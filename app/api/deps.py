from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_token_from_request, verify_token
from app.models.user import User
from app.utils.errors import AppException



async def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> Optional[User]:
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
        user = db.query(User).filter(User.id == user_id).first()
        if not user or user.status.value != "active":
            return None
        
        return user
    except Exception:
        return None


async def require_auth(request: Request, db: Session = Depends(get_db)) -> User:
    user = await get_current_user(request, db)
    if not user:
        raise AppException(
            code="UNAUTHORIZED",
            message="Authentication required",
            status_code=status.HTTP_401_UNAUTHORIZED
        )
    return user


async def require_admin(request: Request, db: Session = Depends(get_db)) -> User:
    user = await require_auth(request, db)
    if user.role.value != "admin":
        raise AppException(
            code="PERMISSION_DENIED",
            message="Admin access required",
            status_code=status.HTTP_403_FORBIDDEN
        )
    return user


def check_ownership_or_admin(user: User, resource_owner_id: str) -> bool:
    return user.role.value == "admin" or str(user.id) == str(resource_owner_id)


# Legacy function for backward compatibility
def get_admin_user(current_user: User = Depends(require_auth)) -> User:
    if current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

    
    if user.status.value != "active":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive",
        )
    
    return user


def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user