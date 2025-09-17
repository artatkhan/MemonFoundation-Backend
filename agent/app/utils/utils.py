import os
import logging
from typing import Dict, Any, Tuple
from fastapi import UploadFile

def ensure_logs_dir_exists():
    """Ensure the logs directory exists."""
    os.makedirs("./logs", exist_ok=True)

def setup_logging():
    """Set up logging configuration."""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler("./logs/api_server.log"),
            logging.StreamHandler()
        ]
    )
    return logging.getLogger("tutor_agent_api")

def create_tenant_folders(tenant_id: str) -> Tuple[str, str]:
    """Create tenant-specific folders for uploads and prompts."""
    # Create folder in uploads directory
    uploads_dir = "./uploads"
    tenant_uploads_folder = os.path.join(uploads_dir, tenant_id)

    # Ensure uploads directory exists
    os.makedirs(uploads_dir, exist_ok=True)

    # Create tenant-specific folder
    uploads_created = False
    if not os.path.exists(tenant_uploads_folder):
        os.makedirs(tenant_uploads_folder)
        uploads_created = True

    # Create folder in prompts directory
    prompts_dir = "./prompts"
    tenant_prompts_folder = os.path.join(prompts_dir, tenant_id)

    # Ensure prompts directory exists
    os.makedirs(prompts_dir, exist_ok=True)

    # Create tenant-specific prompts folder
    prompts_created = False
    if not os.path.exists(tenant_prompts_folder):
        os.makedirs(tenant_prompts_folder)
        prompts_created = True

    return tenant_uploads_folder, tenant_prompts_folder, uploads_created, prompts_created

def save_file_with_conflict_resolution(file: UploadFile, upload_dir: str, content: bytes) -> str:
    """Save uploaded file with conflict resolution for filename."""
    filename = file.filename
    destination_path = os.path.join(upload_dir, filename)

    counter = 1
    base_name, ext = os.path.splitext(filename)
    while os.path.exists(destination_path):
        filename = f"{base_name}_{counter}{ext}"
        destination_path = os.path.join(upload_dir, filename)
        counter += 1

    # Write the file
    with open(destination_path, "wb") as f:
        f.write(content)

    return destination_path

def validate_payload(payload: Dict[str, Any], required_fields: list) -> bool:
    """Validate that payload is a dict and contains required fields."""
    if not isinstance(payload, dict):
        return False
    for field in required_fields:
        if field not in payload:
            return False
    return True
