from sqlalchemy import Column, String, DateTime, Integer, Text, Enum, ForeignKey, Boolean, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
import enum
import uuid

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    EMPLOYEE = "employee"

class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(Text, nullable=False)
    name = Column(String(100), nullable=False)
    mobile_no = Column(String(15))
    role = Column(Enum(UserRole), nullable=False, default=UserRole.EMPLOYEE)
    status = Column(Enum(UserStatus), nullable=False, default=UserStatus.ACTIVE)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class LeadStatus(str, enum.Enum):
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    PROPOSAL_SENT = "proposal_sent"
    NEGOTIATION = "negotiation"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"

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
    BUY = "Buy"
    SELL = "Sell"

class Lead(Base):
    __tablename__ = "leads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    inquiry_no = Column(String(50), unique=True, nullable=False)
    inquiry_date = Column(DateTime(timezone=True), nullable=False)
    client_company = Column(String(150), nullable=False)
    contact_person = Column(String(100), nullable=False)
    contact_no = Column(String(15), nullable=False)
    email = Column(String(100), nullable=False)
    designation = Column(String(100))
    department = Column(String(100))
    description = Column(Text)
    type_of_place = Column(Enum(TypeOfPlace), nullable=False)
    space_requirement = Column(String(100))
    transaction_type = Column(Enum(TransactionType), nullable=False)
    budget = Column(Numeric(15, 2))
    city = Column(String(100))
    location_preference = Column(String(200))
    site_visit_required = Column(String(3), default="No")
    proposal_submitted = Column(String(3), default="No")
    shortlisted = Column(String(3), default="No")
    deal_closed = Column(String(3), default="No")
    status = Column(Enum(LeadStatus), default=LeadStatus.NEW)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    assignee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    owner = relationship("User", foreign_keys=[owner_id])
    assignee = relationship("User", foreign_keys=[assignee_id])

class DeveloperType(str, enum.Enum):
    CORPORATE = "corporate"
    COWORKING = "coworking"
    WAREHOUSE = "warehouse"
    MALL = "mall"

class Grade(str, enum.Enum):
    A = "A"
    B = "B"
    C = "C"

class Developer(Base):
    __tablename__ = "developers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = Column(Enum(DeveloperType), nullable=False)
    name = Column(String(150), nullable=False)
    grade = Column(Enum(Grade), nullable=False)
    contact_no = Column(String(15), nullable=False)
    email_id = Column(String(100), nullable=False)
    website_link = Column(String(200), nullable=False)
    linkedin_link = Column(String(200))
    ho_city = Column(String(100), nullable=False)
    presence_cities = Column(Text)
    no_of_buildings = Column(Integer)
    no_of_coworking = Column(Integer)
    no_of_warehouses = Column(Integer)
    no_of_malls = Column(Integer)
    building_list_link = Column(String(200))
    contact_list_link = Column(String(200))
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User")

class ProjectType(str, enum.Enum):
    CORPORATE_BUILDING = "corporate_building"
    COWORKING_SPACE = "coworking_space"
    WAREHOUSE = "warehouse"
    RETAIL_MALL = "retail_mall"

class ProjectStatus(str, enum.Enum):
    ACTIVE = "Active"
    INACTIVE = "Inactive"
    UNDER_CONSTRUCTION = "Under Construction"

class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = Column(Enum(ProjectType), nullable=False)
    name = Column(String(150), nullable=False)
    grade = Column(Enum(Grade), nullable=False)
    developer_owner = Column(String(150), nullable=False)
    contact_no = Column(String(15), nullable=False)
    alternate_no = Column(String(15))
    email = Column(String(100), nullable=False)
    city = Column(String(100), nullable=False)
    location = Column(String(200), nullable=False)
    landmark = Column(String(200))
    google_location = Column(String(500))
    no_of_floors = Column(Integer)
    floor_plate = Column(String(100))
    no_of_seats = Column(Integer)
    availability_of_seats = Column(Integer)
    per_open_desk_cost = Column(Numeric(10, 2))
    per_dedicated_desk_cost = Column(Numeric(10, 2))
    setup_fees = Column(Numeric(10, 2))
    no_of_warehouses = Column(Integer)
    warehouse_size = Column(String(100))
    total_area = Column(String(100))
    efficiency = Column(String(100))
    floor_plate_area = Column(String(100))
    rent_per_sqft = Column(Numeric(10, 2), nullable=False, default=0)
    cam_per_sqft = Column(Numeric(10, 2), nullable=False, default=0)
    amenities = Column(Text)
    remark = Column(Text)
    status = Column(Enum(ProjectStatus), nullable=False, default=ProjectStatus.ACTIVE)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User")

class InventoryType(str, enum.Enum):
    CORPORATE_BUILDING = "corporate_building"
    COWORKING_SPACE = "coworking_space"
    WAREHOUSE = "warehouse"
    RETAIL_MALL = "retail_mall"

