from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, leads, developers, contacts, projects, inventory, land, pending_actions, documents

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(leads.router, prefix="/leads", tags=["leads"])
api_router.include_router(developers.router, prefix="/developers", tags=["developers"])
api_router.include_router(contacts.router, prefix="/contacts", tags=["contacts"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
api_router.include_router(land.router, prefix="/land", tags=["land"])
api_router.include_router(pending_actions.router, prefix="/pending-actions", tags=["pending-actions"])
api_router.include_router(documents.router, tags=["documents"])