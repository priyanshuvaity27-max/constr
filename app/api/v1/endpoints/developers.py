from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.developer import Developer
from app.schemas.developer import DeveloperCreate, DeveloperUpdate, DeveloperResponse
import uuid

router = APIRouter()


@router.get("/", response_model=List[DeveloperResponse])
def read_developers(
    skip: int = 0,
    limit: int = 100,
    type_filter: Optional[str] = Query(None, alias="type"),
    grade_filter: Optional[str] = Query(None, alias="grade"),
    city_filter: Optional[str] = Query(None, alias="city"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Developer)
    
    # Apply filters
    if type_filter:
        query = query.filter(Developer.type == type_filter)
    if grade_filter:
        query = query.filter(Developer.grade == grade_filter)
    if city_filter:
        query = query.filter(Developer.ho_city.ilike(f"%{city_filter}%"))
    
    developers = query.offset(skip).limit(limit).all()
    return developers


@router.post("/", response_model=DeveloperResponse)
def create_developer(
    developer: DeveloperCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_developer = Developer(
        id=str(uuid.uuid4()),
        **developer.dict()
    )
    db.add(db_developer)
    db.commit()
    db.refresh(db_developer)
    return db_developer


@router.get("/{developer_id}", response_model=DeveloperResponse)
def read_developer(
    developer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    developer = db.query(Developer).filter(Developer.id == developer_id).first()
    if developer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Developer not found"
        )
    return developer


@router.put("/{developer_id}", response_model=DeveloperResponse)
def update_developer(
    developer_id: str,
    developer_update: DeveloperUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    developer = db.query(Developer).filter(Developer.id == developer_id).first()
    if developer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Developer not found"
        )
    
    update_data = developer_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(developer, field, value)
    
    db.commit()
    db.refresh(developer)
    return developer


@router.delete("/{developer_id}")
def delete_developer(
    developer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    developer = db.query(Developer).filter(Developer.id == developer_id).first()
    if developer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Developer not found"
        )
    
    db.delete(developer)
    db.commit()
    return {"message": "Developer deleted successfully"}