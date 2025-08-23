from pydantic import BaseModel, HttpUrl
from typing import Optional, Dict, Any
from datetime import datetime
from app.models.land import Zone


class LandBase(BaseModel):
    land_parcel_name: str
    location: str
    city: str
    google_location: Optional[HttpUrl] = None
    area_in_sqm: int
    zone: Zone
    title: str
    road_width: Optional[str] = None
    connectivity: Optional[str] = None
    advantages: Optional[str] = None
    documents: Optional[Dict[str, Any]] = None


class LandCreate(LandBase):
    pass


class LandUpdate(BaseModel):
    land_parcel_name: Optional[str] = None
    location: Optional[str] = None
    city: Optional[str] = None
    google_location: Optional[HttpUrl] = None
    area_in_sqm: Optional[int] = None
    zone: Optional[Zone] = None
    title: Optional[str] = None
    road_width: Optional[str] = None
    connectivity: Optional[str] = None
    advantages: Optional[str] = None
    documents: Optional[Dict[str, Any]] = None


class LandResponse(LandBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True