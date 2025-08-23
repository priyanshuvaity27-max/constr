from fastapi import APIRouter, Depends, Query, Request
from typing import Optional
from app.schemas.users import UserCreate, UserUpdate, UserResponse, UsersListResponse
from app.schemas.auth import UserResponse as AuthUserResponse
from app.clients.d1_client import d1_client
from app.deps import require_admin
from app.security import get_password_hash
from app.utils.ids import generate_id
from app.utils.errors import AppException

router = APIRouter()

@router.get("/", response_model=UsersListResponse)
async def list_users(
    request: Request,
    q: Optional[str] = Query(None, description="Search query"),
    role: Optional[str] = Query(None, description="Filter by role"),
    status: Optional[str] = Query(None, description="Filter by status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    sort: Optional[str] = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    current_user: AuthUserResponse = Depends(require_admin)
):
    filters = {
        "q": q,
        "role": role,
        "status": status,
        "page": page,
        "page_size": page_size,
        "sort": sort,
        "sort_order": sort_order
    }
    
    result = await d1_client.users_list(filters)
    return UsersListResponse(data=result["users"], meta=result["meta"])

@router.post("/", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    current_user: AuthUserResponse = Depends(require_admin)
):
    # Hash password
    hashed_password = get_password_hash(user_data.password)
    
    # Prepare data for database
    db_data = {
        "id": generate_id(),
        **user_data.dict(exclude={"password"}),
        "password": hashed_password
    }
    
    result = await d1_client.users_create(db_data)
    return UserResponse(**result["user"])

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    current_user: AuthUserResponse = Depends(require_admin)
):
    user_data = await d1_client.users_get_by_id(user_id)
    if not user_data:
        raise AppException(
            code="USER_NOT_FOUND",
            message="User not found",
            status_code=404
        )
    
    return UserResponse(**user_data)

@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    current_user: AuthUserResponse = Depends(require_admin)
):
    # Check if user exists
    existing_user = await d1_client.users_get_by_id(user_id)
    if not existing_user:
        raise AppException(
            code="USER_NOT_FOUND",
            message="User not found",
            status_code=404
        )
    
    # Prepare update data
    update_data = user_update.dict(exclude_unset=True)
    if "password" in update_data:
        update_data["password"] = get_password_hash(update_data["password"])
    
    result = await d1_client.users_update(user_id, update_data)
    return UserResponse(**result["user"])

@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    current_user: AuthUserResponse = Depends(require_admin)
):
    # Prevent self-deletion
    if user_id == current_user.id:
        raise AppException(
            code="CANNOT_DELETE_SELF",
            message="Cannot delete your own account",
            status_code=400
        )
    
    # Check if user exists
    existing_user = await d1_client.users_get_by_id(user_id)
    if not existing_user:
        raise AppException(
            code="USER_NOT_FOUND",
            message="User not found",
            status_code=404
        )
    
    await d1_client.users_delete(user_id)
    return {"ok": True, "message": "User deleted successfully"}