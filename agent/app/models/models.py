from pydantic import BaseModel
from typing import Optional


class QueryWithPayload(BaseModel):
    query: str
    payload: Optional[dict] = None

class UploadResponse(BaseModel):
    success: bool
    message: str
    document_count: Optional[int] = None

class QueryResponse(BaseModel):
    success: bool
    response: str
    query_type: str

class NoteInfo(BaseModel):
    filename: str
    upload_time: Optional[str] = None

class AddPromptRequest(BaseModel):
    tenantId: str
    type: str
    prompt_type: str  # "reading" or "writing"
    prompt: str