class InventoryStatus(str, enum.Enum):
    AVAILABLE = "Available"
    OCCUPIED = "Occupied"
    UNDER_MAINTENANCE = "Under Maintenance"

class InventoryItem(Base):
    __tablename__ = "inventory"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = Column(Enum(InventoryType), nullable=False)
    name = Column(String(150), nullable=False)
    grade = Column(Enum(Grade), nullable=False)
    developer_owner_name = Column(String(150), nullable=False)
    contact_no = Column(String(15), nullable=False)
    alternate_contact_no = Column(String(15))
    email_id = Column(String(100), nullable=False)
    city = Column(String(100), nullable=False)
    location = Column(String(200), nullable=False)
    google_location = Column(String(500))
    saleable_area = Column(String(100))
    carpet_area = Column(String(100))
    no_of_saleable_seats = Column(Integer)
    floor = Column(String(50), nullable=False)
    height = Column(String(50))
    type_of_flooring = Column(String(100))
    flooring_size = Column(String(100))
    side_height = Column(String(50))
    centre_height = Column(String(50))
    canopy = Column(String(100))
    fire_sprinklers = Column(String(100))
    frontage = Column(String(100))
    terrace = Column(String(100))
    specification = Column(Text, nullable=False)
    status = Column(Enum(InventoryStatus), nullable=False, default=InventoryStatus.AVAILABLE)
    rent_per_sqft = Column(Numeric(10, 2))
    cost_per_seat = Column(Numeric(10, 2))
    cam_per_sqft = Column(Numeric(10, 2))
    setup_fees_inventory = Column(Numeric(10, 2))
    agreement_period = Column(String(50), nullable=False)
    lock_in_period = Column(String(50), nullable=False)
    no_of_car_parks = Column(Integer, nullable=False, default=0)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User")

class Zone(str, enum.Enum):
    COMMERCIAL = "Commercial"
    RESIDENTIAL = "Residential"
    INDUSTRIAL = "Industrial"
    MIXED_USE = "Mixed Use"

class LandParcel(Base):
    __tablename__ = "land_parcels"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    land_parcel_name = Column(String(150), nullable=False)
    location = Column(String(200), nullable=False)
    city = Column(String(100), nullable=False)
    google_location = Column(String(500))
    area_in_sqm = Column(Integer, nullable=False)
    zone = Column(Enum(Zone), nullable=False)
    title = Column(String(200), nullable=False)
    road_width = Column(String(50))
    connectivity = Column(Text)
    advantages = Column(Text)
    documents = Column(Text)  # JSON string
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User")

class ContactType(str, enum.Enum):
    CLIENT = "Client"
    DEVELOPER = "Developer"
    INDIVIDUAL_OWNER = "Individual Owner"
    LAND_ACQUISITION = "Land Acquisition"
    OTHERS = "Others"

class Contact(Base):
    __tablename__ = "contacts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = Column(Enum(ContactType), nullable=False)
    company_name = Column(String(150))
    industry = Column(String(100))
    department = Column(String(100))
    developer_name = Column(String(150))
    contact_type = Column(String(100))
    individual_owner_name = Column(String(150))
    owner_type = Column(String(100))
    department_designation = Column(String(100))
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    designation = Column(String(100))
    contact_no = Column(String(15), nullable=False)
    alternate_no = Column(String(15))
    email_id = Column(String(100), nullable=False)
    linkedin_link = Column(String(200))
    city = Column(String(100))
    location = Column(String(200))
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User")

class ActionType(str, enum.Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"

class ActionModule(str, enum.Enum):
    USERS = "users"
    LEADS = "leads"
    DEVELOPERS = "developers"
    PROJECTS = "projects"
    INVENTORY = "inventory"
    LAND = "land"
    CONTACTS = "contacts"

class ActionStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class PendingAction(Base):
    __tablename__ = "pending_actions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    module = Column(Enum(ActionModule), nullable=False)
    type = Column(Enum(ActionType), nullable=False)
    data = Column(Text, nullable=False)  # JSON string
    target_id = Column(UUID(as_uuid=True))
    requested_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    requested_by_name = Column(String(100), nullable=False)
    status = Column(Enum(ActionStatus), nullable=False, default=ActionStatus.PENDING)
    admin_notes = Column(Text)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    approved_by_name = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    requester = relationship("User", foreign_keys=[requested_by])
    approver = relationship("User", foreign_keys=[approved_by])

class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity = Column(String(50), nullable=False)
    entity_id = Column(UUID(as_uuid=True), nullable=False)
    label = Column(String(100), nullable=False)
    filename = Column(String(255), nullable=False)
    content_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)
    file_path = Column(String(500), nullable=False)  # S3 key or local path
    public_url = Column(String(500))
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    uploaded_by_name = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    uploader = relationship("User")