from fastapi import APIRouter, Depends, UploadFile, File, Form, Query, Request
from typing import Optional
from app.schemas.documents import DocumentResponse, DocumentsListResponse
from app.schemas.auth import UserResponse
from app.clients.d1_client import d1_client
from app.clients.r2_client import r2_client
from app.deps import require_auth
from app.utils.ids import generate_id
from app.utils.errors import AppException
import os

router = APIRouter()

@router.get("/documents", response_model=DocumentsListResponse)
async def list_documents(
    request: Request,
    entity: Optional[str] = Query(None, description="Filter by entity type"),
    entity_id: Optional[str] = Query(None, description="Filter by entity ID"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user: UserResponse = Depends(require_auth)
):
    filters = {
        "entity": entity,
        "entity_id": entity_id,
        "page": page,
        "page_size": page_size
    }
    
    result = await d1_client.documents_list(filters)
    return DocumentsListResponse(data=result["documents"], meta=result["meta"])

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    entity: str = Form(...),
    entity_id: str = Form(...),
    label: str = Form(...),
    current_user: UserResponse = Depends(require_auth)
):
    # Validate file
    if not file.filename:
        raise AppException(
            code="INVALID_FILE",
            message="No file provided",
            status_code=400
        )
    
    # Check file size (10MB limit)
    max_size = 10 * 1024 * 1024  # 10MB
    file_content = await file.read()
    if len(file_content) > max_size:
        raise AppException(
            code="FILE_TOO_LARGE",
            message="File size exceeds 10MB limit",
            status_code=400
        )
    
    # Generate R2 key
    file_extension = os.path.splitext(file.filename)[1]
    r2_key = f"{entity}/{entity_id}/{generate_id()}{file_extension}"
    
    # Upload to R2
    from io import BytesIO
    file_stream = BytesIO(file_content)
    
    public_url = await r2_client.upload_file(
        key=r2_key,
        file_data=file_stream,
        content_type=file.content_type or "application/octet-stream",
        metadata={
            "uploaded_by": current_user.id,
            "entity": entity,
            "entity_id": entity_id,
            "label": label
        }
    )
    
    # Save document record
    document_data = {
        "id": generate_id(),
        "entity": entity,
        "entity_id": entity_id,
        "label": label,
        "filename": file.filename,
        "content_type": file.content_type or "application/octet-stream",
        "file_size": len(file_content),
        "r2_key": r2_key,
        "public_url": public_url,
        "uploaded_by": current_user.id,
        "uploaded_by_name": current_user.name
    }
    
    result = await d1_client.documents_create(document_data)
    return DocumentResponse(**result["document"])

@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: str,
    current_user: UserResponse = Depends(require_auth)
):
    # Get document
    documents_result = await d1_client.documents_list({"id": document_id})
    documents = documents_result.get("documents", [])
    
    if not documents:
        raise AppException(
            code="DOCUMENT_NOT_FOUND",
            message="Document not found",
            status_code=404
        )
    
    document = documents[0]
    
    # Check permissions (admin or uploader)
    if current_user.role != "admin" and document["uploaded_by"] != current_user.id:
        raise AppException(
            code="PERMISSION_DENIED",
            message="Access denied",
            status_code=403
        )
    
    # Delete from R2
    await r2_client.delete_file(document["r2_key"])
    
    # Delete from database
    await d1_client.documents_delete(document_id)
    
    return {"ok": True, "message": "Document deleted successfully"}