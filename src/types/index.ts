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

export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
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