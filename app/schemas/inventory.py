from pydantic import BaseModel, EmailStr, HttpUrl
from typing import Optional
from datetime import datetime
from app.models.inventory import InventoryType, InventoryStatus, Grade


class InventoryBase(BaseModel):
    type: InventoryType
    name: str
    grade: Grade
    developer_owner_name: str
    contact_no: str
    alternate_contact_no: Optional[str] = None
    email_id: EmailStr
    city: str
    location: str
    google_location: Optional[HttpUrl] = None
    saleable_area: Optional[str] = None
    carpet_area: Optional[str] = None
    no_of_saleable_seats: Optional[int] = None
    floor: str
    height: Optional[str] = None
    type_of_flooring: Optional[str] = None
    flooring_size: Optional[str] = None
    side_height: Optional[str] = None
    centre_height: Optional[str] = None
    canopy: Optional[str] = None
    fire_sprinklers: Optional[str] = None
    frontage: Optional[str] = None
    terrace: Optional[str] = None
    specification: str
    status: InventoryStatus = InventoryStatus.AVAILABLE
    rent_per_sqft: Optional[float] = None
    cost_per_seat: Optional[float] = None
    cam_per_sqft: Optional[float] = None
    setup_fees_inventory: Optional[float] = None
    agreement_period: str
    lock_in_period: str
    no_of_car_parks: int = 0


class InventoryCreate(InventoryBase):
    pass


class InventoryUpdate(BaseModel):
    type: Optional[InventoryType] = None
    name: Optional[str] = None
    grade: Optional[Grade] = None
    developer_owner_name: Optional[str] = None
    contact_no: Optional[str] = None
    alternate_contact_no: Optional[str] = None
    email_id: Optional[EmailStr] = None
    city: Optional[str] = None
    location: Optional[str] = None
    google_location: Optional[HttpUrl] = None
    saleable_area: Optional[str] = None
    carpet_area: Optional[str] = None
    no_of_saleable_seats: Optional[int] = None
    floor: Optional[str] = None
    height: Optional[str] = None
    type_of_flooring: Optional[str] = None
    flooring_size: Optional[str] = None
    side_height: Optional[str] = None
    centre_height: Optional[str] = None
    canopy: Optional[str] = None
    fire_sprinklers: Optional[str] = None
    frontage: Optional[str] = None
    terrace: Optional[str] = None
    specification: Optional[str] = None
    status: Optional[InventoryStatus] = None
    rent_per_sqft: Optional[float] = None
    cost_per_seat: Optional[float] = None
    cam_per_sqft: Optional[float] = None
    setup_fees_inventory: Optional[float] = None
    agreement_period: Optional[str] = None
    lock_in_period: Optional[str] = None
    no_of_car_parks: Optional[int] = None


class InventoryResponse(InventoryBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True