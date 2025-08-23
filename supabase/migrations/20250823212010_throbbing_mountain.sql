-- Real Estate CRM Database Schema
-- Initial migration with all tables

-- Users table (6 hardcoded accounts)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  mobile_no TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin','employee')),
  status TEXT NOT NULL CHECK (status IN ('active','inactive')) DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  inquiry_no TEXT NOT NULL UNIQUE,
  inquiry_date TEXT NOT NULL,
  client_company TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  contact_no TEXT NOT NULL,
  email TEXT NOT NULL,
  designation TEXT,
  department TEXT,
  description TEXT,
  type_of_place TEXT NOT NULL CHECK (type_of_place IN ('Office','Retail','Warehouse','Coworking','Industrial','Land','Other')),
  space_requirement TEXT,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('Lease','Buy','Sell')),
  budget REAL,
  city TEXT,
  location_preference TEXT,
  site_visit_required TEXT CHECK (site_visit_required IN ('Yes','No')) DEFAULT 'No',
  proposal_submitted TEXT CHECK (proposal_submitted IN ('Yes','No')) DEFAULT 'No',
  shortlisted TEXT CHECK (shortlisted IN ('Yes','No')) DEFAULT 'No',
  deal_closed TEXT CHECK (deal_closed IN ('Yes','No')) DEFAULT 'No',
  owner_id TEXT NOT NULL,
  assignee_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT,
  FOREIGN KEY(owner_id) REFERENCES users(id),
  FOREIGN KEY(assignee_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_leads_company ON leads(client_company);
CREATE INDEX IF NOT EXISTS idx_leads_city ON leads(city);
CREATE INDEX IF NOT EXISTS idx_leads_type ON leads(type_of_place);
CREATE INDEX IF NOT EXISTS idx_leads_owner ON leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_assignee ON leads(assignee_id);

-- Developers table
CREATE TABLE IF NOT EXISTS developers (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('corporate','coworking','warehouse','mall')),
  name TEXT NOT NULL,
  grade TEXT NOT NULL CHECK (grade IN ('A','B','C')),
  contact_no TEXT NOT NULL,
  email_id TEXT NOT NULL,
  website_link TEXT NOT NULL,
  linkedin_link TEXT,
  ho_city TEXT NOT NULL,
  presence_cities TEXT,
  no_of_buildings INTEGER,
  no_of_coworking INTEGER,
  no_of_warehouses INTEGER,
  no_of_malls INTEGER,
  building_list_link TEXT,
  contact_list_link TEXT,
  owner_id TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT,
  FOREIGN KEY(owner_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_developers_type ON developers(type);
CREATE INDEX IF NOT EXISTS idx_developers_city ON developers(ho_city);
CREATE INDEX IF NOT EXISTS idx_developers_grade ON developers(grade);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('corporate_building','coworking_space','warehouse','retail_mall')),
  name TEXT NOT NULL,
  grade TEXT NOT NULL CHECK (grade IN ('A','B','C')),
  developer_owner TEXT NOT NULL,
  contact_no TEXT NOT NULL,
  alternate_no TEXT,
  email TEXT NOT NULL,
  city TEXT NOT NULL,
  location TEXT NOT NULL,
  landmark TEXT,
  google_location TEXT,
  no_of_floors INTEGER,
  floor_plate TEXT,
  no_of_seats INTEGER,
  availability_of_seats INTEGER,
  per_open_desk_cost REAL,
  per_dedicated_desk_cost REAL,
  setup_fees REAL,
  no_of_warehouses INTEGER,
  warehouse_size TEXT,
  total_area TEXT,
  efficiency TEXT,
  floor_plate_area TEXT,
  rent_per_sqft REAL NOT NULL DEFAULT 0,
  cam_per_sqft REAL NOT NULL DEFAULT 0,
  amenities TEXT,
  remark TEXT,
  status TEXT NOT NULL CHECK (status IN ('Active','Inactive','Under Construction')) DEFAULT 'Active',
  owner_id TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT,
  FOREIGN KEY(owner_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type);
CREATE INDEX IF NOT EXISTS idx_projects_city ON projects(city);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('corporate_building','coworking_space','warehouse','retail_mall')),
  name TEXT NOT NULL,
  grade TEXT NOT NULL CHECK (grade IN ('A','B','C')),
  developer_owner_name TEXT NOT NULL,
  contact_no TEXT NOT NULL,
  alternate_contact_no TEXT,
  email_id TEXT NOT NULL,
  city TEXT NOT NULL,
  location TEXT NOT NULL,
  google_location TEXT,
  saleable_area TEXT,
  carpet_area TEXT,
  no_of_saleable_seats INTEGER,
  floor TEXT NOT NULL,
  height TEXT,
  type_of_flooring TEXT,
  flooring_size TEXT,
  side_height TEXT,
  centre_height TEXT,
  canopy TEXT,
  fire_sprinklers TEXT,
  frontage TEXT,
  terrace TEXT,
  specification TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Available','Occupied','Under Maintenance')) DEFAULT 'Available',
  rent_per_sqft REAL,
  cost_per_seat REAL,
  cam_per_sqft REAL,
  setup_fees_inventory REAL,
  agreement_period TEXT NOT NULL,
  lock_in_period TEXT NOT NULL,
  no_of_car_parks INTEGER NOT NULL DEFAULT 0,
  owner_id TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT,
  FOREIGN KEY(owner_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_type ON inventory(type);
CREATE INDEX IF NOT EXISTS idx_inventory_city ON inventory(city);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory(status);

-- Land parcels table
CREATE TABLE IF NOT EXISTS land_parcels (
  id TEXT PRIMARY KEY,
  land_parcel_name TEXT NOT NULL,
  location TEXT NOT NULL,
  city TEXT NOT NULL,
  google_location TEXT,
  area_in_sqm INTEGER NOT NULL,
  zone TEXT NOT NULL CHECK (zone IN ('Commercial','Residential','Industrial','Mixed Use')),
  title TEXT NOT NULL,
  road_width TEXT,
  connectivity TEXT,
  advantages TEXT,
  documents TEXT, -- JSON string
  owner_id TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT,
  FOREIGN KEY(owner_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_land_city ON land_parcels(city);
CREATE INDEX IF NOT EXISTS idx_land_zone ON land_parcels(zone);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('Client','Developer','Individual Owner','Land Acquisition','Others')),
  company_name TEXT,
  industry TEXT,
  department TEXT,
  developer_name TEXT,
  contact_type TEXT,
  individual_owner_name TEXT,
  owner_type TEXT,
  department_designation TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  designation TEXT,
  contact_no TEXT NOT NULL,
  alternate_no TEXT,
  email_id TEXT NOT NULL,
  linkedin_link TEXT,
  city TEXT,
  location TEXT,
  owner_id TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT,
  FOREIGN KEY(owner_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(type);
CREATE INDEX IF NOT EXISTS idx_contacts_city ON contacts(city);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email_id);

-- Pending actions table
CREATE TABLE IF NOT EXISTS pending_actions (
  id TEXT PRIMARY KEY,
  module TEXT NOT NULL CHECK (module IN ('users','leads','developers','projects','inventory','land_parcels','contacts')),
  type TEXT NOT NULL CHECK (type IN ('create','update','delete')),
  data TEXT NOT NULL, -- JSON string
  target_id TEXT,
  requested_by TEXT NOT NULL,
  requested_by_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','approved','rejected')) DEFAULT 'pending',
  admin_notes TEXT,
  approved_by TEXT,
  approved_by_name TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT,
  FOREIGN KEY(requested_by) REFERENCES users(id),
  FOREIGN KEY(approved_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_pending_actions_status ON pending_actions(status);
CREATE INDEX IF NOT EXISTS idx_pending_actions_module ON pending_actions(module);
CREATE INDEX IF NOT EXISTS idx_pending_actions_requested_by ON pending_actions(requested_by);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  label TEXT NOT NULL,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  r2_key TEXT NOT NULL,
  public_url TEXT,
  uploaded_by TEXT NOT NULL,
  uploaded_by_name TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(uploaded_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);