from sqlalchemy import Column, String, DateTime, Text, Enum, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class ActionType(str, enum.Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    BULK_IMPORT = "bulk_import"

class ActionStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class PendingAction(Base):
    __tablename__ = "pending_actions"

    id = Column(String, primary_key=True, index=True)
    module = Column(String(50), nullable=False)
    action_type = Column(Enum(ActionType), nullable=False)
    target_id = Column(String)
    payload = Column(Text, nullable=False)  # JSON string
    requested_by = Column(String, ForeignKey("employees.id"), nullable=False)
    requested_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(Enum(ActionStatus), nullable=False, default=ActionStatus.PENDING)
    reviewed_by = Column(String, ForeignKey("employees.id"))
    reviewed_at = Column(DateTime(timezone=True))
    note = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    requester = relationship("Employee", foreign_keys=[requested_by])
    reviewer = relationship("Employee", foreign_keys=[reviewed_by])