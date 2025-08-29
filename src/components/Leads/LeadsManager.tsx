import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Eye, Upload, Download, FileText, UserCheck } from 'lucide-react';
import DataTable from '../Common/DataTable';
import Modal from '../Common/Modal';
import { Lead, PendingAction } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { apiGet, apiPost, apiPatch, apiDelete, apiUpload, ApiError } from '../../lib/api';

interface FormData {
  inquiryNo: string;
  inquiryDate: string;
  clientCompany: string;
  contactPerson: string;
  contactNo: string;
  email: string;
  designation: string;
  department: string;
  description: string;
  typeOfPlace: 'Office' | 'Retail' | 'Warehouse' | 'Coworking' | 'Industrial' | 'Land' | 'Other';
  spaceRequirement: string;
  transactionType: 'Lease' | 'Buy' | 'Sell';
  budget: string;
  city: string;
  locationPreference: string;
  firstContactDate: string;
  status: string;
  optionShared: 'Yes' | 'No';
  lastContactDate: string;
  nextActionPlan: string;
  actionDate: string;
  remark: string;
}

const initialFormData: FormData = {
  inquiryNo: '',
  inquiryDate: new Date().toISOString().split('T')[0],
  clientCompany: '',
  contactPerson: '',
  contactNo: '',
  email: '',
  designation: '',
  department: '',
  description: '',
  typeOfPlace: 'Office',
  spaceRequirement: '',
  transactionType: 'Lease',
  budget: '',
  city: '',
  locationPreference: '',
  firstContactDate: '',
  status: 'NEW',
  optionShared: 'No',
  lastContactDate: '',
  nextActionPlan: '',
  actionDate: '',
  remark: '',
};

