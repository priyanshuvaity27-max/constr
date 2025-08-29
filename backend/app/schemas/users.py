from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str
    name: str
    email: Optional[EmailStr] = None
    mobile_no: Optional[str] = None
    role: str = "employee"
    status: str = "active"
    
    @validator("role")
    def validate_role(cls, v):
        if v not in ["admin", "employee"]:
            raise ValueError("Role must be admin or employee")
        return v
    
    @validator("status")
    def validate_status(cls, v):
        if v not in ["active", "inactive"]:
            raise ValueError("Status must be active or inactive")
        return v

class UserCreate(UserBase):
    password: str
    
    @validator("password")
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    mobile_no: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    password: Optional[str] = None
    
    @validator("role")
    def validate_role(cls, v):
        if v is not None and v not in ["admin", "employee"]:
            raise ValueError("Role must be admin or employee")
        return v
    
    @validator("status")
    def validate_status(cls, v):
        if v is not None and v not in ["active", "inactive"]:
            raise ValueError("Status must be active or inactive")
        return v

class UserResponse(BaseModel):
    id: str
    username: str
    name: str
    email: Optional[EmailStr] = None
    mobile_no: Optional[str] = None
    role: str
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UsersListResponse(BaseModel):
    ok: bool = True
    data: list[UserResponse]
    meta: dict