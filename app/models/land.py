from sqlalchemy import Column, String, DateTime, Integer, Text, Enum, JSON
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class Zone(str, enum.Enum):
    COMMERCIAL = "Commercial"
    RESIDENTIAL = "Residential"
    INDUSTRIAL = "Industrial"
    MIXED_USE = "Mixed Use"


class LandParcel(Base):
    __tablename__ = "land_parcels"

    id = Column(String, primary_key=True, index=True)
    land_parcel_name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    city = Column(String, nullable=False)
    google_location = Column(String)
    area_in_sqm = Column(Integer, nullable=False)
    zone = Column(Enum(Zone), nullable=False)
    title = Column(String, nullable=False)
    road_width = Column(String)
    connectivity = Column(Text)
    advantages = Column(Text)
    documents = Column(JSON)  # Store document status as JSON
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())