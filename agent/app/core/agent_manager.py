import logging
import os
import importlib.util
from typing import Dict, Any, List, TypedDict
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage
from app.core.note_manager import NoteManager
from app.utils.agent_utils import determine_query_type, format_general_response

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Try different import patterns for Langchain OpenAI
try:
    from langchain_openai import ChatOpenAI
except ImportError:
    # Fallback to regular langchain
    from langchain.chat_models import ChatOpenAI

class AgentState(TypedDict):
    """State for the tutor agent workflow."""
    input: str
    query_type: str
    notes: List[str]
    response: str
    formatted_output: str

class TutorAgent:
    def __init__(self, tenant_id=None):
        """Initialize the tutor agent with note manager and LLM."""
        self.note_manager = NoteManager(tenant_id=tenant_id)
        self.model = "gpt-4o"
        self.temperature = 0.1
        self.llm = ChatOpenAI(model=self.model, temperature=self.temperature)
        logging.info(f"TutorAgent initialized with tenant_id: {tenant_id}")
    
    def determine_query_type(self, state: AgentState) -> Dict[str, Any]:
        """Determine if the input is a general query, reading paper (paper 1), or writing paper (paper 2) request."""
        query_type = determine_query_type(state["input"])
        return {"query_type": query_type}
    
    def retrieve_relevant_notes(self, state: AgentState) -> Dict[str, Any]:
        """Retrieve relevant notes based on the query."""
        query = state["input"]

        # Use the note manager to get relevant content
        if state["query_type"] == "reading_paper":
            # Use specific prompt for reading paper (paper 1)
            prompt_dir = os.path.join("prompts", str(self.note_manager.tenant_id)) if self.note_manager.tenant_id else "app/prompts"
            reading_prompt_file = os.path.join(prompt_dir, "reading.py")
            if os.path.exists(reading_prompt_file):
                spec = importlib.util.spec_from_file_location("dynamic_prompt", reading_prompt_file)
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                reading_prompt = module.prompt
            else:
                from app.prompts.PAPER_READING_PROMPT import prompt as reading_prompt
            if self.note_manager.index:
                response = self.note_manager.generate_modal_paper(query, num_notes=1)
            else:
                # Generate paper even if no notes are available
                response = ""
            # Format response with reading prompt
            prompt_text = reading_prompt.format(state=state['input'], response=response)
            # Use LLM to generate the actual paper
            llm_response = self.llm.invoke(prompt_text)
            response = str(llm_response.content) if hasattr(llm_response, 'content') else str(llm_response)
        elif state["query_type"] == "writing_paper":
            # Use specific prompt for writing paper (paper 2)
            prompt_dir = os.path.join("prompts", str(self.note_manager.tenant_id)) if self.note_manager.tenant_id else "app/prompts"
            writing_prompt_file = os.path.join(prompt_dir, "writing.py")
            if os.path.exists(writing_prompt_file):
                spec = importlib.util.spec_from_file_location("dynamic_prompt", writing_prompt_file)
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                writing_prompt = module.prompt
            else:
                from app.prompts.PAPER_WRITING_PROMPT import prompt as writing_prompt
            if self.note_manager.index:
                response = self.note_manager.generate_modal_paper(query, num_notes=1)
            else:
                # Generate paper even if no notes are available
                response = ""
            # Format response with writing prompt
            prompt_text = writing_prompt.format(state=state['input'], response=response)
            # Use LLM to generate the actual paper
            llm_response = self.llm.invoke(prompt_text)
            response = str(llm_response.content) if hasattr(llm_response, 'content') else str(llm_response)
        else:
            # For general queries, use the query engine directly
            if self.note_manager.index:
                query_engine = self.note_manager.index.as_query_engine()
                response = query_engine.query(query)
                response = str(response) if hasattr(response, 'response') else str(response)
            else:
                response = "No notes available. Please upload notes first."

        logging.info(f"Retrieved notes for query '{query}': {response}")
        return {
            "response": response,
            "notes": [response]  # Store the retrieved content
        }
    
    def format_general_response(self, state: AgentState) -> Dict[str, Any]:
        """Format the response for general queries."""
        return format_general_response(state)
    
    def create_workflow(self) -> StateGraph:
        """Create the LangGraph workflow for the tutor agent."""
        workflow = StateGraph(AgentState)

        # Add nodes
        workflow.add_node("determine_query_type", self.determine_query_type)
        workflow.add_node("retrieve_notes", self.retrieve_relevant_notes)
        workflow.add_node("format_general", self.format_general_response)

        # Set entry point
        workflow.set_entry_point("determine_query_type")

        # Add conditional edges
        workflow.add_conditional_edges(
            "determine_query_type",
            lambda state: state["query_type"],
            {
                "general_query": "retrieve_notes",
                "reading_paper": "retrieve_notes",
                "writing_paper": "retrieve_notes"
            }
        )

        workflow.add_conditional_edges(
            "retrieve_notes",
            lambda state: state["query_type"],
            {
                "general_query": "format_general",
                "reading_paper": "format_general",
                "writing_paper": "format_general"
            }
        )

        # Connect to end
        workflow.add_edge("format_general", END)

        return workflow.compile()
    
    def process_query(self, query: str) -> str:
        """Process a query using the agent workflow."""
        if not self.note_manager.index:
            logging.warning("No notes available for processing.")
            return "No notes available. Please upload notes first using: python main.py upload <file_path>"
        
        workflow = self.create_workflow()
        
        # Initialize state
        initial_state = {
            "input": query,
            "query_type": "",
            "notes": [],
            "response": "",
            "formatted_output": ""
        }
        
        # Execute workflow
        result = workflow.invoke(initial_state)
        
        logging.info(f"Processed query: {query}")
        return result["formatted_output"]

# Example usage
if __name__ == "__main__":
    agent = TutorAgent()
    
    # Example queries
    result = agent.process_query("Explain machine learning concepts")
    print(result)

    result = agent.process_query("Generate reading paper")
    print(result)

    result = agent.process_query("Generate writing paper")
    print(result)
