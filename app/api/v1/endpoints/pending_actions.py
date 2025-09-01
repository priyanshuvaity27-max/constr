from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user, require_admin
from app.models.pending_action import PendingAction
from app.models.employee import Employee
from app.schemas.pending_action import PendingActionResponse, PendingActionUpdate
from app.utils.errors import AppException
from app.services.approval_service import apply_pending_action
from datetime import datetime
import json

router = APIRouter()

@router.get("/")
async def list_pending_actions(
    request: Request,
    status: Optional[str] = Query("pending", description="Filter by status"),
    module: Optional[str] = Query(None, description="Filter by module"),
    action_type: Optional[str] = Query(None, description="Filter by action type"),
    requested_by: Optional[str] = Query(None, description="Filter by requester"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    sort: Optional[str] = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    query = db.query(PendingAction)
    
    # Non-admin users can only see their own requests
    if current_user.role.value != "admin":
        query = query.filter(PendingAction.requested_by == current_user.id)
    elif requested_by:
        query = query.filter(PendingAction.requested_by == requested_by)
    
    # Apply filters
    if status:
        query = query.filter(PendingAction.status == status)
    if module:
        query = query.filter(PendingAction.module == module)
    if action_type:
        query = query.filter(PendingAction.action_type == action_type)
    
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
        requester = db.query(Employee).filter(Employee.id == action.requested_by).first()
        reviewer = db.query(Employee).filter(Employee.id == action.reviewed_by).first()
        
        action_responses.append({
            "id": str(action.id),
            "module": action.module,
            "action_type": action.action_type.value,
            "target_id": str(action.target_id) if action.target_id else None,
            "payload": json.loads(action.payload) if action.payload else {},
            "requested_by": str(action.requested_by),
            "requested_by_name": requester.name if requester else None,
            "requested_at": action.requested_at.isoformat(),
            "status": action.status.value,
            "reviewed_by": str(action.reviewed_by) if action.reviewed_by else None,
            "reviewed_by_name": reviewer.name if reviewer else None,
            "reviewed_at": action.reviewed_at.isoformat() if action.reviewed_at else None,
            "note": action.note,
            "created_at": action.created_at.isoformat(),
            "updated_at": action.updated_at.isoformat() if action.updated_at else None
        })
    
    return {
        "ok": True,
        "data": action_responses,
        "meta": {
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }
    }

@router.post("/{action_id}/approve")
async def approve_pending_action(
    action_id: str,
    admin_notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(require_admin)
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
    
    # Apply the action
    try:
        await apply_pending_action(action, current_user, db)
        
        # Update action status
        action.status = "approved"
        action.note = admin_notes
        action.reviewed_by = current_user.id
        action.reviewed_at = datetime.utcnow()
        
        db.commit()
        
        return {"ok": True, "message": "Action approved and applied successfully"}
        
    except Exception as e:
        db.rollback()
        raise AppException(
            code="APPROVAL_FAILED",
            message=f"Failed to apply action: {str(e)}",
            status_code=500
        )

@router.post("/{action_id}/reject")
async def reject_pending_action(
    action_id: str,
    action_update: PendingActionUpdate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(require_admin)
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
    action.note = action_update.note
    action.reviewed_by = current_user.id
    action.reviewed_at = datetime.utcnow()
    
    db.commit()
    
    return {"ok": True, "message": "Action rejected successfully"}