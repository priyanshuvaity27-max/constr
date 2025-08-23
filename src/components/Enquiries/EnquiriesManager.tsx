import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, FileText } from 'lucide-react';
import DataTable from '../Common/DataTable';
import Modal from '../Common/Modal';
import { Enquiry, User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { exportToCSV, downloadTemplate } from '../../utils/exportUtils';

const EnquiriesManager: React.FC = () => {
  const { user } = useAuth();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [editingEnquiry, setEditingEnquiry] = useState<Enquiry | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    source: 'Website' as Enquiry['source'],
    status: 'New' as Enquiry['status'],
    assignedTo: ''
  });

  useEffect(() => {
    loadEnquiries();
    loadUsers();
  }, [user]);

  const loadEnquiries = () => {
    const storedEnquiries: Enquiry[] = JSON.parse(localStorage.getItem('enquiries') || '[]');
    const filteredEnquiries = user?.role === 'admin' 
      ? storedEnquiries 
      : storedEnquiries.filter(enquiry => enquiry.assignedTo === user?.id);
    setEnquiries(filteredEnquiries);
  };

  const loadUsers = () => {
    const storedUsers: User[] = JSON.parse(localStorage.getItem('users') || '[]');
    setUsers(storedUsers.filter(u => u.status === 'active'));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allEnquiries: Enquiry[] = JSON.parse(localStorage.getItem('enquiries') || '[]');
    
    const assignedUser = users.find(u => u.id === formData.assignedTo);
    
    if (editingEnquiry) {
      const updatedEnquiries = allEnquiries.map(enquiry =>
        enquiry.id === editingEnquiry.id
          ? {
              ...enquiry,
              ...formData,
              assignedToName: assignedUser?.name
            }
          : enquiry
      );
      localStorage.setItem('enquiries', JSON.stringify(updatedEnquiries));
    } else {
      const newEnquiry: Enquiry = {
        id: Date.now().toString(),
        ...formData,
        assignedToName: assignedUser?.name,
        dateOfEnquiry: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString().split('T')[0]
      };
      allEnquiries.push(newEnquiry);
      localStorage.setItem('enquiries', JSON.stringify(allEnquiries));
    }

    loadEnquiries();
    resetForm();
    setShowModal(false);
  };

  const handleEdit = (enquiry: Enquiry) => {
    setEditingEnquiry(enquiry);
    setFormData({
      name: enquiry.name,
      email: enquiry.email,
      phone: enquiry.phone,
      message: enquiry.message,
      source: enquiry.source,
      status: enquiry.status,
      assignedTo: enquiry.assignedTo || ''
    });
    setShowModal(true);
  };

  const handleDelete = (enquiry: Enquiry) => {
    if (window.confirm('Are you sure you want to delete this enquiry?')) {
      const allEnquiries: Enquiry[] = JSON.parse(localStorage.getItem('enquiries') || '[]');
      const updatedEnquiries = allEnquiries.filter(e => e.id !== enquiry.id);
      localStorage.setItem('enquiries', JSON.stringify(updatedEnquiries));
      loadEnquiries();
    }
  };

  const handleViewDetails = (enquiry: Enquiry) => {
    setSelectedEnquiry(enquiry);
    setShowDetailsModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      message: '',
      source: 'Website',
      status: 'New',
      assignedTo: ''
    });
    setEditingEnquiry(null);
  };

  const handleExport = () => {
    exportToCSV(enquiries, 'enquiries');
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
          const lines = csv.split('\n');
          const headers = lines[0].split(',');
          
          const importedEnquiries = lines.slice(1)
            .filter(line => line.trim())
            .map(line => {
              const values = line.split(',');
              const enquiry: Partial<Enquiry> = {};
              headers.forEach((header, index) => {
                const key = header.trim() as keyof Enquiry;
                (enquiry as any)[key] = values[index]?.trim();
              });
              return {
                ...enquiry,
                id: Date.now().toString() + Math.random(),
                dateOfEnquiry: new Date().toISOString().split('T')[0],
                createdAt: new Date().toISOString().split('T')[0]
              } as Enquiry;
            });

          const allEnquiries: Enquiry[] = JSON.parse(localStorage.getItem('enquiries') || '[]');
          const updatedEnquiries = [...allEnquiries, ...importedEnquiries];
          localStorage.setItem('enquiries', JSON.stringify(updatedEnquiries));
          loadEnquiries();
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'phone', label: 'Phone', sortable: true },
    { key: 'source', label: 'Source', sortable: true },
    { key: 'assignedToName', label: 'Assigned To', sortable: true },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          value === 'New' ? 'bg-blue-100 text-blue-800' :
          value === 'Contacted' ? 'bg-yellow-100 text-yellow-800' :
          value === 'Qualified' ? 'bg-green-100 text-green-800' :
          value === 'Converted' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          {value}
        </span>
      )
    },
    { key: 'dateOfEnquiry', label: 'Enquiry Date', sortable: true },
    { key: 'createdAt', label: 'Created', sortable: true }
  ];

  const actions = [
    {
      label: 'View Details',
      icon: Eye,
      onClick: handleViewDetails,
      variant: 'secondary' as const
    },
    {
      label: 'Edit',
      icon: Edit,
      onClick: handleEdit,
      variant: 'primary' as const
    },
    {
      label: 'Delete',
      icon: Trash2,
      onClick: handleDelete,
      variant: 'danger' as const
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.role === 'admin' ? 'Enquiries Management' : 'My Enquiries'}
          </h1>
          <p className="text-gray-600">Manage customer enquiries and follow-ups</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => downloadTemplate('enquiries')}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
          >
            <FileText className="h-4 w-4" />
            <span>Template</span>
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Enquiry</span>
          </button>
        </div>
      </div>

      <DataTable
        data={enquiries}
        columns={columns}
        actions={actions}
        searchable={true}
        exportable={true}
        importable={user?.role === 'admin'}
        onExport={handleExport}
        onImport={handleImport}
        title="Enquiries"
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingEnquiry ? 'Edit Enquiry' : 'Add New Enquiry'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source *
              </label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value as Enquiry['source'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="Website">Website</option>
                <option value="Phone">Phone</option>
                <option value="Email">Email</option>
                <option value="Walk-in">Walk-in</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Enquiry['status'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Converted">Converted</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned To
              </label>
              <select
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select User</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message *
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Customer enquiry message..."
              required
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {editingEnquiry ? 'Update Enquiry' : 'Create Enquiry'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Enquiry Details"
        size="lg"
      >
        {selectedEnquiry && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Name</label>
                <p className="text-sm text-gray-900">{selectedEnquiry.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Email</label>
                <p className="text-sm text-gray-900">{selectedEnquiry.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Phone</label>
                <p className="text-sm text-gray-900">{selectedEnquiry.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Source</label>
                <p className="text-sm text-gray-900">{selectedEnquiry.source}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Assigned To</label>
                <p className="text-sm text-gray-900">{selectedEnquiry.assignedToName || 'Not assigned'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                  selectedEnquiry.status === 'New' ? 'bg-blue-100 text-blue-800' :
                  selectedEnquiry.status === 'Contacted' ? 'bg-yellow-100 text-yellow-800' :
                  selectedEnquiry.status === 'Qualified' ? 'bg-green-100 text-green-800' :
                  selectedEnquiry.status === 'Converted' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {selectedEnquiry.status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Enquiry Date</label>
                <p className="text-sm text-gray-900">{selectedEnquiry.dateOfEnquiry}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Created Date</label>
                <p className="text-sm text-gray-900">{selectedEnquiry.createdAt}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Message</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{selectedEnquiry.message}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EnquiriesManager;