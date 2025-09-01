from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, date
from decimal import Decimal
from app.models.lead import TypeOfSpace, TransactionType, LeadStatus

class LeadBase(BaseModel):
    inquiry_no: str
    inquiry_date: date
    client_company: str
    contact_person: str
    contact_no: str
    email: Optional[EmailStr] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    type_of_space: Optional[TypeOfSpace] = None
    space_requirement: str
    transaction_type: Optional[TransactionType] = None
    representative: Optional[str] = None
    budget: Optional[Decimal] = None
    city: str
    location_preference: Optional[str] = None
    description: Optional[str] = None
    first_contact_date: Optional[date] = None
    last_contact_date: Optional[date] = None
    lead_managed_by: Optional[str] = None
    action_date: Optional[date] = None
    status: LeadStatus = LeadStatus.NEW
    next_action_plan: Optional[str] = None
    option_shared: bool = False
    remarks: Optional[str] = None

class LeadCreate(LeadBase):
    pass

class LeadUpdate(BaseModel):
    inquiry_no: Optional[str] = None
    inquiry_date: Optional[date] = None
    client_company: Optional[str] = None
    contact_person: Optional[str] = None
    contact_no: Optional[str] = None
    email: Optional[EmailStr] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    type_of_space: Optional[TypeOfSpace] = None
    space_requirement: Optional[str] = None
    transaction_type: Optional[TransactionType] = None
    representative: Optional[str] = None
    budget: Optional[Decimal] = None
    city: Optional[str] = None
    location_preference: Optional[str] = None
    description: Optional[str] = None
    first_contact_date: Optional[date] = None
    last_contact_date: Optional[date] = None
    lead_managed_by: Optional[str] = None
    action_date: Optional[date] = None
    status: Optional[LeadStatus] = None
    next_action_plan: Optional[str] = None
    option_shared: Optional[bool] = None
    remarks: Optional[str] = None

class LeadResponse(LeadBase):
    id: str
    owner_id: Optional[str] = None
    assignee_id: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True