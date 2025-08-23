from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import datetime, date

class LeadBase(BaseModel):
    inquiry_no: str
    inquiry_date: date
    client_company: str
    contact_person: str
    contact_no: str
    email: EmailStr
    designation: Optional[str] = None
    department: Optional[str] = None
    description: Optional[str] = None
    type_of_place: str
    space_requirement: Optional[str] = None
    transaction_type: str
    budget: Optional[float] = None
    city: Optional[str] = None
    location_preference: Optional[str] = None
    site_visit_required: str = "No"
    proposal_submitted: str = "No"
    shortlisted: str = "No"
    deal_closed: str = "No"
    assignee_id: Optional[str] = None
    
    @validator("type_of_place")
    def validate_type_of_place(cls, v):
        allowed = ["Office", "Retail", "Warehouse", "Coworking", "Industrial", "Land", "Other"]
        if v not in allowed:
            raise ValueError(f"Type of place must be one of: {allowed}")
        return v
    
    @validator("transaction_type")
    def validate_transaction_type(cls, v):
        allowed = ["Lease", "Buy", "Sell"]
        if v not in allowed:
            raise ValueError(f"Transaction type must be one of: {allowed}")
        return v
    
    @validator("site_visit_required", "proposal_submitted", "shortlisted", "deal_closed")
    def validate_yes_no(cls, v):
        if v not in ["Yes", "No"]:
            raise ValueError("Value must be Yes or No")
        return v

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
    description: Optional[str] = None
    type_of_place: Optional[str] = None
    space_requirement: Optional[str] = None
    transaction_type: Optional[str] = None
    budget: Optional[float] = None
    city: Optional[str] = None
    location_preference: Optional[str] = None
    site_visit_required: Optional[str] = None
    proposal_submitted: Optional[str] = None
    shortlisted: Optional[str] = None
    deal_closed: Optional[str] = None
    assignee_id: Optional[str] = None

class LeadResponse(LeadBase):
    id: str
    owner_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Joined fields
    owner_name: Optional[str] = None
    assignee_name: Optional[str] = None

class LeadsListResponse(BaseModel):
    ok: bool = True
    data: list[LeadResponse]
    meta: dict