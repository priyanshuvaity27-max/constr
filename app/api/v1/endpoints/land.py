from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.land import LandParcel
from app.schemas.land import LandCreate, LandUpdate, LandResponse
import uuid

router = APIRouter()


@router.get("/", response_model=List[LandResponse])
def read_land_parcels(
    skip: int = 0,
    limit: int = 100,
    zone_filter: Optional[str] = Query(None, alias="zone"),
    city_filter: Optional[str] = Query(None, alias="city"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(LandParcel)
    
    # Apply filters
    if zone_filter:
        query = query.filter(LandParcel.zone == zone_filter)
    if city_filter:
        query = query.filter(LandParcel.city.ilike(f"%{city_filter}%"))
    
    land_parcels = query.offset(skip).limit(limit).all()
    return land_parcels


@router.post("/", response_model=LandResponse)
def create_land_parcel(
    land_parcel: LandCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_land = LandParcel(
        id=str(uuid.uuid4()),
        **land_parcel.dict()
    )
    db.add(db_land)
    db.commit()
    db.refresh(db_land)
    return db_land


@router.get("/{land_id}", response_model=LandResponse)
def read_land_parcel(
    land_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    land_parcel = db.query(LandParcel).filter(LandParcel.id == land_id).first()
    if land_parcel is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Land parcel not found"
        )
    return land_parcel


@router.put("/{land_id}", response_model=LandResponse)
def update_land_parcel(
    land_id: str,
    land_update: LandUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    land_parcel = db.query(LandParcel).filter(LandParcel.id == land_id).first()
    if land_parcel is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Land parcel not found"
        )
    
    update_data = land_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(land_parcel, field, value)
    
    db.commit()
    db.refresh(land_parcel)
    return land_parcel


@router.delete("/{land_id}")
def delete_land_parcel(
    land_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    land_parcel = db.query(LandParcel).filter(LandParcel.id == land_id).first()
    if land_parcel is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Land parcel not found"
        )
    
    db.delete(land_parcel)
    db.commit()
    return {"message": "Land parcel deleted successfully"}