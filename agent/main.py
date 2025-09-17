import logging
from fastapi import FastAPI, HTTPException, UploadFile, File, status
from fastapi.middleware.cors import CORSMiddleware
import os
from typing import List
from app.core.agent_manager import TutorAgent
from app.core.note_manager import NoteManager
import traceback
from datetime import datetime
from app.models.models import (
    QueryWithPayload,
    UploadResponse,
    QueryResponse,
    NoteInfo,
    AddPromptRequest,
)
from app.utils.utils import ensure_logs_dir_exists, setup_logging, create_tenant_folders, save_file_with_conflict_resolution, validate_payload

# Ensure logs directory exists and setup logging
ensure_logs_dir_exists()
logger = setup_logging()

app = FastAPI(
    title="Tutor Agent API",
    description="REST API for the multi-tool tutor agent with note embedding and paper generation (reading paper 1, writing paper 2)",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize tutor agent
tutor_agent = TutorAgent()

@app.get("/")
async def root():
    """Root endpoint with API information."""
    logger.info("Root endpoint accessed.")
    return {
        "message": "Tutor Agent API",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "endpoints": {
            "upload": "POST /upload - Upload notes file with tenant-specific storage",
            "query": "POST /query - Ask a question or generate papers (use 'paper 1' or 'paper 2' keywords)",
            "notes": "POST /notes - List uploaded notes for a tenant (tutor only)",
            "add_prompt": "POST /add_prompt - Add a prompt for a tenant and save as .py file",
            "health": "GET /health - Health check",
            "delete_notes": "DELETE /notes - Delete specific file or clear all notes for a tenant (tutor only)"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    logger.info("Health check endpoint accessed.")
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "openai_configured": bool(os.getenv("OPENAI_API_KEY")),
        "vector_store_ready": False,
        "notes_count": 0
    }
    
    try:
        # Check if vector store is accessible
        notes = tutor_agent.note_manager.list_uploaded_notes()
        health_status["vector_store_ready"] = True
        health_status["notes_count"] = len(notes)
        logger.info(f"Health check successful - {len(notes)} notes found")
    except Exception as e:
        logger.warning(f"Vector store health check failed: {e}")
        health_status["status"] = "degraded"
        health_status["error"] = str(e)
    
    return health_status

from fastapi import Form
import json

@app.post("/upload", response_model=UploadResponse)
async def on(file: UploadFile = File(...), payload: str = Form(...)):
    """Upload a notes file and create embeddings with tenant-specific folder."""
    logger.info(f"Upload endpoint called with file: {file.filename} and payload: {payload}")

    try:
        # Parse payload JSON string to dict
        try:
            payload_dict = json.loads(payload)
        except json.JSONDecodeError:
            logger.warning("Invalid JSON payload for upload_notes")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payload must be a valid JSON string"
            )

        # Validate payload dict
        if not validate_payload(payload_dict, ["type", "tenantId"]):
            logger.warning("Invalid payload for upload_notes: missing type or tenantId")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payload must be a dict with 'type' and 'tenantId' fields"
            )

        tutor_type = payload_dict.get("type")
        tenant_id = payload_dict.get("tenantId")

        # Validate file type
        if not file.filename.lower().endswith(('.txt', '.docx', '.pdf', '.doc')):
            logger.warning(f"Unsupported file type: {file.filename}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only .txt, .docx, .pdf and .doc files are supported"
            )

        # Validate file size (max 10MB)
        max_size = 10 * 1024 * 1024  # 10MB
        content = await file.read()
        if len(content) > max_size:
            logger.warning(f"File too large: {len(content)} bytes")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds 10MB limit"
            )

        # Determine upload directory based on tenantId if type is tutor
        if tutor_type == "tutor":
            uploaded_notes_dir = os.path.join("./uploads", tenant_id)
        else:
            uploaded_notes_dir = "./uploads"

        os.makedirs(uploaded_notes_dir, exist_ok=True)

        # Save file with conflict resolution
        destination_path = save_file_with_conflict_resolution(file, uploaded_notes_dir, content)
        logger.info(f"File saved to uploads directory: {destination_path}")

        # Create a NoteManager instance with tenant_id to handle tenant-specific embeddings
        tenant_note_manager = NoteManager(tenant_id=tenant_id)

        # Upload using tenant-specific note manager, passing the saved file path
        documents = tenant_note_manager.upload_notes(destination_path)

        if documents:
            logger.info(f"Successfully processed {len(documents)} documents from {file.filename}")
            return UploadResponse(
                success=True,
                message=f"Successfully uploaded and processed {len(documents)} documents from {file.filename}",
                document_count=len(documents)
            )
        else:
            logger.warning(f"Failed to process the uploaded file: {file.filename}")
            # Clean up the file if processing failed
            if os.path.exists(destination_path):
                os.remove(destination_path)
                logger.info(f"Cleaned up file after failed processing: {destination_path}")
            return UploadResponse(
                success=False,
                message="Failed to process the uploaded file. Please check the file format and content."
            )

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error uploading file {file.filename}: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error while processing file: {str(e)}"
        )

