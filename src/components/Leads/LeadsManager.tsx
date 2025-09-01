import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Eye, Upload, Download, UserCheck, Filter, Search } from 'lucide-react';
import DataTable from '../Common/DataTable';
import Modal from '../Common/Modal';
import { useAuth } from '../../context/AuthContext';
import { apiGet, apiPost, apiPatch, apiDelete, apiUpload, ApiError } from '../../lib/api';

interface Lead {
  id: string;
  inquiry_no: string;
  inquiry_date: string;
  client_company: string;
  contact_person: string;
  contact_no: string;
  email?: string;
  designation?: string;
  department?: string;
  type_of_space?: string;
  space_requirement: string;
  transaction_type?: string;
  representative?: string;
  budget?: number;
  city: string;
  location_preference?: string;
  description?: string;
  first_contact_date?: string;
  last_contact_date?: string;
  lead_managed_by?: string;
  action_date?: string;
  status?: string;
  next_action_plan?: string;
  option_shared?: boolean;
  remarks?: string;
  owner_id?: string;
  assignee_id?: string;
  owner_name?: string;
  assignee_name?: string;
  created_at: string;
  updated_at?: string;
}

interface FormData {
  inquiry_no: string;
  inquiry_date: string;
  client_company: string;
  contact_person: string;
  contact_no: string;
  email: string;
  designation: string;
  department: string;
  type_of_space: string;
  space_requirement: string;
  transaction_type: string;
  representative: string;
  budget: string;
  city: string;
  location_preference: string;
  description: string;
  first_contact_date: string;
  last_contact_date: string;
  lead_managed_by: string;
  action_date: string;
  status: string;
  next_action_plan: string;
  option_shared: boolean;
  remarks: string;
}

const initialFormData: FormData = {
  inquiry_no: '',
  inquiry_date: new Date().toISOString().split('T')[0],
  client_company: '',
  contact_person: '',
  contact_no: '',
  email: '',
  designation: '',
  department: '',
  type_of_space: 'Office',
  space_requirement: '',
  transaction_type: 'Lease',
  representative: '',
  budget: '',
  city: '',
  location_preference: '',
  description: '',
  first_contact_date: '',
  last_contact_date: '',
  lead_managed_by: '',
  action_date: '',
  status: 'new',
  next_action_plan: '',
  option_shared: false,
  remarks: '',
};