const LeadsManager: React.FC = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [editingLead, setEditingLead] = useState<any | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [filters, setFilters] = useState({
    q: '',
    city: '',
    type_of_place: '',
    transaction_type: '',
    site_visit_required: '',
    proposal_submitted: '',
    shortlisted: '',
    deal_closed: '',
    owner: 'me',
    page: 1,
    page_size: 50,
  });

  const loadLeads = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiGet('/api/v1/leads', filters);
      if (response.ok && response.data) {
        setLeads(response.data);
      }
    } catch (error) {
      console.error('Failed to load leads:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.clientCompany) newErrors.clientCompany = 'Client Company is required';
    if (!formData.contactPerson) newErrors.contactPerson = 'Contact Person is required';
    if (!formData.contactNo) newErrors.contactNo = 'Contact Number is required';
    if (!formData.email) newErrors.email = 'Email is required';
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
          inquiry_no: formData.inquiryNo,
          inquiry_date: formData.inquiryDate,
          client_company: formData.clientCompany,
          contact_person: formData.contactPerson,
          contact_no: formData.contactNo,
          email: formData.email,
          designation: formData.designation,
          department: formData.department,
          description: formData.description,
          type_of_place: formData.typeOfPlace,
          space_requirement: formData.spaceRequirement,
          transaction_type: formData.transactionType,
          budget: formData.budget ? parseFloat(formData.budget) : null,
          city: formData.city,
          location_preference: formData.locationPreference,
          first_contact_date: formData.firstContactDate || null,
          status: formData.status,
          option_shared: formData.optionShared,
          last_contact_date: formData.lastContactDate || null,
          next_action_plan: formData.nextActionPlan,
          action_date: formData.actionDate || null,
          remark: formData.remark,
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

  const handleEdit = useCallback((lead: any) => {
    setEditingLead(lead);
    setFormData({
      inquiryNo: lead.inquiry_no || '',
      inquiryDate: lead.inquiry_date?.split('T')[0] || '',
      clientCompany: lead.client_company || '',
      contactPerson: lead.contact_person || '',
      contactNo: lead.contact_no || '',
      email: lead.email || '',
      designation: lead.designation || '',
      department: lead.department || '',
      description: lead.description || '',
      typeOfPlace: lead.type_of_place || 'Office',
      spaceRequirement: lead.space_requirement || '',
      transactionType: lead.transaction_type || 'Lease',
      budget: lead.budget?.toString() || '',
      city: lead.city || '',
      locationPreference: lead.location_preference || '',
      firstContactDate: lead.first_contact_date?.split('T')[0] || '',
      status: lead.status || 'NEW',
      optionShared: lead.option_shared || 'No',
      lastContactDate: lead.last_contact_date?.split('T')[0] || '',
      nextActionPlan: lead.next_action_plan || '',
      actionDate: lead.action_date?.split('T')[0] || '',
      remark: lead.remark || '',
    });
    setShowModal(true);
  }, []);

  const handleDelete = useCallback(
    async (lead: any) => {
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

  const handleViewDetails = useCallback((lead: any) => {
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

  const columns = [
    { key: 'inquiry_no', label: 'Inquiry No.', sortable: true },
    { key: 'client_company', label: 'Client Company', sortable: true },
    { key: 'contact_person', label: 'Contact Person', sortable: true },
    { key: 'contact_no', label: 'Contact No.', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { 
      key: 'type_of_place', 
      label: 'Type of Place', 
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
    { key: 'lead_manager_name', label: 'Manager', sortable: true },
    { key: 'created_at', label: 'Created', sortable: true, render: (value: string) => new Date(value).toLocaleDateString() },
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

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="Search leads..."
            />
          </div>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Type of Place</label>
            <select
              value={filters.type_of_place}
              onChange={(e) => setFilters({ ...filters, type_of_place: e.target.value, page: 1 })}
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
        />
      </div>

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
                  value={formData.inquiryNo}
                  onChange={(e) => setFormData({ ...formData, inquiryNo: e.target.value })}
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
                  value={formData.inquiryDate}
                  onChange={(e) => setFormData({ ...formData, inquiryDate: e.target.value })}
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
                  value={formData.clientCompany}
                  onChange={(e) => setFormData({ ...formData, clientCompany: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                    errors.clientCompany ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.clientCompany && (
                  <p className="text-red-500 text-xs mt-1">{errors.clientCompany}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Person *
                </label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                    errors.contactPerson ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.contactPerson && (
                  <p className="text-red-500 text-xs mt-1">{errors.contactPerson}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact No. *
                </label>
                <input
                  type="tel"
                  value={formData.contactNo}
                  onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                    errors.contactNo ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.contactNo && (
                  <p className="text-red-500 text-xs mt-1">{errors.contactNo}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
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
                  Type of Place *
                </label>
                <select
                  value={formData.typeOfPlace}
                  onChange={(e) => setFormData({ ...formData, typeOfPlace: e.target.value as FormData['typeOfPlace'] })}
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
                  value={formData.transactionType}
                  onChange={(e) => setFormData({ ...formData, transactionType: e.target.value as FormData['transactionType'] })}
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
                  Space Requirement
                </label>
                <input
                  type="text"
                  value={formData.spaceRequirement}
                  onChange={(e) => setFormData({ ...formData, spaceRequirement: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  placeholder="e.g., 5000 sq ft"
                />
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
                <p className="text-sm text-gray-900">{selectedLead.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Type of Place</label>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                  selectedLead.type_of_place === 'Office' ? 'bg-blue-100 text-blue-800' :
                  selectedLead.type_of_place === 'Retail' ? 'bg-green-100 text-green-800' :
                  selectedLead.type_of_place === 'Warehouse' ? 'bg-orange-100 text-orange-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {selectedLead.type_of_place}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Budget</label>
                <p className="text-sm text-gray-900">
                  {selectedLead.budget ? `₹${selectedLead.budget.toLocaleString()}` : 'Not specified'}
                </p>
              </div>
            </div>
            
            {selectedLead.description && (
              <div>
                <label className="block text-sm font-medium text-gray-500">Description</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{selectedLead.description}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LeadsManager;