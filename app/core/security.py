from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Request, Response
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "iss": "real-estate-crm",
        "aud": "real-estate-crm"
    })
    
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM],
            audience="real-estate-crm",
            issuer="real-estate-crm"
        )
        return payload
    except JWTError:
        return None

def set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key="auth_token",
        value=token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="lax"
    )

def clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(
        key="auth_token",
        httponly=True,
        secure=not settings.DEBUG,
        samesite="lax"
    )

def get_token_from_request(request: Request) -> Optional[str]:
    return request.cookies.get("auth_token")

# Rate limiting (simple in-memory)
_rate_limits: Dict[str, Dict[str, Any]] = {}

def check_rate_limit(key: str, limit: int, window_minutes: int = 1) -> bool:
    now = datetime.utcnow()
    window_start = now - timedelta(minutes=window_minutes)
    
    if key not in _rate_limits:
        _rate_limits[key] = {"count": 0, "window_start": now}
        return True
    
    rate_data = _rate_limits[key]
    
    # Reset window if expired
    if rate_data["window_start"] < window_start:
        rate_data["count"] = 0
        rate_data["window_start"] = now
    
    if rate_data["count"] >= limit:
        return False
    
    rate_data["count"] += 1
    return True