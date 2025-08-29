from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import PendingAction, User, Lead
from app.schemas.pending_actions import PendingActionUpdate, PendingActionResponse, PendingActionsListResponse
from app.schemas.auth import UserResponse
from app.deps import require_auth, require_admin
from app.utils.errors import AppException
import json

router = APIRouter()

@router.get("/", response_model=PendingActionsListResponse)
async def list_pending_actions(
    request: Request,
    status: Optional[str] = Query("pending", description="Filter by status"),
    module: Optional[str] = Query(None, description="Filter by module"),
    type: Optional[str] = Query(None, description="Filter by type"),
    requested_by: Optional[str] = Query(None, description="Filter by requester"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    sort: Optional[str] = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(require_auth)
):
    query = db.query(PendingAction)
    
    # Non-admin users can only see their own requests
    if current_user.role != "admin":
        query = query.filter(PendingAction.requested_by == current_user.id)
    elif requested_by:
        query = query.filter(PendingAction.requested_by == requested_by)
    
    # Apply filters
    if status:
        query = query.filter(PendingAction.status == status)
    if module:
        query = query.filter(PendingAction.module == module)
    if type:
        query = query.filter(PendingAction.type == type)
    
    # Count total
    total = query.count()
    
    # Apply sorting
    if hasattr(PendingAction, sort):
        order_column = getattr(PendingAction, sort)
        if sort_order == "desc":
            query = query.order_by(order_column.desc())
        else:
            query = query.order_by(order_column.asc())
    
    # Apply pagination
    offset = (page - 1) * page_size
    actions = query.offset(offset).limit(page_size).all()
    
    # Convert to response format
    action_responses = []
    for action in actions:
        action_responses.append(PendingActionResponse(
            id=str(action.id),
            module=action.module.value,
            type=action.type.value,
            data=json.loads(action.data),
            target_id=str(action.target_id) if action.target_id else None,
            requested_by=str(action.requested_by),
            requested_by_name=action.requested_by_name,
            status=action.status.value,
            admin_notes=action.admin_notes,
            approved_by=str(action.approved_by) if action.approved_by else None,
            approved_by_name=action.approved_by_name,
            created_at=action.created_at,
            updated_at=action.updated_at
        ))
    
    return PendingActionsListResponse(
        data=action_responses,
        meta={
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }
    )

@router.post("/{action_id}/approve")
async def approve_pending_action(
    action_id: str,
    admin_notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(require_admin)
):
    action = db.query(PendingAction).filter(PendingAction.id == action_id).first()
    if not action:
        raise AppException(
            code="ACTION_NOT_FOUND",
            message="Pending action not found",
            status_code=404
        )
    
    if action.status.value != "pending":
        raise AppException(
            code="ACTION_ALREADY_PROCESSED",
            message="Action has already been processed",
            status_code=400
        )
    
    # Apply the action based on module and type
    data = json.loads(action.data)
    
    if action.module.value == "leads":
        if action.type.value == "create":
            # Create the lead
            db_lead = Lead(
                inquiry_no=data.get("inquiry_no") or generate_inquiry_no(),
                owner_id=action.requested_by,
                **{k: v for k, v in data.items() if k != "inquiry_no"}
            )
            db.add(db_lead)
        elif action.type.value == "update" and action.target_id:
            # Update the lead
            lead = db.query(Lead).filter(Lead.id == action.target_id).first()
            if lead:
                for field, value in data.items():
                    setattr(lead, field, value)
        elif action.type.value == "delete" and action.target_id:
            # Delete the lead
            lead = db.query(Lead).filter(Lead.id == action.target_id).first()
            if lead:
                db.delete(lead)
    
    # Update action status
    action.status = "approved"
    action.admin_notes = admin_notes
    action.approved_by = current_user.id
    action.approved_by_name = current_user.name
    
    db.commit()
    
    return {"ok": True, "message": "Action approved and applied successfully"}

@router.post("/{action_id}/reject")
async def reject_pending_action(
    action_id: str,
    action_update: PendingActionUpdate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(require_admin)
):
    action = db.query(PendingAction).filter(PendingAction.id == action_id).first()
    if not action:
        raise AppException(
            code="ACTION_NOT_FOUND",
            message="Pending action not found",
            status_code=404
        )
    
    if action.status.value != "pending":
        raise AppException(
            code="ACTION_ALREADY_PROCESSED",
            message="Action has already been processed",
            status_code=400
        )
    
    # Update action status
    action.status = "rejected"
    action.admin_notes = action_update.admin_notes
    action.approved_by = current_user.id
    action.approved_by_name = current_user.name
    
    db.commit()
    
    return {"ok": True, "message": "Action rejected successfully"}