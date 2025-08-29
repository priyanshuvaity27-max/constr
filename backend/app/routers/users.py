from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import User
from app.schemas.users import UserCreate, UserUpdate, UserResponse, UsersListResponse
from app.schemas.auth import UserResponse as AuthUserResponse
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
    db: Session = Depends(get_db),
    current_user: AuthUserResponse = Depends(require_admin)
):
    query = db.query(User)
    
    # Apply filters
    if q:
        query = query.filter(
            User.name.ilike(f"%{q}%") |
            User.username.ilike(f"%{q}%") |
            User.email.ilike(f"%{q}%")
        )
    if role:
        query = query.filter(User.role == role)
    if status:
        query = query.filter(User.status == status)
    
    # Count total
    total = query.count()
    
    # Apply sorting
    if hasattr(User, sort):
        order_column = getattr(User, sort)
        if sort_order == "desc":
            query = query.order_by(order_column.desc())
        else:
            query = query.order_by(order_column.asc())
    
    # Apply pagination
    offset = (page - 1) * page_size
    users = query.offset(offset).limit(page_size).all()
    
    # Convert to response format
    user_responses = []
    for user in users:
        user_responses.append(UserResponse(
            id=str(user.id),
            username=user.username,
            name=user.name,
            email=user.email,
            mobile_no=user.mobile_no,
            role=user.role.value,
            status=user.status.value,
            created_at=user.created_at,
            updated_at=user.updated_at
        ))
    
    return UsersListResponse(
        data=user_responses,
        meta={
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }
    )

@router.post("/", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: AuthUserResponse = Depends(require_admin)
):
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.username == user_data.username) | (User.email == user_data.email)
    ).first()
    
    if existing_user:
        raise AppException(
            code="USER_EXISTS",
            message="User with this username or email already exists",
            status_code=400
        )
    
    # Hash password
    hashed_password = get_password_hash(user_data.password)
    
    # Create user
    db_user = User(
        username=user_data.username,
        name=user_data.name,
        email=user_data.email,
        mobile_no=user_data.mobile_no,
        password_hash=hashed_password,
        role=user_data.role,
        status=user_data.status
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return UserResponse(
        id=str(db_user.id),
        username=db_user.username,
        name=db_user.name,
        email=db_user.email,
        mobile_no=db_user.mobile_no,
        role=db_user.role.value,
        status=db_user.status.value,
        created_at=db_user.created_at,
        updated_at=db_user.updated_at
    )

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: AuthUserResponse = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise AppException(
            code="USER_NOT_FOUND",
            message="User not found",
            status_code=404
        )
    
    return UserResponse(
        id=str(user.id),
        username=user.username,
        name=user.name,
        email=user.email,
        mobile_no=user.mobile_no,
        role=user.role.value,
        status=user.status.value,
        created_at=user.created_at,
        updated_at=user.updated_at
    )

@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: AuthUserResponse = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise AppException(
            code="USER_NOT_FOUND",
            message="User not found",
            status_code=404
        )
    
    # Update fields
    update_data = user_update.dict(exclude_unset=True)
    if "password" in update_data:
        update_data["password_hash"] = get_password_hash(update_data.pop("password"))
    
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    return UserResponse(
        id=str(user.id),
        username=user.username,
        name=user.name,
        email=user.email,
        mobile_no=user.mobile_no,
        role=user.role.value,
        status=user.status.value,
        created_at=user.created_at,
        updated_at=user.updated_at
    )

@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: AuthUserResponse = Depends(require_admin)
):
    # Prevent self-deletion
    if str(current_user.id) == user_id:
        raise AppException(
            code="CANNOT_DELETE_SELF",
            message="Cannot delete your own account",
            status_code=400
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise AppException(
            code="USER_NOT_FOUND",
            message="User not found",
            status_code=404
        )
    
    db.delete(user)
    db.commit()
    
    return {"ok": True, "message": "User deleted successfully"}