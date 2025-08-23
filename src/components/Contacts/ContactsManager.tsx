import React, { useState, useEffect, useCallback } from 'react';
import { Contact, ContactType, PendingAction } from '../../types';
import { useAuth } from '../../context/AuthContext';
import DataTable from '../Common/DataTable';
import Modal from '../Common/Modal';
import { exportToCSV, downloadTemplate } from '../../utils/exportUtils';
import { Plus, Upload, Download, Building2, Users, User, UserCheck, FileText, Edit, Trash2, Eye } from 'lucide-react';

// Strongly typed user interface
interface EmployeeUser {
  id: string;
  name: string;
  role: 'admin' | 'employee';
}

const createPendingAction = (
  type: 'create' | 'update' | 'delete',
  module: string,
  data: any,
  originalData?: any,
  user?: EmployeeUser
): void => {
  if (!user) {
    alert('User information is missing.');
    return;
  }
  const pendingActions = JSON.parse(localStorage.getItem('pendingActions') || '[]');
  const newAction: PendingAction = {
    id: Date.now().toString(),
    type,
    module,
    data,
    originalData,
    requestedBy: user.id,
    requestedByName: user.name,
    requestedAt: new Date().toISOString(),
    status: 'pending'
  };
  pendingActions.push(newAction);
  localStorage.setItem('pendingActions', JSON.stringify(pendingActions));
};

const sectionConfig: Record<ContactType, { showBasicInfo: boolean; showContactInfo: boolean; showLocationDetails: boolean }> = {
  Client: {
    showBasicInfo: true,
    showContactInfo: true,
    showLocationDetails: true,
  },
  Developer: {
    showBasicInfo: true,
    showContactInfo: true,
    showLocationDetails: true,
  },
  'Individual Owner': {
    showBasicInfo: true,
    showContactInfo: true,
    showLocationDetails: true,
  },
  'Land Acquisition': {
    showBasicInfo: true,
    showContactInfo: true,
    showLocationDetails: true,
  },
  Others: {
    showBasicInfo: true,
    showContactInfo: true,
    showLocationDetails: true,
  },
};

