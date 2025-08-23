from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DocumentBase(BaseModel):
    entity: str
    entity_id: str
    label: str
    filename: str
    content_type: str
    file_size: int
    r2_key: str
    public_url: Optional[str] = None

class DocumentCreate(DocumentBase):
    pass

class DocumentResponse(DocumentBase):
    id: str
    uploaded_by: str
    uploaded_by_name: str
    created_at: datetime

class DocumentsListResponse(BaseModel):
    ok: bool = True
    data: list[DocumentResponse]
    meta: dict