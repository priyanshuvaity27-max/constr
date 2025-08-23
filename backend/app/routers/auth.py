from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from app.schemas.auth import LoginRequest, LoginResponse, UserResponse
from app.clients.d1_client import d1_client
from app.security import verify_password, create_access_token, set_auth_cookie, clear_auth_cookie, check_rate_limit
from app.deps import get_current_user
from app.config import settings
from app.utils.errors import AppException

router = APIRouter()

@router.post("/login", response_model=LoginResponse)
async def login(
    request: Request,
    response: Response,
    login_data: LoginRequest
):
    # Rate limiting
    client_ip = request.client.host
    if not check_rate_limit(f"login:{client_ip}", settings.RATE_LIMIT_LOGIN):
        raise AppException(
            code="RATE_LIMITED",
            message="Too many login attempts. Please try again later.",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS
        )
    
    # Validate username is in allowed list
    if login_data.username not in settings.ALLOWED_USERNAMES:
        raise AppException(
            code="INVALID_CREDENTIALS",
            message="Invalid username or password",
            status_code=status.HTTP_401_UNAUTHORIZED
        )
    
    # Get user from database
    user_data = await d1_client.users_get_by_username(login_data.username)
    if not user_data:
        raise AppException(
            code="INVALID_CREDENTIALS",
            message="Invalid username or password",
            status_code=status.HTTP_401_UNAUTHORIZED
        )
    
    # Verify password
    if not verify_password(login_data.password, user_data["password"]):
        raise AppException(
            code="INVALID_CREDENTIALS",
            message="Invalid username or password",
            status_code=status.HTTP_401_UNAUTHORIZED
        )
    
    # Check if user is active
    if user_data["status"] != "active":
        raise AppException(
            code="ACCOUNT_INACTIVE",
            message="Account is inactive",
            status_code=status.HTTP_401_UNAUTHORIZED
        )
    
    # Create JWT token
    token_data = {
        "sub": user_data["id"],
        "username": user_data["username"],
        "role": user_data["role"],
        "name": user_data["name"]
    }
    token = create_access_token(token_data)
    
    # Set cookie
    set_auth_cookie(response, token)
    
    # Return user data (without password)
    user_response = UserResponse(**{k: v for k, v in user_data.items() if k != "password"})
    
    return LoginResponse(user=user_response)

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    request: Request,
    current_user: UserResponse = Depends(get_current_user)
):
    if not current_user:
        raise AppException(
            code="UNAUTHORIZED",
            message="Not authenticated",
            status_code=status.HTTP_401_UNAUTHORIZED
        )
    return current_user

@router.post("/logout")
async def logout(response: Response):
    clear_auth_cookie(response)
    return {"ok": True, "message": "Logged out successfully"}