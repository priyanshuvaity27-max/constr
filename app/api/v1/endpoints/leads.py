from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.core.database import get_db
from app.api.deps import get_current_user, require_admin
from app.models.employee import Employee
from app.models.lead import Lead
from app.models.pending_action import PendingAction
from app.schemas.lead import LeadCreate, LeadUpdate, LeadResponse
from app.schemas.pending_action import PendingActionCreate
from app.utils.errors import AppException
from app.utils.ids import generate_id, generate_inquiry_no
from app.services.csv_service import export_to_csv, import_from_csv
from app.services.approval_service import create_pending_action
import json

router = APIRouter()

@router.get("/")
async def list_leads(
    request: Request,
    q: Optional[str] = Query(None, description="Search query"),
    city: Optional[str] = Query(None, description="Filter by city"),
    type_of_space: Optional[str] = Query(None, description="Filter by type of space"),
    transaction_type: Optional[str] = Query(None, description="Filter by transaction type"),
    status: Optional[str] = Query(None, description="Filter by status"),
    owner: str = Query("me", description="Filter by owner: me|all"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    sort: Optional[str] = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    format: Optional[str] = Query(None, description="Response format: json|csv"),
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    query = db.query(Lead)
    
    # Apply ownership filter for non-admin users
    if current_user.role.value != "admin":
        if owner == "all":
            # Employees can only see their own or assigned leads
            query = query.filter(
                or_(
                    Lead.owner_id == current_user.id,
                    Lead.assignee_id == current_user.id
                )
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
    if type_of_space:
        query = query.filter(Lead.type_of_space == type_of_space)
    if transaction_type:
        query = query.filter(Lead.transaction_type == transaction_type)
    if status:
        query = query.filter(Lead.status == status)
    
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
        owner = db.query(Employee).filter(Employee.id == lead.owner_id).first()
        assignee = db.query(Employee).filter(Employee.id == lead.assignee_id).first()
        
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
            "type_of_space": lead.type_of_space.value if lead.type_of_space else None,
            "space_requirement": lead.space_requirement,
            "transaction_type": lead.transaction_type.value if lead.transaction_type else None,
            "representative": lead.representative,
            "budget": float(lead.budget) if lead.budget else None,
            "city": lead.city,
            "location_preference": lead.location_preference,
            "description": lead.description,
            "first_contact_date": lead.first_contact_date.isoformat() if lead.first_contact_date else None,
            "last_contact_date": lead.last_contact_date.isoformat() if lead.last_contact_date else None,
            "lead_managed_by": lead.lead_managed_by,
            "action_date": lead.action_date.isoformat() if lead.action_date else None,
            "status": lead.status.value if lead.status else None,
            "next_action_plan": lead.next_action_plan,
            "option_shared": lead.option_shared,
            "remarks": lead.remarks,
            "owner_id": str(lead.owner_id) if lead.owner_id else None,
            "assignee_id": str(lead.assignee_id) if lead.assignee_id else None,
            "owner_name": owner.name if owner else None,
            "assignee_name": assignee.name if assignee else None,
            "created_at": lead.created_at.isoformat(),
            "updated_at": lead.updated_at.isoformat() if lead.updated_at else None
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
    current_user: Employee = Depends(get_current_user)
):
    if current_user.role.value != "admin":
        # Create pending action for employee
        await create_pending_action(
            db=db,
            module="leads",
            action_type="create",
            payload=lead_data.dict(),
            requested_by=current_user.id
        )
        
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
        owner_id=current_user.id,
        **lead_data.dict(exclude={"inquiry_no"})
    )
    
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    
    return {
        "ok": True,
        "data": {
            "id": str(db_lead.id),
            "inquiry_no": db_lead.inquiry_no,
            "client_company": db_lead.client_company,
            "contact_person": db_lead.contact_person,
            "created_at": db_lead.created_at.isoformat()
        }
    }

@router.get("/{lead_id}")
async def get_lead(
    lead_id: str,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise AppException(
            code="LEAD_NOT_FOUND",
            message="Lead not found",
            status_code=404
        )
    
    # Check ownership for non-admin users
    if current_user.role.value != "admin":
        if str(lead.owner_id) != current_user.id and str(lead.assignee_id) != current_user.id:
            raise AppException(
                code="PERMISSION_DENIED",
                message="Access denied",
                status_code=403
            )
    
    owner = db.query(Employee).filter(Employee.id == lead.owner_id).first()
    assignee = db.query(Employee).filter(Employee.id == lead.assignee_id).first()
    
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
            "type_of_space": lead.type_of_space.value if lead.type_of_space else None,
            "space_requirement": lead.space_requirement,
            "transaction_type": lead.transaction_type.value if lead.transaction_type else None,
            "representative": lead.representative,
            "budget": float(lead.budget) if lead.budget else None,
            "city": lead.city,
            "location_preference": lead.location_preference,
            "description": lead.description,
            "first_contact_date": lead.first_contact_date.isoformat() if lead.first_contact_date else None,
            "last_contact_date": lead.last_contact_date.isoformat() if lead.last_contact_date else None,
            "lead_managed_by": lead.lead_managed_by,
            "action_date": lead.action_date.isoformat() if lead.action_date else None,
            "status": lead.status.value if lead.status else None,
            "next_action_plan": lead.next_action_plan,
            "option_shared": lead.option_shared,
            "remarks": lead.remarks,
            "owner_id": str(lead.owner_id) if lead.owner_id else None,
            "assignee_id": str(lead.assignee_id) if lead.assignee_id else None,
            "owner_name": owner.name if owner else None,
            "assignee_name": assignee.name if assignee else None,
            "created_at": lead.created_at.isoformat(),
            "updated_at": lead.updated_at.isoformat() if lead.updated_at else None
        }
    }

@router.patch("/{lead_id}")
async def update_lead(
    lead_id: str,
    lead_update: LeadUpdate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise AppException(
            code="LEAD_NOT_FOUND",
            message="Lead not found",
            status_code=404
        )
    
    if current_user.role.value != "admin":
        # Check ownership
        if str(lead.owner_id) != current_user.id and str(lead.assignee_id) != current_user.id:
            raise AppException(
                code="PERMISSION_DENIED",
                message="Access denied",
                status_code=403
            )
        
        # Create pending action for employee
        await create_pending_action(
            db=db,
            module="leads",
            action_type="update",
            payload=lead_update.dict(exclude_unset=True),
            target_id=lead_id,
            requested_by=current_user.id
        )
        
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
    current_user: Employee = Depends(get_current_user)
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise AppException(
            code="LEAD_NOT_FOUND",
            message="Lead not found",
            status_code=404
        )
    
    if current_user.role.value != "admin":
        # Check ownership
        if str(lead.owner_id) != current_user.id:
            raise AppException(
                code="PERMISSION_DENIED",
                message="Access denied",
                status_code=403
            )
        
        # Create pending action for employee
        await create_pending_action(
            db=db,
            module="leads",
            action_type="delete",
            payload={},
            target_id=lead_id,
            requested_by=current_user.id
        )
        
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
    current_user: Employee = Depends(require_admin)
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
                owner_id=current_user.id,
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