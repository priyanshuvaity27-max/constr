from typing import Dict, Any
from sqlalchemy.orm import Session
from app.models.pending_action import PendingAction
from app.models.lead import Lead
from app.models.corporate_developer import CorporateDeveloper
from app.models.employee import Employee
from app.models.audit_log import AuditLog
from app.utils.ids import generate_id, generate_inquiry_no
from app.utils.errors import AppException
from app.utils.logging import logger
import json

async def create_pending_action(
    db: Session,
    module: str,
    action_type: str,
    payload: Dict[str, Any],
    requested_by: str,
    target_id: str = None
) -> PendingAction:
    """Create a new pending action for employee requests"""
    
    requester = db.query(Employee).filter(Employee.id == requested_by).first()
    if not requester:
        raise AppException(
            code="USER_NOT_FOUND",
            message="Requester not found",
            status_code=404
        )
    
    pending_action = PendingAction(
        id=generate_id(),
        module=module,
        action_type=action_type,
        target_id=target_id,
        payload=json.dumps(payload),
        requested_by=requested_by
    )
    
    db.add(pending_action)
    db.commit()
    db.refresh(pending_action)
    
    logger.info(
        "Pending action created",
        extra={
            "action_id": pending_action.id,
            "module": module,
            "action_type": action_type,
            "requested_by": requested_by
        }
    )
    
    return pending_action

async def apply_pending_action(action: PendingAction, admin_user: Employee, db: Session) -> None:
    """Apply a pending action to the database"""
    module = action.module
    action_type = action.action_type.value
    payload = json.loads(action.payload) if action.payload else {}
    target_id = action.target_id
    
    logger.info(
        "Applying pending action",
        extra={
            "action_id": action.id,
            "module": module,
            "action_type": action_type,
            "target_id": target_id,
            "admin_id": admin_user.id
        }
    )
    
    try:
        if action_type == "create":
            await _apply_create_action(module, payload, admin_user, db)
        elif action_type == "update":
            if not target_id:
                raise AppException(
                    code="INVALID_ACTION",
                    message="Update action requires target_id",
                    status_code=400
                )
            await _apply_update_action(module, target_id, payload, admin_user, db)
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

async def _apply_create_action(module: str, payload: Dict[str, Any], admin_user: Employee, db: Session) -> None:
    """Apply create action"""
    # Add required fields
    create_data = {
        "id": generate_id(),
        **payload
    }
    
    # Generate inquiry_no for leads if not provided
    if module == "leads" and not create_data.get("inquiry_no"):
        create_data["inquiry_no"] = generate_inquiry_no()
    
    # Create the appropriate model
    if module == "leads":
        db_obj = Lead(**create_data)
    elif module == "corporate_developers":
        db_obj = CorporateDeveloper(**create_data)
    else:
        raise AppException(
            code="INVALID_MODULE",
            message=f"Unknown module: {module}",
            status_code=400
        )
    
    db.add(db_obj)
    
    # Log to audit
    audit_log = AuditLog(
        id=generate_id(),
        module=module,
        action_type="create",
        target_id=create_data["id"],
        before_payload=None,
        after_payload=json.dumps(create_data),
        admin_id=admin_user.id
    )
    db.add(audit_log)

async def _apply_update_action(module: str, target_id: str, payload: Dict[str, Any], admin_user: Employee, db: Session) -> None:
    """Apply update action"""
    # Get the appropriate model
    if module == "leads":
        obj = db.query(Lead).filter(Lead.id == target_id).first()
    elif module == "corporate_developers":
        obj = db.query(CorporateDeveloper).filter(CorporateDeveloper.id == target_id).first()
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
    
    # Capture before state
    before_data = {column.name: getattr(obj, column.name) for column in obj.__table__.columns}
    
    # Apply updates
    for field, value in payload.items():
        if hasattr(obj, field):
            setattr(obj, field, value)
    
    # Capture after state
    after_data = {column.name: getattr(obj, column.name) for column in obj.__table__.columns}
    
    # Log to audit
    audit_log = AuditLog(
        id=generate_id(),
        module=module,
        action_type="update",
        target_id=target_id,
        before_payload=json.dumps(before_data, default=str),
        after_payload=json.dumps(after_data, default=str),
        admin_id=admin_user.id
    )
    db.add(audit_log)

async def _apply_delete_action(module: str, target_id: str, admin_user: Employee, db: Session) -> None:
    """Apply delete action"""
    # Get the appropriate model
    if module == "leads":
        obj = db.query(Lead).filter(Lead.id == target_id).first()
    elif module == "corporate_developers":
        obj = db.query(CorporateDeveloper).filter(CorporateDeveloper.id == target_id).first()
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
    
    # Capture before state
    before_data = {column.name: getattr(obj, column.name) for column in obj.__table__.columns}
    
    # Delete object
    db.delete(obj)
    
    # Log to audit
    audit_log = AuditLog(
        id=generate_id(),
        module=module,
        action_type="delete",
        target_id=target_id,
        before_payload=json.dumps(before_data, default=str),
        after_payload=None,
        admin_id=admin_user.id
    )
    db.add(audit_log)