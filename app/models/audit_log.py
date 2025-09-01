from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(String, primary_key=True, index=True)
    module = Column(String(50), nullable=False)
    action_type = Column(String(50), nullable=False)
    target_id = Column(String)
    before_payload = Column(Text)  # JSON string
    after_payload = Column(Text)   # JSON string
    admin_id = Column(String, ForeignKey("employees.id"), nullable=False)
    actioned_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    admin = relationship("Employee", foreign_keys=[admin_id])