const LeadsManager: React.FC = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [filters, setFilters] = useState({
    q: '',
    city: '',
    type_of_space: '',
    transaction_type: '',
    status: '',
    owner: 'me',
    page: 1,
    page_size: 50,
    sort: 'created_at',
    sort_order: 'desc'
  });
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    page_size: 50,
    total_pages: 0
  });

  const loadLeads = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiGet<Lead[]>('/api/v1/leads', filters);
      if (response.ok && response.data) {
        setLeads(response.data);
        if (response.meta) {
          setMeta(response.meta);
        }
      }
    } catch (error) {
      console.error('Failed to load leads:', error);
      if (error instanceof ApiError) {
        alert(`Failed to load leads: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    
    if (!formData.client_company.trim()) {
      newErrors.client_company = 'Client Company is required';
    }
    if (!formData.contact_person.trim()) {
      newErrors.contact_person = 'Contact Person is required';
    }
    if (!formData.contact_no.trim()) {
      newErrors.contact_no = 'Contact Number is required';
    }
    if (!formData.space_requirement.trim()) {
      newErrors.space_requirement = 'Space Requirement is required';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (formData.budget && isNaN(parseFloat(formData.budget))) {
      newErrors.budget = 'Budget must be a valid number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const resetForm = useCallback(() => {
    setEditingLead(null);
    setFormData(initialFormData);
    setErrors({});
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validateForm()) return;

      try {
        const leadData = {
          inquiry_no: formData.inquiry_no || undefined,
          inquiry_date: formData.inquiry_date,
          client_company: formData.client_company,
          contact_person: formData.contact_person,
          contact_no: formData.contact_no,
          email: formData.email || undefined,
          designation: formData.designation || undefined,
          department: formData.department || undefined,
          type_of_space: formData.type_of_space,
          space_requirement: formData.space_requirement,
          transaction_type: formData.transaction_type,
          representative: formData.representative || undefined,
          budget: formData.budget ? parseFloat(formData.budget) : undefined,
          city: formData.city,
          location_preference: formData.location_preference || undefined,
          description: formData.description || undefined,
          first_contact_date: formData.first_contact_date || undefined,
          last_contact_date: formData.last_contact_date || undefined,
          lead_managed_by: formData.lead_managed_by || undefined,
          action_date: formData.action_date || undefined,
          status: formData.status,
          next_action_plan: formData.next_action_plan || undefined,
          option_shared: formData.option_shared,
          remarks: formData.remarks || undefined,
        };

        if (editingLead) {
          await apiPatch(`/api/v1/leads/${editingLead.id}`, leadData);
        } else {
          await apiPost('/api/v1/leads', leadData);
        }

        await loadLeads();
        resetForm();
        setShowModal(false);
        alert(editingLead ? 'Lead updated successfully!' : 'Lead created successfully!');
      } catch (error) {
        if (error instanceof ApiError && error.code === 'PENDING_APPROVAL') {
          alert('Your request has been sent to admin for approval.');
          resetForm();
          setShowModal(false);
        } else {
          console.error('Failed to save lead:', error);
          alert('Failed to save lead. Please try again.');
        }
      }
    },
    [formData, editingLead, loadLeads, resetForm, validateForm]
  );

  const handleEdit = useCallback((lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      inquiry_no: lead.inquiry_no || '',
      inquiry_date: lead.inquiry_date?.split('T')[0] || '',
      client_company: lead.client_company || '',
      contact_person: lead.contact_person || '',
      contact_no: lead.contact_no || '',
      email: lead.email || '',
      designation: lead.designation || '',
      department: lead.department || '',
      type_of_space: lead.type_of_space || 'Office',
      space_requirement: lead.space_requirement || '',
      transaction_type: lead.transaction_type || 'Lease',
      representative: lead.representative || '',
      budget: lead.budget?.toString() || '',
      city: lead.city || '',
      location_preference: lead.location_preference || '',
      description: lead.description || '',
      first_contact_date: lead.first_contact_date?.split('T')[0] || '',
      last_contact_date: lead.last_contact_date?.split('T')[0] || '',
      lead_managed_by: lead.lead_managed_by || '',
      action_date: lead.action_date?.split('T')[0] || '',
      status: lead.status || 'new',
      next_action_plan: lead.next_action_plan || '',
      option_shared: lead.option_shared || false,
      remarks: lead.remarks || '',
    });
    setShowModal(true);
  }, []);

  const handleDelete = useCallback(
    async (lead: Lead) => {
      if (!window.confirm('Are you sure you want to delete this lead?')) return;

      try {
        await apiDelete(`/api/v1/leads/${lead.id}`);
        await loadLeads();
        alert('Lead deleted successfully!');
      } catch (error) {
        if (error instanceof ApiError && error.code === 'PENDING_APPROVAL') {
          alert('Delete request sent to admin for approval.');
        } else {
          console.error('Failed to delete lead:', error);
          alert('Failed to delete lead. Please try again.');
        }
      }
    },
    [loadLeads]
  );

  const handleViewDetails = useCallback((lead: Lead) => {
    setSelectedLead(lead);
    setShowDetailsModal(true);
  }, []);

  const handleExport = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams({ ...filters, format: 'csv' });
      const response = await fetch(`${API_BASE}/api/v1/leads?${queryParams}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'leads.csv';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  }, [filters]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await apiUpload('/api/v1/leads/import', formData);

        if (response.ok) {
          await loadLeads();
          alert(`Import completed! ${response.data?.details?.created || 0} leads created.`);
          if (response.data?.details?.errors?.length > 0) {
            console.warn('Import errors:', response.data.details.errors);
          }
        }
      } catch (error) {
        console.error('Import failed:', error);
        alert('Import failed. Please try again.');
      }
    };
    input.click();
  }, [loadLeads]);

  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  const columns = [
    { key: 'inquiry_no', label: 'Inquiry No.', sortable: true },
    { key: 'client_company', label: 'Client Company', sortable: true },
    { key: 'contact_person', label: 'Contact Person', sortable: true },
    { key: 'contact_no', label: 'Contact No.', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { 
      key: 'type_of_space', 
      label: 'Type of Space', 
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          value === 'Office' ? 'bg-blue-100 text-blue-800' :
          value === 'Retail' ? 'bg-green-100 text-green-800' :
          value === 'Warehouse' ? 'bg-orange-100 text-orange-800' :
          'bg-purple-100 text-purple-800'
        }`}>
          {value}
        </span>
      )
    },
    { 
      key: 'transaction_type', 
      label: 'Transaction Type', 
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          value === 'Lease' ? 'bg-blue-100 text-blue-800' :
          value === 'Buy' ? 'bg-green-100 text-green-800' :
          'bg-orange-100 text-orange-800'
        }`}>
          {value}
        </span>
      )
    },
    { 
      key: 'budget', 
      label: 'Budget', 
      sortable: true,
      render: (value: number) => value ? `₹${value.toLocaleString()}` : '-'
    },
    { key: 'city', label: 'City', sortable: true },
    { key: 'owner_name', label: 'Owner', sortable: true },
    { key: 'assignee_name', label: 'Assignee', sortable: true },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          value === 'new' ? 'bg-blue-100 text-blue-800' :
          value === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
          value === 'qualified' ? 'bg-green-100 text-green-800' :
          value === 'closed_won' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          {value}
        </span>
      )
    },
    { 
      key: 'created_at', 
      label: 'Created', 
      sortable: true, 
      render: (value: string) => new Date(value).toLocaleDateString() 
    },
  ];

  const actions = [
    {
      label: 'View Details',
      icon: Eye,
      onClick: handleViewDetails,
      variant: 'secondary' as const,
    },
    {
      label: 'Edit',
      icon: Edit,
      onClick: handleEdit,
      variant: 'primary' as const,
    },
    {
      label: 'Delete',
      icon: Trash2,
      onClick: handleDelete,
      variant: 'danger' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-blue-600" />
            Lead Tracker
          </h1>
          <p className="text-base text-gray-600">Manage and track your sales leads</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowFiltersModal(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>
          {user?.role === 'admin' && (
            <button
              onClick={handleImport}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 transition-colors"
            >
              <Upload className="h-4 w-4" />
              <span>Import</span>
            </button>
          )}
          <button
            onClick={handleExport}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Quick Search */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value, page: 1 })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="Search leads by company, contact person, email, or inquiry number..."
            />
          </div>
          <select
            value={filters.owner}
            onChange={(e) => setFilters({ ...filters, owner: e.target.value, page: 1 })}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="me">My Leads</option>
            {user?.role === 'admin' && <option value="all">All Leads</option>}
          </select>
        </div>
      </div>

      <div className="overflow-hidden">
        <DataTable
          data={leads}
          columns={columns}
          actions={actions}
          searchable={false}
          exportable={false}
          importable={false}
          title="Leads"
          loading={loading}
          meta={meta}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Filters Modal */}
      <Modal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        title="Advanced Filters"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value, page: 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="Filter by city..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type of Space</label>
              <select
                value={filters.type_of_space}
                onChange={(e) => setFilters({ ...filters, type_of_space: e.target.value, page: 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Types</option>
                <option value="Office">Office</option>
                <option value="Retail">Retail</option>
                <option value="Warehouse">Warehouse</option>
                <option value="Coworking">Coworking</option>
                <option value="Industrial">Industrial</option>
                <option value="Land">Land</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
              <select
                value={filters.transaction_type}
                onChange={(e) => setFilters({ ...filters, transaction_type: e.target.value, page: 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Types</option>
                <option value="Lease">Lease</option>
                <option value="Buy">Buy</option>
                <option value="Sell">Sell</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="proposal_sent">Proposal Sent</option>
                <option value="negotiation">Negotiation</option>
                <option value="closed_won">Closed Won</option>
                <option value="closed_lost">Closed Lost</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => {
                setFilters({
                  q: '',
                  city: '',
                  type_of_space: '',
                  transaction_type: '',
                  status: '',
                  owner: 'me',
                  page: 1,
                  page_size: 50,
                  sort: 'created_at',
                  sort_order: 'desc'
                });
                setShowFiltersModal(false);
              }}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Clear Filters
            </button>
            <button
              onClick={() => setShowFiltersModal(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </Modal>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingLead ? 'Edit Lead' : 'Add New Lead'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inquiry No.
                </label>
                <input
                  type="text"
                  value={formData.inquiry_no}
                  onChange={(e) => setFormData({ ...formData, inquiry_no: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Auto-generated if empty"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inquiry Date *
                </label>
                <input
                  type="date"
                  value={formData.inquiry_date}
                  onChange={(e) => setFormData({ ...formData, inquiry_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Company *
                </label>
                <input
                  type="text"
                  value={formData.client_company}
                  onChange={(e) => setFormData({ ...formData, client_company: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                    errors.client_company ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.client_company && (
                  <p className="text-red-500 text-xs mt-1">{errors.client_company}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Person *
                </label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                    errors.contact_person ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.contact_person && (
                  <p className="text-red-500 text-xs mt-1">{errors.contact_person}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact No. *
                </label>
                <input
                  type="tel"
                  value={formData.contact_no}
                  onChange={(e) => setFormData({ ...formData, contact_no: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                    errors.contact_no ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.contact_no && (
                  <p className="text-red-500 text-xs mt-1">{errors.contact_no}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-900 mb-4">Requirements</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type of Space *
                </label>
                <select
                  value={formData.type_of_space}
                  onChange={(e) => setFormData({ ...formData, type_of_space: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  required
                >
                  <option value="Office">Office</option>
                  <option value="Retail">Retail</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="Coworking">Coworking</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Land">Land</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Type *
                </label>
                <select
                  value={formData.transaction_type}
                  onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  required
                >
                  <option value="Lease">Lease</option>
                  <option value="Buy">Buy</option>
                  <option value="Sell">Sell</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Space Requirement *
                </label>
                <input
                  type="text"
                  value={formData.space_requirement}
                  onChange={(e) => setFormData({ ...formData, space_requirement: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm ${
                    errors.space_requirement ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 5000 sq ft"
                  required
                />
                {errors.space_requirement && (
                  <p className="text-red-500 text-xs mt-1">{errors.space_requirement}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget
                </label>
                <input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm ${
                    errors.budget ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter budget amount"
                />
                {errors.budget && (
                  <p className="text-red-500 text-xs mt-1">{errors.budget}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm ${
                    errors.city ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.city && (
                  <p className="text-red-500 text-xs mt-1">{errors.city}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal_sent">Proposal Sent</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="closed_won">Closed Won</option>
                  <option value="closed_lost">Closed Lost</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowFiltersModal(false)}
              className="px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setShowFiltersModal(false)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all text-sm font-medium"
            >
              Apply Filters
            </button>
          </div>
        </form>
      </Modal>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingLead ? 'Edit Lead' : 'Add New Lead'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inquiry No.
                </label>
                <input
                  type="text"
                  value={formData.inquiry_no}
                  onChange={(e) => setFormData({ ...formData, inquiry_no: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Auto-generated if empty"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inquiry Date *
                </label>
                <input
                  type="date"
                  value={formData.inquiry_date}
                  onChange={(e) => setFormData({ ...formData, inquiry_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Company *
                </label>
                <input
                  type="text"
                  value={formData.client_company}
                  onChange={(e) => setFormData({ ...formData, client_company: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                    errors.client_company ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.client_company && (
                  <p className="text-red-500 text-xs mt-1">{errors.client_company}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Person *
                </label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                    errors.contact_person ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.contact_person && (
                  <p className="text-red-500 text-xs mt-1">{errors.contact_person}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact No. *
                </label>
                <input
                  type="tel"
                  value={formData.contact_no}
                  onChange={(e) => setFormData({ ...formData, contact_no: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                    errors.contact_no ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.contact_no && (
                  <p className="text-red-500 text-xs mt-1">{errors.contact_no}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-900 mb-4">Requirements</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type of Space *
                </label>
                <select
                  value={formData.type_of_space}
                  onChange={(e) => setFormData({ ...formData, type_of_space: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  required
                >
                  <option value="Office">Office</option>
                  <option value="Retail">Retail</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="Coworking">Coworking</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Land">Land</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Type *
                </label>
                <select
                  value={formData.transaction_type}
                  onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  required
                >
                  <option value="Lease">Lease</option>
                  <option value="Buy">Buy</option>
                  <option value="Sell">Sell</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Space Requirement *
                </label>
                <input
                  type="text"
                  value={formData.space_requirement}
                  onChange={(e) => setFormData({ ...formData, space_requirement: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm ${
                    errors.space_requirement ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 5000 sq ft"
                  required
                />
                {errors.space_requirement && (
                  <p className="text-red-500 text-xs mt-1">{errors.space_requirement}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget
                </label>
                <input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm ${
                    errors.budget ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter budget amount"
                />
                {errors.budget && (
                  <p className="text-red-500 text-xs mt-1">{errors.budget}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm ${
                    errors.city ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.city && (
                  <p className="text-red-500 text-xs mt-1">{errors.city}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal_sent">Proposal Sent</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="closed_won">Closed Won</option>
                  <option value="closed_lost">Closed Lost</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all text-sm font-medium"
            >
              {editingLead ? 'Update Lead' : 'Create Lead'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Lead Details"
        size="xl"
      >
        {selectedLead && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Inquiry No.</label>
                <p className="text-sm text-gray-900 font-medium">{selectedLead.inquiry_no}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Client Company</label>
                <p className="text-sm text-gray-900">{selectedLead.client_company}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Contact Person</label>
                <p className="text-sm text-gray-900">{selectedLead.contact_person}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Email</label>
                <p className="text-sm text-gray-900">{selectedLead.email || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Type of Space</label>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                  selectedLead.type_of_space === 'Office' ? 'bg-blue-100 text-blue-800' :
                  selectedLead.type_of_space === 'Retail' ? 'bg-green-100 text-green-800' :
                  selectedLead.type_of_space === 'Warehouse' ? 'bg-orange-100 text-orange-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {selectedLead.type_of_space}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Budget</label>
                <p className="text-sm text-gray-900">
                  {selectedLead.budget ? `₹${selectedLead.budget.toLocaleString()}` : 'Not specified'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">City</label>
                <p className="text-sm text-gray-900">{selectedLead.city}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                  selectedLead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                  selectedLead.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                  selectedLead.status === 'qualified' ? 'bg-green-100 text-green-800' :
                  selectedLead.status === 'closed_won' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {selectedLead.status}
                </span>
              </div>
            </div>
            
            {selectedLead.description && (
              <div>
                <label className="block text-sm font-medium text-gray-500">Description</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{selectedLead.description}</p>
              </div>
            )}

            {selectedLead.remarks && (
              <div>
                <label className="block text-sm font-medium text-gray-500">Remarks</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{selectedLead.remarks}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LeadsManager;