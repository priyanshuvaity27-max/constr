import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, FileText, Building, Users, Package, ShoppingBag, Upload, Download } from 'lucide-react';
import DataTable from '../Common/DataTable';
import Modal from '../Common/Modal';
import { useAuth } from '../../context/AuthContext';
import { exportToCSV, downloadTemplate } from '../../utils/exportUtils';

interface Developer {
  id: string;
  type: 'corporate' | 'coworking' | 'warehouse' | 'mall';
  name: string;
  grade: 'A' | 'B' | 'C';
  contactNo: string;
  emailId: string;
  websiteLink: string;
  linkedinLink?: string;
  hoCity: string;
  presenceCities?: string;
  noOfBuildings?: number;
  noOfCoworking?: number;
  noOfWarehouses?: number;
  noOfMalls?: number;
  buildingListLink?: string;
  contactListLink?: string;
  createdAt: string;
}

const DevelopersManager: React.FC = () => {
  const { user } = useAuth();
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Developer | null>(null);
  const [editingItem, setEditingItem] = useState<Developer | null>(null);
  const [activeTab, setActiveTab] = useState<'corporate' | 'coworking' | 'warehouse' | 'mall'>('corporate');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [formData, setFormData] = useState({
    type: 'corporate' as Developer['type'],
    name: '',
    grade: 'A' as Developer['grade'],
    contactNo: '',
    emailId: '',
    websiteLink: '',
    linkedinLink: '',
    hoCity: '',
    presenceCities: '',
    noOfBuildings: '',
    noOfCoworking: '',
    noOfWarehouses: '',
    noOfMalls: '',
    buildingListLink: '',
    contactListLink: ''
  });

  useEffect(() => {
    const storedDevelopers: Developer[] = JSON.parse(localStorage.getItem('developers') || '[]');
    setDevelopers(storedDevelopers);
  }, []);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.contactNo || !/^\d{10}$/.test(formData.contactNo)) newErrors.contactNo = 'Valid 10-digit contact number is required';
    if (!formData.emailId || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailId)) newErrors.emailId = 'Valid email is required';
    if (!formData.websiteLink || !/^https?:\/\/[^\s$.?#].[^\s]*$/.test(formData.websiteLink)) newErrors.websiteLink = 'Valid URL is required';
    if (formData.linkedinLink && !/^https?:\/\/(www\.)?linkedin\.com\/.*$/.test(formData.linkedinLink)) newErrors.linkedinLink = 'Valid LinkedIn URL is required';
    if (!formData.hoCity) newErrors.hoCity = 'Head Office City is required';
    if (activeTab === 'corporate' && (!formData.noOfBuildings || isNaN(parseInt(formData.noOfBuildings)))) newErrors.noOfBuildings = 'Number of Buildings is required';
    if (activeTab === 'coworking' && (!formData.noOfCoworking || isNaN(parseInt(formData.noOfCoworking)))) newErrors.noOfCoworking = 'Number of Coworking Spaces is required';
    if (activeTab === 'warehouse' && (!formData.noOfWarehouses || isNaN(parseInt(formData.noOfWarehouses)))) newErrors.noOfWarehouses = 'Number of Warehouses is required';
    if (activeTab === 'mall' && (!formData.noOfMalls || isNaN(parseInt(formData.noOfMalls)))) newErrors.noOfMalls = 'Number of Malls is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const developerData = {
      ...formData,
      noOfBuildings: formData.noOfBuildings ? parseInt(formData.noOfBuildings) : undefined,
      noOfCoworking: formData.noOfCoworking ? parseInt(formData.noOfCoworking) : undefined,
      noOfWarehouses: formData.noOfWarehouses ? parseInt(formData.noOfWarehouses) : undefined,
      noOfMalls: formData.noOfMalls ? parseInt(formData.noOfMalls) : undefined
    };

    const allDevelopers: Developer[] = JSON.parse(localStorage.getItem('developers') || '[]');

    if (editingItem) {
      const updatedDevelopers = allDevelopers.map(item =>
        item.id === editingItem.id ? { ...item, ...developerData } : item
      );
      localStorage.setItem('developers', JSON.stringify(updatedDevelopers));
      setDevelopers(updatedDevelopers);
    } else {
      const newItem: Developer = {
        id: Date.now().toString(),
        ...developerData,
        createdAt: new Date().toISOString().split('T')[0]
      };
      allDevelopers.push(newItem);
      localStorage.setItem('developers', JSON.stringify(allDevelopers));
      setDevelopers(allDevelopers);
    }

    resetForm();
    setShowModal(false);
  };

  const handleEdit = (item: Developer) => {
    setEditingItem(item);
    setFormData({
      type: item.type,
      name: item.name,
      grade: item.grade,
      contactNo: item.contactNo,
      emailId: item.emailId,
      websiteLink: item.websiteLink,
      linkedinLink: item.linkedinLink || '',
      hoCity: item.hoCity,
      presenceCities: item.presenceCities || '',
      noOfBuildings: item.noOfBuildings?.toString() || '',
      noOfCoworking: item.noOfCoworking?.toString() || '',
      noOfWarehouses: item.noOfWarehouses?.toString() || '',
      noOfMalls: item.noOfMalls?.toString() || '',
      buildingListLink: item.buildingListLink || '',
      contactListLink: item.contactListLink || ''
    });
    setShowModal(true);
  };

  const handleDelete = (item: Developer) => {
    if (window.confirm('Are you sure you want to delete this developer?')) {
      const updatedDevelopers = developers.filter(i => i.id !== item.id);
      localStorage.setItem('developers', JSON.stringify(updatedDevelopers));
      setDevelopers(updatedDevelopers);
    }
  };

  const handleViewDetails = (item: Developer) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
  };

  const resetForm = () => {
    setFormData({
      type: activeTab,
      name: '',
      grade: 'A',
      contactNo: '',
      emailId: '',
      websiteLink: '',
      linkedinLink: '',
      hoCity: '',
      presenceCities: '',
      noOfBuildings: '',
      noOfCoworking: '',
      noOfWarehouses: '',
      noOfMalls: '',
      buildingListLink: '',
      contactListLink: ''
    });
    setEditingItem(null);
    setErrors({});
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
          const importedDevelopers = lines.slice(1).map(line => {
            const values = line.split(',');
            const item: Partial<Developer> = {};
            headers.forEach((header, index) => {
              const key = header.trim() as keyof Developer;
              if (key.includes('noOf')) {
                item[key] = values[index] ? parseInt(values[index]) : undefined;
              } else {
                item[key] = values[index]?.trim();
              }
            });
            return {
              ...item,
              id: Date.now().toString() + Math.random(),
              type: activeTab,
              createdAt: new Date().toISOString().split('T')[0]
            } as Developer;
          });

          const allDevelopers = [...developers, ...importedDevelopers];
          localStorage.setItem('developers', JSON.stringify(allDevelopers));
          setDevelopers(allDevelopers);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const filteredDevelopers = developers.filter(item => item.type === activeTab);

  const getColumns = () => {
    const baseColumns = [
      { key: 'name', label: `${getTabLabel(activeTab).replace(' List', '')} Name`, sortable: true },
      { 
        key: 'grade', 
        label: 'Grade', 
        sortable: true,
        render: (value: string) => (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            value === 'A' ? 'bg-green-100 text-green-800' :
            value === 'B' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            Grade {value}
          </span>
        )
      },
      { key: 'contactNo', label: 'Common Contact', sortable: true },
      { key: 'emailId', label: 'Email ID', sortable: true },
      { key: 'websiteLink', label: 'Website Link', sortable: true, render: (value: string) => (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{value}</a>
      )},
      { key: 'hoCity', label: 'HO City', sortable: true }
    ];

    if (activeTab === 'corporate') baseColumns.push({ key: 'noOfBuildings', label: 'No. of Buildings', sortable: true });
    if (activeTab === 'coworking') baseColumns.push({ key: 'noOfCoworking', label: 'No. of Coworking', sortable: true });
    if (activeTab === 'warehouse') baseColumns.push({ key: 'noOfWarehouses', label: 'No. of Warehouses', sortable: true });
    if (activeTab === 'mall') baseColumns.push({ key: 'noOfMalls', label: 'No. of Malls', sortable: true });

    return baseColumns;
  };

  const actions = [
    { label: 'View Details', icon: Eye, onClick: handleViewDetails, variant: 'secondary' },
    { label: 'Edit', icon: Edit, onClick: handleEdit, variant: 'primary' },
    { label: 'Delete', icon: Trash2, onClick: handleDelete, variant: 'danger' }
  ];

  const getTabLabel = (type: string) => {
    switch (type) {
      case 'corporate': return 'Corporate Developer List';
      case 'coworking': return 'Coworking Developer List';
      case 'warehouse': return 'Warehouse Developer List';
      case 'mall': return 'Mall Developer List';
      default: return type;
    }
  };

  const getTabIcon = (type: string) => {
    switch (type) {
      case 'corporate': return <Building className="w-4 h-4" />;
      case 'coworking': return <Users className="w-4 h-4" />;
      case 'warehouse': return <Package className="w-4 h-4" />;
      case 'mall': return <ShoppingBag className="w-4 h-4" />;
      default: return <Building className="w-4 h-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Developers List</h1>
          <p className="text-sm text-gray-600">Manage developers across different property types</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={() => downloadTemplate(getColumns().map(col => col.key), `${activeTab}_developers_template.csv`)}
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
            onClick={() => exportToCSV(filteredDevelopers, `${activeTab}_developers.csv`)}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button
            onClick={() => { resetForm(); setFormData({ ...formData, type: activeTab }); setShowModal(true); }}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add {getTabLabel(activeTab).replace(' List', '')}</span>
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="flex space-x-8 min-w-max">
          {[
            { id: 'corporate', label: 'Corporate Developer List' },
            { id: 'coworking', label: 'Coworking Developer List' },
            { id: 'warehouse', label: 'Warehouse Developer List' },
            { id: 'mall', label: 'Mall Developer List' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              aria-selected={activeTab === tab.id}
            >
              {getTabIcon(tab.id)}
              <span>{tab.label}</span>
              <span className="bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                {developers.filter(i => i.type === tab.id).length}
              </span>
            </button>
          ))}
        </nav>
      </div>

      <DataTable
        data={filteredDevelopers}
        columns={getColumns()}
        actions={actions}
        searchable={true}
        exportable={false}
        importable={false}
        title={getTabLabel(activeTab)}
      />

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingItem ? `Edit ${getTabLabel(activeTab).replace(' List', '')}` : `Add ${getTabLabel(activeTab).replace(' List', '')}`}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                  required
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name && <p id="name-error" className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">Grade *</label>
                <select
                  id="grade"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value as Developer['grade'] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                >
                  <option value="A">Grade A</option>
                  <option value="B">Grade B</option>
                  <option value="C">Grade C</option>
                </select>
              </div>
              <div>
                <label htmlFor="contactNo" className="block text-sm font-medium text-gray-700 mb-2">Common Contact *</label>
                <input
                  id="contactNo"
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
                <label htmlFor="emailId" className="block text-sm font-medium text-gray-700 mb-2">Email ID *</label>
                <input
                  id="emailId"
                  type="email"
                  value={formData.emailId}
                  onChange={(e) => setFormData({ ...formData, emailId: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.emailId ? 'border-red-500' : 'border-gray-300'}`}
                  required
                  aria-invalid={!!errors.emailId}
                  aria-describedby={errors.emailId ? 'emailId-error' : undefined}
                />
                {errors.emailId && <p id="emailId-error" className="text-red-500 text-xs mt-1">{errors.emailId}</p>}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-900 mb-4">Online Presence</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="websiteLink" className="block text-sm font-medium text-gray-700 mb-2">Website Link *</label>
                <input
                  id="websiteLink"
                  type="url"
                  value={formData.websiteLink}
                  onChange={(e) => setFormData({ ...formData, websiteLink: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.websiteLink ? 'border-red-500' : 'border-gray-300'}`}
                  required
                  aria-invalid={!!errors.websiteLink}
                  aria-describedby={errors.websiteLink ? 'websiteLink-error' : undefined}
                />
                {errors.websiteLink && <p id="websiteLink-error" className="text-red-500 text-xs mt-1">{errors.websiteLink}</p>}
              </div>
              <div>
                <label htmlFor="linkedinLink" className="block text-sm font-medium text-gray-700 mb-2">LinkedIn Link</label>
                <input
                  id="linkedinLink"
                  type="url"
                  value={formData.linkedinLink}
                  onChange={(e) => setFormData({ ...formData, linkedinLink: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.linkedinLink ? 'border-red-500' : 'border-gray-300'}`}
                  aria-invalid={!!errors.linkedinLink}
                  aria-describedby={errors.linkedinLink ? 'linkedinLink-error' : undefined}
                />
                {errors.linkedinLink && <p id="linkedinLink-error" className="text-red-500 text-xs mt-1">{errors.linkedinLink}</p>}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-900 mb-4">Location Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="hoCity" className="block text-sm font-medium text-gray-700 mb-2">Head Office City *</label>
                <input
                  id="hoCity"
                  type="text"
                  value={formData.hoCity}
                  onChange={(e) => setFormData({ ...formData, hoCity: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.hoCity ? 'border-red-500' : 'border-gray-300'}`}
                  required
                  aria-invalid={!!errors.hoCity}
                  aria-describedby={errors.hoCity ? 'hoCity-error' : undefined}
                />
                {errors.hoCity && <p id="hoCity-error" className="text-red-500 text-xs mt-1">{errors.hoCity}</p>}
              </div>
              <div>
                <label htmlFor="presenceCities" className="block text-sm font-medium text-gray-700 mb-2">Presence Cities</label>
                <input
                  id="presenceCities"
                  type="text"
                  value={formData.presenceCities}
                  onChange={(e) => setFormData({ ...formData, presenceCities: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="e.g., Mumbai, Delhi, Bangalore"
                />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
            <h3 className="text-lg font-semibold text-orange-900 mb-4">Developer Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeTab === 'corporate' && (
                <div>
                  <label htmlFor="noOfBuildings" className="block text-sm font-medium text-gray-700 mb-2">No. of Buildings *</label>
                  <input
                    id="noOfBuildings"
                    type="number"
                    value={formData.noOfBuildings}
                    onChange={(e) => setFormData({ ...formData, noOfBuildings: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.noOfBuildings ? 'border-red-500' : 'border-gray-300'}`}
                    required
                    aria-invalid={!!errors.noOfBuildings}
                    aria-describedby={errors.noOfBuildings ? 'noOfBuildings-error' : undefined}
                  />
                  {errors.noOfBuildings && <p id="noOfBuildings-error" className="text-red-500 text-xs mt-1">{errors.noOfBuildings}</p>}
                </div>
              )}
              {activeTab === 'coworking' && (
                <div>
                  <label htmlFor="noOfCoworking" className="block text-sm font-medium text-gray-700 mb-2">No. of Coworking Spaces *</label>
                  <input
                    id="noOfCoworking"
                    type="number"
                    value={formData.noOfCoworking}
                    onChange={(e) => setFormData({ ...formData, noOfCoworking: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.noOfCoworking ? 'border-red-500' : 'border-gray-300'}`}
                    required
                    aria-invalid={!!errors.noOfCoworking}
                    aria-describedby={errors.noOfCoworking ? 'noOfCoworking-error' : undefined}
                  />
                  {errors.noOfCoworking && <p id="noOfCoworking-error" className="text-red-500 text-xs mt-1">{errors.noOfCoworking}</p>}
                </div>
              )}
              {activeTab === 'warehouse' && (
                <div>
                  <label htmlFor="noOfWarehouses" className="block text-sm font-medium text-gray-700 mb-2">No. of Warehouses *</label>
                  <input
                    id="noOfWarehouses"
                    type="number"
                    value={formData.noOfWarehouses}
                    onChange={(e) => setFormData({ ...formData, noOfWarehouses: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.noOfWarehouses ? 'border-red-500' : 'border-gray-300'}`}
                    required
                    aria-invalid={!!errors.noOfWarehouses}
                    aria-describedby={errors.noOfWarehouses ? 'noOfWarehouses-error' : undefined}
                  />
                  {errors.noOfWarehouses && <p id="noOfWarehouses-error" className="text-red-500 text-xs mt-1">{errors.noOfWarehouses}</p>}
                </div>
              )}
              {activeTab === 'mall' && (
                <div>
                  <label htmlFor="noOfMalls" className="block text-sm font-medium text-gray-700 mb-2">No. of Malls *</label>
                  <input
                    id="noOfMalls"
                    type="number"
                    value={formData.noOfMalls}
                    onChange={(e) => setFormData({ ...formData, noOfMalls: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.noOfMalls ? 'border-red-500' : 'border-gray-300'}`}
                    required
                    aria-invalid={!!errors.noOfMalls}
                    aria-describedby={errors.noOfMalls ? 'noOfMalls-error' : undefined}
                  />
                  {errors.noOfMalls && <p id="noOfMalls-error" className="text-red-500 text-xs mt-1">{errors.noOfMalls}</p>}
                </div>
              )}
              <div>
                <label htmlFor="buildingListLink" className="block text-sm font-medium text-gray-700 mb-2">Link to List of {activeTab === 'corporate' ? 'Buildings' : activeTab === 'coworking' ? 'Coworking Spaces' : activeTab === 'warehouse' ? 'Warehouses' : 'Malls'}</label>
                <input
                  id="buildingListLink"
                  type="url"
                  value={formData.buildingListLink}
                  onChange={(e) => setFormData({ ...formData, buildingListLink: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label htmlFor="contactListLink" className="block text-sm font-medium text-gray-700 mb-2">Link to Contact List</label>
                <input
                  id="contactListLink"
                  type="url"
                  value={formData.contactListLink}
                  onChange={(e) => setFormData({ ...formData, contactListLink: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => { setShowModal(false); resetForm(); }}
              className="px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl"
            >
              {editingItem ? `Update ${getTabLabel(activeTab).replace(' List', '')}` : `Create ${getTabLabel(activeTab).replace(' List', '')}`}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={`${getTabLabel(activeTab).replace(' List', '')} Details`}
        size="xl"
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Basic Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Name</label>
                  <p className="text-sm text-gray-900 font-medium">{selectedItem.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Grade</label>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                    selectedItem.grade === 'A' ? 'bg-green-100 text-green-800' :
                    selectedItem.grade === 'B' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    Grade {selectedItem.grade}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Common Contact</label>
                  <p className="text-sm text-gray-900">{selectedItem.contactNo}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Email ID</label>
                  <p className="text-sm text-gray-900">{selectedItem.emailId}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Online Presence</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Website Link</label>
                  <a href={selectedItem.websiteLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">{selectedItem.websiteLink}</a>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">LinkedIn Link</label>
                  {selectedItem.linkedinLink ? (
                    <a href={selectedItem.linkedinLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">{selectedItem.linkedinLink}</a>
                  ) : (
                    <p className="text-sm text-gray-900">N/A</p>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Location Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Head Office City</label>
                  <p className="text-sm text-gray-900">{selectedItem.hoCity}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Presence Cities</label>
                  <p className="text-sm text-gray-900">{selectedItem.presenceCities || 'N/A'}</p>
                </div>
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-medium text-orange-900 mb-2">Developer Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedItem.noOfBuildings && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">No. of Buildings</label>
                    <p className="text-sm text-gray-900">{selectedItem.noOfBuildings}</p>
                  </div>
                )}
                {selectedItem.noOfCoworking && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">No. of Coworking Spaces</label>
                    <p className="text-sm text-gray-900">{selectedItem.noOfCoworking}</p>
                  </div>
                )}
                {selectedItem.noOfWarehouses && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">No. of Warehouses</label>
                    <p className="text-sm text-gray-900">{selectedItem.noOfWarehouses}</p>
                  </div>
                )}
                {selectedItem.noOfMalls && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">No. of Malls</label>
                    <p className="text-sm text-gray-900">{selectedItem.noOfMalls}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-500">Link to List of {activeTab === 'corporate' ? 'Buildings' : activeTab === 'coworking' ? 'Coworking Spaces' : activeTab === 'warehouse' ? 'Warehouses' : 'Malls'}</label>
                  {selectedItem.buildingListLink ? (
                    <a href={selectedItem.buildingListLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">{selectedItem.buildingListLink}</a>
                  ) : (
                    <p className="text-sm text-gray-900">N/A</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Link to Contact List</label>
                  {selectedItem.contactListLink ? (
                    <a href={selectedItem.contactListLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">{selectedItem.contactListLink}</a>
                  ) : (
                    <p className="text-sm text-gray-900">N/A</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DevelopersManager;