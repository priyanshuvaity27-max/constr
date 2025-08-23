from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from app.models.pending_action import ActionType, ActionModule, ActionStatus


class PendingActionResponse(BaseModel):
    id: str
    type: ActionType
    module: ActionModule
    data: Dict[str, Any]
    original_data: Optional[Dict[str, Any]] = None
    requested_by: str
    requested_by_name: str
    requested_at: datetime
    status: ActionStatus
    admin_notes: Optional[str] = None
    processed_at: Optional[datetime] = None
    processed_by: Optional[str] = None

    class Config:
        from_attributes = True


class PendingActionUpdate(BaseModel):
    status: ActionStatus
    admin_notes: Optional[str] = None