import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, FileText, ExternalLink } from 'lucide-react';
import DataTable from '../Common/DataTable';
import Modal from '../Common/Modal';
import { Document } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { exportToCSV, downloadTemplate } from '../../utils/exportUtils';

const DocumentsManager: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);

  const [formData, setFormData] = useState({
    propertyCard: '',
    googleLocation: '',
    plotLayout: '',
    dpRemarks: '',
    surveyTitle: '',
    iod: '',
    noc: ''
  });

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = () => {
    const storedDocuments: Document[] = JSON.parse(localStorage.getItem('documents') || '[]');
    setDocuments(storedDocuments);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allDocuments: Document[] = JSON.parse(localStorage.getItem('documents') || '[]');

    if (editingDocument) {
      const updatedDocuments = allDocuments.map(doc =>
        doc.id === editingDocument.id
          ? { ...doc, ...formData }
          : doc
      );
      localStorage.setItem('documents', JSON.stringify(updatedDocuments));
    } else {
      const newDocument: Document = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString().split('T')[0]
      };
      allDocuments.push(newDocument);
      localStorage.setItem('documents', JSON.stringify(allDocuments));
    }

    loadDocuments();
    resetForm();
    setShowModal(false);
  };

  const handleEdit = (document: Document) => {
    setEditingDocument(document);
    setFormData({
      propertyCard: document.propertyCard,
      googleLocation: document.googleLocation,
      plotLayout: document.plotLayout,
      dpRemarks: document.dpRemarks,
      surveyTitle: document.surveyTitle,
      iod: document.iod,
      noc: document.noc
    });
    setShowModal(true);
  };

  const handleDelete = (document: Document) => {
    if (window.confirm('Are you sure you want to delete this document record?')) {
      const allDocuments: Document[] = JSON.parse(localStorage.getItem('documents') || '[]');
      const updatedDocuments = allDocuments.filter(d => d.id !== document.id);
      localStorage.setItem('documents', JSON.stringify(updatedDocuments));
      loadDocuments();
    }
  };

  const handleViewDetails = (document: Document) => {
    setSelectedDocument(document);
    setShowDetailsModal(true);
  };

  const resetForm = () => {
    setFormData({
      propertyCard: '',
      googleLocation: '',
      plotLayout: '',
      dpRemarks: '',
      surveyTitle: '',
      iod: '',
      noc: ''
    });
    setEditingDocument(null);
  };

  const handleExport = () => {
    exportToCSV(documents, 'documents');
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
          
          const importedDocuments = lines.slice(1)
            .filter(line => line.trim())
            .map(line => {
              const values = line.split(',');
              const document: Partial<Document> = {};
              headers.forEach((header, index) => {
                const key = header.trim() as keyof Document;
                (document as any)[key] = values[index]?.trim();
              });
              return {
                ...document,
                id: Date.now().toString() + Math.random(),
                createdAt: new Date().toISOString().split('T')[0]
              } as Document;
            });

          const allDocuments: Document[] = JSON.parse(localStorage.getItem('documents') || '[]');
          const updatedDocuments = [...allDocuments, ...importedDocuments];
          localStorage.setItem('documents', JSON.stringify(updatedDocuments));
          loadDocuments();
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const columns = [
    { key: 'propertyCard', label: 'Property Card', sortable: true },
    { key: 'plotLayout', label: 'Plot Layout', sortable: true },
    { key: 'dpRemarks', label: 'DP Remarks', sortable: true },
    { key: 'surveyTitle', label: 'Survey Title', sortable: true },
    { key: 'iod', label: 'IOD', sortable: true },
    { key: 'noc', label: 'NOC', sortable: true },
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

  const filteredActions = user?.role === 'admin' ? actions : actions.filter(action => action.label === 'View Details');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents Management</h1>
          <p className="text-gray-600">Manage property documents and legal papers</p>
        </div>
        {user?.role === 'admin' && (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => downloadTemplate('documents')}
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
              <span>Add Document</span>
            </button>
          </div>
        )}
      </div>

      <DataTable
        data={documents}
        columns={columns}
        actions={filteredActions}
        searchable={true}
        exportable={true}
        importable={user?.role === 'admin'}
        onExport={handleExport}
        onImport={handleImport}
        title="Document Records"
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingDocument ? 'Edit Document Record' : 'Add New Document Record'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Card *
              </label>
              <input
                type="text"
                value={formData.propertyCard}
                onChange={(e) => setFormData({ ...formData, propertyCard: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Google Location
              </label>
              <input
                type="url"
                value={formData.googleLocation}
                onChange={(e) => setFormData({ ...formData, googleLocation: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="https://maps.google.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plot Layout
              </label>
              <input
                type="text"
                value={formData.plotLayout}
                onChange={(e) => setFormData({ ...formData, plotLayout: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DP Remarks
              </label>
              <input
                type="text"
                value={formData.dpRemarks}
                onChange={(e) => setFormData({ ...formData, dpRemarks: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Survey Title
              </label>
              <input
                type="text"
                value={formData.surveyTitle}
                onChange={(e) => setFormData({ ...formData, surveyTitle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IOD
              </label>
              <input
                type="text"
                value={formData.iod}
                onChange={(e) => setFormData({ ...formData, iod: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NOC
              </label>
              <input
                type="text"
                value={formData.noc}
                onChange={(e) => setFormData({ ...formData, noc: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
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
              {editingDocument ? 'Update Document' : 'Create Document'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Document Details"
        size="lg"
      >
        {selectedDocument && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Property Card</label>
                <p className="text-sm text-gray-900">{selectedDocument.propertyCard}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Google Location</label>
                {selectedDocument.googleLocation ? (
                  <a href={selectedDocument.googleLocation} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                    View on Google Maps <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                ) : (
                  <p className="text-sm text-gray-500">Not provided</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Plot Layout</label>
                <p className="text-sm text-gray-900">{selectedDocument.plotLayout || 'Not specified'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">DP Remarks</label>
                <p className="text-sm text-gray-900">{selectedDocument.dpRemarks || 'Not specified'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Survey Title</label>
                <p className="text-sm text-gray-900">{selectedDocument.surveyTitle || 'Not specified'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">IOD</label>
                <p className="text-sm text-gray-900">{selectedDocument.iod || 'Not specified'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">NOC</label>
                <p className="text-sm text-gray-900">{selectedDocument.noc || 'Not specified'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Created Date</label>
                <p className="text-sm text-gray-900">{selectedDocument.createdAt}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DocumentsManager;