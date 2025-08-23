from sqlalchemy import Column, String, DateTime, Integer, Text, Enum, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class TypeOfPlace(str, enum.Enum):
    OFFICE = "Office"
    RETAIL = "Retail"
    WAREHOUSE = "Warehouse"
    COWORKING = "Coworking"
    INDUSTRIAL = "Industrial"
    LAND = "Land"
    OTHER = "Other"


class TransactionType(str, enum.Enum):
    LEASE = "Lease"
    SALE = "Sale"
    BOTH = "Both"


class LeadStatus(str, enum.Enum):
    NEW = "New"
    IN_PROGRESS = "In Progress"
    QUALIFIED = "Qualified"
    CLOSED_WON = "Closed Won"
    CLOSED_LOST = "Closed Lost"
    FOLLOW_UP = "Follow Up"


class OptionShared(str, enum.Enum):
    YES = "Yes"
    NO = "No"


class Lead(Base):
    __tablename__ = "leads"

    id = Column(String, primary_key=True, index=True)
    inquiry_no = Column(String, unique=True, nullable=False)
    inquiry_date = Column(DateTime(timezone=True), nullable=False)
    client_company = Column(String, nullable=False)
    contact_person = Column(String, nullable=False)
    contact_no = Column(String, nullable=False)
    email = Column(String, nullable=False)
    designation = Column(String)
    department = Column(String)
    description = Column(Text)
    type_of_place = Column(Enum(TypeOfPlace), nullable=False)
    space_requirement = Column(String)
    transaction_type = Column(Enum(TransactionType), nullable=False)
    budget = Column(Integer)
    city = Column(String)
    location_preference = Column(String)
    first_contact_date = Column(DateTime(timezone=True))
    lead_managed_by = Column(String, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(LeadStatus), nullable=False, default=LeadStatus.NEW)
    option_shared = Column(Enum(OptionShared), default=OptionShared.NO)
    last_contact_date = Column(DateTime(timezone=True))
    next_action_plan = Column(Text)
    action_date = Column(DateTime(timezone=True))
    remark = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    lead_manager = relationship("User", foreign_keys=[lead_managed_by])