@app.post("/add-tutor")
async def add_tutor(payload: dict):
    """Add a tutor and create a tenant-specific folder for uploads."""
    logger.info("Add tutor endpoint called.")

    try:
        # Validate payload
        if not validate_payload(payload, ["type", "tenantId"]):
            logger.warning("Invalid payload for add_tutor: missing type or tenantId")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payload must be a dict with 'type' and 'tenantId' fields"
            )

        tutor_type = payload.get("type")
        tenant_id = payload.get("tenantId")

        if tutor_type == "tutor":
            tenant_uploads_folder, tenant_prompts_folder, uploads_created, prompts_created = create_tenant_folders(tenant_id)

            # Log the creation
            if uploads_created:
                logger.info(f"Created tenant uploads folder: {tenant_uploads_folder}")
            else:
                logger.info(f"Tenant uploads folder already exists: {tenant_uploads_folder}")

            if prompts_created:
                logger.info(f"Created tenant prompts folder: {tenant_prompts_folder}")
            else:
                logger.info(f"Tenant prompts folder already exists: {tenant_prompts_folder}")

            # Set message based on what was created
            if uploads_created and prompts_created:
                message = f"Tenant folders created successfully for tenantId: {tenant_id}"
            elif uploads_created:
                message = f"Tenant uploads folder created successfully for tenantId: {tenant_id} (prompts folder already existed)"
            elif prompts_created:
                message = f"Tenant prompts folder created successfully for tenantId: {tenant_id} (uploads folder already existed)"
            else:
                message = f"Tenant folders already exist for tenantId: {tenant_id}"

            return {
                "success": True,
                "message": message,
                "tenant_uploads_folder": tenant_uploads_folder,
                "tenant_prompts_folder": tenant_prompts_folder
            }
        else:
            logger.info("Payload type is not 'tutor', no folder created.")
            return {
                "success": True,
                "message": "No folder created as type is not 'tutor'"
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in add_tutor: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@app.post("/query", response_model=QueryResponse)
async def process_query(request: QueryWithPayload):
    """Process a query and return the response with tenant-specific embeddings."""
    logger.info(f"Query endpoint called with query: '{request.query}' and payload: {request.payload}")

    try:
        # Validate query length
        if not request.query or len(request.query.strip()) == 0:
            logger.warning("Empty query received")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Query cannot be empty"
            )

        if len(request.query) > 1000:
            logger.warning(f"Query too long: {len(request.query)} characters")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Query exceeds maximum length of 1000 characters"
            )

        # Check payload for tenantId if type is student
        tenant_id = None
        if isinstance(request.payload, dict) and request.payload.get("type") == "student" and "tenantId" in request.payload:
            tenant_id = request.payload.get("tenantId")
            logger.info(f"Processing query for student with tenantId: {tenant_id}")

        # Create a TutorAgent instance with tenant_id to handle tenant-specific embeddings
        if tenant_id:
            tenant_tutor_agent = TutorAgent(tenant_id=tenant_id)
            response = tenant_tutor_agent.process_query(request.query)
        else:
            response = tutor_agent.process_query(request.query)

        logger.info(f"Query processed successfully: '{request.query}'")

        # Determine query type for response
        query_lower = request.query.lower()
        if any(keyword in query_lower for keyword in ["reading paper", "generate reading paper", "create reading paper", "paper 1"]):
            query_type = "reading_paper"
        elif any(keyword in query_lower for keyword in ["writing paper", "generate writing paper", "create writing paper", "paper 2"]):
            query_type = "writing_paper"
        else:
            query_type = "general_query"

        return QueryResponse(
            success=True,
            response=response,
            query_type=query_type
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing query '{request.query}': {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error while processing query: {str(e)}"
        )

# Removed the /generate endpoint entirely as modal paper functionality is removed

@app.post("/notes", response_model=List[NoteInfo])
async def list_notes(payload: dict):
    """List all uploaded notes for a specific tenant (tutor only)."""
    logger.info("List notes endpoint called.")

    try:
        # Validate payload
        if not validate_payload(payload, ["type", "tenantId"]):
            logger.warning("Invalid payload for list_notes: missing type or tenantId")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payload must be a dict with 'type' and 'tenantId' fields"
            )

        tutor_type = payload.get("type")
        tenant_id = payload.get("tenantId")

        # Validate type is tutor
        if tutor_type != "tutor":
            logger.warning(f"Invalid type for list_notes: {tutor_type}. Only 'tutor' type allowed.")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only tutors can access tenant-specific notes"
            )

        # Create tenant-specific note manager
        tenant_note_manager = NoteManager(tenant_id=tenant_id)
        notes = tenant_note_manager.list_uploaded_notes()
        logger.info(f"Found {len(notes)} uploaded notes for tenant {tenant_id}.")

        note_info = []
        for note in notes:
            note_info.append(NoteInfo(
                filename=note.get("filename", "Unknown"),
                upload_time=note.get("upload_time")
            ))

        return note_info

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing notes: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error while listing notes: {str(e)}"
        )

