export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  mobile_no?: string;
  role: 'admin' | 'employee';
  status: 'active' | 'inactive';
  created_at: string;
  updated_at?: string;
}

export interface PendingAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  module: 'leads' | 'developers' | 'contacts' | 'projects' | 'inventory' | 'land';
  data: any;
  target_id?: string;
  requested_by: string;
  requested_by_name: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  approved_by?: string;
  approved_by_name?: string;
  updated_at?: string;
}

export interface Lead {
  id: string;
  inquiry_no: string;
  inquiry_date: string;  
  client_company: string;
  contact_person: string;
  contact_no: string;
  email: string;
  designation: string;
  department?: string;
  description?: string;
  type_of_place: 'Office' | 'Retail' | 'Warehouse' | 'Coworking' | 'Industrial' | 'Land' | 'Other';
  space_requirement?: string;
  transaction_type: 'Lease' | 'Buy' | 'Sell';
  budget: number;
  city: string;
  location_preference?: string;
  site_visit_required: 'Yes' | 'No';
  proposal_submitted: 'Yes' | 'No';
  shortlisted: 'Yes' | 'No';
  deal_closed: 'Yes' | 'No';
  owner_id: string;
  assignee_id?: string;
  owner_name?: string;
  assignee_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface ApiFilters {
  q?: string;
  page?: number;
  page_size?: number;
  sort?: string;
  sort_order?: 'asc' | 'desc';
  [key: string]: any;
}

export interface ApiMeta {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface Document {
  id: string;
  entity: string;
  entity_id: string;
  label: string;
  filename: string;
  content_type: string;
  file_size: number;
  r2_key: string;
  public_url?: string;
  uploaded_by: string;
  uploaded_by_name?: string;
  created_at: string;
}

export interface Developer {
  id: string;
  type: 'corporate' | 'coworking' | 'warehouse' | 'mall';
  name: string;
  grade: 'A' | 'B' | 'C';
  contactNo: string;
  emailId: string;
  websiteLink: string;
  linkedinLink?: string;
  hoCity: string;
  presenceCities?: string;
  noOfBuildings?: number;
  noOfCoworking?: number;
  noOfWarehouses?: number;
  noOfMalls?: number;
  buildingListLink?: string;
  contactListLink?: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  type: ContactType;
  companyName?: string;
  industry?: string;
  department?: string;
  developerName?: string;
  contactType?: string;
  individualOwnerName?: string;
  ownerType?: string;
  departmentDesignation?: string;
  firstName: string;
  lastName: string;
  designation?: string;
  contactNo: string;
  alternateNo?: string;
  emailId: string;
  linkedinLink?: string;
  city?: string;
  location?: string;
}

export type ContactType = 'Client' | 'Developer' | 'Individual Owner' | 'Land Acquisition' | 'Others';

export interface LandParcel {
  id: string;
  landParcelName: string;
  location: string;
  city: string;
  googleLocation?: string;
  areaInSqm: number;
  zone: 'Commercial' | 'Residential' | 'Industrial' | 'Mixed Use';
  title: string;
  roadWidth?: string;
  connectivity?: string;
  advantages?: string;
  documents?: Record<string, { uploaded: boolean; fileName: string }>;
  createdAt: string;
}

export interface ProjectMaster {
  id: string;
  type: 'corporate_building' | 'coworking_space' | 'warehouse' | 'retail_mall';
  name: string;
  grade: 'A' | 'B' | 'C';
  developerOwner: string;
  contactNo: string;
  alternateNo?: string;
  email: string;
  city: string;
  location: string;
  landmark?: string;
  googleLocation?: string;
  noOfFloors?: number;
  floorPlate?: string;
  noOfSeats?: number;
  availabilityOfSeats?: number;
  perOpenDeskCost?: number;
  perDedicatedDeskCost?: number;
  setupFees?: number;
  noOfWarehouses?: number;
  warehouseSize?: string;
  totalArea?: string;
  efficiency?: string;
  floorPlateArea?: string;
  rentPerSqft: number;
  camPerSqft: number;
  amenities?: string;
  remark?: string;
  status: 'Active' | 'Inactive' | 'Under Construction';
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  type: 'corporate_building' | 'coworking_space' | 'warehouse' | 'retail_mall';
  name: string;
  grade: 'A' | 'B' | 'C';
  developerOwnerName: string;
  contactNo: string;
  alternateContactNo?: string;
  emailId: string;
  city: string;
  location: string;
  googleLocation?: string;
  saleableArea?: string;
  carpetArea?: string;
  noOfSaleableSeats?: number;
  floor: string;
  height?: string;
  typeOfFlooring?: string;
  flooringSize?: string;
  sideHeight?: string;
  centreHeight?: string;
  canopy?: string;
  fireSprinklers?: string;
  frontage?: string;
  terrace?: string;
  specification: string;
  status: 'Available' | 'Occupied' | 'Under Maintenance';
  rentPerSqft?: number;
  costPerSeat?: number;
  camPerSqft?: number;
  setupFeesInventory?: number;
  agreementPeriod: string;
  lockInPeriod: string;
  noOfCarParks: number;
  createdAt: string;
}

export interface Entity {
  id: string;
  type: 'Project' | 'Property' | 'Site Visit' | 'Task';
  name: string;
  location: string;
  area: string;
  developer: string;
  developerName?: string;
  startDate: string;
  endDate: string;
  status: 'Planning' | 'Ongoing' | 'Completed' | 'On Hold';
  description: string;
  budget?: number;
  createdAt: string;
}

export interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  source: 'Website' | 'Phone' | 'Email' | 'Walk-in';
  status: 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Closed';
  assignedTo?: string;
  assignedToName?: string;
  dateOfEnquiry: string;
  createdAt: string;
}

export interface DashboardStats {
  totalLeads: number;
  totalDevelopers: number;
  activeInventory: number;
  leadsByStatus: { [key: string]: number };
  spaceRequirementChart: { [key: string]: number };
  leadsByCity: { [key: string]: number };
  monthlyLeads: { month: string; count: number }[];
}