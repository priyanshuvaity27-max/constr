from sqlalchemy import Column, String, DateTime, Integer, Text, Enum, ForeignKey, Numeric, Boolean, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class TypeOfSpace(str, enum.Enum):
    OFFICE = "Office"
    RETAIL = "Retail"
    WAREHOUSE = "Warehouse"
    COWORKING = "Coworking"
    INDUSTRIAL = "Industrial"
    LAND = "Land"
    OTHER = "Other"

class TransactionType(str, enum.Enum):
    LEASE = "Lease"
    BUY = "Buy"
    SELL = "Sell"

class LeadStatus(str, enum.Enum):
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    PROPOSAL_SENT = "proposal_sent"
    NEGOTIATION = "negotiation"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"

class Lead(Base):
    __tablename__ = "leads"

    id = Column(String, primary_key=True, index=True)
    inquiry_no = Column(String(50), unique=True, nullable=False)
    inquiry_date = Column(Date, nullable=False)
    client_company = Column(String(255), nullable=False)
    contact_person = Column(String(255), nullable=False)
    contact_no = Column(String(20), nullable=False)
    email = Column(String(255))
    designation = Column(String(255))
    department = Column(String(255))
    type_of_space = Column(Enum(TypeOfSpace))
    space_requirement = Column(String(255), nullable=False)
    transaction_type = Column(Enum(TransactionType))
    representative = Column(String(255))
    budget = Column(Numeric(18, 2))
    city = Column(String(100), nullable=False)
    location_preference = Column(String(255))
    description = Column(Text)
    first_contact_date = Column(Date)
    last_contact_date = Column(Date)
    lead_managed_by = Column(String)
    action_date = Column(Date)
    status = Column(Enum(LeadStatus), default=LeadStatus.NEW)
    next_action_plan = Column(Text)
    option_shared = Column(Boolean, default=False)
    remarks = Column(Text)
    owner_id = Column(String, ForeignKey("employees.id"))
    assignee_id = Column(String, ForeignKey("employees.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    owner = relationship("Employee", foreign_keys=[owner_id])
    assignee = relationship("Employee", foreign_keys=[assignee_id])