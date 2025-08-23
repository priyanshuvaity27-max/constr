import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Edit, Trash2, Upload, Download, Info, MapPin, FileText, CheckCircle, XCircle } from 'lucide-react';
import DataTable from '../Common/DataTable';
import Modal from '../Common/Modal';
import { LandParcel, PendingAction } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { exportToCSV } from '../../utils/exportUtils';

interface DocumentStatus {
  uploaded: boolean;
  fileName: string;
}

interface FormData {
  landParcelName: string;
  location: string;
  city: string;
  googleLocation: string;
  areaInSqm: string;
  zone: LandParcel['zone'];
  title: string;
  roadWidth: string;
  connectivity: string;
  advantages: string;
  documents: Record<string, DocumentStatus>;
}

const createPendingAction = (
  type: 'create' | 'update' | 'delete',
  module: string,
  data: any,
  originalData: any,
  user: any
): void => {
  const pendingActions: PendingAction[] = JSON.parse(localStorage.getItem('pendingActions') || '[]');
  const newAction: PendingAction = {
    id: Date.now().toString(),
    type,
    module,
    data,
    originalData,
    requestedBy: user?.id || '',
    requestedByName: user?.name || '',
    requestedAt: new Date().toISOString(),
    status: 'pending',
  };
  pendingActions.push(newAction);
  localStorage.setItem('pendingActions', JSON.stringify(pendingActions));
};

const initialFormData: FormData = {
  landParcelName: '',
  location: '',
  city: '',
  googleLocation: '',
  areaInSqm: '',
  zone: 'Commercial',
  title: '',
  roadWidth: '',
  connectivity: '',
  advantages: '',
  documents: {
    propertyCard: { uploaded: false, fileName: '' },
    googleLocationMapping: { uploaded: false, fileName: '' },
    plotLayout: { uploaded: false, fileName: '' },
    dpRemark: { uploaded: false, fileName: '' },
    surveyTitle: { uploaded: false, fileName: '' },
    iod: { uploaded: false, fileName: '' },
    noc: { uploaded: false, fileName: '' },
  },
};

const docTypes = [
  { key: 'propertyCard', label: 'Property Card' },
  { key: 'googleLocationMapping', label: 'Google Location Mapping' },
  { key: 'plotLayout', label: 'Plot Layout' },
  { key: 'dpRemark', label: 'DP Remark' },
  { key: 'surveyTitle', label: 'Survey Title' },
  { key: 'iod', label: 'IOD' },
  { key: 'noc', label: 'NOC' },
];