@app.delete("/notes")
async def delete_notes(payload: dict):
    """Delete specific file or clear all uploaded notes for a tenant (tutor only)."""
    logger.info("Delete notes endpoint called.")

    try:
        # Validate payload
        if not validate_payload(payload, ["type", "tenantId"]):
            logger.warning("Invalid payload for delete_notes: missing type or tenantId")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payload must be a dict with 'type' and 'tenantId' fields"
            )

        tutor_type = payload.get("type")
        tenant_id = payload.get("tenantId")
        filename = payload.get("filename")  # Get filename from payload

        # Validate type is tutor
        if tutor_type != "tutor":
            logger.warning(f"Invalid type for delete_notes: {tutor_type}. Only 'tutor' type allowed.")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only tutors can delete tenant-specific notes"
            )

        # Create tenant-specific note manager
        tenant_note_manager = NoteManager(tenant_id=tenant_id)

        if filename:
            # Delete specific file
            success = tenant_note_manager.delete_note(filename)
            if success:
                logger.info(f"Note '{filename}' deleted successfully for tenant {tenant_id}.")
                return {
                    "success": True,
                    "message": f"Note '{filename}' deleted successfully",
                    "filename": filename,
                    "timestamp": datetime.now().isoformat()
                }
            else:
                logger.error(f"Failed to delete note '{filename}' for tenant {tenant_id}.")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to delete note '{filename}'"
                )
        else:
            # Clear all notes for the tenant
            success = tenant_note_manager.clear_notes()
            if success:
                logger.info(f"All notes cleared successfully for tenant {tenant_id}.")
                return {
                    "success": True,
                    "message": "All notes cleared successfully",
                    "timestamp": datetime.now().isoformat()
                }
            else:
                logger.error(f"Failed to clear notes for tenant {tenant_id}.")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to clear notes from the vector store"
                )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting notes: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error while deleting notes: {str(e)}"
        )
    
@app.post("/add_prompt")
async def add_prompt(request: AddPromptRequest):
    """Add a prompt for a tenant and save it in prompts/{tenantId}/ directory as a .py file."""
    tenant_id = request.tenantId
    prompt_type = request.prompt_type
    prompt_text = request.prompt

    # Validate tenant_id, type, and prompt_type
    if not tenant_id or not request.type or not prompt_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="tenantId, type, and prompt_type are required fields"
        )

    # Validate prompt_type is either "reading" or "writing"
    if prompt_type not in ["reading", "writing"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="prompt_type must be either 'reading' or 'writing'"
        )

