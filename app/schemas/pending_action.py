from pydantic import BaseModel, validator
from typing import Optional, Dict, Any
from datetime import datetime

class PendingActionBase(BaseModel):
    module: str
    action_type: str
    payload: Dict[str, Any]
    target_id: Optional[str] = None
    
    @validator("module")
    def validate_module(cls, v):
        allowed = ["leads", "corporate_developers", "coworking_developers", "warehouse_developers", 
                  "mall_developers", "clients", "developer_contacts", "brokers", "individual_owners",
                  "corporate_buildings", "coworking_spaces", "warehouses", "retail_malls", "land_parcels"]
        if v not in allowed:
            raise ValueError(f"Module must be one of: {allowed}")
        return v
    
    @validator("action_type")
    def validate_action_type(cls, v):
        allowed = ["create", "update", "delete", "bulk_import"]
        if v not in allowed:
            raise ValueError(f"Action type must be one of: {allowed}")
        return v

class PendingActionCreate(PendingActionBase):
    pass

class PendingActionUpdate(BaseModel):
    status: str
    note: Optional[str] = None
    
    @validator("status")
    def validate_status(cls, v):
        allowed = ["pending", "approved", "rejected"]
        if v not in allowed:
            raise ValueError(f"Status must be one of: {allowed}")
        return v

class PendingActionResponse(PendingActionBase):
    id: str
    requested_by: str
    requested_by_name: Optional[str] = None
    requested_at: datetime
    status: str
    reviewed_by: Optional[str] = None
    reviewed_by_name: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    note: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True