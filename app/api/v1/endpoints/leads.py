from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.api.deps import require_auth, require_admin
from app.models.lead import Lead
from app.models.user import User
from app.models.pending_action import PendingAction
from app.schemas.lead import LeadCreate, LeadUpdate, LeadResponse
from app.schemas.auth import UserResponse
from app.schemas.pending_action import PendingActionCreate
from app.utils.errors import AppException
from app.utils.ids import generate_id, generate_inquiry_no
from app.services.csv_service import export_to_csv, import_from_csv
import json

router = APIRouter()


@router.get("/")
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
    query = db.query(Lead).join(User, Lead.lead_managed_by == User.id)
    
    # Apply ownership filter for non-admin users
    if current_user.role != "admin":
        if owner == "all":
            # Employees can only see their own or assigned leads
            query = query.filter(
                or_(Lead.lead_managed_by == current_user.id)
            )
        else:
            query = query.filter(Lead.lead_managed_by == current_user.id)
    elif owner == "me":
        query = query.filter(Lead.lead_managed_by == current_user.id)
    
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
        manager = db.query(User).filter(User.id == lead.lead_managed_by).first()
        
        lead_responses.append({
            "id": str(lead.id),
            "inquiry_no": lead.inquiry_no,
            "inquiry_date": lead.inquiry_date.isoformat() if lead.inquiry_date else None,
            "client_company": lead.client_company,
            "contact_person": lead.contact_person,
            "contact_no": lead.contact_no,
            "email": lead.email,
            "designation": lead.designation,
            "department": lead.department,
            "description": lead.description,
            "type_of_place": lead.type_of_place.value,
            "space_requirement": lead.space_requirement,
            "transaction_type": lead.transaction_type.value,
            "budget": float(lead.budget) if lead.budget else None,
            "city": lead.city,
            "location_preference": lead.location_preference,
            "first_contact_date": lead.first_contact_date.isoformat() if lead.first_contact_date else None,
            "lead_managed_by": str(lead.lead_managed_by),
            "status": lead.status.value,
            "option_shared": lead.option_shared.value,
            "last_contact_date": lead.last_contact_date.isoformat() if lead.last_contact_date else None,
            "next_action_plan": lead.next_action_plan,
            "action_date": lead.action_date.isoformat() if lead.action_date else None,
            "remark": lead.remark,
            "created_at": lead.created_at.isoformat(),
            "updated_at": lead.updated_at.isoformat() if lead.updated_at else None,
            "lead_manager_name": manager.name if manager else None
        })
    
    if format == "csv":
        return export_to_csv(lead_responses, "leads")
    
    return {
        "ok": True,
        "data": lead_responses,
        "meta": {
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }
    }


