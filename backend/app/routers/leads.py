from fastapi import APIRouter, Depends, Query, Request, Response
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from app.database import get_db
from app.models import Lead, User
from app.schemas.leads import LeadCreate, LeadUpdate, LeadResponse, LeadsListResponse
from app.schemas.auth import UserResponse
from app.schemas.pending_actions import PendingActionCreate
from app.deps import require_auth, require_admin
from app.utils.ids import generate_inquiry_no
from app.utils.errors import AppException
from app.services.csv_io import export_to_csv
import json

router = APIRouter()

@router.get("/", response_model=LeadsListResponse)
async def list_leads(
    request: Request,
    q: Optional[str] = Query(None, description="Search query"),
    city: Optional[str] = Query(None, description="Filter by city"),
    type_of_place: Optional[str] = Query(None, description="Filter by type of place"),
    transaction_type: Optional[str] = Query(None, description="Filter by transaction type"),
    site_visit_required: Optional[str] = Query(None, description="Filter by site visit required"),
    proposal_submitted: Optional[str] = Query(None, description="Filter by proposal submitted"),
    shortlisted: Optional[str] = Query(None, description="Filter by shortlisted"),
    deal_closed: Optional[str] = Query(None, description="Filter by deal closed"),
    assignee_id: Optional[str] = Query(None, description="Filter by assignee"),
    owner: str = Query("me", description="Filter by owner: me|all"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    sort: Optional[str] = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    format: Optional[str] = Query(None, description="Response format: json|csv"),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(require_auth)
):
    query = db.query(Lead).join(User, Lead.owner_id == User.id)
    
    # Apply ownership filter for non-admin users
    if current_user.role != "admin":
        if owner == "all":
            # Employees can only see their own or assigned leads
            query = query.filter(
                or_(Lead.owner_id == current_user.id, Lead.assignee_id == current_user.id)
            )
        else:
            query = query.filter(Lead.owner_id == current_user.id)
    elif owner == "me":
        query = query.filter(Lead.owner_id == current_user.id)
    
    # Apply filters
    if q:
        query = query.filter(
            or_(
                Lead.client_company.ilike(f"%{q}%"),
                Lead.contact_person.ilike(f"%{q}%"),
                Lead.email.ilike(f"%{q}%"),
                Lead.inquiry_no.ilike(f"%{q}%")
            )
        )
    if city:
        query = query.filter(Lead.city.ilike(f"%{city}%"))
    if type_of_place:
        query = query.filter(Lead.type_of_place == type_of_place)
    if transaction_type:
        query = query.filter(Lead.transaction_type == transaction_type)
    if site_visit_required:
        query = query.filter(Lead.site_visit_required == site_visit_required)
    if proposal_submitted:
        query = query.filter(Lead.proposal_submitted == proposal_submitted)
    if shortlisted:
        query = query.filter(Lead.shortlisted == shortlisted)
    if deal_closed:
        query = query.filter(Lead.deal_closed == deal_closed)
    if assignee_id:
        query = query.filter(Lead.assignee_id == assignee_id)
    
    # Count total
    total = query.count()
    
    # Apply sorting
    if hasattr(Lead, sort):
        order_column = getattr(Lead, sort)
        if sort_order == "desc":
            query = query.order_by(order_column.desc())
        else:
            query = query.order_by(order_column.asc())
    
    # Apply pagination
    offset = (page - 1) * page_size
    leads = query.offset(offset).limit(page_size).all()
    
    # Convert to response format
    lead_responses = []
    for lead in leads:
        owner = db.query(User).filter(User.id == lead.owner_id).first()
        assignee = db.query(User).filter(User.id == lead.assignee_id).first() if lead.assignee_id else None
        
        lead_responses.append(LeadResponse(
            id=str(lead.id),
            inquiry_no=lead.inquiry_no,
            inquiry_date=lead.inquiry_date,
            client_company=lead.client_company,
            contact_person=lead.contact_person,
            contact_no=lead.contact_no,
            email=lead.email,
            designation=lead.designation,
            department=lead.department,
            description=lead.description,
            type_of_place=lead.type_of_place.value,
            space_requirement=lead.space_requirement,
            transaction_type=lead.transaction_type.value,
            budget=float(lead.budget) if lead.budget else None,
            city=lead.city,
            location_preference=lead.location_preference,
            site_visit_required=lead.site_visit_required,
            proposal_submitted=lead.proposal_submitted,
            shortlisted=lead.shortlisted,
            deal_closed=lead.deal_closed,
            assignee_id=str(lead.assignee_id) if lead.assignee_id else None,
            owner_id=str(lead.owner_id),
            status=lead.status.value,
            created_at=lead.created_at,
            updated_at=lead.updated_at,
            owner_name=owner.name if owner else None,
            assignee_name=assignee.name if assignee else None
        ))
    
    if format == "csv":
        return export_to_csv(lead_responses, "leads")
    
    return LeadsListResponse(
        data=lead_responses,
        meta={
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }
    )

@router.post("/", response_model=LeadResponse)
async def create_lead(
    lead_data: LeadCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(require_auth)
):
    if current_user.role != "admin":
        # Create pending action for employee
        from app.models import PendingAction
        
        pending_action = PendingAction(
            module="leads",
            type="create",
            data=json.dumps(lead_data.dict()),
            requested_by=current_user.id,
            requested_by_name=current_user.name,
            status="pending"
        )
        
        db.add(pending_action)
        db.commit()
        
        raise AppException(
            code="PENDING_APPROVAL",
            message="Lead creation request submitted for admin approval",
            status_code=202
        )
    
    # Admin can create directly
    db_lead = Lead(
        inquiry_no=lead_data.inquiry_no or generate_inquiry_no(),
        inquiry_date=lead_data.inquiry_date,
        client_company=lead_data.client_company,
        contact_person=lead_data.contact_person,
        contact_no=lead_data.contact_no,
        email=lead_data.email,
        designation=lead_data.designation,
        department=lead_data.department,
        description=lead_data.description,
        type_of_place=lead_data.type_of_place,
        space_requirement=lead_data.space_requirement,
        transaction_type=lead_data.transaction_type,
        budget=lead_data.budget,
        city=lead_data.city,
        location_preference=lead_data.location_preference,
        site_visit_required=lead_data.site_visit_required,
        proposal_submitted=lead_data.proposal_submitted,
        shortlisted=lead_data.shortlisted,
        deal_closed=lead_data.deal_closed,
        assignee_id=lead_data.assignee_id,
        owner_id=current_user.id
    )
    
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    
    owner = db.query(User).filter(User.id == db_lead.owner_id).first()
    assignee = db.query(User).filter(User.id == db_lead.assignee_id).first() if db_lead.assignee_id else None
    
    return LeadResponse(
        id=str(db_lead.id),
        inquiry_no=db_lead.inquiry_no,
        inquiry_date=db_lead.inquiry_date,
        client_company=db_lead.client_company,
        contact_person=db_lead.contact_person,
        contact_no=db_lead.contact_no,
        email=db_lead.email,
        designation=db_lead.designation,
        department=db_lead.department,
        description=db_lead.description,
        type_of_place=db_lead.type_of_place.value,
        space_requirement=db_lead.space_requirement,
        transaction_type=db_lead.transaction_type.value,
        budget=float(db_lead.budget) if db_lead.budget else None,
        city=db_lead.city,
        location_preference=db_lead.location_preference,
        site_visit_required=db_lead.site_visit_required,
        proposal_submitted=db_lead.proposal_submitted,
        shortlisted=db_lead.shortlisted,
        deal_closed=db_lead.deal_closed,
        assignee_id=str(db_lead.assignee_id) if db_lead.assignee_id else None,
        owner_id=str(db_lead.owner_id),
        status=db_lead.status.value,
        created_at=db_lead.created_at,
        updated_at=db_lead.updated_at,
        owner_name=owner.name if owner else None,
        assignee_name=assignee.name if assignee else None
    )

@router.get("/{lead_id}", response_model=LeadResponse)
async def get_lead(
    lead_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(require_auth)
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise AppException(
            code="LEAD_NOT_FOUND",
            message="Lead not found",
            status_code=404
        )
    
    # Check ownership for non-admin users
    if current_user.role != "admin":
        if str(lead.owner_id) != current_user.id and str(lead.assignee_id) != current_user.id:
            raise AppException(
                code="PERMISSION_DENIED",
                message="Access denied",
                status_code=403
            )
    
    owner = db.query(User).filter(User.id == lead.owner_id).first()
    assignee = db.query(User).filter(User.id == lead.assignee_id).first() if lead.assignee_id else None
    
    return LeadResponse(
        id=str(lead.id),
        inquiry_no=lead.inquiry_no,
        inquiry_date=lead.inquiry_date,
        client_company=lead.client_company,
        contact_person=lead.contact_person,
        contact_no=lead.contact_no,
        email=lead.email,
        designation=lead.designation,
        department=lead.department,
        description=lead.description,
        type_of_place=lead.type_of_place.value,
        space_requirement=lead.space_requirement,
        transaction_type=lead.transaction_type.value,
        budget=float(lead.budget) if lead.budget else None,
        city=lead.city,
        location_preference=lead.location_preference,
        site_visit_required=lead.site_visit_required,
        proposal_submitted=lead.proposal_submitted,
        shortlisted=lead.shortlisted,
        deal_closed=lead.deal_closed,
        assignee_id=str(lead.assignee_id) if lead.assignee_id else None,
        owner_id=str(lead.owner_id),
        status=lead.status.value,
        created_at=lead.created_at,
        updated_at=lead.updated_at,
        owner_name=owner.name if owner else None,
        assignee_name=assignee.name if assignee else None
    )

@router.patch("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: str,
    lead_update: LeadUpdate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(require_auth)
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise AppException(
            code="LEAD_NOT_FOUND",
            message="Lead not found",
            status_code=404
        )
    
    if current_user.role != "admin":
        # Check ownership
        if str(lead.owner_id) != current_user.id and str(lead.assignee_id) != current_user.id:
            raise AppException(
                code="PERMISSION_DENIED",
                message="Access denied",
                status_code=403
            )
        
        # Create pending action for employee
        from app.models import PendingAction
        
        pending_action = PendingAction(
            module="leads",
            type="update",
            data=json.dumps(lead_update.dict(exclude_unset=True)),
            target_id=lead_id,
            requested_by=current_user.id,
            requested_by_name=current_user.name,
            status="pending"
        )
        
        db.add(pending_action)
        db.commit()
        
        raise AppException(
            code="PENDING_APPROVAL",
            message="Lead update request submitted for admin approval",
            status_code=202
        )
    
    # Admin can update directly
    update_data = lead_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lead, field, value)
    
    db.commit()
    db.refresh(lead)
    
    owner = db.query(User).filter(User.id == lead.owner_id).first()
    assignee = db.query(User).filter(User.id == lead.assignee_id).first() if lead.assignee_id else None
    
    return LeadResponse(
        id=str(lead.id),
        inquiry_no=lead.inquiry_no,
        inquiry_date=lead.inquiry_date,
        client_company=lead.client_company,
        contact_person=lead.contact_person,
        contact_no=lead.contact_no,
        email=lead.email,
        designation=lead.designation,
        department=lead.department,
        description=lead.description,
        type_of_place=lead.type_of_place.value,
        space_requirement=lead.space_requirement,
        transaction_type=lead.transaction_type.value,
        budget=float(lead.budget) if lead.budget else None,
        city=lead.city,
        location_preference=lead.location_preference,
        site_visit_required=lead.site_visit_required,
        proposal_submitted=lead.proposal_submitted,
        shortlisted=lead.shortlisted,
        deal_closed=lead.deal_closed,
        assignee_id=str(lead.assignee_id) if lead.assignee_id else None,
        owner_id=str(lead.owner_id),
        status=lead.status.value,
        created_at=lead.created_at,
        updated_at=lead.updated_at,
        owner_name=owner.name if owner else None,
        assignee_name=assignee.name if assignee else None
    )

@router.delete("/{lead_id}")
async def delete_lead(
    lead_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(require_auth)
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise AppException(
            code="LEAD_NOT_FOUND",
            message="Lead not found",
            status_code=404
        )
    
    if current_user.role != "admin":
        # Check ownership
        if str(lead.owner_id) != current_user.id:
            raise AppException(
                code="PERMISSION_DENIED",
                message="Access denied",
                status_code=403
            )
        
        # Create pending action for employee
        from app.models import PendingAction
        
        pending_action = PendingAction(
            module="leads",
            type="delete",
            data="{}",
            target_id=lead_id,
            requested_by=current_user.id,
            requested_by_name=current_user.name,
            status="pending"
        )
        
        db.add(pending_action)
        db.commit()
        
        raise AppException(
            code="PENDING_APPROVAL",
            message="Lead deletion request submitted for admin approval",
            status_code=202
        )
    
    # Admin can delete directly
    db.delete(lead)
    db.commit()
    
    return {"ok": True, "message": "Lead deleted successfully"}

@router.post("/import")
async def import_leads(
    request: Request,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(require_admin)
):
    # This would handle CSV import
    # Implementation depends on multipart form handling
    return {"ok": True, "message": "Import functionality to be implemented"}