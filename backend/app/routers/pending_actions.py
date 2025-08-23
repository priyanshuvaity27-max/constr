from fastapi import APIRouter, Depends, Query, Request
from typing import Optional
from app.schemas.pending_actions import PendingActionUpdate, PendingActionResponse, PendingActionsListResponse
from app.schemas.auth import UserResponse
from app.clients.d1_client import d1_client
from app.deps import require_auth, require_admin
from app.services.approvals import apply_pending_action
from app.utils.errors import AppException

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
    current_user: UserResponse = Depends(require_auth)
):
    filters = {
        "status": status,
        "module": module,
        "type": type,
        "page": page,
        "page_size": page_size,
        "sort": sort,
        "sort_order": sort_order
    }
    
    # Non-admin users can only see their own requests
    if current_user.role != "admin":
        filters["requested_by"] = current_user.id
    elif requested_by:
        filters["requested_by"] = requested_by
    
    result = await d1_client.pending_actions_list(filters)
    return PendingActionsListResponse(data=result["pending_actions"], meta=result["meta"])

@router.get("/{action_id}", response_model=PendingActionResponse)
async def get_pending_action(
    action_id: str,
    current_user: UserResponse = Depends(require_auth)
):
    action_data = await d1_client.pending_actions_get_by_id(action_id)
    if not action_data:
        raise AppException(
            code="ACTION_NOT_FOUND",
            message="Pending action not found",
            status_code=404
        )
    
    # Check permissions
    if current_user.role != "admin" and action_data["requested_by"] != current_user.id:
        raise AppException(
            code="PERMISSION_DENIED",
            message="Access denied",
            status_code=403
        )
    
    return PendingActionResponse(**action_data)

@router.post("/{action_id}/approve")
async def approve_pending_action(
    action_id: str,
    admin_notes: Optional[str] = None,
    current_user: UserResponse = Depends(require_admin)
):
    # Get the pending action
    action_data = await d1_client.pending_actions_get_by_id(action_id)
    if not action_data:
        raise AppException(
            code="ACTION_NOT_FOUND",
            message="Pending action not found",
            status_code=404
        )
    
    if action_data["status"] != "pending":
        raise AppException(
            code="ACTION_ALREADY_PROCESSED",
            message="Action has already been processed",
            status_code=400
        )
    
    # Apply the action
    await apply_pending_action(action_data, current_user)
    
    # Update action status
    update_data = {
        "status": "approved",
        "admin_notes": admin_notes,
        "approved_by": current_user.id,
        "approved_by_name": current_user.name
    }
    
    await d1_client.pending_actions_update(action_id, update_data)
    
    return {"ok": True, "message": "Action approved and applied successfully"}

@router.post("/{action_id}/reject")
async def reject_pending_action(
    action_id: str,
    action_update: PendingActionUpdate,
    current_user: UserResponse = Depends(require_admin)
):
    # Get the pending action
    action_data = await d1_client.pending_actions_get_by_id(action_id)
    if not action_data:
        raise AppException(
            code="ACTION_NOT_FOUND",
            message="Pending action not found",
            status_code=404
        )
    
    if action_data["status"] != "pending":
        raise AppException(
            code="ACTION_ALREADY_PROCESSED",
            message="Action has already been processed",
            status_code=400
        )
    
    # Update action status
    update_data = {
        "status": "rejected",
        "admin_notes": action_update.admin_notes,
        "approved_by": current_user.id,
        "approved_by_name": current_user.name
    }
    
    await d1_client.pending_actions_update(action_id, update_data)
    
    return {"ok": True, "message": "Action rejected successfully"}