from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import require_auth, require_admin
from app.models.pending_action import PendingAction
from app.models.user import User
from app.schemas.pending_action import PendingActionResponse, PendingActionUpdate, PendingActionsListResponse
from app.schemas.auth import UserResponse
from app.utils.errors import AppException
from app.services.approval_service import apply_pending_action
from datetime import datetime
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
            module=action.module,
            type=action.type,
            data=json.loads(action.data) if action.data else {},
            target_id=str(action.target_id) if action.target_id else None,
            requested_by=str(action.requested_by),
            requested_by_name=action.requested_by_name,
            status=action.status,
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
    
    if action.status != "pending":
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
        action.admin_notes = admin_notes
        action.approved_by = current_user.id
        action.approved_by_name = current_user.name
        action.updated_at = datetime.utcnow()
        
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
    current_user: UserResponse = Depends(require_admin)
):
    action = db.query(PendingAction).filter(PendingAction.id == action_id).first()
    if not action:
        raise AppException(
            code="ACTION_NOT_FOUND",
            message="Pending action not found",
            status_code=404
        )
    
    if action.status != "pending":
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
    action.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"ok": True, "message": "Action rejected successfully"}
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    pending_actions = db.query(PendingAction).filter(
        PendingAction.status == ActionStatus.PENDING
    ).offset(skip).limit(limit).all()
    return pending_actions


@router.get("/my-requests", response_model=List[PendingActionResponse])
def read_my_pending_actions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pending_actions = db.query(PendingAction).filter(
        PendingAction.requested_by == current_user.id
    ).offset(skip).limit(limit).all()
    return pending_actions


@router.get("/{action_id}", response_model=PendingActionResponse)
def read_pending_action(
    action_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    action = db.query(PendingAction).filter(PendingAction.id == action_id).first()
    if action is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pending action not found"
        )
    
    # Users can only view their own requests unless they're admin
    if current_user.role.value != "admin" and action.requested_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return action


@router.put("/{action_id}", response_model=PendingActionResponse)
def update_pending_action(
    action_id: str,
    action_update: PendingActionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    action = db.query(PendingAction).filter(PendingAction.id == action_id).first()
    if action is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pending action not found"
        )
    
    # Update the action
    action.status = action_update.status
    action.admin_notes = action_update.admin_notes
    action.processed_at = datetime.utcnow()
    action.processed_by = current_user.id
    
    db.commit()
    db.refresh(action)
    return action


@router.delete("/{action_id}")
def delete_pending_action(
    action_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    action = db.query(PendingAction).filter(PendingAction.id == action_id).first()
    if action is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pending action not found"
        )
    
    db.delete(action)
    db.commit()
    return {"message": "Pending action deleted successfully"}