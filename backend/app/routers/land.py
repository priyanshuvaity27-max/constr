from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from app.database import get_db
from app.models import LandParcel, User
from app.schemas.auth import UserResponse
from app.deps import require_auth
from app.utils.errors import AppException

router = APIRouter()

@router.get("/")
async def list_land_parcels(
    request: Request,
    q: Optional[str] = Query(None, description="Search query"),
    zone: Optional[str] = Query(None, description="Filter by zone"),
    city: Optional[str] = Query(None, description="Filter by city"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    sort: Optional[str] = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(require_auth)
):
    query = db.query(LandParcel)
    
    # Apply filters
    if q:
        query = query.filter(
            or_(
                LandParcel.land_parcel_name.ilike(f"%{q}%"),
                LandParcel.location.ilike(f"%{q}%"),
                LandParcel.city.ilike(f"%{q}%")
            )
        )
    if zone:
        query = query.filter(LandParcel.zone == zone)
    if city:
        query = query.filter(LandParcel.city.ilike(f"%{city}%"))
    
    # Count total
    total = query.count()
    
    # Apply sorting
    if hasattr(LandParcel, sort):
        order_column = getattr(LandParcel, sort)
        if sort_order == "desc":
            query = query.order_by(order_column.desc())
        else:
            query = query.order_by(order_column.asc())
    
    # Apply pagination
    offset = (page - 1) * page_size
    land_parcels = query.offset(offset).limit(page_size).all()
    
    # Convert to response format
    land_responses = []
    for land in land_parcels:
        land_responses.append({
            "id": str(land.id),
            "landParcelName": land.land_parcel_name,
            "location": land.location,
            "city": land.city,
            "googleLocation": land.google_location,
            "areaInSqm": land.area_in_sqm,
            "zone": land.zone.value,
            "title": land.title,
            "roadWidth": land.road_width,
            "connectivity": land.connectivity,
            "advantages": land.advantages,
            "documents": json.loads(land.documents) if land.documents else {},
            "createdAt": land.created_at.isoformat()
        })
    
    return {
        "ok": True,
        "data": land_responses,
        "meta": {
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }
    }