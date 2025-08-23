from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from app.security import get_token_from_request, verify_token
from app.clients.d1_client import d1_client
from app.schemas.auth import UserResponse
from app.utils.errors import AppException

async def get_current_user(request: Request) -> Optional[UserResponse]:
    token = get_token_from_request(request)
    if not token:
        return None
    
    payload = verify_token(token)
    if not payload:
        return None
    
    user_id = payload.get("sub")
    if not user_id:
        return None
    
    try:
        user_data = await d1_client.users_get_by_id(user_id)
        if not user_data or user_data.get("status") != "active":
            return None
        
        return UserResponse(**user_data)
    except Exception:
        return None

async def require_auth(request: Request) -> UserResponse:
    user = await get_current_user(request)
    if not user:
        raise AppException(
            code="UNAUTHORIZED",
            message="Authentication required",
            status_code=status.HTTP_401_UNAUTHORIZED
        )
    return user

async def require_admin(request: Request) -> UserResponse:
    user = await require_auth(request)
    if user.role != "admin":
        raise AppException(
            code="PERMISSION_DENIED",
            message="Admin access required",
            status_code=status.HTTP_403_FORBIDDEN
        )
    return user

def check_ownership_or_admin(user: UserResponse, resource_owner_id: str) -> bool:
    return user.role == "admin" or user.id == resource_owner_id