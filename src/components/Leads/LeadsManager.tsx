import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, FileText, Download, Upload } from 'lucide-react';
import DataTable from '../Common/DataTable';
import Modal from '../Common/Modal';
import { Lead, User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { exportToCSV, downloadTemplate } from '../../utils/exportUtils';

const LeadsManager: React.FC = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [formData, setFormData] = useState({
    inquiryNo: '',
    inquiryDate: '',
    clientCompany: '',
    contactPerson: '',
    contactNo: '',
    email: '',
    designation: '',
    department: '',
    description: '',
    typeOfPlace: 'Office' as Lead['typeOfPlace'],
    spaceRequirement: '',
    transactionType: 'Lease' as Lead['transactionType'],
    budget: '',
    city: '',
    locationPreference: '',
    firstContactDate: '',
    leadManagedBy: '',
    status: 'New' as Lead['status'],
    optionShared: 'No' as Lead['optionShared'],
    lastContactDate: '',
    nextActionPlan: '',
    actionDate: '',
    remark: ''
  });

  useEffect(() => {
    loadLeads();
    loadUsers();
  }, [user]);

  const loadLeads = () => {
    const storedLeads: Lead[] = JSON.parse(localStorage.getItem('leads') || '[]');
    const filteredLeads = user?.role === 'admin'
      ? storedLeads
      : storedLeads.filter(lead => lead.leadManagedBy === user?.id);
    setLeads(filteredLeads);
  };

  const loadUsers = () => {
    const storedUsers: User[] = JSON.parse(localStorage.getItem('users') || '[]');
    setUsers(storedUsers.filter(u => u.status === 'active'));
  };

  const generateInquiryNo = () => {
    const count = leads.length + 1;
    return `LEAD-${count.toString().padStart(3, '0')}`;
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.inquiryDate) newErrors.inquiryDate = 'Inquiry Date is required';
    if (!formData.clientCompany) newErrors.clientCompany = 'Client Company is required';
    if (!formData.contactPerson) newErrors.contactPerson = 'Contact Person is required';
    if (!formData.contactNo || !/^\d{10}$/.test(formData.contactNo)) newErrors.contactNo = 'Valid 10-digit contact number is required';
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Valid email is required';
    if (!formData.typeOfPlace) newErrors.typeOfPlace = 'Type of Place is required';
    if (!formData.transactionType) newErrors.transactionType = 'Transaction Type is required';
    if (!formData.leadManagedBy) newErrors.leadManagedBy = 'Lead Manager is required';
    if (!formData.status) newErrors.status = 'Status is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const allLeads: Lead[] = JSON.parse(localStorage.getItem('leads') || '[]');
    const assignedUser = users.find(u => u.id === formData.leadManagedBy);

    const leadData = {
      ...formData,
      leadManagerName: assignedUser?.name || '',
      budget: formData.budget ? parseFloat(formData.budget) : undefined
    };

    if (editingLead) {
      const updatedLeads = allLeads.map(lead =>
        lead.id === editingLead.id ? { ...lead, ...leadData } : lead
      );
      localStorage.setItem('leads', JSON.stringify(updatedLeads));
      setLeads(updatedLeads);
    } else {
      const newLead: Lead = {
        id: Date.now().toString(),
        ...leadData,
        inquiryNo: formData.inquiryNo || generateInquiryNo(),
        createdAt: new Date().toISOString().split('T')[0]
      };
      allLeads.push(newLead);
      localStorage.setItem('leads', JSON.stringify(allLeads));
      setLeads(allLeads);
    }

    resetForm();
    setShowModal(false);
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      inquiryNo: lead.inquiryNo,
      inquiryDate: lead.inquiryDate,
      clientCompany: lead.clientCompany,
      contactPerson: lead.contactPerson,
      contactNo: lead.contactNo,
      email: lead.email,
      designation: lead.designation || '',
      department: lead.department || '',
      description: lead.description || '',
      typeOfPlace: lead.typeOfPlace,
      spaceRequirement: lead.spaceRequirement || '',
      transactionType: lead.transactionType,
      budget: lead.budget?.toString() || '',
      city: lead.city || '',
      locationPreference: lead.locationPreference || '',
      firstContactDate: lead.firstContactDate || '',
      leadManagedBy: lead.leadManagedBy,
      status: lead.status,
      optionShared: lead.optionShared,
      lastContactDate: lead.lastContactDate || '',
      nextActionPlan: lead.nextActionPlan || '',
      actionDate: lead.actionDate || '',
      remark: lead.remark || ''
    });
    setShowModal(true);
  };

  const handleDelete = (lead: Lead) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      const allLeads: Lead[] = JSON.parse(localStorage.getItem('leads') || '[]');
      const updatedLeads = allLeads.filter(l => l.id !== lead.id);
      localStorage.setItem('leads', JSON.stringify(updatedLeads));
      setLeads(updatedLeads);
    }
  };

  const handleViewDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setShowDetailsModal(true);
  };

  const resetForm = () => {
    setFormData({
      inquiryNo: '',
      inquiryDate: '',
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
      leadManagedBy: '',
      status: 'New',
      optionShared: 'No',
      lastContactDate: '',
      nextActionPlan: '',
      actionDate: '',
      remark: ''
    });
    setEditingLead(null);
    setErrors({});
  };

  const handleExport = () => {
    exportToCSV(leads, 'leads.csv');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const csv = e.target?.result as string;
          const lines = csv.split('\n').filter(line => line.trim());
          const headers = lines[0].split(',');

          const importedLeads = lines.slice(1).map(line => {
            const values = line.split(',');
            const lead: Partial<Lead> = {};
            headers.forEach((header, index) => {
              const key = header.trim() as keyof Lead;
              if (key === 'budget') {
                lead[key] = values[index] ? parseFloat(values[index]) : undefined;
              } else {
                (lead as any)[key] = values[index]?.trim();
              }
            });
            return {
              ...lead,
              id: Date.now().toString() + Math.random(),
              createdAt: new Date().toISOString().split('T')[0]
            } as Lead;
          });

          const allLeads: Lead[] = JSON.parse(localStorage.getItem('leads') || '[]');
          const updatedLeads = [...allLeads, ...importedLeads];
          localStorage.setItem('leads', JSON.stringify(updatedLeads));
          loadLeads();
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const columns = [
    { key: 'inquiryNo', label: 'Inquiry No.', sortable: true },
    { key: 'inquiryDate', label: 'Inquiry Date', sortable: true },
    { key: 'clientCompany', label: 'Client Company', sortable: true },
    { key: 'contactPerson', label: 'Contact Person', sortable: true },
    { key: 'contactNo', label: 'Contact No.', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'typeOfPlace', label: 'Type of Place', sortable: true },
    { key: 'spaceRequirement', label: 'Space Requirement', sortable: true },
    { key: 'city', label: 'City', sortable: true },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            value === 'New' ? 'bg-blue-100 text-blue-800' :
            value === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
            value === 'Qualified' ? 'bg-green-100 text-green-800' :
            value === 'Closed Won' ? 'bg-green-100 text-green-800' :
            value === 'Follow Up' ? 'bg-orange-100 text-orange-800' :
            'bg-red-100 text-red-800'
          }`}
        >
          {value}
        </span>
      )
    }
  ];

  const actions = [
    { label: 'View Details', icon: Eye, onClick: handleViewDetails, variant: 'secondary' as const },
    { label: 'Edit', icon: Edit, onClick: handleEdit, variant: 'primary' as const },
    { label: 'Delete', icon: Trash2, onClick: handleDelete, variant: 'danger' as const }
  ];

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Lead Tracker</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage and track all leads and inquiries</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <button
            onClick={() => downloadTemplate(columns.map(col => col.key), 'leads_template.csv')}
            className="inline-flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
          >
            <FileText className="h-4 w-4" />
            <span>Template</span>
          </button>
          <button
            onClick={handleImport}
            className="inline-flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span>Import</span>
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="inline-flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      <div className="overflow-hidden">
        <DataTable
          data={leads}
          columns={columns}
          actions={actions}
          searchable={true}
          exportable={false}
          importable={false}
          title="All Leads"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inquiry No.</label>
                <input
                  type="text"
                  value={formData.inquiryNo}
                  onChange={(e) => setFormData({ ...formData, inquiryNo: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Auto-generated if empty"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inquiry Date *</label>
                <input
                  type="date"
                  value={formData.inquiryDate}
                  onChange={(e) => setFormData({ ...formData, inquiryDate: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.inquiryDate ? 'border-red-500' : 'border-gray-300'}`}
                  required
                  aria-invalid={!!errors.inquiryDate}
                  aria-describedby={errors.inquiryDate ? 'inquiryDate-error' : undefined}
                />
                {errors.inquiryDate && <p id="inquiryDate-error" className="text-red-500 text-xs mt-1">{errors.inquiryDate}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Company *</label>
                <input
                  type="text"
                  value={formData.clientCompany}
                  onChange={(e) => setFormData({ ...formData, clientCompany: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.clientCompany ? 'border-red-500' : 'border-gray-300'}`}
                  required
                  aria-invalid={!!errors.clientCompany}
                  aria-describedby={errors.clientCompany ? 'clientCompany-error' : undefined}
                />
                {errors.clientCompany && <p id="clientCompany-error" className="text-red-500 text-xs mt-1">{errors.clientCompany}</p>}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-900 mb-4">Contact Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person *</label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.contactPerson ? 'border-red-500' : 'border-gray-300'}`}
                  required
                  aria-invalid={!!errors.contactPerson}
                  aria-describedby={errors.contactPerson ? 'contactPerson-error' : undefined}
                />
                {errors.contactPerson && <p id="contactPerson-error" className="text-red-500 text-xs mt-1">{errors.contactPerson}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact No. *</label>
                <input
                  type="tel"
                  value={formData.contactNo}
                  onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.contactNo ? 'border-red-500' : 'border-gray-300'}`}
                  required
                  aria-invalid={!!errors.contactNo}
                  aria-describedby={errors.contactNo ? 'contactNo-error' : undefined}
                />
                {errors.contactNo && <p id="contactNo-error" className="text-red-500 text-xs mt-1">{errors.contactNo}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                  required
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email && <p id="email-error" className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-900 mb-4">Property Requirements</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type of Space *</label>
                <select
                  value={formData.typeOfPlace}
                  onChange={(e) => setFormData({ ...formData, typeOfPlace: e.target.value as Lead['typeOfPlace'] })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.typeOfPlace ? 'border-red-500' : 'border-gray-300'}`}
                  required
                  aria-invalid={!!errors.typeOfPlace}
                  aria-describedby={errors.typeOfPlace ? 'typeOfPlace-error' : undefined}
                >
                  <option value="Office">Office</option>
                  <option value="Retail">Retail</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="Coworking">Coworking</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Land">Land</option>
                  <option value="Other">Other</option>
                </select>
                {errors.typeOfPlace && <p id="typeOfPlace-error" className="text-red-500 text-xs mt-1">{errors.typeOfPlace}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Space Requirement</label>
                <input
                  type="text"
                  value={formData.spaceRequirement}
                  onChange={(e) => setFormData({ ...formData, spaceRequirement: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="e.g., 5000 sq ft"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type *</label>
                <select
                  value={formData.transactionType}
                  onChange={(e) => setFormData({ ...formData, transactionType: e.target.value as Lead['transactionType'] })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.transactionType ? 'border-red-500' : 'border-gray-300'}`}
                  required
                  aria-invalid={!!errors.transactionType}
                  aria-describedby={errors.transactionType ? 'transactionType-error' : undefined}
                >
                  <option value="Lease">Lease</option>
                  <option value="Sale">Sale</option>
                  <option value="Both">Both</option>
                </select>
                {errors.transactionType && <p id="transactionType-error" className="text-red-500 text-xs mt-1">{errors.transactionType}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                <input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Enter budget amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location Preference</label>
                <input
                  type="text"
                  value={formData.locationPreference}
                  onChange={(e) => setFormData({ ...formData, locationPreference: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Enter detailed description..."
              />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
            <h3 className="text-lg font-semibold text-orange-900 mb-4">Lead Management</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Contact Date</label>
                <input
                  type="date"
                  value={formData.firstContactDate}
                  onChange={(e) => setFormData({ ...formData, firstContactDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lead Managed By *</label>
                <select
                  value={formData.leadManagedBy}
                  onChange={(e) => setFormData({ ...formData, leadManagedBy: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.leadManagedBy ? 'border-red-500' : 'border-gray-300'}`}
                  required
                  aria-invalid={!!errors.leadManagedBy}
                  aria-describedby={errors.leadManagedBy ? 'leadManagedBy-error' : undefined}
                >
                  <option value="">Select Manager</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                {errors.leadManagedBy && <p id="leadManagedBy-error" className="text-red-500 text-xs mt-1">{errors.leadManagedBy}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Lead['status'] })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.status ? 'border-red-500' : 'border-gray-300'}`}
                  required
                  aria-invalid={!!errors.status}
                  aria-describedby={errors.status ? 'status-error' : undefined}
                >
                  <option value="New">New</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Closed Won">Closed Won</option>
                  <option value="Closed Lost">Closed Lost</option>
                  <option value="Follow Up">Follow Up</option>
                </select>
                {errors.status && <p id="status-error" className="text-red-500 text-xs mt-1">{errors.status}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Option Shared</label>
                <select
                  value={formData.optionShared}
                  onChange={(e) => setFormData({ ...formData, optionShared: e.target.value as Lead['optionShared'] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Contact Date</label>
                <input
                  type="date"
                  value={formData.lastContactDate}
                  onChange={(e) => setFormData({ ...formData, lastContactDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action Date</label>
                <input
                  type="date"
                  value={formData.actionDate}
                  onChange={(e) => setFormData({ ...formData, actionDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Next Action Plan</label>
              <textarea
                value={formData.nextActionPlan}
                onChange={(e) => setFormData({ ...formData, nextActionPlan: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Enter next action plan..."
              />
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-lg border border-red-200">
            <h3 className="text-lg font-semibold text-red-900 mb-4">Additional Information</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remark</label>
                <textarea
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Enter additional remarks..."
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
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
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl"
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
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Inquiry No.</label>
                  <p className="text-sm text-gray-900">{selectedLead.inquiryNo}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Inquiry Date</label>
                  <p className="text-sm text-gray-900">{selectedLead.inquiryDate || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Client Company</label>
                  <p className="text-sm text-gray-900">{selectedLead.clientCompany}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900 mb-4">Contact Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Contact Person</label>
                  <p className="text-sm text-gray-900">{selectedLead.contactPerson}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Contact No.</label>
                  <p className="text-sm text-gray-900">{selectedLead.contactNo}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Email</label>
                  <p className="text-sm text-gray-900">{selectedLead.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Designation</label>
                  <p className="text-sm text-gray-900">{selectedLead.designation || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Department</label>
                  <p className="text-sm text-gray-900">{selectedLead.department || 'Not specified'}</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-900 mb-4">Property Requirements</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Type of Space</label>
                  <p className="text-sm text-gray-900">{selectedLead.typeOfSpace}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Space Requirement</label>
                  <p className="text-sm text-gray-900">{selectedLead.spaceRequirement || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Transaction Type</label>
                  <p className="text-sm text-gray-900">{selectedLead.transactionType}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Budget</label>
                  <p className="text-sm text-gray-900">{selectedLead.budget ? `₹${selectedLead.budget.toLocaleString()}` : 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">City</label>
                  <p className="text-sm text-gray-900">{selectedLead.city || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Location Preference</label>
                  <p className="text-sm text-gray-900">{selectedLead.locationPreference || 'Not specified'}</p>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-500">Description</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{selectedLead.description || 'No description'}</p>
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-orange-900 mb-4">Lead Management</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">First Contact Date</label>
                  <p className="text-sm text-gray-900">{selectedLead.firstContactDate || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Lead Managed By</label>
                  <p className="text-sm text-gray-900">{selectedLead.leadManagerName || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Status</label>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      selectedLead.status === 'New' ? 'bg-blue-100 text-blue-800' :
                      selectedLead.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                      selectedLead.status === 'Qualified' ? 'bg-green-100 text-green-800' :
                      selectedLead.status === 'Closed Won' ? 'bg-green-100 text-green-800' :
                      selectedLead.status === 'Follow Up' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}
                  >
                    {selectedLead.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Option Shared</label>
                  <p className="text-sm text-gray-900">{selectedLead.optionShared}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Last Contact Date</label>
                  <p className="text-sm text-gray-900">{selectedLead.lastContactDate || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Action Date</label>
                  <p className="text-sm text-gray-900">{selectedLead.actionDate || 'Not specified'}</p>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-500">Next Action Plan</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{selectedLead.nextActionPlan || 'No action plan'}</p>
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-red-900 mb-4">Additional Information</h3>
              <div>
                <label className="block text-sm font-medium text-gray-500">Remark</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{selectedLead.remark || 'No remarks'}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
  
export default LeadsManager;