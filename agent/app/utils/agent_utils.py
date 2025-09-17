import logging
from typing import Dict, Any

def determine_query_type(input_text: str) -> str:
    """Determine if the input is a general query, reading paper (paper 1), or writing paper (paper 2) request."""
    input_text = input_text.lower()

    # Check for paper type keywords
    reading_keywords = ["reading paper", "generate reading paper", "create reading paper", "paper 1"]
    writing_keywords = ["writing paper", "generate writing paper", "create writing paper", "paper 2"]

    if any(keyword in input_text for keyword in reading_keywords):
        query_type = "reading_paper"
    elif any(keyword in input_text for keyword in writing_keywords):
        query_type = "writing_paper"
    else:
        query_type = "general_query"

    logging.info(f"Determined query type: {query_type}")
    return query_type

def format_general_response(state: Dict[str, Any]) -> Dict[str, Any]:
    """Format the response for general queries."""
    if state["query_type"] in ["reading_paper", "writing_paper"]:
        return {"formatted_output": state["response"]}
    else:
        response = state["response"]

        formatted_output = f"QUERY RESPONSE\n"
        formatted_output += f"Query: {state['input']}\n\n"
        formatted_output += f"Answer:\n"
        formatted_output += f"{'='*50}\n"
        formatted_output += f"{response}\n"
        formatted_output += f"{'='*50}\n"
        formatted_output += f"Generated from your uploaded notes\n"

        logging.info("Formatted general response.")
        return {"formatted_output": formatted_output}
