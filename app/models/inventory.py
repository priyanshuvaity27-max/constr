from sqlalchemy import Column, String, DateTime, Integer, Float, Text, Enum
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class InventoryType(str, enum.Enum):
    CORPORATE_BUILDING = "corporate_building"
    COWORKING_SPACE = "coworking_space"
    WAREHOUSE = "warehouse"
    RETAIL_MALL = "retail_mall"


class InventoryStatus(str, enum.Enum):
    AVAILABLE = "Available"
    OCCUPIED = "Occupied"
    UNDER_MAINTENANCE = "Under Maintenance"


class Grade(str, enum.Enum):
    A = "A"
    B = "B"
    C = "C"


class InventoryItem(Base):
    __tablename__ = "inventory"

    id = Column(String, primary_key=True, index=True)
    type = Column(Enum(InventoryType), nullable=False)
    name = Column(String, nullable=False)
    grade = Column(Enum(Grade), nullable=False)
    developer_owner_name = Column(String, nullable=False)
    contact_no = Column(String, nullable=False)
    alternate_contact_no = Column(String)
    email_id = Column(String, nullable=False)
    city = Column(String, nullable=False)
    location = Column(String, nullable=False)
    google_location = Column(String)
    
    # Area fields
    saleable_area = Column(String)
    carpet_area = Column(String)
    no_of_saleable_seats = Column(Integer)
    floor = Column(String, nullable=False)
    height = Column(String)
    
    # Warehouse specific
    type_of_flooring = Column(String)
    flooring_size = Column(String)
    side_height = Column(String)
    centre_height = Column(String)
    canopy = Column(String)
    fire_sprinklers = Column(String)
    
    # Retail/Mall specific
    frontage = Column(String)
    
    # Common fields
    terrace = Column(String)
    specification = Column(Text, nullable=False)
    status = Column(Enum(InventoryStatus), nullable=False, default=InventoryStatus.AVAILABLE)
    rent_per_sqft = Column(Float)
    cost_per_seat = Column(Float)
    cam_per_sqft = Column(Float)
    setup_fees_inventory = Column(Float)
    agreement_period = Column(String, nullable=False)
    lock_in_period = Column(String, nullable=False)
    no_of_car_parks = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())