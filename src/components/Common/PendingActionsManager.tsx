import React, { useState, useEffect, useCallback } from 'react';
import { Check, X, Clock, Eye, AlertCircle } from 'lucide-react';
import { PendingAction } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { apiGet, apiPost, ApiError } from '../../lib/api';
import Modal from './Modal';

const PendingActionsManager: React.FC = () => {
  const { user } = useAuth();
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState<PendingAction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    loadPendingActions();
  }, []);

  const loadPendingActions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiGet<PendingAction[]>('/api/v1/pending-actions', {
        status: 'pending'
      });
      if (response.ok && response.data) {
        setPendingActions(response.data);
      }
    } catch (error) {
      console.error('Failed to load pending actions:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  };

  const handleApprove = useCallback(async (actionId: string) => {
    try {
      await apiPost(`/api/v1/pending-actions/${actionId}/approve`, {
        admin_notes: adminNotes
      });
      
      await loadPendingActions();
      setAdminNotes('');
      alert('Action approved successfully!');
    } catch (error) {
      console.error('Failed to approve action:', error);
      alert('Failed to approve action. Please try again.');
    }
  }, [adminNotes, loadPendingActions]);

  const handleReject = useCallback(async (actionId: string) => {
    try {
      await apiPost(`/api/v1/pending-actions/${actionId}/reject`, {
        status: 'rejected',
        admin_notes: adminNotes
      });
      
      await loadPendingActions();
      setAdminNotes('');
      alert('Action rejected successfully!');
    } catch (error) {
      console.error('Failed to reject action:', error);
      alert('Failed to reject action. Please try again.');
    }
  }, [adminNotes, loadPendingActions]);

  const getActionTypeColor = (type: string) => {
    switch (type) {
      case 'create': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-blue-100 text-blue-800';
      case 'delete': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getModuleColor = (module: string) => {
    switch (module) {
      case 'leads': return 'bg-purple-100 text-purple-800';
      case 'developers': return 'bg-orange-100 text-orange-800';
      case 'contacts': return 'bg-teal-100 text-teal-800';
      case 'projects': return 'bg-indigo-100 text-indigo-800';
      case 'inventory': return 'bg-pink-100 text-pink-800';
      case 'land': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="h-6 w-6 text-orange-600" />
            Pending Actions
          </h1>
          <p className="text-gray-600">Review and approve employee requests</p>
        </div>
        <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
          {pendingActions.length} Pending
        </div>
      </div>

      {pendingActions.length === 0 ? (
        loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading pending actions...</p>
          </div>
        ) : (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Actions</h3>
          <p className="text-gray-600">All employee requests have been processed.</p>
        </div>
        )
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="divide-y divide-gray-200">
            {pendingActions.map((action) => (
              <div key={action.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionTypeColor(action.type)}`}>
                        {action.type.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getModuleColor(action.module)}`}>
                        {action.module.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {action.type === 'create' && `Create new ${action.module.slice(0, -1)}`}
                      {action.type === 'update' && `Update ${action.module.slice(0, -1)}`}
                      {action.type === 'delete' && `Delete ${action.module.slice(0, -1)}`}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Requested by <strong>{action.requestedByName}</strong> on {new Date(action.requestedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedAction(action);
                        setShowDetailsModal(true);
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleApprove(action.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Approve"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleReject(action.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Reject"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                    placeholder="Add notes for this action..."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Action Details"
        size="lg"
      >
        {selectedAction && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Action Type</label>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getActionTypeColor(selectedAction.type)}`}>
                  {selectedAction.type.toUpperCase()}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Module</label>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getModuleColor(selectedAction.module)}`}>
                  {selectedAction.module.toUpperCase()}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Requested By</label>
                <p className="text-sm text-gray-900">{selectedAction.requestedByName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Requested At</label>
                <p className="text-sm text-gray-900">{new Date(selectedAction.requestedAt).toLocaleString()}</p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Data Changes</label>
              <div className="bg-gray-50 p-3 rounded-md">
                <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                  {JSON.stringify(selectedAction.data, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PendingActionsManager;