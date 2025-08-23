from pydantic import BaseModel, validator
from typing import Optional, Dict, Any
from datetime import datetime

class PendingActionBase(BaseModel):
    module: str
    type: str
    data: Dict[str, Any]
    target_id: Optional[str] = None
    
    @validator("module")
    def validate_module(cls, v):
        allowed = ["users", "leads", "developers", "projects", "inventory", "land", "contacts"]
        if v not in allowed:
            raise ValueError(f"Module must be one of: {allowed}")
        return v
    
    @validator("type")
    def validate_type(cls, v):
        allowed = ["create", "update", "delete"]
        if v not in allowed:
            raise ValueError(f"Type must be one of: {allowed}")
        return v

class PendingActionCreate(PendingActionBase):
    pass

class PendingActionUpdate(BaseModel):
    status: str
    admin_notes: Optional[str] = None
    
    @validator("status")
    def validate_status(cls, v):
        allowed = ["pending", "approved", "rejected"]
        if v not in allowed:
            raise ValueError(f"Status must be one of: {allowed}")
        return v

class PendingActionResponse(PendingActionBase):
    id: str
    requested_by: str
    requested_by_name: str
    status: str
    admin_notes: Optional[str] = None
    approved_by: Optional[str] = None
    approved_by_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # For updates, include current data for diff
    current_data: Optional[Dict[str, Any]] = None

class PendingActionsListResponse(BaseModel):
    ok: bool = True
    data: list[PendingActionResponse]
    meta: dict