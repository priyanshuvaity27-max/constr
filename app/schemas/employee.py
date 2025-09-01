from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.employee import UserRole, UserStatus

class EmployeeBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    name: str
    role: UserRole = UserRole.EMPLOYEE
    status: UserStatus = UserStatus.ACTIVE

class EmployeeCreate(EmployeeBase):
    password: str

class EmployeeUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None
    password: Optional[str] = None

class EmployeeResponse(EmployeeBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class EmployeeLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: EmployeeResponse