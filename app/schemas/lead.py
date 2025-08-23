from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.lead import TypeOfPlace, TransactionType, LeadStatus, OptionShared


class LeadBase(BaseModel):
    inquiry_no: str
    inquiry_date: datetime
    client_company: str
    contact_person: str
    contact_no: str
    email: EmailStr
    designation: Optional[str] = None
    department: Optional[str] = None
    description: Optional[str] = None
    type_of_place: TypeOfPlace
    space_requirement: Optional[str] = None
    transaction_type: TransactionType
    budget: Optional[int] = None
    city: Optional[str] = None
    location_preference: Optional[str] = None
    first_contact_date: Optional[datetime] = None
    lead_managed_by: str
    status: LeadStatus = LeadStatus.NEW
    option_shared: OptionShared = OptionShared.NO
    last_contact_date: Optional[datetime] = None
    next_action_plan: Optional[str] = None
    action_date: Optional[datetime] = None
    remark: Optional[str] = None


class LeadCreate(LeadBase):
    pass


class LeadUpdate(BaseModel):
    inquiry_no: Optional[str] = None
    inquiry_date: Optional[datetime] = None
    client_company: Optional[str] = None
    contact_person: Optional[str] = None
    contact_no: Optional[str] = None
    email: Optional[EmailStr] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    description: Optional[str] = None
    type_of_place: Optional[TypeOfPlace] = None
    space_requirement: Optional[str] = None
    transaction_type: Optional[TransactionType] = None
    budget: Optional[int] = None
    city: Optional[str] = None
    location_preference: Optional[str] = None
    first_contact_date: Optional[datetime] = None
    lead_managed_by: Optional[str] = None
    status: Optional[LeadStatus] = None
    option_shared: Optional[OptionShared] = None
    last_contact_date: Optional[datetime] = None
    next_action_plan: Optional[str] = None
    action_date: Optional[datetime] = None
    remark: Optional[str] = None


class LeadResponse(LeadBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True