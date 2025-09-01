/*
  # Seed Initial Data for Real Estate CRM

  This migration seeds the database with:
  1. Initial admin and employee accounts
  2. Sample data for testing
  
  Note: Passwords are hashed with bcrypt
  Default password for all accounts: "password123"
*/

-- Insert initial employees (1 admin + 5 employees)
-- Password hash for "password123": $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXIG/QVr6VLO

INSERT INTO employees (id, username, email, password_hash, name, role, status, created_at) VALUES
('admin-001', 'boss', 'boss@realestate.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXIG/QVr6VLO', 'Admin Boss', 'admin', 'active', NOW()),
('emp-001', 'emp1', 'emp1@realestate.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXIG/QVr6VLO', 'Employee One', 'employee', 'active', NOW()),
('emp-002', 'emp2', 'emp2@realestate.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXIG/QVr6VLO', 'Employee Two', 'employee', 'active', NOW()),
('emp-003', 'emp3', 'emp3@realestate.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXIG/QVr6VLO', 'Employee Three', 'employee', 'active', NOW()),
('emp-004', 'emp4', 'emp4@realestate.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXIG/QVr6VLO', 'Employee Four', 'employee', 'active', NOW()),
('emp-005', 'emp5', 'emp5@realestate.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXIG/QVr6VLO', 'Employee Five', 'employee', 'active', NOW())
ON CONFLICT (username) DO NOTHING;

-- Sample leads
INSERT INTO leads (
  id, inquiry_no, inquiry_date, client_company, contact_person, contact_no, email,
  designation, type_of_space, space_requirement, transaction_type, budget, city,
  location_preference, owner_id, created_at
) VALUES
('lead-001', 'LEAD-20250101001', '2025-01-01', 'ABC Corporation', 'John Smith', '+91-9876543220', 'john@abc.com', 'Manager', 'Office', '5000 sq ft', 'Lease', 5000000, 'Mumbai', 'Andheri East', 'emp-001', NOW()),
('lead-002', 'LEAD-20250101002', '2025-01-02', 'XYZ Retail', 'Sarah Johnson', '+91-9876543221', 'sarah@xyz.com', 'Director', 'Retail', '2000 sq ft', 'Buy', 3000000, 'Pune', 'Koregaon Park', 'emp-002', NOW()),
('lead-003', 'LEAD-20250101003', '2025-01-03', 'Tech Solutions', 'Mike Wilson', '+91-9876543222', 'mike@tech.com', 'CEO', 'Office', '8000 sq ft', 'Lease', 8000000, 'Bangalore', 'Whitefield', 'emp-003', NOW())
ON CONFLICT (inquiry_no) DO NOTHING;

-- Sample corporate developers
INSERT INTO corporate_developers (
  id, name, grade, common_contact, email, website, linkedin,
  head_office_city, presence_city, no_of_buildings, owner_id, created_at
) VALUES
('corp-dev-001', 'DLF Limited', 'A', '+91-9876543230', 'contact@dlf.com', 'https://www.dlf.in', 'https://linkedin.com/company/dlf', 'Delhi', 'Delhi,Mumbai,Bangalore,Chennai', 150, 'admin-001', NOW()),
('corp-dev-002', 'Godrej Properties', 'A', '+91-9876543231', 'contact@godrej.com', 'https://www.godrejproperties.com', 'https://linkedin.com/company/godrej-properties', 'Mumbai', 'Mumbai,Pune,Bangalore,Hyderabad', 85, 'admin-001', NOW())
ON CONFLICT (id) DO NOTHING;

-- Sample coworking developers
INSERT INTO coworking_developers (
  id, name, grade, common_contact, email, website, linkedin,
  head_office_city, presence_city, no_of_spaces, owner_id, created_at
) VALUES
('cow-dev-001', 'WeWork India', 'A', '+91-9876543240', 'contact@wework.com', 'https://www.wework.com/en-IN', 'https://linkedin.com/company/wework', 'Mumbai', 'Mumbai,Delhi,Bangalore,Pune', 45, 'admin-001', NOW()),
('cow-dev-002', 'Awfis Space Solutions', 'B', '+91-9876543241', 'contact@awfis.com', 'https://www.awfis.com', 'https://linkedin.com/company/awfis', 'Delhi', 'Delhi,Mumbai,Bangalore,Hyderabad', 120, 'admin-001', NOW())
ON CONFLICT (id) DO NOTHING;

-- Sample clients
INSERT INTO clients (
  id, first_name, last_name, designation, company_contact_no, email,
  company_name, industry, city, location, owner_id, created_at
) VALUES
('client-001', 'Vikram', 'Mehta', 'CEO', '+91-9876543250', 'vikram@techsolutions.com', 'Tech Solutions Pvt Ltd', 'Technology', 'Mumbai', 'Powai', 'emp-001', NOW()),
('client-002', 'Priya', 'Sharma', 'Director', '+91-9876543251', 'priya@retailcorp.com', 'Retail Corp', 'Retail', 'Delhi', 'Connaught Place', 'emp-002', NOW())
ON CONFLICT (id) DO NOTHING;

-- Sample corporate buildings
INSERT INTO corporate_buildings (
  id, name, grade, developer_owner, contact_no, email, city, location,
  google_location, no_of_floors, floor_plate_size, rent, cam, amenities, owner_id, created_at
) VALUES
('corp-bld-001', 'DLF Cyber City Tower A', 'A', 'DLF Limited', '+91-9876543260', 'leasing@dlf.com', 'Gurgaon', 'Cyber City', 'https://maps.google.com/dlf-cyber-city', 25, 25000, 85.0, 15.0, 'Parking, Security, Power Backup, Cafeteria', 'admin-001', NOW()),
('corp-bld-002', 'Godrej BKC Tower', 'A', 'Godrej Properties', '+91-9876543261', 'leasing@godrej.com', 'Mumbai', 'Bandra Kurla Complex', 'https://maps.google.com/godrej-bkc', 30, 30000, 120.0, 20.0, 'Premium Amenities, Metro Connectivity', 'admin-001', NOW())
ON CONFLICT (id) DO NOTHING;

-- Sample land parcels
INSERT INTO land_parcels (
  id, name, type, city, location, area, title, road_width,
  google_location, connectivity, advantage, owner_id, created_at
) VALUES
('land-001', 'Panvel Commercial Plot', 'Commercial', 'Navi Mumbai', 'Panvel', 5000, 'Clear Title', '60 feet', 'https://maps.google.com/panvel', 'Highway access, Metro connectivity', 'Prime location, good infrastructure', 'admin-001', NOW()),
('land-002', 'Pune IT Park Land', 'Commercial', 'Pune', 'Hinjewadi', 8000, 'Clear Title', '80 feet', 'https://maps.google.com/hinjewadi', 'IT corridor, Metro planned', 'IT hub, high appreciation potential', 'admin-001', NOW())
ON CONFLICT (id) DO NOTHING;