@router.post("/")
async def create_lead(
    lead_data: LeadCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(require_auth)
):
    if current_user.role != "admin":
        # Create pending action for employee
        pending_action = PendingAction(
            id=generate_id(),
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
    # Check if inquiry number already exists
    if lead_data.inquiry_no:
        existing_lead = db.query(Lead).filter(Lead.inquiry_no == lead_data.inquiry_no).first()
        if existing_lead:
            raise AppException(
                code="INQUIRY_NO_EXISTS",
                message="Inquiry number already exists",
                status_code=400
            )
    
    db_lead = Lead(
        id=generate_id(),
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
        first_contact_date=lead_data.first_contact_date,
        lead_managed_by=current_user.id,
        status=lead_data.status,
        option_shared=lead_data.option_shared,
        last_contact_date=lead_data.last_contact_date,
        next_action_plan=lead_data.next_action_plan,
        action_date=lead_data.action_date,
        remark=lead_data.remark
    )
    
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    
    manager = db.query(User).filter(User.id == db_lead.lead_managed_by).first()
    
    return {
        "ok": True,
        "data": {
            "id": str(db_lead.id),
            "inquiry_no": db_lead.inquiry_no,
            "client_company": db_lead.client_company,
            "contact_person": db_lead.contact_person,
            "lead_manager_name": manager.name if manager else None,
            "created_at": db_lead.created_at.isoformat()
        }
    }


@router.get("/{lead_id}")
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
        if str(lead.lead_managed_by) != current_user.id:
            raise AppException(
                code="PERMISSION_DENIED",
                message="Access denied",
                status_code=403
            )
    
    manager = db.query(User).filter(User.id == lead.lead_managed_by).first()
    
    return {
        "ok": True,
        "data": {
            "id": str(lead.id),
            "inquiry_no": lead.inquiry_no,
            "inquiry_date": lead.inquiry_date.isoformat() if lead.inquiry_date else None,
            "client_company": lead.client_company,
            "contact_person": lead.contact_person,
            "contact_no": lead.contact_no,
            "email": lead.email,
            "designation": lead.designation,
            "department": lead.department,
            "description": lead.description,
            "type_of_place": lead.type_of_place.value,
            "space_requirement": lead.space_requirement,
            "transaction_type": lead.transaction_type.value,
            "budget": float(lead.budget) if lead.budget else None,
            "city": lead.city,
            "location_preference": lead.location_preference,
            "first_contact_date": lead.first_contact_date.isoformat() if lead.first_contact_date else None,
            "lead_managed_by": str(lead.lead_managed_by),
            "status": lead.status.value,
            "option_shared": lead.option_shared.value,
            "last_contact_date": lead.last_contact_date.isoformat() if lead.last_contact_date else None,
            "next_action_plan": lead.next_action_plan,
            "action_date": lead.action_date.isoformat() if lead.action_date else None,
            "remark": lead.remark,
            "created_at": lead.created_at.isoformat(),
            "updated_at": lead.updated_at.isoformat() if lead.updated_at else None,
            "lead_manager_name": manager.name if manager else None
        }
    }


@router.patch("/{lead_id}")
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
        if str(lead.lead_managed_by) != current_user.id:
            raise AppException(
                code="PERMISSION_DENIED",
                message="Access denied",
                status_code=403
            )
        
        # Create pending action for employee
        pending_action = PendingAction(
            id=generate_id(),
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
    
    return {"ok": True, "message": "Lead updated successfully"}


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
        if str(lead.lead_managed_by) != current_user.id:
            raise AppException(
                code="PERMISSION_DENIED",
                message="Access denied",
                status_code=403
            )
        
        # Create pending action for employee
        pending_action = PendingAction(
            id=generate_id(),
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
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(require_admin)
):
    if not file.filename or not file.filename.endswith('.csv'):
        raise AppException(
            code="INVALID_FILE",
            message="Please upload a CSV file",
            status_code=400
        )
    
    content = await file.read()
    csv_data = content.decode('utf-8')
    
    result = import_from_csv(csv_data, LeadCreate)
    
    # Create leads from valid rows
    created_count = 0
    for row_data in result["valid_rows"]:
        try:
            db_lead = Lead(
                id=generate_id(),
                inquiry_no=row_data.get("inquiry_no") or generate_inquiry_no(),
                lead_managed_by=current_user.id,
                **row_data
            )
            db.add(db_lead)
            created_count += 1
        except Exception as e:
            result["errors"].append(f"Failed to create lead: {str(e)}")
    
    db.commit()
    
    return {
        "ok": True,
        "message": f"Import completed. {created_count} leads created.",
        "details": {
            "created": created_count,
            "errors": result["errors"],
            "total_rows": result["total_rows"]
        }
    }
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = Query(None, alias="status"),
    city_filter: Optional[str] = Query(None, alias="city"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Lead)
    
    # Non-admin users can only see their own leads
    if current_user.role.value != "admin":
        query = query.filter(Lead.lead_managed_by == current_user.id)
    
    # Apply filters
    if status_filter:
        query = query.filter(Lead.status == status_filter)
    if city_filter:
        query = query.filter(Lead.city.ilike(f"%{city_filter}%"))
    
    leads = query.offset(skip).limit(limit).all()
    return leads


@router.post("/", response_model=LeadResponse)
def create_lead(
    lead: LeadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if inquiry number already exists
    existing_lead = db.query(Lead).filter(Lead.inquiry_no == lead.inquiry_no).first()
    if existing_lead:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inquiry number already exists"
        )
    
    db_lead = Lead(
        id=str(uuid.uuid4()),
        **lead.dict()
    )
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    return db_lead


@router.get("/{lead_id}", response_model=LeadResponse)
def read_lead(
    lead_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if lead is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    
    # Non-admin users can only see their own leads
    if current_user.role.value != "admin" and lead.lead_managed_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return lead


@router.put("/{lead_id}", response_model=LeadResponse)
def update_lead(
    lead_id: str,
    lead_update: LeadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if lead is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    
    # Non-admin users can only update their own leads
    if current_user.role.value != "admin" and lead.lead_managed_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    update_data = lead_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lead, field, value)
    
    db.commit()
    db.refresh(lead)
    return lead


@router.delete("/{lead_id}")
def delete_lead(
    lead_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if lead is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    
    # Non-admin users can only delete their own leads
    if current_user.role.value != "admin" and lead.lead_managed_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    db.delete(lead)
    db.commit()
    return {"message": "Lead deleted successfully"}