const ContactsManager: React.FC = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [activeTab, setActiveTab] = useState<ContactType>('Client');
  const [formData, setFormData] = useState<Partial<Contact>>({
    type: 'Client',
    companyName: '',
    industry: '',
    department: '',
    developerName: '',
    contactType: '',
    individualOwnerName: '',
    ownerType: '',
    departmentDesignation: '',
    firstName: '',
    lastName: '',
    designation: '',
    contactNo: '',
    alternateNo: '',
    emailId: '',
    linkedinLink: '',
    city: '',
    location: '',
  });
  const [formError, setFormError] = useState<string>('');

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = useCallback(() => {
    const savedContacts = localStorage.getItem('contacts');
    if (savedContacts) {
      setContacts(JSON.parse(savedContacts));
    } else {
      const sampleContacts: Contact[] = [
        {
          id: '1',
          type: 'Client',
          companyName: 'Tech Solutions Ltd',
          industry: 'Technology',
          firstName: 'John',
          lastName: 'Smith',
          designation: 'CEO',
          contactNo: '+91 9876543210',
          alternateNo: '+91 9876543211',
          emailId: 'john@techsolutions.com',
          linkedinLink: 'https://linkedin.com/in/johnsmith',
          city: 'Mumbai',
          location: 'Bandra Kurla Complex'
        },
        {
          id: '2',
          type: 'Developer',
          developerName: 'DLF Limited',
          contactType: 'Corporate',
          firstName: 'Sarah',
          lastName: 'Johnson',
          designation: 'Project Manager',
          contactNo: '+91 9876543212',
          alternateNo: '+91 9876543213',
          emailId: 'sarah@dlf.com',
          linkedinLink: 'https://linkedin.com/in/sarahjohnson',
          city: 'Delhi',
          location: 'Cyber City'
        }
      ];
      setContacts(sampleContacts);
      localStorage.setItem('contacts', JSON.stringify(sampleContacts));
    }
  }, []);

  const validateForm = useCallback(() => {
    const requiredFields: (keyof Partial<Contact>)[] = ['firstName', 'lastName', 'contactNo', 'emailId'];
    for (const field of requiredFields) {
      if (!formData[field]?.trim()) {
        setFormError(`${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required.`);
        return false;
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.emailId || '')) {
      setFormError('Please enter a valid email address.');
      return false;
    }

    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    if (!phoneRegex.test(formData.contactNo || '')) {
      setFormError('Please enter a valid contact number.');
      return false;
    }

    if (formData.linkedinLink && !formData.linkedinLink.startsWith('https://linkedin.com/')) {
      setFormError('Please enter a valid LinkedIn URL.');
      return false;
    }

    setFormError('');
    return true;
  }, [formData]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const contactData: Contact = {
      id: editingContact?.id || Date.now().toString(),
      type: activeTab,
      ...formData
    };

    const allContacts: Contact[] = JSON.parse(localStorage.getItem('contacts') || '[]');

    if (user?.role === 'employee') {
      if (editingContact) {
        createPendingAction('update', 'contacts', contactData, editingContact, user);
      } else {
        createPendingAction('create', 'contacts', contactData, undefined, user);
      }
      alert('Your request has been sent to admin for approval.');
    } else {
      if (editingContact) {
        const updatedContacts = allContacts.map(contact =>
          contact.id === editingContact.id ? contactData : contact
        );
        localStorage.setItem('contacts', JSON.stringify(updatedContacts));
      } else {
        allContacts.push(contactData);
        localStorage.setItem('contacts', JSON.stringify(allContacts));
      }
    }

    loadContacts();
    resetForm();
    setShowModal(false);
  }, [activeTab, editingContact, formData, loadContacts, user]);

  const handleEdit = useCallback((contact: Contact) => {
    setEditingContact(contact);
    setActiveTab(contact.type);
    setFormData({
      companyName: contact.companyName || '',
      industry: contact.industry || '',
      department: contact.department || '',
      developerName: contact.developerName || '',
      contactType: contact.contactType || '',
      individualOwnerName: contact.individualOwnerName || '',
      ownerType: contact.ownerType || '',
      departmentDesignation: contact.departmentDesignation || '',
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      designation: contact.designation || '',
      contactNo: contact.contactNo || '',
      alternateNo: contact.alternateNo || '',
      emailId: contact.emailId || '',
      linkedinLink: contact.linkedinLink || '',
      city: contact.city || '',
      location: contact.location || '',
    });
    setShowModal(true);
  }, []);

  const handleDelete = useCallback((contact: Contact) => {
    if (user?.role === 'employee') {
      if (window.confirm('Your delete request will be sent to admin for approval. Continue?')) {
        createPendingAction('delete', 'contacts', contact, undefined, user);
        alert('Delete request sent to admin for approval.');
      }
    } else {
      if (window.confirm('Are you sure you want to delete this contact?')) {
        const allContacts: Contact[] = JSON.parse(localStorage.getItem('contacts') || '[]');
        const updatedContacts = allContacts.filter(c => c.id !== contact.id);
        localStorage.setItem('contacts', JSON.stringify(updatedContacts));
        loadContacts();
      }
    }
  }, [loadContacts, user]);

  const handleViewDetails = useCallback((contact: Contact) => {
    setSelectedContact(contact);
    setShowDetailsModal(true);
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      companyName: '',
      industry: '',
      department: '',
      developerName: '',
      contactType: '',
      individualOwnerName: '',
      ownerType: '',
      departmentDesignation: '',
      firstName: '',
      lastName: '',
      designation: '',
      contactNo: '',
      alternateNo: '',
      emailId: '',
      linkedinLink: '',
      city: '',
      location: '',
    });
    setEditingContact(null);
    setFormError('');
  }, []);

  const handleExport = useCallback(() => {
    const filteredContacts = contacts.filter(contact => contact.type === activeTab).map(contact => ({
      ...contact,
      fullName: `${contact.firstName} ${contact.lastName}`
    }));
    exportToCSV(filteredContacts, `${activeTab.toLowerCase().replace(' ', '-')}-contacts`);
  }, [activeTab, contacts]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            try {
              const importedContacts = (result.data as Partial<Contact>[]).map((row) => ({
                id: Date.now().toString() + Math.random(),
                type: activeTab,
                ...row,
              })) as Contact[];

              if (user?.role === 'employee') {
                importedContacts.forEach((contact) => {
                  createPendingAction('create', 'contacts', contact, undefined, user);
                });
                alert(`${importedContacts.length} contacts sent to admin for approval.`);
              } else {
                const allContacts: Contact[] = JSON.parse(localStorage.getItem('contacts') || '[]');
                const updatedContacts = [...allContacts, ...importedContacts];
                localStorage.setItem('contacts', JSON.stringify(updatedContacts));
                loadContacts();
              }
            } catch (error) {
              alert('Error parsing CSV file. Please ensure it follows the correct format.');
            }
          },
          error: (error) => {
            alert(`Error parsing CSV: ${error.message}`);
          }
        });
      }
    };
    input.click();
  }, [activeTab, loadContacts, user]);

  const getTabIcon = (type: ContactType) => {
    switch (type) {
      case 'Client': return <Building2 className="w-4 h-4" />;
      case 'Developer': return <Users className="w-4 h-4" />;
      case 'Individual Owner': return <User className="w-4 h-4" />;
      case 'Land Acquisition': return <FileText className="w-4 h-4" />;
      case 'Others': return <UserCheck className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getColumns = useCallback(() => {
    const baseColumns = [
      {
        key: 'fullName',
        label: 'Contact Name',
        sortable: true,
        render: (contact: Contact) => `${contact.firstName} ${contact.lastName}`
      },
      { key: 'designation', label: 'Designation', sortable: true },
      { key: 'contactNo', label: 'Contact No.', sortable: true },
      { key: 'emailId', label: 'Email ID', sortable: true },
      { key: 'city', label: 'City', sortable: true },
      { key: 'department', label: 'Department', sortable: true },
      { key: 'location', label: 'Location', sortable: true }
    ];

    switch (activeTab) {
      case 'Client':
        return [
          { key: 'companyName', label: 'Company Name', sortable: true },
          { key: 'industry', label: 'Industry', sortable: true },
          ...baseColumns,
        ];
      case 'Developer':
        return [
          { key: 'developerName', label: 'Developer Name', sortable: true },
          { key: 'contactType', label: 'Type', sortable: true },
          ...baseColumns,
        ];
      case 'Individual Owner':
        return [
          { key: 'individualOwnerName', label: 'Individual Owner Name', sortable: true },
          { key: 'ownerType', label: 'Type', sortable: true },
          { key: 'departmentDesignation', label: 'Department / Designation', sortable: true },
          ...baseColumns,
        ];
      case 'Land Acquisition':
        return [
          { key: 'developerName', label: 'Developer Name', sortable: true },
          { key: 'contactType', label: 'Type', sortable: true },
          ...baseColumns,
        ];
      default:
        return [
          { key: 'companyName', label: 'Company/Name', sortable: true },
          { key: 'industry', label: 'Type', sortable: true },
          ...baseColumns,
        ];
    }
  }, [activeTab]);

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
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contact List</h1>
          <p className="text-base text-gray-600">Manage your business contacts across different categories</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={() => downloadTemplate('contacts')}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
          >
            <FileText className="h-4 w-4" />
            <span>Template</span>
          </button>
          <button
            onClick={handleImport}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span>Import</span>
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add {activeTab}</span>
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="flex space-x-8 min-w-max">
          {(['Client', 'Developer', 'Individual Owner', 'Land Acquisition', 'Others'] as ContactType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {getTabIcon(tab)}
              <span>{tab}</span>
              <span className="bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                {contacts.filter((c) => c.type === tab).length}
              </span>
            </button>
          ))}
        </nav>
      </div>

      <div className="overflow-hidden">
        <DataTable
          data={contacts.filter(contact => contact.type === activeTab)}
          columns={getColumns()}
          actions={actions}
          searchable={true}
          exportable={false}
          importable={false}
          title={`${activeTab} Contacts`}
        />
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingContact ? `Edit ${activeTab}` : `Add ${activeTab}`}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {formError && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
              <p>{formError}</p>
            </div>
          )}

          {sectionConfig[activeTab].showContactInfo && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold text-green-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={formData.firstName || ''}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value.trim() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={formData.lastName || ''}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value.trim() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-2">
                    Designation
                  </label>
                  <input
                    id="designation"
                    type="text"
                    value={formData.designation || ''}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value.trim() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <input
                    id="department"
                    type="text"
                    value={formData.department || ''}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value.trim() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="contactNo" className="block text-sm font-medium text-gray-700 mb-2">
                    Contact No. *
                  </label>
                  <input
                    id="contactNo"
                    type="tel"
                    value={formData.contactNo || ''}
                    onChange={(e) => setFormData({ ...formData, contactNo: e.target.value.trim() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="alternateNo" className="block text-sm font-medium text-gray-700 mb-2">
                    Alternate No.
                  </label>
                  <input
                    id="alternateNo"
                    type="tel"
                    value={formData.alternateNo || ''}
                    onChange={(e) => setFormData({ ...formData, alternateNo: e.target.value.trim() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="emailId" className="block text-sm font-medium text-gray-700 mb-2">
                    Email ID *
                  </label>
                  <input
                    id="emailId"
                    type="email"
                    value={formData.emailId || ''}
                    onChange={(e) => setFormData({ ...formData, emailId: e.target.value.trim() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="linkedinLink" className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn Link
                  </label>
                  <input
                    id="linkedinLink"
                    type="url"
                    value={formData.linkedinLink || ''}
                    onChange={(e) => setFormData({ ...formData, linkedinLink: e.target.value.trim() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
              </div>
            </div>
          )}

          {sectionConfig[activeTab].showBasicInfo && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeTab === 'Client' && (
                  <>
                    <div>
                      <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name *
                      </label>
                      <input
                        id="companyName"
                        type="text"
                        value={formData.companyName || ''}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
                        Industry
                      </label>
                      <input
                        id="industry"
                        type="text"
                        value={formData.industry || ''}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </>
                )}
                {activeTab === 'Developer' && (
                  <>
                    <div>
                      <label htmlFor="developerName" className="block text-sm font-medium text-gray-700 mb-2">
                        Developer Name *
                      </label>
                      <input
                        id="developerName"
                        type="text"
                        value={formData.developerName || ''}
                        onChange={(e) => setFormData({ ...formData, developerName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="contactType" className="block text-sm font-medium text-gray-700 mb-2">
                        Type
                      </label>
                      <input
                        id="contactType"
                        type="text"
                        value={formData.contactType || ''}
                        onChange={(e) => setFormData({ ...formData, contactType: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </>
                )}
                {activeTab === 'Individual Owner' && (
                  <>
                    <div>
                      <label htmlFor="individualOwnerName" className="block text-sm font-medium text-gray-700 mb-2">
                        Individual Owner Name *
                      </label>
                      <input
                        id="individualOwnerName"
                        type="text"
                        value={formData.individualOwnerName || ''}
                        onChange={(e) => setFormData({ ...formData, individualOwnerName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="ownerType" className="block text-sm font-medium text-gray-700 mb-2">
                        Type
                      </label>
                      <input
                        id="ownerType"
                        type="text"
                        value={formData.ownerType || ''}
                        onChange={(e) => setFormData({ ...formData, ownerType: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="departmentDesignation" className="block text-sm font-medium text-gray-700 mb-2">
                        Department / Designation
                      </label>
                      <input
                        id="departmentDesignation"
                        type="text"
                        value={formData.departmentDesignation || ''}
                        onChange={(e) => setFormData({ ...formData, departmentDesignation: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </>
                )}
                {activeTab === 'Land Acquisition' && (
                  <>
                    <div>
                      <label htmlFor="developerName" className="block text-sm font-medium text-gray-700 mb-2">
                        Developer Name *
                      </label>
                      <input
                        id="developerName"
                        type="text"
                        value={formData.developerName || ''}
                        onChange={(e) => setFormData({ ...formData, developerName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="contactType" className="block text-sm font-medium text-gray-700 mb-2">
                        Type
                      </label>
                      <input
                        id="contactType"
                        type="text"
                        value={formData.contactType || ''}
                        onChange={(e) => setFormData({ ...formData, contactType: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </>
                )}
                {activeTab === 'Others' && (
                  <>
                    <div>
                      <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                        Company/Name *
                      </label>
                      <input
                        id="companyName"
                        type="text"
                        value={formData.companyName || ''}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
                        Type
                      </label>
                      <input
                        id="industry"
                        type="text"
                        value={formData.industry || ''}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {sectionConfig[activeTab].showLocationDetails && (
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
              <h3 className="text-lg font-semibold text-purple-900 mb-4">Location Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value.trim() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    id="location"
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value.trim() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {editingContact ? 'Save Changes' : 'Add Contact'}
            </button>
          </div>
        </form>
      </Modal>

      {selectedContact && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedContact(null);
          }}
          title={`Contact Details: ${selectedContact.firstName} ${selectedContact.lastName}`}
          size="lg"
        >
          <div className="space-y-4">
            {Object.entries(selectedContact).map(([key, value]) => {
              if (key === 'id' || !value) return null;
              const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              return (
                <div key={key} className="flex flex-col sm:flex-row">
                  <p className="w-full sm:w-1/3 text-sm font-semibold text-gray-600">{formattedKey}:</p>
                  <p className="w-full sm:w-2/3 text-sm text-gray-800">{String(value)}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => {
                setShowDetailsModal(false);
                setSelectedContact(null);
              }}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ContactsManager;