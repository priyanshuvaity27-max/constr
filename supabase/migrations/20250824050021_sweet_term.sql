-- Seed data for Real Estate CRM
-- Note: Passwords are bcrypt hashed versions of simple passwords

-- Insert users (1 admin + 5 employees)
-- Password hashes generated with: python -c "from passlib.context import CryptContext; print(CryptContext(schemes=['bcrypt']).hash('password123'))"

INSERT OR IGNORE INTO users (id, username, password, name, email, mobile_no, role, status, created_at) VALUES
('admin-001', 'boss', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXIG/QVr6VLO', 'Admin Boss', 'boss@realestate.com', '+91-9876543210', 'admin', 'active', datetime('now')),
('emp-001', 'emp1', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXIG/QVr6VLO', 'Employee One', 'emp1@realestate.com', '+91-9876543211', 'employee', 'active', datetime('now')),
('emp-002', 'emp2', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXIG/QVr6VLO', 'Employee Two', 'emp2@realestate.com', '+91-9876543212', 'employee', 'active', datetime('now')),
('emp-003', 'emp3', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXIG/QVr6VLO', 'Employee Three', 'emp3@realestate.com', '+91-9876543213', 'employee', 'active', datetime('now')),
('emp-004', 'emp4', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXIG/QVr6VLO', 'Employee Four', 'emp4@realestate.com', '+91-9876543214', 'employee', 'active', datetime('now')),
('emp-005', 'emp5', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXIG/QVr6VLO', 'Employee Five', 'emp5@realestate.com', '+91-9876543215', 'employee', 'active', datetime('now'));

-- Sample leads
INSERT OR IGNORE INTO leads (
  id, inquiry_no, inquiry_date, client_company, contact_person, contact_no, email,
  designation, type_of_place, space_requirement, transaction_type, budget, city,
  location_preference, owner_id, created_at
) VALUES
('lead-001', 'LEAD-20250101001', '2025-01-01', 'ABC Corporation', 'John Smith', '+91-9876543220', 'john@abc.com', 'Manager', 'Office', '5000 sq ft', 'Lease', 5000000, 'Mumbai', 'Andheri East', 'emp-001', datetime('now')),
('lead-002', 'LEAD-20250101002', '2025-01-02', 'XYZ Retail', 'Sarah Johnson', '+91-9876543221', 'sarah@xyz.com', 'Director', 'Retail', '2000 sq ft', 'Buy', 3000000, 'Pune', 'Koregaon Park', 'emp-002', datetime('now')),
('lead-003', 'LEAD-20250101003', '2025-01-03', 'Tech Solutions', 'Mike Wilson', '+91-9876543222', 'mike@tech.com', 'CEO', 'Office', '8000 sq ft', 'Lease', 8000000, 'Bangalore', 'Whitefield', 'emp-003', datetime('now'));

-- Sample developers
INSERT OR IGNORE INTO developers (
  id, type, name, grade, contact_no, email_id, website_link, linkedin_link,
  ho_city, presence_cities, no_of_buildings, owner_id, created_at
) VALUES
('dev-001', 'corporate', 'DLF Limited', 'A', '+91-9876543230', 'contact@dlf.com', 'https://www.dlf.in', 'https://linkedin.com/company/dlf', 'Delhi', 'Delhi,Mumbai,Bangalore,Chennai', 150, 'admin-001', datetime('now')),
('dev-002', 'coworking', 'WeWork India', 'A', '+91-9876543231', 'contact@wework.com', 'https://www.wework.com/en-IN', 'https://linkedin.com/company/wework', 'Mumbai', 'Mumbai,Delhi,Bangalore,Pune', 45, 'admin-001', datetime('now'));

-- Sample projects
INSERT OR IGNORE INTO projects (
  id, type, name, grade, developer_owner, contact_no, email, city, location,
  no_of_floors, floor_plate, rent_per_sqft, cam_per_sqft, amenities, status, owner_id, created_at
) VALUES
('proj-001', 'corporate_building', 'DLF Cyber City', 'A', 'DLF Limited', '+91-9876543240', 'leasing@dlf.com', 'Gurgaon', 'Cyber City', 25, '25000 sq ft', 85.0, 15.0, 'Parking, Security, Power Backup, Cafeteria', 'Active', 'admin-001', datetime('now'));

-- Sample inventory
INSERT OR IGNORE INTO inventory (
  id, type, name, grade, developer_owner_name, contact_no, email_id, city, location,
  saleable_area, carpet_area, floor, specification, status, rent_per_sqft, cam_per_sqft,
  agreement_period, lock_in_period, no_of_car_parks, owner_id, created_at
) VALUES
('inv-001', 'corporate_building', 'Tower A - Floor 15', 'A', 'DLF Limited', '+91-9876543250', 'leasing@dlf.com', 'Gurgaon', 'Cyber City', '5000 sq ft', '4200 sq ft', '15th Floor', 'Fully furnished office space with modern amenities', 'Available', 85.0, 15.0, '3 years', '1 year', 10, 'admin-001', datetime('now'));

-- Sample land parcels
INSERT OR IGNORE INTO land_parcels (
  id, land_parcel_name, location, city, google_location, area_in_sqm, zone, title,
  road_width, connectivity, advantages, documents, owner_id, created_at
) VALUES
('land-001', 'Panvel Commercial Plot', 'Panvel', 'Navi Mumbai', 'https://maps.google.com/panvel', 5000, 'Commercial', 'Clear Title', '60 feet', 'Highway access, Metro connectivity', 'Prime location, good infrastructure', '{"propertyCard":{"uploaded":true,"fileName":"property_card_001.pdf"}}', 'admin-001', datetime('now'));

-- Sample contacts
INSERT OR IGNORE INTO contacts (
  id, type, company_name, industry, first_name, last_name, designation, contact_no,
  email_id, linkedin_link, city, location, owner_id, created_at
) VALUES
('contact-001', 'Client', 'Tech Solutions Pvt Ltd', 'Technology', 'Vikram', 'Mehta', 'CEO', '+91-9876543260', 'vikram@techsolutions.com', 'https://linkedin.com/in/vikram-mehta', 'Mumbai', 'Powai', 'emp-001', datetime('now')),
('contact-002', 'Developer', 'Godrej Properties', 'Real Estate', 'Ravi', 'Gupta', 'Project Manager', '+91-9876543261', 'ravi@godrej.com', 'https://linkedin.com/in/ravi-gupta', 'Mumbai', 'Vikhroli', 'emp-002', datetime('now'));