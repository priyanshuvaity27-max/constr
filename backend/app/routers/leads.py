from fastapi import APIRouter, Depends, Query, Request, Response
from typing import Optional
from app.schemas.leads import LeadCreate, LeadUpdate, LeadResponse, LeadsListResponse
from app.schemas.auth import UserResponse
from app.schemas.pending_actions import PendingActionCreate
from app.clients.d1_client import d1_client
from app.deps import require_auth, require_admin
from app.utils.ids import generate_id, generate_inquiry_no
from app.utils.errors import AppException
from app.services.csv_io import export_to_csv, import_from_csv

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
    current_user: UserResponse = Depends(require_auth)
):
    filters = {
        "q": q,
        "city": city,
        "type_of_place": type_of_place,
        "transaction_type": transaction_type,
        "site_visit_required": site_visit_required,
        "proposal_submitted": proposal_submitted,
        "shortlisted": shortlisted,
        "deal_closed": deal_closed,
        "assignee_id": assignee_id,
        "page": page,
        "page_size": page_size,
        "sort": sort,
        "sort_order": sort_order
    }
    
    # Apply ownership filter for non-admin users
    if current_user.role != "admin":
        if owner == "all":
            # Employees can only see their own or assigned leads
            filters["owner_or_assignee_id"] = current_user.id
        else:
            filters["owner_id"] = current_user.id
    elif owner == "me":
        filters["owner_id"] = current_user.id
    
    result = await d1_client.leads_list(filters)
    
    if format == "csv":
        return export_to_csv(result["leads"], "leads")
    
    return LeadsListResponse(data=result["leads"], meta=result["meta"])

@router.post("/", response_model=LeadResponse)
async def create_lead(
    lead_data: LeadCreate,
    current_user: UserResponse = Depends(require_auth)
):
    if current_user.role != "admin":
        # Create pending action for employee
        pending_data = PendingActionCreate(
            module="leads",
            type="create",
            data=lead_data.dict()
        )
        
        action_data = {
            "id": generate_id(),
            "requested_by": current_user.id,
            "requested_by_name": current_user.name,
            "status": "pending",
            **pending_data.dict()
        }
        
        await d1_client.pending_actions_create(action_data)
        
        raise AppException(
            code="PENDING_APPROVAL",
            message="Lead creation request submitted for admin approval",
            status_code=202
        )
    
    # Admin can create directly
    db_data = {
        "id": generate_id(),
        "inquiry_no": lead_data.inquiry_no or generate_inquiry_no(),
        "owner_id": current_user.id,
        **lead_data.dict()
    }
    
    result = await d1_client.leads_create(db_data)
    return LeadResponse(**result["lead"])

@router.get("/{lead_id}", response_model=LeadResponse)
async def get_lead(
    lead_id: str,
    current_user: UserResponse = Depends(require_auth)
):
    lead_data = await d1_client.leads_get_by_id(lead_id)
    if not lead_data:
        raise AppException(
            code="LEAD_NOT_FOUND",
            message="Lead not found",
            status_code=404
        )
    
    # Check ownership for non-admin users
    if current_user.role != "admin":
        if lead_data["owner_id"] != current_user.id and lead_data.get("assignee_id") != current_user.id:
            raise AppException(
                code="PERMISSION_DENIED",
                message="Access denied",
                status_code=403
            )
    
    return LeadResponse(**lead_data)

@router.patch("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: str,
    lead_update: LeadUpdate,
    current_user: UserResponse = Depends(require_auth)
):
    # Check if lead exists
    existing_lead = await d1_client.leads_get_by_id(lead_id)
    if not existing_lead:
        raise AppException(
            code="LEAD_NOT_FOUND",
            message="Lead not found",
            status_code=404
        )
    
    if current_user.role != "admin":
        # Check ownership
        if existing_lead["owner_id"] != current_user.id and existing_lead.get("assignee_id") != current_user.id:
            raise AppException(
                code="PERMISSION_DENIED",
                message="Access denied",
                status_code=403
            )
        
        # Create pending action for employee
        pending_data = PendingActionCreate(
            module="leads",
            type="update",
            data=lead_update.dict(exclude_unset=True),
            target_id=lead_id
        )
        
        action_data = {
            "id": generate_id(),
            "requested_by": current_user.id,
            "requested_by_name": current_user.name,
            "status": "pending",
            **pending_data.dict()
        }
        
        await d1_client.pending_actions_create(action_data)
        
        raise AppException(
            code="PENDING_APPROVAL",
            message="Lead update request submitted for admin approval",
            status_code=202
        )
    
    # Admin can update directly
    update_data = lead_update.dict(exclude_unset=True)
    result = await d1_client.leads_update(lead_id, update_data)
    return LeadResponse(**result["lead"])

@router.delete("/{lead_id}")
async def delete_lead(
    lead_id: str,
    current_user: UserResponse = Depends(require_auth)
):
    # Check if lead exists
    existing_lead = await d1_client.leads_get_by_id(lead_id)
    if not existing_lead:
        raise AppException(
            code="LEAD_NOT_FOUND",
            message="Lead not found",
            status_code=404
        )
    
    if current_user.role != "admin":
        # Check ownership
        if existing_lead["owner_id"] != current_user.id:
            raise AppException(
                code="PERMISSION_DENIED",
                message="Access denied",
                status_code=403
            )
        
        # Create pending action for employee
        pending_data = PendingActionCreate(
            module="leads",
            type="delete",
            data={},
            target_id=lead_id
        )
        
        action_data = {
            "id": generate_id(),
            "requested_by": current_user.id,
            "requested_by_name": current_user.name,
            "status": "pending",
            **pending_data.dict()
        }
        
        await d1_client.pending_actions_create(action_data)
        
        raise AppException(
            code="PENDING_APPROVAL",
            message="Lead deletion request submitted for admin approval",
            status_code=202
        )
    
    # Admin can delete directly
    await d1_client.leads_delete(lead_id)
    return {"ok": True, "message": "Lead deleted successfully"}

@router.post("/import")
async def import_leads(
    request: Request,
    current_user: UserResponse = Depends(require_admin)
):
    # This would handle CSV import
    # Implementation depends on multipart form handling
    return {"ok": True, "message": "Import functionality to be implemented"}