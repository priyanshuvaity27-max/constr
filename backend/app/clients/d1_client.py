import httpx
import hmac
import hashlib
import json
import time
from typing import Dict, Any, List, Optional
from app.config import settings
from app.utils.errors import AppException

class D1Client:
    def __init__(self):
        self.base_url = settings.WORKER_BASE
        self.hmac_secret = settings.WORKER_HMAC_SECRET.encode()
        self.client = httpx.AsyncClient(timeout=30.0)
    
    def _sign_request(self, body: str) -> Dict[str, str]:
        timestamp = str(int(time.time()))
        signature = hmac.new(
            self.hmac_secret,
            f"{timestamp}{body}".encode(),
            hashlib.sha256
        ).hexdigest()
        
        return {
            "X-Ts": timestamp,
            "X-Sign": signature,
            "Content-Type": "application/json"
        }
    
    async def _call(self, endpoint: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        body = json.dumps(payload, separators=(',', ':'))
        headers = self._sign_request(body)
        
        try:
            response = await self.client.post(
                f"{self.base_url}/{endpoint}",
                content=body,
                headers=headers
            )
            
            result = response.json()
            
            if not response.is_success or not result.get("ok"):
                error = result.get("error", {})
                raise AppException(
                    code=error.get("code", "WORKER_ERROR"),
                    message=error.get("message", "Worker request failed"),
                    details=error.get("details"),
                    status_code=response.status_code if response.status_code >= 400 else 500
                )
            
            return result.get("data", result)
            
        except httpx.RequestError as e:
            raise AppException(
                code="WORKER_UNAVAILABLE",
                message=f"Failed to connect to database: {str(e)}",
                status_code=503
            )
    
    # Users
    async def users_get_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        result = await self._call("sql/users.get_by_username", {"username": username})
        return result.get("user")
    
    async def users_get_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        result = await self._call("sql/users.get_by_id", {"id": user_id})
        return result.get("user")
    
    async def users_list(self, filters: Dict[str, Any]) -> Dict[str, Any]:
        return await self._call("sql/users.list", filters)
    
    async def users_create(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        return await self._call("sql/users.create", user_data)
    
    async def users_update(self, user_id: str, user_data: Dict[str, Any]) -> Dict[str, Any]:
        return await self._call("sql/users.update", {"id": user_id, **user_data})
    
    async def users_delete(self, user_id: str) -> bool:
        await self._call("sql/users.delete", {"id": user_id})
        return True
    
    # Leads
    async def leads_list(self, filters: Dict[str, Any]) -> Dict[str, Any]:
        return await self._call("sql/leads.list", filters)
    
    async def leads_get_by_id(self, lead_id: str) -> Optional[Dict[str, Any]]:
        result = await self._call("sql/leads.get_by_id", {"id": lead_id})
        return result.get("lead")
    
    async def leads_create(self, lead_data: Dict[str, Any]) -> Dict[str, Any]:
        return await self._call("sql/leads.create", lead_data)
    
    async def leads_update(self, lead_id: str, lead_data: Dict[str, Any]) -> Dict[str, Any]:
        return await self._call("sql/leads.update", {"id": lead_id, **lead_data})
    
    async def leads_delete(self, lead_id: str) -> bool:
        await self._call("sql/leads.delete", {"id": lead_id})
        return True
    
    # Developers
    async def developers_list(self, filters: Dict[str, Any]) -> Dict[str, Any]:
        return await self._call("sql/developers.list", filters)
    
    async def developers_get_by_id(self, developer_id: str) -> Optional[Dict[str, Any]]:
        result = await self._call("sql/developers.get_by_id", {"id": developer_id})
        return result.get("developer")
    
    async def developers_create(self, developer_data: Dict[str, Any]) -> Dict[str, Any]:
        return await self._call("sql/developers.create", developer_data)
    
    async def developers_update(self, developer_id: str, developer_data: Dict[str, Any]) -> Dict[str, Any]:
        return await self._call("sql/developers.update", {"id": developer_id, **developer_data})
    
    async def developers_delete(self, developer_id: str) -> bool:
        await self._call("sql/developers.delete", {"id": developer_id})
        return True
    
    # Projects
    async def projects_list(self, filters: Dict[str, Any]) -> Dict[str, Any]:
        return await self._call("sql/projects.list", filters)
    
    async def projects_get_by_id(self, project_id: str) -> Optional[Dict[str, Any]]:
        result = await self._call("sql/projects.get_by_id", {"id": project_id})
        return result.get("project")
    
    async def projects_create(self, project_data: Dict[str, Any]) -> Dict[str, Any]:
        return await self._call("sql/projects.create", project_data)
    
    async def projects_update(self, project_id: str, project_data: Dict[str, Any]) -> Dict[str, Any]:
        return await self._call("sql/projects.update", {"id": project_id, **project_data})
    
    async def projects_delete(self, project_id: str) -> bool:
        await self._call("sql/projects.delete", {"id": project_id})
        return True
    
    # Inventory
    async def inventory_list(self, filters: Dict[str, Any]) -> Dict[str, Any]:
        return await self._call("sql/inventory.list", filters)
    
    async def inventory_get_by_id(self, inventory_id: str) -> Optional[Dict[str, Any]]:
        result = await self._call("sql/inventory.get_by_id", {"id": inventory_id})
        return result.get("inventory")
    
    async def inventory_create(self, inventory_data: Dict[str, Any]) -> Dict[str, Any]:
        return await self._call("sql/inventory.create", inventory_data)
    
    async def inventory_update(self, inventory_id: str, inventory_data: Dict[str, Any]) -> Dict[str, Any]:
        return await self._call("sql/inventory.update", {"id": inventory_id, **inventory_data})
    
    async def inventory_delete(self, inventory_id: str) -> bool:
        await self._call("sql/inventory.delete", {"id": inventory_id})
        return True
    
    # Land
    async def land_list(self, filters: Dict[str, Any]) -> Dict[str, Any]:
        return await self._call("sql/land.list", filters)
    
    async def land_get_by_id(self, land_id: str) -> Optional[Dict[str, Any]]:
        result = await self._call("sql/land.get_by_id", {"id": land_id})
        return result.get("land")
    
    async def land_create(self, land_data: Dict[str, Any]) -> Dict[str, Any]:
        return await self._call("sql/land.create", land_data)
    
    async def land_update(self, land_id: str, land_data: Dict[str, Any]) -> Dict[str, Any]:
        return await self._call("sql/land.update", {"id": land_id, **land_data})
    
    async def land_delete(self, land_id: str) -> bool:
        await self._call("sql/land.delete", {"id": land_id})
        return True
    
    # Contacts
    async def contacts_list(self, filters: Dict[str, Any]) -> Dict[str, Any]:
        return await self._call("sql/contacts.list", filters)
    
    async def contacts_get_by_id(self, contact_id: str) -> Optional[Dict[str, Any]]:
        result = await self._call("sql/contacts.get_by_id", {"id": contact_id})
        return result.get("contact")
    
    async def contacts_create(self, contact_data: Dict[str, Any]) -> Dict[str, Any]:
        return await self._call("sql/contacts.create", contact_data)
    
    async def contacts_update(self, contact_id: str, contact_data: Dict[str, Any]) -> Dict[str, Any]:
        return await self._call("sql/contacts.update", {"id": contact_id, **contact_data})
    
    async def contacts_delete(self, contact_id: str) -> bool:
        await self._call("sql/contacts.delete", {"id": contact_id})
        return True
    
    # Pending Actions
    async def pending_actions_list(self, filters: Dict[str, Any]) -> Dict[str, Any]:
        return await self._call("sql/pending_actions.list", filters)
    
    async def pending_actions_get_by_id(self, action_id: str) -> Optional[Dict[str, Any]]:
        result = await self._call("sql/pending_actions.get_by_id", {"id": action_id})
        return result.get("pending_action")
    
    async def pending_actions_create(self, action_data: Dict[str, Any]) -> Dict[str, Any]:
        return await self._call("sql/pending_actions.create", action_data)
    
    async def pending_actions_update(self, action_id: str, action_data: Dict[str, Any]) -> Dict[str, Any]:
        return await self._call("sql/pending_actions.update", {"id": action_id, **action_data})
    
    async def pending_actions_delete(self, action_id: str) -> bool:
        await self._call("sql/pending_actions.delete", {"id": action_id})
        return True
    
    # Documents
    async def documents_list(self, filters: Dict[str, Any]) -> Dict[str, Any]:
        return await self._call("sql/documents.list", filters)
    
    async def documents_create(self, document_data: Dict[str, Any]) -> Dict[str, Any]:
        return await self._call("sql/documents.create", document_data)
    
    async def documents_delete(self, document_id: str) -> bool:
        await self._call("sql/documents.delete", {"id": document_id})
        return True

# Global instance
d1_client = D1Client()