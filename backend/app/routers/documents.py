from fastapi import APIRouter, Depends, UploadFile, File, Form, Query, Request
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import Document
from app.schemas.documents import DocumentResponse, DocumentsListResponse
from app.schemas.auth import UserResponse
from app.deps import require_auth
from app.services.file_storage import upload_file, delete_file
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
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(require_auth)
):
    query = db.query(Document)
    
    # Apply filters
    if entity:
        query = query.filter(Document.entity == entity)
    if entity_id:
        query = query.filter(Document.entity_id == entity_id)
    
    # Count total
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * page_size
    documents = query.offset(offset).limit(page_size).all()
    
    # Convert to response format
    doc_responses = []
    for doc in documents:
        doc_responses.append(DocumentResponse(
            id=str(doc.id),
            entity=doc.entity,
            entity_id=str(doc.entity_id),
            label=doc.label,
            filename=doc.filename,
            content_type=doc.content_type,
            file_size=doc.file_size,
            file_path=doc.file_path,
            public_url=doc.public_url,
            uploaded_by=str(doc.uploaded_by),
            uploaded_by_name=doc.uploaded_by_name,
            created_at=doc.created_at
        ))
    
    return DocumentsListResponse(
        data=doc_responses,
        meta={
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }
    )

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    entity: str = Form(...),
    entity_id: str = Form(...),
    label: str = Form(...),
    db: Session = Depends(get_db),
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
    
    # Upload file
    file_path, public_url = await upload_file(
        file_content=file_content,
        filename=file.filename,
        content_type=file.content_type or "application/octet-stream",
        entity=entity,
        entity_id=entity_id
    )
    
    # Save document record
    document = Document(
        entity=entity,
        entity_id=entity_id,
        label=label,
        filename=file.filename,
        content_type=file.content_type or "application/octet-stream",
        file_size=len(file_content),
        file_path=file_path,
        public_url=public_url,
        uploaded_by=current_user.id,
        uploaded_by_name=current_user.name
    )
    
    db.add(document)
    db.commit()
    db.refresh(document)
    
    return DocumentResponse(
        id=str(document.id),
        entity=document.entity,
        entity_id=str(document.entity_id),
        label=document.label,
        filename=document.filename,
        content_type=document.content_type,
        file_size=document.file_size,
        file_path=document.file_path,
        public_url=document.public_url,
        uploaded_by=str(document.uploaded_by),
        uploaded_by_name=document.uploaded_by_name,
        created_at=document.created_at
    )

@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(require_auth)
):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise AppException(
            code="DOCUMENT_NOT_FOUND",
            message="Document not found",
            status_code=404
        )
    
    # Check permissions (admin or uploader)
    if current_user.role != "admin" and str(document.uploaded_by) != current_user.id:
        raise AppException(
            code="PERMISSION_DENIED",
            message="Access denied",
            status_code=403
        )
    
    # Delete file from storage
    await delete_file(document.file_path)
    
    # Delete from database
    db.delete(document)
    db.commit()
    
    return {"ok": True, "message": "Document deleted successfully"}