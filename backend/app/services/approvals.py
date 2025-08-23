from typing import Dict, Any
from app.clients.d1_client import d1_client
from app.schemas.auth import UserResponse
from app.utils.ids import generate_id, generate_inquiry_no
from app.utils.errors import AppException
from app.utils.logging import logger

async def apply_pending_action(action_data: Dict[str, Any], admin_user: UserResponse) -> None:
    """Apply a pending action to the database"""
    module = action_data["module"]
    action_type = action_data["type"]
    data = action_data["data"]
    target_id = action_data.get("target_id")
    
    logger.info(
        "Applying pending action",
        extra={
            "action_id": action_data["id"],
            "module": module,
            "type": action_type,
            "target_id": target_id,
            "admin_id": admin_user.id
        }
    )
    
    try:
        if action_type == "create":
            await _apply_create_action(module, data, admin_user)
        elif action_type == "update":
            if not target_id:
                raise AppException(
                    code="INVALID_ACTION",
                    message="Update action requires target_id",
                    status_code=400
                )
            await _apply_update_action(module, target_id, data, admin_user)
        elif action_type == "delete":
            if not target_id:
                raise AppException(
                    code="INVALID_ACTION",
                    message="Delete action requires target_id",
                    status_code=400
                )
            await _apply_delete_action(module, target_id, admin_user)
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
                "action_id": action_data["id"],
                "error": str(e)
            }
        )
        raise

async def _apply_create_action(module: str, data: Dict[str, Any], admin_user: UserResponse) -> None:
    """Apply create action"""
    # Add required fields
    create_data = {
        "id": generate_id(),
        **data
    }
    
    # Add owner_id for entities that support it
    if module in ["leads", "projects", "inventory", "land", "contacts"]:
        create_data["owner_id"] = admin_user.id
    
    # Generate inquiry_no for leads if not provided
    if module == "leads" and not create_data.get("inquiry_no"):
        create_data["inquiry_no"] = generate_inquiry_no()
    
    # Call appropriate client method
    client_method = getattr(d1_client, f"{module}_create")
    await client_method(create_data)

async def _apply_update_action(module: str, target_id: str, data: Dict[str, Any], admin_user: UserResponse) -> None:
    """Apply update action"""
    client_method = getattr(d1_client, f"{module}_update")
    await client_method(target_id, data)

async def _apply_delete_action(module: str, target_id: str, admin_user: UserResponse) -> None:
    """Apply delete action"""
    client_method = getattr(d1_client, f"{module}_delete")
    await client_method(target_id)