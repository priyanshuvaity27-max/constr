from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import (
    verify_password, 
    create_access_token, 
    set_auth_cookie, 
    clear_auth_cookie, 
    check_rate_limit
)
from app.core.config import settings
from app.models.employee import Employee
from app.schemas.employee import EmployeeLogin, Token, EmployeeResponse
from app.api.deps import get_current_user
from app.utils.errors import AppException

router = APIRouter()

@router.post("/login", response_model=Token)
async def login(
    request: Request,
    response: Response,
    login_data: EmployeeLogin,
    db: Session = Depends(get_db)
):
    # Rate limiting
    client_ip = request.client.host if request.client else "unknown"
    if not check_rate_limit(f"login:{client_ip}", settings.RATE_LIMIT_LOGIN):
        raise AppException(
            code="RATE_LIMITED",
            message="Too many login attempts. Please try again later.",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS
        )
    
    # Get user from database
    user = db.query(Employee).filter(Employee.username == login_data.username).first()
    if not user:
        raise AppException(
            code="INVALID_CREDENTIALS",
            message="Invalid username or password",
            status_code=status.HTTP_401_UNAUTHORIZED
        )
    
    # Verify password
    if not verify_password(login_data.password, user.password_hash):
        raise AppException(
            code="INVALID_CREDENTIALS",
            message="Invalid username or password",
            status_code=status.HTTP_401_UNAUTHORIZED
        )
    
    # Check if user is active
    if user.status.value != "active":
        raise AppException(
            code="ACCOUNT_INACTIVE",
            message="Account is inactive",
            status_code=status.HTTP_401_UNAUTHORIZED
        )
    
    # Create JWT token
    token_data = {
        "sub": str(user.id),
        "username": user.username,
        "role": user.role.value,
        "name": user.name
    }
    token = create_access_token(token_data)
    
    # Set cookie
    set_auth_cookie(response, token)
    
    # Return user data
    user_response = EmployeeResponse(
        id=str(user.id),
        username=user.username,
        name=user.name,
        email=user.email,
        role=user.role.value,
        status=user.status.value,
        created_at=user.created_at,
        updated_at=user.updated_at
    )
    
    return Token(
        access_token=token,
        token_type="bearer",
        user=user_response
    )

@router.get("/me", response_model=EmployeeResponse)
async def get_current_user_info(
    current_user: Employee = Depends(get_current_user)
):
    return EmployeeResponse(
        id=str(current_user.id),
        username=current_user.username,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role.value,
        status=current_user.status.value,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at
    )

@router.post("/logout")
async def logout(response: Response):
    clear_auth_cookie(response)
    return {"ok": True, "message": "Logged out successfully"}