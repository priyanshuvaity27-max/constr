/*
  # Complete Real Estate CRM Database Schema

  This migration creates all tables for the Real Estate CRM system including:
  
  1. Core Tables
     - `employees` (authentication and RBAC)
     - `leads` (lead tracking)
     - `pending_actions` (approval workflow)
     - `audit_log` (change tracking)
     - `documents` (file metadata)
  
  2. Developer Tables
     - `corporate_developers`
     - `coworking_developers` 
     - `warehouse_developers`
     - `mall_developers`
  
  3. Contact Tables
     - `clients`
     - `developer_contacts`
     - `brokers`
     - `individual_owners`
  
  4. Inventory Tables
     - `corporate_buildings`
     - `coworking_spaces`
     - `warehouses`
     - `retail_malls`
     - `land_parcels`
  
  5. Security
     - Enable RLS on all tables
     - Add policies for role-based access
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. EMPLOYEES TABLE (Authentication & RBAC)
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'employee')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'inactive')),
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. LEADS TABLE
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inquiry_no VARCHAR(50) UNIQUE NOT NULL,
    inquiry_date DATE NOT NULL,
    client_company VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    contact_no VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    designation VARCHAR(255),
    department VARCHAR(255),
    type_of_space VARCHAR(50) CHECK (type_of_space IN ('Office','Retail','Warehouse','Coworking','Industrial','Land','Other')),
    space_requirement VARCHAR(255) NOT NULL,
    transaction_type VARCHAR(50) CHECK (transaction_type IN ('Lease','Buy','Sell')),
    representative VARCHAR(255),
    budget NUMERIC(18,2),
    city VARCHAR(100) NOT NULL,
    location_preference VARCHAR(255),
    description TEXT,
    first_contact_date DATE,
    last_contact_date DATE,
    lead_managed_by UUID,
    action_date DATE,
    status VARCHAR(50) DEFAULT 'new',
    next_action_plan TEXT,
    option_shared BOOLEAN DEFAULT FALSE,
    remarks TEXT,
    owner_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    assignee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CORPORATE DEVELOPERS TABLE
CREATE TABLE IF NOT EXISTS corporate_developers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    grade VARCHAR(50),
    common_contact VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    website VARCHAR(255),
    linkedin VARCHAR(255),
    head_office_city VARCHAR(100),
    presence_city VARCHAR(100),
    no_of_buildings INTEGER,
    building_list_link VARCHAR(255),
    contact_list_link VARCHAR(255),
    owner_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. COWORKING DEVELOPERS TABLE
CREATE TABLE IF NOT EXISTS coworking_developers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    grade VARCHAR(50),
    common_contact VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    website VARCHAR(255),
    linkedin VARCHAR(255),
    head_office_city VARCHAR(100),
    presence_city VARCHAR(100),
    no_of_spaces INTEGER,
    space_list_link VARCHAR(255),
    contact_list_link VARCHAR(255),
    owner_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. WAREHOUSE DEVELOPERS TABLE
CREATE TABLE IF NOT EXISTS warehouse_developers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    grade VARCHAR(50),
    common_contact VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    website VARCHAR(255),
    linkedin VARCHAR(255),
    head_office_city VARCHAR(100),
    presence_city VARCHAR(100),
    no_of_warehouses INTEGER,
    warehouse_list_link VARCHAR(255),
    contact_list_link VARCHAR(255),
    owner_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. MALL DEVELOPERS TABLE
CREATE TABLE IF NOT EXISTS mall_developers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    grade VARCHAR(50),
    common_contact VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    website VARCHAR(255),
    linkedin VARCHAR(255),
    head_office_city VARCHAR(100),
    presence_city VARCHAR(100),
    no_of_malls INTEGER,
    mall_list_link VARCHAR(255),
    contact_list_link VARCHAR(255),
    owner_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. CLIENTS TABLE
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    designation VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    company_contact_no VARCHAR(20),
    alternate_no VARCHAR(20),
    email VARCHAR(255),
    linkedin VARCHAR(255),
    company_name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    city VARCHAR(100) NOT NULL,
    location VARCHAR(255),
    owner_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. DEVELOPER CONTACTS TABLE
CREATE TABLE IF NOT EXISTS developer_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    designation VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    contact_no VARCHAR(20),
    alternate_no VARCHAR(20),
    email VARCHAR(255),
    linkedin VARCHAR(255),
    company_name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    city VARCHAR(100) NOT NULL,
    location VARCHAR(255),
    owner_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. BROKERS TABLE
CREATE TABLE IF NOT EXISTS brokers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    designation VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    contact_no VARCHAR(20),
    alternate_no VARCHAR(20),
    email VARCHAR(255),
    linkedin VARCHAR(255),
    company_name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    city VARCHAR(100) NOT NULL,
    location VARCHAR(255),
    owner_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. INDIVIDUAL OWNERS TABLE
CREATE TABLE IF NOT EXISTS individual_owners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    designation VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    contact_no VARCHAR(20),
    alternate_no VARCHAR(20),
    email VARCHAR(255),
    linkedin VARCHAR(255),
    company_name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    city VARCHAR(100) NOT NULL,
    location VARCHAR(255),
    owner_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. CORPORATE BUILDINGS TABLE
CREATE TABLE IF NOT EXISTS corporate_buildings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    grade VARCHAR(50),
    developer_owner VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    contact_no VARCHAR(20),
    alternate_no VARCHAR(20),
    email VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    landmark VARCHAR(255),
    google_location VARCHAR(255) NOT NULL,
    no_of_floors INTEGER,
    floor_plate_size NUMERIC(10,2),
    rent NUMERIC(18,2),
    cam NUMERIC(18,2),
    amenities TEXT,
    remarks TEXT,
    owner_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. COWORKING SPACES TABLE
CREATE TABLE IF NOT EXISTS coworking_spaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    grade VARCHAR(50),
    developer_owner VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    contact_no VARCHAR(20),
    alternate_no VARCHAR(20),
    email VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    landmark VARCHAR(255),
    google_location VARCHAR(255) NOT NULL,
    no_of_seats INTEGER,
    open_desk_cost NUMERIC(18,2),
    dedicated_desk_cost NUMERIC(18,2),
    setup_fees NUMERIC(18,2),
    amenities TEXT,
    remarks TEXT,
    owner_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. WAREHOUSES TABLE
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    grade VARCHAR(50),
    developer_owner VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    contact_no VARCHAR(20),
    alternate_no VARCHAR(20),
    email VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    landmark VARCHAR(255),
    google_location VARCHAR(255) NOT NULL,
    warehouse_size NUMERIC(18,2),
    rent NUMERIC(18,2),
    cam NUMERIC(18,2),
    amenities TEXT,
    remarks TEXT,
    owner_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. RETAIL MALLS TABLE
CREATE TABLE IF NOT EXISTS retail_malls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    grade VARCHAR(50),
    developer_owner VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    contact_no VARCHAR(20),
    alternate_no VARCHAR(20),
    email VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    landmark VARCHAR(255),
    google_location VARCHAR(255) NOT NULL,
    total_area NUMERIC(18,2),
    efficiency NUMERIC(5,2),
    floor_plate_area NUMERIC(18,2),
    rent NUMERIC(18,2),
    cam NUMERIC(18,2),
    amenities TEXT,
    remarks TEXT,
    owner_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. LAND PARCELS TABLE
CREATE TABLE IF NOT EXISTS land_parcels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    city VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    area NUMERIC(18,2) NOT NULL,
    title VARCHAR(255),
    road_width VARCHAR(50),
    google_location VARCHAR(255) NOT NULL,
    connectivity TEXT,
    advantage TEXT,
    property_card VARCHAR(255),
    survey_title VARCHAR(255),
    dp_remark TEXT,
    document_files TEXT,
    owner_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. PENDING ACTIONS TABLE
CREATE TABLE IF NOT EXISTS pending_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module VARCHAR(50) NOT NULL,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('create','update','delete','bulk_import')),
    target_id UUID,
    payload TEXT NOT NULL,
    requested_by UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    reviewed_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module VARCHAR(50) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    target_id UUID,
    before_payload TEXT,
    after_payload TEXT,
    admin_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    actioned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 18. DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    label VARCHAR(255),
    filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100),
    file_size INTEGER,
    r2_key VARCHAR(255) NOT NULL,
    public_url VARCHAR(255),
    uploaded_by UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_employees_username ON employees(username);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);

CREATE INDEX IF NOT EXISTS idx_leads_company ON leads(client_company);
CREATE INDEX IF NOT EXISTS idx_leads_city ON leads(city);
CREATE INDEX IF NOT EXISTS idx_leads_owner ON leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_assignee ON leads(assignee_id);
CREATE INDEX IF NOT EXISTS idx_leads_inquiry_no ON leads(inquiry_no);

CREATE INDEX IF NOT EXISTS idx_corporate_developers_name ON corporate_developers(name);
CREATE INDEX IF NOT EXISTS idx_corporate_developers_city ON corporate_developers(head_office_city);

CREATE INDEX IF NOT EXISTS idx_pending_actions_status ON pending_actions(status);
CREATE INDEX IF NOT EXISTS idx_pending_actions_module ON pending_actions(module);
CREATE INDEX IF NOT EXISTS idx_pending_actions_requested_by ON pending_actions(requested_by);

CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(module, entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE coworking_developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE mall_developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE individual_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE coworking_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE retail_malls ENABLE ROW LEVEL SECURITY;
ALTER TABLE land_parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES FOR EMPLOYEES
CREATE POLICY "Employees can read all users" ON employees
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage all users" ON employees
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid()::text 
      AND role = 'admin'
    )
  );

-- LEADS POLICIES
CREATE POLICY "Users can read own leads" ON leads
  FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()::text 
    OR assignee_id = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid()::text 
      AND role = 'admin'
    )
  );

CREATE POLICY "Users can create leads" ON leads
  FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid()::text 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all leads" ON leads
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid()::text 
      AND role = 'admin'
    )
  );

-- SIMILAR POLICIES FOR OTHER TABLES
CREATE POLICY "Users can read own data" ON corporate_developers
  FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid()::text 
      AND role = 'admin'
    )
  );

CREATE POLICY "Users can create own data" ON corporate_developers
  FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid()::text 
      AND role = 'admin'
    )
  );

-- REPEAT SIMILAR POLICIES FOR ALL TABLES...

-- PENDING ACTIONS POLICIES
CREATE POLICY "Users can read own pending actions" ON pending_actions
  FOR SELECT TO authenticated
  USING (
    requested_by = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid()::text 
      AND role = 'admin'
    )
  );

CREATE POLICY "Users can create pending actions" ON pending_actions
  FOR INSERT TO authenticated
  WITH CHECK (requested_by = auth.uid()::text);

CREATE POLICY "Admins can update pending actions" ON pending_actions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid()::text 
      AND role = 'admin'
    )
  );

-- AUDIT LOG POLICIES
CREATE POLICY "Admins can read audit log" ON audit_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid()::text 
      AND role = 'admin'
    )
  );

-- DOCUMENTS POLICIES
CREATE POLICY "Users can read documents" ON documents
  FOR SELECT TO authenticated
  USING (
    uploaded_by = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid()::text 
      AND role = 'admin'
    )
  );

CREATE POLICY "Users can upload documents" ON documents
  FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid()::text);