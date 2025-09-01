from sqlalchemy import Column, String, DateTime, Integer, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class CorporateDeveloper(Base):
    __tablename__ = "corporate_developers"

    id = Column(String, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    grade = Column(String(50))
    common_contact = Column(String(255), nullable=False)
    email = Column(String(255))
    website = Column(String(255))
    linkedin = Column(String(255))
    head_office_city = Column(String(100))
    presence_city = Column(String(100))
    no_of_buildings = Column(Integer)
    building_list_link = Column(String(255))
    contact_list_link = Column(String(255))
    owner_id = Column(String, ForeignKey("employees.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    owner = relationship("Employee", foreign_keys=[owner_id])