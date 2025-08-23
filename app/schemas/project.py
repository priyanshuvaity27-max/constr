from pydantic import BaseModel, EmailStr, HttpUrl
from typing import Optional
from datetime import datetime
from app.models.project import ProjectType, ProjectStatus, Grade


class ProjectBase(BaseModel):
    type: ProjectType
    name: str
    grade: Grade
    developer_owner: str
    contact_no: str
    alternate_no: Optional[str] = None
    email: EmailStr
    city: str
    location: str
    landmark: Optional[str] = None
    google_location: Optional[HttpUrl] = None
    no_of_floors: Optional[int] = None
    floor_plate: Optional[str] = None
    no_of_seats: Optional[int] = None
    availability_of_seats: Optional[int] = None
    per_open_desk_cost: Optional[float] = None
    per_dedicated_desk_cost: Optional[float] = None
    setup_fees: Optional[float] = None
    no_of_warehouses: Optional[int] = None
    warehouse_size: Optional[str] = None
    total_area: Optional[str] = None
    efficiency: Optional[str] = None
    floor_plate_area: Optional[str] = None
    rent_per_sqft: float = 0
    cam_per_sqft: float = 0
    amenities: Optional[str] = None
    remark: Optional[str] = None
    status: ProjectStatus = ProjectStatus.ACTIVE


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    type: Optional[ProjectType] = None
    name: Optional[str] = None
    grade: Optional[Grade] = None
    developer_owner: Optional[str] = None
    contact_no: Optional[str] = None
    alternate_no: Optional[str] = None
    email: Optional[EmailStr] = None
    city: Optional[str] = None
    location: Optional[str] = None
    landmark: Optional[str] = None
    google_location: Optional[HttpUrl] = None
    no_of_floors: Optional[int] = None
    floor_plate: Optional[str] = None
    no_of_seats: Optional[int] = None
    availability_of_seats: Optional[int] = None
    per_open_desk_cost: Optional[float] = None
    per_dedicated_desk_cost: Optional[float] = None
    setup_fees: Optional[float] = None
    no_of_warehouses: Optional[int] = None
    warehouse_size: Optional[str] = None
    total_area: Optional[str] = None
    efficiency: Optional[str] = None
    floor_plate_area: Optional[str] = None
    rent_per_sqft: Optional[float] = None
    cam_per_sqft: Optional[float] = None
    amenities: Optional[str] = None
    remark: Optional[str] = None
    status: Optional[ProjectStatus] = None


class ProjectResponse(ProjectBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True