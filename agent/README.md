# Tutor Agent

A multi-tool AI-powered tutor agent that helps you upload notes, create embeddings, answer queries, and generate exam papers (Paper 1 Reading, Paper 2 Writing) using Langchain, LangGraph, Llama Index, and OpenAI embeddings.

## Features

- **Multi-Tool Agent**: Intelligent agent that determines whether to answer queries or generate exam papers
- **Note Upload**: Upload text files and automatically create embeddings using OpenAI's embedding model
- **Vector Storage**: Store and retrieve note embeddings using ChromaDB vector store
- **Query Answering**: Answer specific questions based on your uploaded notes
- **Paper 1 Generation**: Generate Cambridge O Level English Language Paper 1 Reading papers
- **Paper 2 Generation**: Generate Cambridge O Level English Language Paper 2 Writing papers
- **Note Management**: List and manage all uploaded notes

## Prerequisites

- Python 3.12 or higher
- OpenAI API key

## Installation

1. Clone this repository:
```bash
git clone <repository-url>
cd tutor-agent
```

2. Install dependencies:
```bash
pip install -e .
```

3. Set up your OpenAI API key:
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env file and add your OpenAI API key
# OPENAI_API_KEY=your-actual-api-key-here
```

## Usage

### REST API Server

Start the FastAPI server:
```bash
uvicorn main:app --host 127.0.0.1 --port 8000
```

The server will run on `http://localhost:8000` with automatic API documentation at `http://localhost:8000/docs`

## API Endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API information |
| `GET` | `/health` | Health check |
| `POST` | `/upload` | Upload notes file |
| `POST` | `/query` | Ask a question or generate papers (use 'paper 1' or 'paper 2' keywords) |
| `GET` | `/notes` | List uploaded notes |
| `POST` | `/notes` | Manage notes |
| `DELETE` | `/notes` | Clear all notes or delete specific file |
| `POST` | `/add-tutor` | Add tutor |
| `POST` | `/add_prompt` | Add custom prompt |


## JSON Payloads

### POST /add-tutor
```json
{
  "type": "tutor",
  "tenantId": "test_tenant"
}
```

### POST /query
```json
{
  "query": "What is machine learning?",
  "payload": {
    "type": "student",
    "tenantId": "test_tenant"
  }
}
```

### POST /notes
```json
{
  "type": "tutor",
  "tenantId": "test_tenant"
}
```

### DELETE /notes (Delete specific file)
```json
{
  "type": "tutor",
  "tenantId": "test_tenant",
  "filename": "test_note.txt"
}
```

### DELETE /notes (Delete all notes)
```json
{
  "type": "tutor",
  "tenantId": "test_tenant"
}
```

### POST /add_prompt
```json
{
  "tenantId": "test_tenant",
  "type": "tutor",
  "prompt_type": "reading",
  "prompt": "Your custom reading paper prompt here..."
}
```

#### Error Responses:

The API returns appropriate HTTP status codes with detailed error messages:

- `400 Bad Request`: Invalid input (empty query, unsupported file type, file too large)
- `500 Internal Server Error`: Server-side processing errors
- All errors include detailed messages for debugging

#### File Upload Limits:
- Supported file types: `.docx`, `.md`, `.pdf`
- Maximum file size: 10MB
- Query length limits: 1000 characters for queries, 500 characters for paper generation


## Project Structure

```
agent/
├── .gitignore
├── Dockerfile
├── main.py             # Main CLI application
├── pyproject.toml      # Python dependencies and project configuration
├── requirements.txt
├── uv.lock
├── README.md           # This file
├── app/
│   ├── __init__.py
│   ├── core/
│   │   ├── agent_manager.py     # Multi-tool agent with LangGraph workflow
│   │   └── note_manager.py      # Core functionality for note management
│   ├── models/
│   │   └── models.py
│   ├── prompts/
│   ├── utils/
│   │   ├── agent_utils.py
│   │   ├── note_utils.py
│   │   └── utils.py
├── chroma_db/          # Vector store database (created automatically)
├── logs/
├── prompts/
├── tests/
│   ├── __init__.py
│   ├── sample_notes.txt
│   └── test_api_endpoints.py
└── uploads/
```

## Dependencies

- **langchain**: Framework for building LLM applications
- **langgraph**: For building stateful, multi-step applications
- **llama-index**: Data framework for LLM applications
- **openai**: OpenAI API client
- **chromadb**: Vector database for storing embeddings
- **python-dotenv**: Environment variable management
- **pydantic**: Data validation

## How It Works

1. **Multi-Tool Agent**: The TutorAgent uses LangGraph to create a workflow that:
   - Determines query type (general question vs. modal paper request)
   - Routes to appropriate processing based on query intent
   - Uses different formatting strategies for different output types

2. **Note Upload**: When you upload a note file, the system:
   - Reads the file content using Llama Index's SimpleDirectoryReader
   - Creates embeddings using OpenAI's embedding model
   - Stores the embeddings in a ChromaDB vector store

3. **Query Processing**: When you ask a question:
   - The agent retrieves relevant notes from the vector store
   - Provides concise, direct answers to specific questions
   - Formats responses in a clear, question-answer format

4. **Modal Paper Generation**: When you generate a modal paper:
   - The system queries the vector store for comprehensive content
   - Uses LLM enhancement to structure the content academically
   - Formats the response into a professional modal paper format

## Configuration

The application uses environment variables for configuration. Create a `.env` file with:

```env
OPENAI_API_KEY=your-openai-api-key
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test your changes
5. Submit a pull request

## License

This project is licensed under the MIT License.
