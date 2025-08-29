import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Check, X, Eye, AlertCircle } from 'lucide-react';
import DataTable from './DataTable';
import Modal from './Modal';
import { PendingAction } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { apiGet, apiPost, ApiError } from '../../lib/api';

const PendingActionsManager: React.FC = () => {
  const { user } = useAuth();
  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<any | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [approvalType, setApprovalType] = useState<'approve' | 'reject'>('approve');
  const [filters, setFilters] = useState({
    status: 'pending',
    module: '',
    type: '',
    page: 1,
    page_size: 50,
  });

  const loadPendingActions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiGet('/api/v1/pending-actions', filters);
      if (response.ok && response.data) {
        setPendingActions(response.data);
      }
    } catch (error) {
      console.error('Failed to load pending actions:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadPendingActions();
  }, [loadPendingActions]);

  const handleViewDetails = useCallback((action: any) => {
    setSelectedAction(action);
    setShowDetailsModal(true);
  }, []);

  const handleApprove = useCallback((action: any) => {
    setSelectedAction(action);
    setApprovalType('approve');
    setApprovalNotes('');
    setShowApprovalModal(true);
  }, []);

  const handleReject = useCallback((action: any) => {
    setSelectedAction(action);
    setApprovalType('reject');
    setApprovalNotes('');
    setShowApprovalModal(true);
  }, []);

  const submitApproval = useCallback(async () => {
    if (!selectedAction) return;

    try {
      const endpoint = approvalType === 'approve' 
        ? `/api/v1/pending-actions/${selectedAction.id}/approve`
        : `/api/v1/pending-actions/${selectedAction.id}/reject`;
      
      const payload = approvalType === 'reject' 
        ? { status: 'rejected', admin_notes: approvalNotes }
        : { admin_notes: approvalNotes };

      await apiPost(endpoint, payload);
      
      await loadPendingActions();
      setShowApprovalModal(false);
      setSelectedAction(null);
      setApprovalNotes('');
      
      alert(`Action ${approvalType}d successfully!`);
    } catch (error) {
      console.error(`Failed to ${approvalType} action:`, error);
      alert(`Failed to ${approvalType} action. Please try again.`);
    }
  }, [selectedAction, approvalType, approvalNotes, loadPendingActions]);

  const getActionTypeColor = (type: string) => {
    switch (type) {
      case 'create': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-blue-100 text-blue-800';
      case 'delete': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = [
    { 
      key: 'module', 
      label: 'Module', 
      sortable: true,
      render: (value: string) => (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 capitalize">
          {value}
        </span>
      )
    },
    { 
      key: 'type', 
      label: 'Action Type', 
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionTypeColor(value)} capitalize`}>
          {value}
        </span>
      )
    },
    { key: 'requested_by_name', label: 'Requested By', sortable: true },
    { 
      key: 'created_at', 
      label: 'Requested At', 
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(value)} capitalize`}>
          {value}
        </span>
      )
    },
  ];

  const actions = [
    {
      label: 'View Details',
      icon: Eye,
      onClick: handleViewDetails,
      variant: 'secondary' as const,
    },
    ...(user?.role === 'admin' ? [
      {
        label: 'Approve',
        icon: Check,
        onClick: handleApprove,
        variant: 'primary' as const,
      },
      {
        label: 'Reject',
        icon: X,
        onClick: handleReject,
        variant: 'danger' as const,
      },
    ] : []),
  ];

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-600 mt-2">You don't have permission to access pending actions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="h-6 w-6 text-orange-600" />
            Pending Actions
          </h1>
          <p className="text-base text-gray-600">Review and approve employee requests</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Module</label>
            <select
              value={filters.module}
              onChange={(e) => setFilters({ ...filters, module: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Modules</option>
              <option value="leads">Leads</option>
              <option value="developers">Developers</option>
              <option value="projects">Projects</option>
              <option value="inventory">Inventory</option>
              <option value="land">Land</option>
              <option value="contacts">Contacts</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Types</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden">
        <DataTable
          data={pendingActions}
          columns={columns}
          actions={actions}
          searchable={false}
          exportable={false}
          importable={false}
          title="Pending Actions"
          loading={loading}
        />
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Action Details"
        size="xl"
      >
        {selectedAction && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Module</label>
                <p className="text-sm text-gray-900 font-medium capitalize">{selectedAction.module}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Action Type</label>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getActionTypeColor(selectedAction.type)} capitalize`}>
                  {selectedAction.type}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Requested By</label>
                <p className="text-sm text-gray-900">{selectedAction.requested_by_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedAction.status)} capitalize`}>
                  {selectedAction.status}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Requested Data</label>
              <pre className="text-sm text-gray-900 bg-gray-50 p-4 rounded-md overflow-auto max-h-64">
                {JSON.stringify(selectedAction.data, null, 2)}
              </pre>
            </div>

            {selectedAction.admin_notes && (
              <div>
                <label className="block text-sm font-medium text-gray-500">Admin Notes</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{selectedAction.admin_notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Approval Modal */}
      <Modal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        title={`${approvalType === 'approve' ? 'Approve' : 'Reject'} Action`}
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">
                  {approvalType === 'approve' ? 'Approve Action' : 'Reject Action'}
                </h4>
                <p className="text-sm text-yellow-700 mt-1">
                  {approvalType === 'approve' 
                    ? 'This will apply the requested changes to the database.'
                    : 'This will reject the request without making any changes.'
                  }
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {approvalType === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason'}
            </label>
            <textarea
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder={approvalType === 'approve' ? 'Add any notes...' : 'Explain why this request is being rejected...'}
              required={approvalType === 'reject'}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowApprovalModal(false)}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={submitApproval}
              className={`px-4 py-2 text-white rounded-md transition-colors ${
                approvalType === 'approve' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {approvalType === 'approve' ? 'Approve' : 'Reject'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PendingActionsManager;