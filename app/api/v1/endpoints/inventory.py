from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.inventory import InventoryItem
from app.schemas.inventory import InventoryCreate, InventoryUpdate, InventoryResponse
import uuid

router = APIRouter()


@router.get("/", response_model=List[InventoryResponse])
def read_inventory(
    skip: int = 0,
    limit: int = 100,
    type_filter: Optional[str] = Query(None, alias="type"),
    status_filter: Optional[str] = Query(None, alias="status"),
    city_filter: Optional[str] = Query(None, alias="city"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(InventoryItem)
    
    # Apply filters
    if type_filter:
        query = query.filter(InventoryItem.type == type_filter)
    if status_filter:
        query = query.filter(InventoryItem.status == status_filter)
    if city_filter:
        query = query.filter(InventoryItem.city.ilike(f"%{city_filter}%"))
    
    inventory = query.offset(skip).limit(limit).all()
    return inventory


@router.post("/", response_model=InventoryResponse)
def create_inventory_item(
    inventory_item: InventoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_inventory = InventoryItem(
        id=str(uuid.uuid4()),
        **inventory_item.dict()
    )
    db.add(db_inventory)
    db.commit()
    db.refresh(db_inventory)
    return db_inventory


@router.get("/{inventory_id}", response_model=InventoryResponse)
def read_inventory_item(
    inventory_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inventory_item = db.query(InventoryItem).filter(InventoryItem.id == inventory_id).first()
    if inventory_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found"
        )
    return inventory_item


@router.put("/{inventory_id}", response_model=InventoryResponse)
def update_inventory_item(
    inventory_id: str,
    inventory_update: InventoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inventory_item = db.query(InventoryItem).filter(InventoryItem.id == inventory_id).first()
    if inventory_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found"
        )
    
    update_data = inventory_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(inventory_item, field, value)
    
    db.commit()
    db.refresh(inventory_item)
    return inventory_item


@router.delete("/{inventory_id}")
def delete_inventory_item(
    inventory_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inventory_item = db.query(InventoryItem).filter(InventoryItem.id == inventory_id).first()
    if inventory_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found"
        )
    
    db.delete(inventory_item)
    db.commit()
    return {"message": "Inventory item deleted successfully"}