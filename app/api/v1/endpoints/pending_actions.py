from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user, get_admin_user
from app.models.user import User
from app.models.pending_action import PendingAction, ActionStatus
from app.schemas.pending_action import PendingActionResponse, PendingActionUpdate
from datetime import datetime

router = APIRouter()


@router.get("/", response_model=List[PendingActionResponse])
def read_pending_actions(
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