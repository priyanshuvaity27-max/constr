from typing import Dict, Any
from sqlalchemy.orm import Session
from app.models.pending_action import PendingAction
from app.models.lead import Lead
from app.models.developer import Developer
from app.models.contact import Contact
from app.models.project import ProjectMaster
from app.models.inventory import InventoryItem
from app.models.land import LandParcel
from app.schemas.auth import UserResponse
from app.utils.ids import generate_id, generate_inquiry_no
from app.utils.errors import AppException
from app.utils.logging import logger
import json

async def apply_pending_action(action: PendingAction, admin_user: UserResponse, db: Session) -> None:
    """Apply a pending action to the database"""
    module = action.module
    action_type = action.type
    data = json.loads(action.data) if action.data else {}
    target_id = action.target_id
    
    logger.info(
        "Applying pending action",
        extra={
            "action_id": action.id,
            "module": module,
            "type": action_type,
            "target_id": target_id,
            "admin_id": admin_user.id
        }
    )
    
    try:
        if action_type == "create":
            await _apply_create_action(module, data, admin_user, db)
        elif action_type == "update":
            if not target_id:
                raise AppException(
                    code="INVALID_ACTION",
                    message="Update action requires target_id",
                    status_code=400
                )
            await _apply_update_action(module, target_id, data, admin_user, db)
        elif action_type == "delete":
            if not target_id:
                raise AppException(
                    code="INVALID_ACTION",
                    message="Delete action requires target_id",
                    status_code=400
                )
            await _apply_delete_action(module, target_id, admin_user, db)
        else:
            raise AppException(
                code="INVALID_ACTION_TYPE",
                message=f"Unknown action type: {action_type}",
                status_code=400
            )
            
    except Exception as e:
        logger.error(
            "Failed to apply pending action",
            extra={
                "action_id": action.id,
                "error": str(e)
            }
        )
        raise

async def _apply_create_action(module: str, data: Dict[str, Any], admin_user: UserResponse, db: Session) -> None:
    """Apply create action"""
    # Add required fields
    create_data = {
        "id": generate_id(),
        **data
    }
    
    # Generate inquiry_no for leads if not provided
    if module == "leads" and not create_data.get("inquiry_no"):
        create_data["inquiry_no"] = generate_inquiry_no()
    
    # Create the appropriate model
    if module == "leads":
        db_obj = Lead(**create_data)
    elif module == "developers":
        db_obj = Developer(**create_data)
    elif module == "contacts":
        db_obj = Contact(**create_data)
    elif module == "projects":
        db_obj = ProjectMaster(**create_data)
    elif module == "inventory":
        db_obj = InventoryItem(**create_data)
    elif module == "land":
        db_obj = LandParcel(**create_data)
    else:
        raise AppException(
            code="INVALID_MODULE",
            message=f"Unknown module: {module}",
            status_code=400
        )
    
    db.add(db_obj)

async def _apply_update_action(module: str, target_id: str, data: Dict[str, Any], admin_user: UserResponse, db: Session) -> None:
    """Apply update action"""
    # Get the appropriate model
    if module == "leads":
        obj = db.query(Lead).filter(Lead.id == target_id).first()
    elif module == "developers":
        obj = db.query(Developer).filter(Developer.id == target_id).first()
    elif module == "contacts":
        obj = db.query(Contact).filter(Contact.id == target_id).first()
    elif module == "projects":
        obj = db.query(ProjectMaster).filter(ProjectMaster.id == target_id).first()
    elif module == "inventory":
        obj = db.query(InventoryItem).filter(InventoryItem.id == target_id).first()
    elif module == "land":
        obj = db.query(LandParcel).filter(LandParcel.id == target_id).first()
    else:
        raise AppException(
            code="INVALID_MODULE",
            message=f"Unknown module: {module}",
            status_code=400
        )
    
    if not obj:
        raise AppException(
            code="OBJECT_NOT_FOUND",
            message=f"{module.title()} not found",
            status_code=404
        )
    
    # Apply updates
    for field, value in data.items():
        if hasattr(obj, field):
            setattr(obj, field, value)

async def _apply_delete_action(module: str, target_id: str, admin_user: UserResponse, db: Session) -> None:
    """Apply delete action"""
    # Get the appropriate model
    if module == "leads":
        obj = db.query(Lead).filter(Lead.id == target_id).first()
    elif module == "developers":
        obj = db.query(Developer).filter(Developer.id == target_id).first()
    elif module == "contacts":
        obj = db.query(Contact).filter(Contact.id == target_id).first()
    elif module == "projects":
        obj = db.query(ProjectMaster).filter(ProjectMaster.id == target_id).first()
    elif module == "inventory":
        obj = db.query(InventoryItem).filter(InventoryItem.id == target_id).first()
    elif module == "land":
        obj = db.query(LandParcel).filter(LandParcel.id == target_id).first()
    else:
        raise AppException(
            code="INVALID_MODULE",
            message=f"Unknown module: {module}",
            status_code=400
        )
    
    if not obj:
        raise AppException(
            code="OBJECT_NOT_FOUND",
            message=f"{module.title()} not found",
            status_code=404
        )
    
    db.delete(obj)