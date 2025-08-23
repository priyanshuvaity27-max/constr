import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Download, Trash2, Eye, FileText, File, Image, Video } from 'lucide-react';
import { Document } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { apiGet, apiDelete, apiUpload, ApiError } from '../../lib/api';
import Modal from '../Common/Modal';

interface DocumentsManagerProps {
  entity: string;
  entityId: string;
  title?: string;
}

const DocumentsManager: React.FC<DocumentsManagerProps> = ({ entity, entityId, title }) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadLabel, setUploadLabel] = useState('');

  useEffect(() => {
    loadDocuments();
  }, [entity, entityId]);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiGet<Document[]>('/api/v1/documents', {
        entity,
        entity_id: entityId
      });
      if (response.ok && response.data) {
        setDocuments(response.data);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  }, [entity, entityId]);

  const handleUpload = useCallback(async (file: File, label: string) => {
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entity', entity);
      formData.append('entity_id', entityId);
      formData.append('label', label);

      const response = await apiUpload<Document>('/api/v1/upload', formData);
      
      if (response.ok) {
        await loadDocuments();
        setShowUploadModal(false);
        setUploadLabel('');
        alert('File uploaded successfully!');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [entity, entityId, loadDocuments]);

  const handleDelete = useCallback(async (document: Document) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await apiDelete(`/api/v1/documents/${document.id}`);
      await loadDocuments();
      alert('Document deleted successfully!');
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('Failed to delete document. Please try again.');
    }
  }, [loadDocuments]);

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) return <Image className="h-5 w-5 text-blue-600" />;
    if (contentType.startsWith('video/')) return <Video className="h-5 w-5 text-purple-600" />;
    if (contentType.includes('pdf')) return <FileText className="h-5 w-5 text-red-600" />;
    return <File className="h-5 w-5 text-gray-600" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          {title || 'Documents'}
        </h3>
        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          <Upload className="h-4 w-4" />
          <span>Upload</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading documents...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No documents uploaded yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="divide-y divide-gray-200">
            {documents.map((doc) => (
              <div key={doc.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(doc.content_type)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.filename}</p>
                      <p className="text-xs text-gray-500">
                        {doc.label} • {formatFileSize(doc.file_size)} • 
                        Uploaded by {doc.uploaded_by_name} on {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {doc.public_url && (
                      <a
                        href={doc.public_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View/Download"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                    )}
                    {(user?.role === 'admin' || doc.uploaded_by === user?.id) && (
                      <button
                        onClick={() => handleDelete(doc)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setUploadLabel('');
        }}
        title="Upload Document"
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const file = formData.get('file') as File;
            if (file && uploadLabel) {
              handleUpload(file, uploadLabel);
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Label *
            </label>
            <input
              type="text"
              value={uploadLabel}
              onChange={(e) => setUploadLabel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g., Property Card, NOC, etc."
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File *
            </label>
            <input
              type="file"
              name="file"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum file size: 10MB
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowUploadModal(false);
                setUploadLabel('');
              }}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={uploading || !uploadLabel}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DocumentsManager;