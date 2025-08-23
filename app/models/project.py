from sqlalchemy import Column, String, DateTime, Integer, Float, Text, Enum
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class ProjectType(str, enum.Enum):
    CORPORATE_BUILDING = "corporate_building"
    COWORKING_SPACE = "coworking_space"
    WAREHOUSE = "warehouse"
    RETAIL_MALL = "retail_mall"


class ProjectStatus(str, enum.Enum):
    ACTIVE = "Active"
    INACTIVE = "Inactive"
    UNDER_CONSTRUCTION = "Under Construction"


class Grade(str, enum.Enum):
    A = "A"
    B = "B"
    C = "C"


class ProjectMaster(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, index=True)
    type = Column(Enum(ProjectType), nullable=False)
    name = Column(String, nullable=False)
    grade = Column(Enum(Grade), nullable=False)
    developer_owner = Column(String, nullable=False)
    contact_no = Column(String, nullable=False)
    alternate_no = Column(String)
    email = Column(String, nullable=False)
    city = Column(String, nullable=False)
    location = Column(String, nullable=False)
    landmark = Column(String)
    google_location = Column(String)
    
    # Corporate Building specific
    no_of_floors = Column(Integer)
    floor_plate = Column(String)
    
    # Coworking specific
    no_of_seats = Column(Integer)
    availability_of_seats = Column(Integer)
    per_open_desk_cost = Column(Float)
    per_dedicated_desk_cost = Column(Float)
    setup_fees = Column(Float)
    
    # Warehouse specific
    no_of_warehouses = Column(Integer)
    warehouse_size = Column(String)
    
    # Retail/Mall specific
    total_area = Column(String)
    efficiency = Column(String)
    floor_plate_area = Column(String)
    
    # Common fields
    rent_per_sqft = Column(Float, nullable=False, default=0)
    cam_per_sqft = Column(Float, nullable=False, default=0)
    amenities = Column(Text)
    remark = Column(Text)
    status = Column(Enum(ProjectStatus), nullable=False, default=ProjectStatus.ACTIVE)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())