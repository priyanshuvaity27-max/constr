from sqlalchemy import Column, String, DateTime, Integer, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, index=True)
    module = Column(String(50), nullable=False)
    entity_id = Column(String, nullable=False)
    label = Column(String(255))
    filename = Column(String(255), nullable=False)
    content_type = Column(String(100))
    file_size = Column(Integer)
    r2_key = Column(String(255), nullable=False)
    public_url = Column(String(255))
    uploaded_by = Column(String, ForeignKey("employees.id"), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    uploader = relationship("Employee", foreign_keys=[uploaded_by])