from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from app.database import get_db
from app.models import InventoryItem, User
from app.schemas.auth import UserResponse
from app.deps import require_auth
from app.utils.errors import AppException

router = APIRouter()

@router.get("/")
async def list_inventory(
    request: Request,
    q: Optional[str] = Query(None, description="Search query"),
    type: Optional[str] = Query(None, description="Filter by type"),
    status: Optional[str] = Query(None, description="Filter by status"),
    city: Optional[str] = Query(None, description="Filter by city"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    sort: Optional[str] = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(require_auth)
):
    query = db.query(InventoryItem)
    
    # Apply filters
    if q:
        query = query.filter(
            or_(
                InventoryItem.name.ilike(f"%{q}%"),
                InventoryItem.developer_owner_name.ilike(f"%{q}%"),
                InventoryItem.city.ilike(f"%{q}%")
            )
        )
    if type:
        query = query.filter(InventoryItem.type == type)
    if status:
        query = query.filter(InventoryItem.status == status)
    if city:
        query = query.filter(InventoryItem.city.ilike(f"%{city}%"))
    
    # Count total
    total = query.count()
    
    # Apply sorting
    if hasattr(InventoryItem, sort):
        order_column = getattr(InventoryItem, sort)
        if sort_order == "desc":
            query = query.order_by(order_column.desc())
        else:
            query = query.order_by(order_column.asc())
    
    # Apply pagination
    offset = (page - 1) * page_size
    inventory = query.offset(offset).limit(page_size).all()
    
    # Convert to response format
    inventory_responses = []
    for item in inventory:
        inventory_responses.append({
            "id": str(item.id),
            "type": item.type.value,
            "name": item.name,
            "grade": item.grade.value,
            "developerOwnerName": item.developer_owner_name,
            "contactNo": item.contact_no,
            "alternateContactNo": item.alternate_contact_no,
            "emailId": item.email_id,
            "city": item.city,
            "location": item.location,
            "googleLocation": item.google_location,
            "saleableArea": item.saleable_area,
            "carpetArea": item.carpet_area,
            "noOfSaleableSeats": item.no_of_saleable_seats,
            "floor": item.floor,
            "height": item.height,
            "typeOfFlooring": item.type_of_flooring,
            "flooringSize": item.flooring_size,
            "sideHeight": item.side_height,
            "centreHeight": item.centre_height,
            "canopy": item.canopy,
            "fireSprinklers": item.fire_sprinklers,
            "frontage": item.frontage,
            "terrace": item.terrace,
            "specification": item.specification,
            "status": item.status.value,
            "rentPerSqft": float(item.rent_per_sqft) if item.rent_per_sqft else None,
            "costPerSeat": float(item.cost_per_seat) if item.cost_per_seat else None,
            "camPerSqft": float(item.cam_per_sqft) if item.cam_per_sqft else None,
            "setupFeesInventory": float(item.setup_fees_inventory) if item.setup_fees_inventory else None,
            "agreementPeriod": item.agreement_period,
            "lockInPeriod": item.lock_in_period,
            "noOfCarParks": item.no_of_car_parks,
            "createdAt": item.created_at.isoformat()
        })
    
    return {
        "ok": True,
        "data": inventory_responses,
        "meta": {
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }
    }