const LandManager: React.FC = () => {
  const { user } = useAuth();
  const [landParcels, setLandParcels] = useState<LandParcel[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState<LandParcel | null>(null);
  const [editingParcel, setEditingParcel] = useState<LandParcel | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const loadLandParcels = useCallback(() => {
    const data = localStorage.getItem('landParcels');
    if (data) {
      setLandParcels(JSON.parse(data));
    }
  }, []);

  useEffect(() => {
    loadLandParcels();
  }, [loadLandParcels]);

  const saveToStorage = useCallback((data: LandParcel[]) => {
    localStorage.setItem('landParcels', JSON.stringify(data));
    setLandParcels(data);
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.landParcelName) newErrors.landParcelName = 'Land Parcel Name is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.location) newErrors.location = 'Location is required';
    if (!formData.areaInSqm) newErrors.areaInSqm = 'Area is required';
    if (!formData.title) newErrors.title = 'Title is required';
    if (formData.areaInSqm && isNaN(parseFloat(formData.areaInSqm))) {
      newErrors.areaInSqm = 'Area must be a valid number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const resetForm = useCallback(() => {
    setEditingParcel(null);
    setFormData(initialFormData);
    setErrors({});
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!validateForm()) return;

      const parcelData: LandParcel = {
        id: editingParcel ? editingParcel.id : Date.now().toString(),
        landParcelName: formData.landParcelName,
        location: formData.location,
        city: formData.city,
        googleLocation: formData.googleLocation,
        areaInSqm: parseFloat(formData.areaInSqm) || 0,
        zone: formData.zone,
        title: formData.title,
        roadWidth: formData.roadWidth,
        connectivity: formData.connectivity,
        advantages: formData.advantages,
        documents: formData.documents,
        createdAt: editingParcel ? editingParcel.createdAt : new Date().toISOString().split('T')[0],
      };

      if (user?.role === 'employee') {
        createPendingAction(
          editingParcel ? 'update' : 'create',
          'land',
          parcelData,
          editingParcel,
          user
        );
        alert('Your request has been sent to admin for approval.');
      } else {
        const allLandParcels: LandParcel[] = JSON.parse(localStorage.getItem('landParcels') || '[]');
        const updated = editingParcel
          ? allLandParcels.map((p) => (p.id === editingParcel.id ? parcelData : p))
          : [...allLandParcels, parcelData];
        saveToStorage(updated);
      }

      loadLandParcels();
      resetForm();
      setShowModal(false);
    },
    [formData, editingParcel, user, saveToStorage, loadLandParcels, resetForm, validateForm]
  );

  const handleEdit = useCallback((parcel: LandParcel) => {
    setEditingParcel(parcel);
    setFormData({
      landParcelName: parcel.landParcelName || '',
      location: parcel.location || '',
      city: parcel.city || '',
      googleLocation: parcel.googleLocation || '',
      areaInSqm: parcel.areaInSqm?.toString() || '',
      zone: parcel.zone || 'Commercial',
      title: parcel.title || '',
      roadWidth: parcel.roadWidth || '',
      connectivity: parcel.connectivity || '',
      advantages: parcel.advantages || '',
      documents: parcel.documents || initialFormData.documents,
    });
    setShowModal(true);
  }, []);

  const handleDelete = useCallback(
    (parcel: LandParcel) => {
      if (user?.role === 'employee') {
        if (window.confirm('Your delete request will be sent to admin for approval. Continue?')) {
          createPendingAction('delete', 'land', parcel, undefined, user);
          alert('Delete request sent to admin for approval.');
        }
      } else {
        if (window.confirm('Are you sure you want to delete this land parcel?')) {
          const allLandParcels: LandParcel[] = JSON.parse(localStorage.getItem('landParcels') || '[]');
          const filtered = allLandParcels.filter((p) => p.id !== parcel.id);
          saveToStorage(filtered);
          loadLandParcels();
        }
      }
    },
    [user, saveToStorage, loadLandParcels]
  );

  const handleViewDetails = useCallback((parcel: LandParcel) => {
    setSelectedParcel(parcel);
    setShowDetailsModal(true);
  }, []);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const [headerLine, ...lines] = text.trim().split('\n');
        const headers = headerLine.split(',');
        const newParcels = lines.map((line) => {
          const values = line.split(',');
          const obj: any = {};
          headers.forEach((h, i) => (obj[h] = values[i]));
          return {
            ...obj,
            id: Date.now().toString() + Math.random(),
            areaInSqm: parseFloat(obj.areaInSqm) || 0,
            documents: initialFormData.documents,
            createdAt: new Date().toISOString().split('T')[0],
          };
        });

        if (user?.role === 'employee') {
          newParcels.forEach((parcel) => {
            createPendingAction('create', 'land', parcel, undefined, user);
          });
          alert(`${newParcels.length} land parcels sent to admin for approval.`);
        } else {
          const allLandParcels: LandParcel[] = JSON.parse(localStorage.getItem('landParcels') || '[]');
          saveToStorage([...allLandParcels, ...newParcels]);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [user, saveToStorage]);

  const handleDocumentUpload = useCallback((docKey: string, file: File) => {
    setFormData((prev) => ({
      ...prev,
      documents: {
        ...prev.documents,
        [docKey]: {
          uploaded: true,
          fileName: file.name,
        },
      },
    }));
  }, []);

  const columns = useMemo(
    () => [
      { key: 'landParcelName', label: 'Land Parcel Name', sortable: true },
      { key: 'city', label: 'City', sortable: true },
      { key: 'location', label: 'Location', sortable: true },
      {
        key: 'zone',
        label: 'Zone',
        sortable: true,
        render: (value: string) => (
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              value === 'Commercial'
                ? 'bg-blue-100 text-blue-800'
                : value === 'Residential'
                ? 'bg-green-100 text-green-800'
                : value === 'Industrial'
                ? 'bg-orange-100 text-orange-800'
                : 'bg-purple-100 text-purple-800'
            }`}
          >
            {value}
          </span>
        ),
      },
      {
        key: 'areaInSqm',
        label: 'Area (Sqm)',
        sortable: true,
        render: (value: number) => (value ? value.toLocaleString() : '-'),
      },
      { key: 'title', label: 'Title', sortable: true },
      { key: 'createdAt', label: 'Created', sortable: true },
    ],
    []
  );

  const actions = useMemo(
    () => [
      {
        label: 'View Details',
        icon: Info,
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
    ],
    [handleViewDetails, handleEdit, handleDelete]
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="h-6 w-6 text-green-600" />
            Land Parcels
          </h1>
          <p className="text-base text-gray-600">Manage land parcels and property documents</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleImport}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span>Import</span>
          </button>
          <button
            onClick={() => exportToCSV(landParcels, 'land_parcels')}
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
            <span>Add Land Parcel</span>
          </button>
        </div>
      </div>

      <div className="overflow-hidden">
        <DataTable
          data={landParcels}
          columns={columns}
          actions={actions}
          searchable={true}
          exportable={false}
          importable={false}
          title="Land Parcels"
        />
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingParcel ? 'Edit Land Parcel' : 'Add New Land Parcel'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Land Parcel Name *
                </label>
                <input
                  type="text"
                  value={formData.landParcelName}
                  onChange={(e) => setFormData({ ...formData, landParcelName: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm ${
                    errors.landParcelName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.landParcelName && (
                  <p className="text-red-500 text-xs mt-1">{errors.landParcelName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zone *
                </label>
                <select
                  value={formData.zone}
                  onChange={(e) => setFormData({ ...formData, zone: e.target.value as LandParcel['zone'] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  required
                >
                  <option value="Commercial">Commercial</option>
                  <option value="Residential">Residential</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Mixed Use">Mixed Use</option>
                </select>
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
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm ${
                    errors.location ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Area (in Sqm) *
                </label>
                <input
                  type="number"
                  value={formData.areaInSqm}
                  onChange={(e) => setFormData({ ...formData, areaInSqm: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm ${
                    errors.areaInSqm ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.areaInSqm && <p className="text-red-500 text-xs mt-1">{errors.areaInSqm}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Road Width
                </label>
                <input
                  type="text"
                  value={formData.roadWidth}
                  onChange={(e) => setFormData({ ...formData, roadWidth: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Location
                </label>
                <input
                  type="url"
                  value={formData.googleLocation}
                  onChange={(e) => setFormData({ ...formData, googleLocation: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  placeholder="https://maps.google.com/..."
                />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Additional Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Connectivity
                </label>
                <textarea
                  value={formData.connectivity}
                  onChange={(e) => setFormData({ ...formData, connectivity: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Describe connectivity features..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Advantages
                </label>
                <textarea
                  value={formData.advantages}
                  onChange={(e) => setFormData({ ...formData, advantages: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="List key advantages..."
                />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
            <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Management
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {docTypes.map((docType) => (
                <div key={docType.key} className="border border-gray-200 rounded-lg p-3 bg-white">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {docType.label}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleDocumentUpload(docType.key, file);
                      }}
                      className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                    />
                    {formData.documents[docType.key]?.uploaded && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                  {formData.documents[docType.key]?.uploaded && (
                    <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Uploaded: {formData.documents[docType.key].fileName}
                    </p>
                  )}
                </div>
              ))}
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
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all text-sm font-medium"
            >
              {editingParcel ? 'Update Land Parcel' : 'Create Land Parcel'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Land Parcel Details"
        size="xl"
      >
        {selectedParcel && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Land Parcel Name</label>
                <p className="text-sm text-gray-900 font-medium">{selectedParcel.landParcelName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Zone</label>
                <span
                  className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                    selectedParcel.zone === 'Commercial'
                      ? 'bg-blue-100 text-blue-800'
                      : selectedParcel.zone === 'Residential'
                      ? 'bg-green-100 text-green-800'
                      : selectedParcel.zone === 'Industrial'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {selectedParcel.zone}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">City</label>
                <p className="text-sm text-gray-900">{selectedParcel.city}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Location</label>
                <p className="text-sm text-gray-900">{selectedParcel.location}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Area (Sqm)</label>
                <p className="text-sm text-gray-900">{selectedParcel.areaInSqm?.toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Title</label>
                <p className="text-sm text-gray-900">{selectedParcel.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Road Width</label>
                <p className="text-sm text-gray-900">{selectedParcel.roadWidth || 'Not specified'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Created Date</label>
                <p className="text-sm text-gray-900">{selectedParcel.createdAt}</p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Connectivity</h4>
              <p className="text-sm text-gray-900">
                {selectedParcel.connectivity || 'No connectivity information provided'}
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Advantages</h4>
              <p className="text-sm text-gray-900">
                {selectedParcel.advantages || 'No advantages listed'}
              </p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-medium text-orange-900 mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Document Status
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {docTypes.map((docType) => {
                  const doc = selectedParcel.documents?.[docType.key as keyof typeof selectedParcel.documents];
                  return (
                    <div key={docType.key} className="flex items-center justify-between p-2 bg-white rounded border">
                      <span className="text-sm text-gray-700">{docType.label}</span>
                      {doc?.uploaded ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-xs">Uploaded</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-gray-400">
                          <XCircle className="h-4 w-4" />
                          <span className="text-xs">Not uploaded</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LandManager;