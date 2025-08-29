from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from app.database import get_db
from app.models import Developer, User
from app.schemas.auth import UserResponse
from app.deps import require_auth, require_admin
from app.utils.errors import AppException

router = APIRouter()

@router.get("/")
async def list_developers(
    request: Request,
    q: Optional[str] = Query(None, description="Search query"),
    type: Optional[str] = Query(None, description="Filter by type"),
    grade: Optional[str] = Query(None, description="Filter by grade"),
    city: Optional[str] = Query(None, description="Filter by city"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    sort: Optional[str] = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(require_auth)
):
    query = db.query(Developer)
    
    # Apply filters
    if q:
        query = query.filter(
            or_(
                Developer.name.ilike(f"%{q}%"),
                Developer.email_id.ilike(f"%{q}%"),
                Developer.ho_city.ilike(f"%{q}%")
            )
        )
    if type:
        query = query.filter(Developer.type == type)
    if grade:
        query = query.filter(Developer.grade == grade)
    if city:
        query = query.filter(Developer.ho_city.ilike(f"%{city}%"))
    
    # Count total
    total = query.count()
    
    # Apply sorting
    if hasattr(Developer, sort):
        order_column = getattr(Developer, sort)
        if sort_order == "desc":
            query = query.order_by(order_column.desc())
        else:
            query = query.order_by(order_column.asc())
    
    # Apply pagination
    offset = (page - 1) * page_size
    developers = query.offset(offset).limit(page_size).all()
    
    # Convert to response format
    developer_responses = []
    for dev in developers:
        developer_responses.append({
            "id": str(dev.id),
            "type": dev.type.value,
            "name": dev.name,
            "grade": dev.grade.value,
            "contactNo": dev.contact_no,
            "emailId": dev.email_id,
            "websiteLink": dev.website_link,
            "linkedinLink": dev.linkedin_link,
            "hoCity": dev.ho_city,
            "presenceCities": dev.presence_cities,
            "noOfBuildings": dev.no_of_buildings,
            "noOfCoworking": dev.no_of_coworking,
            "noOfWarehouses": dev.no_of_warehouses,
            "noOfMalls": dev.no_of_malls,
            "buildingListLink": dev.building_list_link,
            "contactListLink": dev.contact_list_link,
            "createdAt": dev.created_at.isoformat()
        })
    
    return {
        "ok": True,
        "data": developer_responses,
        "meta": {
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }
    }