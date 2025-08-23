from sqlalchemy import Column, String, DateTime, Text, Enum
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class ContactType(str, enum.Enum):
    CLIENT = "Client"
    DEVELOPER = "Developer"
    INDIVIDUAL_OWNER = "Individual Owner"
    LAND_ACQUISITION = "Land Acquisition"
    OTHERS = "Others"


class Contact(Base):
    __tablename__ = "contacts"

    id = Column(String, primary_key=True, index=True)
    type = Column(Enum(ContactType), nullable=False)
    company_name = Column(String)
    industry = Column(String)
    department = Column(String)
    developer_name = Column(String)
    contact_type = Column(String)
    individual_owner_name = Column(String)
    owner_type = Column(String)
    department_designation = Column(String)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    designation = Column(String)
    contact_no = Column(String, nullable=False)
    alternate_no = Column(String)
    email_id = Column(String, nullable=False)
    linkedin_link = Column(String)
    city = Column(String)
    location = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())