from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from app.database import get_db
from app.models import Project, User
from app.schemas.auth import UserResponse
from app.deps import require_auth
from app.utils.errors import AppException

router = APIRouter()

@router.get("/")
async def list_projects(
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
    query = db.query(Project)
    
    # Apply filters
    if q:
        query = query.filter(
            or_(
                Project.name.ilike(f"%{q}%"),
                Project.developer_owner.ilike(f"%{q}%"),
                Project.city.ilike(f"%{q}%")
            )
        )
    if type:
        query = query.filter(Project.type == type)
    if status:
        query = query.filter(Project.status == status)
    if city:
        query = query.filter(Project.city.ilike(f"%{city}%"))
    
    # Count total
    total = query.count()
    
    # Apply sorting
    if hasattr(Project, sort):
        order_column = getattr(Project, sort)
        if sort_order == "desc":
            query = query.order_by(order_column.desc())
        else:
            query = query.order_by(order_column.asc())
    
    # Apply pagination
    offset = (page - 1) * page_size
    projects = query.offset(offset).limit(page_size).all()
    
    # Convert to response format
    project_responses = []
    for proj in projects:
        project_responses.append({
            "id": str(proj.id),
            "type": proj.type.value,
            "name": proj.name,
            "grade": proj.grade.value,
            "developerOwner": proj.developer_owner,
            "contactNo": proj.contact_no,
            "alternateNo": proj.alternate_no,
            "email": proj.email,
            "city": proj.city,
            "location": proj.location,
            "landmark": proj.landmark,
            "googleLocation": proj.google_location,
            "noOfFloors": proj.no_of_floors,
            "floorPlate": proj.floor_plate,
            "noOfSeats": proj.no_of_seats,
            "availabilityOfSeats": proj.availability_of_seats,
            "perOpenDeskCost": float(proj.per_open_desk_cost) if proj.per_open_desk_cost else None,
            "perDedicatedDeskCost": float(proj.per_dedicated_desk_cost) if proj.per_dedicated_desk_cost else None,
            "setupFees": float(proj.setup_fees) if proj.setup_fees else None,
            "noOfWarehouses": proj.no_of_warehouses,
            "warehouseSize": proj.warehouse_size,
            "totalArea": proj.total_area,
            "efficiency": proj.efficiency,
            "floorPlateArea": proj.floor_plate_area,
            "rentPerSqft": float(proj.rent_per_sqft),
            "camPerSqft": float(proj.cam_per_sqft),
            "amenities": proj.amenities,
            "remark": proj.remark,
            "status": proj.status.value,
            "createdAt": proj.created_at.isoformat()
        })
    
    return {
        "ok": True,
        "data": project_responses,
        "meta": {
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }
    }