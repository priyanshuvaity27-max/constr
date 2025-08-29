from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from app.database import get_db
from app.models import Contact, User
from app.schemas.auth import UserResponse
from app.deps import require_auth
from app.utils.errors import AppException

router = APIRouter()

@router.get("/")
async def list_contacts(
    request: Request,
    q: Optional[str] = Query(None, description="Search query"),
    type: Optional[str] = Query(None, description="Filter by type"),
    city: Optional[str] = Query(None, description="Filter by city"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    sort: Optional[str] = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(require_auth)
):
    query = db.query(Contact)
    
    # Apply filters
    if q:
        query = query.filter(
            or_(
                Contact.first_name.ilike(f"%{q}%"),
                Contact.last_name.ilike(f"%{q}%"),
                Contact.company_name.ilike(f"%{q}%"),
                Contact.email_id.ilike(f"%{q}%")
            )
        )
    if type:
        query = query.filter(Contact.type == type)
    if city:
        query = query.filter(Contact.city.ilike(f"%{city}%"))
    
    # Count total
    total = query.count()
    
    # Apply sorting
    if hasattr(Contact, sort):
        order_column = getattr(Contact, sort)
        if sort_order == "desc":
            query = query.order_by(order_column.desc())
        else:
            query = query.order_by(order_column.asc())
    
    # Apply pagination
    offset = (page - 1) * page_size
    contacts = query.offset(offset).limit(page_size).all()
    
    # Convert to response format
    contact_responses = []
    for contact in contacts:
        contact_responses.append({
            "id": str(contact.id),
            "type": contact.type.value,
            "companyName": contact.company_name,
            "industry": contact.industry,
            "department": contact.department,
            "developerName": contact.developer_name,
            "contactType": contact.contact_type,
            "individualOwnerName": contact.individual_owner_name,
            "ownerType": contact.owner_type,
            "departmentDesignation": contact.department_designation,
            "firstName": contact.first_name,
            "lastName": contact.last_name,
            "designation": contact.designation,
            "contactNo": contact.contact_no,
            "alternateNo": contact.alternate_no,
            "emailId": contact.email_id,
            "linkedinLink": contact.linkedin_link,
            "city": contact.city,
            "location": contact.location
        })
    
    return {
        "ok": True,
        "data": contact_responses,
        "meta": {
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }
    }