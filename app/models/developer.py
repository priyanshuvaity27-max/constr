from sqlalchemy import Column, String, DateTime, Integer, Text, Enum, JSON
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class DeveloperType(str, enum.Enum):
    CORPORATE = "corporate"
    COWORKING = "coworking"
    WAREHOUSE = "warehouse"
    MALL = "mall"


class Grade(str, enum.Enum):
    A = "A"
    B = "B"
    C = "C"


class Developer(Base):
    __tablename__ = "developers"

    id = Column(String, primary_key=True, index=True)
    type = Column(Enum(DeveloperType), nullable=False)
    name = Column(String, nullable=False)
    grade = Column(Enum(Grade), nullable=False)
    contact_no = Column(String, nullable=False)
    email_id = Column(String, nullable=False)
    website_link = Column(String, nullable=False)
    linkedin_link = Column(String)
    ho_city = Column(String, nullable=False)
    presence_cities = Column(String)
    no_of_buildings = Column(Integer)
    no_of_coworking = Column(Integer)
    no_of_warehouses = Column(Integer)
    no_of_malls = Column(Integer)
    building_list_link = Column(String)
    contact_list_link = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())