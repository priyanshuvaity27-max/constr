from sqlalchemy import Column, String, DateTime, Text, Enum, JSON, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class ActionType(str, enum.Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"


class ActionModule(str, enum.Enum):
    LEADS = "leads"
    DEVELOPERS = "developers"
    CONTACTS = "contacts"
    PROJECTS = "projects"
    INVENTORY = "inventory"
    LAND = "land"


class ActionStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class PendingAction(Base):
    __tablename__ = "pending_actions"

    id = Column(String, primary_key=True, index=True)
    type = Column(Enum(ActionType), nullable=False)
    module = Column(Enum(ActionModule), nullable=False)
    data = Column(JSON, nullable=False)
    original_data = Column(JSON)
    requested_by = Column(String, ForeignKey("users.id"), nullable=False)
    requested_by_name = Column(String, nullable=False)
    requested_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(Enum(ActionStatus), nullable=False, default=ActionStatus.PENDING)
    admin_notes = Column(Text)
    processed_at = Column(DateTime(timezone=True))
    processed_by = Column(String, ForeignKey("users.id"))

    # Relationships
    requester = relationship("User", foreign_keys=[requested_by])
    processor = relationship("User", foreign_keys=[processed_by])