from pydantic import BaseModel, EmailStr, HttpUrl
from typing import Optional
from datetime import datetime
from app.models.developer import DeveloperType, Grade


class DeveloperBase(BaseModel):
    type: DeveloperType
    name: str
    grade: Grade
    contact_no: str
    email_id: EmailStr
    website_link: HttpUrl
    linkedin_link: Optional[HttpUrl] = None
    ho_city: str
    presence_cities: Optional[str] = None
    no_of_buildings: Optional[int] = None
    no_of_coworking: Optional[int] = None
    no_of_warehouses: Optional[int] = None
    no_of_malls: Optional[int] = None
    building_list_link: Optional[HttpUrl] = None
    contact_list_link: Optional[HttpUrl] = None


class DeveloperCreate(DeveloperBase):
    pass


class DeveloperUpdate(BaseModel):
    type: Optional[DeveloperType] = None
    name: Optional[str] = None
    grade: Optional[Grade] = None
    contact_no: Optional[str] = None
    email_id: Optional[EmailStr] = None
    website_link: Optional[HttpUrl] = None
    linkedin_link: Optional[HttpUrl] = None
    ho_city: Optional[str] = None
    presence_cities: Optional[str] = None
    no_of_buildings: Optional[int] = None
    no_of_coworking: Optional[int] = None
    no_of_warehouses: Optional[int] = None
    no_of_malls: Optional[int] = None
    building_list_link: Optional[HttpUrl] = None
    contact_list_link: Optional[HttpUrl] = None


class DeveloperResponse(DeveloperBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True