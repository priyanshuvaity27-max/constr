from sqlalchemy import Column, String, DateTime, Integer, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, index=True)
    entity = Column(String, nullable=False)  # 'leads', 'projects', etc.
    entity_id = Column(String, nullable=False)
    label = Column(String, nullable=False)  # 'Property Card', 'NOC', etc.
    filename = Column(String, nullable=False)
    content_type = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    file_path = Column(String, nullable=False)  # S3 key or local path
    public_url = Column(String)
    uploaded_by = Column(String, ForeignKey("users.id"), nullable=False)
    uploaded_by_name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    uploader = relationship("User", foreign_keys=[uploaded_by])