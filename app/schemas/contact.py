from pydantic import BaseModel, EmailStr, HttpUrl
from typing import Optional
from datetime import datetime
from app.models.contact import ContactType


class ContactBase(BaseModel):
    type: ContactType
    company_name: Optional[str] = None
    industry: Optional[str] = None
    department: Optional[str] = None
    developer_name: Optional[str] = None
    contact_type: Optional[str] = None
    individual_owner_name: Optional[str] = None
    owner_type: Optional[str] = None
    department_designation: Optional[str] = None
    first_name: str
    last_name: str
    designation: Optional[str] = None
    contact_no: str
    alternate_no: Optional[str] = None
    email_id: EmailStr
    linkedin_link: Optional[HttpUrl] = None
    city: Optional[str] = None
    location: Optional[str] = None


class ContactCreate(ContactBase):
    pass


class ContactUpdate(BaseModel):
    type: Optional[ContactType] = None
    company_name: Optional[str] = None
    industry: Optional[str] = None
    department: Optional[str] = None
    developer_name: Optional[str] = None
    contact_type: Optional[str] = None
    individual_owner_name: Optional[str] = None
    owner_type: Optional[str] = None
    department_designation: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    designation: Optional[str] = None
    contact_no: Optional[str] = None
    alternate_no: Optional[str] = None
    email_id: Optional[EmailStr] = None
    linkedin_link: Optional[HttpUrl] = None
    city: Optional[str] = None
    location: Optional[str] = None


class ContactResponse(ContactBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True