import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, FileText, Building, Users, Package, ShoppingBag, Upload, Download } from 'lucide-react';
import DataTable from '../Common/DataTable';
import Modal from '../Common/Modal';
import { InventoryItem, PendingAction } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { exportToCSV, downloadTemplate } from '../../utils/exportUtils';

const createPendingAction = (type: 'create' | 'update' | 'delete', module: string, data: any, originalData?: any, user?: any) => {
  const pendingActions = JSON.parse(localStorage.getItem('pendingActions') || '[]');
  const newAction: PendingAction = {
    id: Date.now().toString(),
    type,
    module,
    data,
    originalData,
    requestedBy: user?.id || '',
    requestedByName: user?.name || '',
    requestedAt: new Date().toISOString(),
    status: 'pending'
  };
  pendingActions.push(newAction);
  localStorage.setItem('pendingActions', JSON.stringify(pendingActions));
};

const InventoryManager: React.FC = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [activeTab, setActiveTab] = useState<'corporate_building' | 'coworking_space' | 'warehouse' | 'retail_mall'>('corporate_building');

  const [formData, setFormData] = useState({
    type: 'corporate_building' as InventoryItem['type'],
    name: '',
    grade: 'A' as InventoryItem['grade'],
    developerOwnerName: '',
    contactNo: '',
    alternateContactNo: '',
    emailId: '',
    city: '',
    location: '',
    googleLocation: '',
    saleableArea: '',
    carpetArea: '',
    floor: '',
    height: '',
    typeOfFlooring: '',
    flooringSize: '',
    sideHeight: '',
    centreHeight: '',
    canopy: '',
    fireSprinklers: '',
    frontage: '',
    noOfSaleableSeats: '',
    terrace: '',
    type: '',
    specification: '',
    status: 'Available' as InventoryItem['status'],
    rentPerSqft: '',
    costPerSeat: '',
    camPerSqft: '',
    setupFeesInventory: '',
    agreementPeriod: '',
    lockInPeriod: '',
    noOfCarParks: ''
  });

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = () => {
    const storedInventory: InventoryItem[] = JSON.parse(localStorage.getItem('inventory') || '[]');
    setInventory(storedInventory);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allInventory: InventoryItem[] = JSON.parse(localStorage.getItem('inventory') || '[]');

    const inventoryData = {
      ...formData,
      noOfSaleableSeats: formData.noOfSaleableSeats ? parseInt(formData.noOfSaleableSeats) : undefined,
      rentPerSqft: formData.rentPerSqft ? parseFloat(formData.rentPerSqft) : undefined,
      costPerSeat: formData.costPerSeat ? parseFloat(formData.costPerSeat) : undefined,
      camPerSqft: formData.camPerSqft ? parseFloat(formData.camPerSqft) : undefined,
      setupFeesInventory: formData.setupFeesInventory ? parseFloat(formData.setupFeesInventory) : undefined,
      noOfCarParks: parseInt(formData.noOfCarParks) || 0
    };

    if (user?.role === 'employee') {
      // Create pending action for employee
      if (editingItem) {
        createPendingAction('update', 'inventory', { ...editingItem, ...inventoryData }, editingItem, user);
      } else {
        const newItem: InventoryItem = {
          id: Date.now().toString(),
          ...inventoryData,
          createdAt: new Date().toISOString().split('T')[0]
        };
        createPendingAction('create', 'inventory', newItem, undefined, user);
      }
      alert('Your request has been sent to admin for approval.');
    } else {
      // Admin can directly modify
      if (editingItem) {
        const updatedInventory = allInventory.map(item =>
          item.id === editingItem.id
            ? { ...item, ...inventoryData }
            : item
        );
        localStorage.setItem('inventory', JSON.stringify(updatedInventory));
      } else {
        const newItem: InventoryItem = {
          id: Date.now().toString(),
          ...inventoryData,
          createdAt: new Date().toISOString().split('T')[0]
        };
        allInventory.push(newItem);
        localStorage.setItem('inventory', JSON.stringify(allInventory));
      }
    }

    loadInventory();
    resetForm();
    setShowModal(false);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      type: item.type,
      name: item.name,
      grade: item.grade,
      developerOwnerName: item.developerOwnerName,
      contactNo: item.contactNo,
      alternateContactNo: item.alternateContactNo,
      emailId: item.emailId,
      city: item.city,
      location: item.location,
      googleLocation: item.googleLocation,
      saleableArea: item.saleableArea || '',
      carpetArea: item.carpetArea || '',
      floor: item.floor,
      height: item.height || '',
      typeOfFlooring: item.typeOfFlooring || '',
      flooringSize: item.flooringSize || '',
      sideHeight: item.sideHeight || '',
      centreHeight: item.centreHeight || '',
      canopy: item.canopy || '',
      fireSprinklers: item.fireSprinklers || '',
      frontage: item.frontage || '',
      noOfSaleableSeats: item.noOfSaleableSeats?.toString() || '',
      terrace: item.terrace || '',
      type: item.type,
      specification: item.specification,
      status: item.status,
      rentPerSqft: item.rentPerSqft?.toString() || '',
      costPerSeat: item.costPerSeat?.toString() || '',
      camPerSqft: item.camPerSqft?.toString() || '',
      setupFeesInventory: item.setupFeesInventory?.toString() || '',
      agreementPeriod: item.agreementPeriod,
      lockInPeriod: item.lockInPeriod,
      noOfCarParks: item.noOfCarParks.toString()
    });
    setShowModal(true);
  };

  const handleDelete = (item: InventoryItem) => {
    if (user?.role === 'employee') {
      if (window.confirm('Your delete request will be sent to admin for approval. Continue?')) {
        createPendingAction('delete', 'inventory', item, undefined, user);
        alert('Delete request sent to admin for approval.');
      }
    } else {
      if (window.confirm('Are you sure you want to delete this inventory item?')) {
        const allInventory: InventoryItem[] = JSON.parse(localStorage.getItem('inventory') || '[]');
        const updatedInventory = allInventory.filter(i => i.id !== item.id);
        localStorage.setItem('inventory', JSON.stringify(updatedInventory));
        loadInventory();
      }
    }
  };

  const handleViewDetails = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
  };

  const resetForm = () => {
    setFormData({
      type: activeTab,
      name: '',
      grade: 'A',
      developerOwnerName: '',
      contactNo: '',
      alternateContactNo: '',
      emailId: '',
      city: '',
      location: '',
      googleLocation: '',
      saleableArea: '',
      carpetArea: '',
      floor: '',
      height: '',
      typeOfFlooring: '',
      flooringSize: '',
      sideHeight: '',
      centreHeight: '',
      canopy: '',
      fireSprinklers: '',
      frontage: '',
      noOfSaleableSeats: '',
      terrace: '',
      type: '',
      specification: '',
      status: 'Available',
      rentPerSqft: '',
      costPerSeat: '',
      camPerSqft: '',
      setupFeesInventory: '',
      agreementPeriod: '',
      lockInPeriod: '',
      noOfCarParks: ''
    });
    setEditingItem(null);
  };

  const handleExport = () => {
    const filteredInventory = inventory.filter(item => item.type === activeTab);
    exportToCSV(filteredInventory, `${activeTab}_inventory`);
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
          
          const importedInventory = lines.slice(1)
            .filter(line => line.trim())
            .map(line => {
              const values = line.split(',');
              const item: Partial<InventoryItem> = {};
              headers.forEach((header, index) => {
                const key = header.trim() as keyof InventoryItem;
                if (key.includes('noOf') || key.includes('Seats')) {
                  (item as any)[key] = values[index] ? parseInt(values[index]) : undefined;
                } else if (key.includes('PerSqft') || key.includes('Cost') || key.includes('Fees')) {
                  (item as any)[key] = values[index] ? parseFloat(values[index]) : undefined;
                } else {
                  (item as any)[key] = values[index]?.trim();
                }
              });
              return {
                ...item,
                id: Date.now().toString() + Math.random(),
                type: activeTab,
                createdAt: new Date().toISOString().split('T')[0]
              } as InventoryItem;
            });

          if (user?.role === 'employee') {
            // Create pending actions for each imported item
            importedInventory.forEach(item => {
              createPendingAction('create', 'inventory', item, undefined, user);
            });
            alert(`${importedInventory.length} inventory items sent to admin for approval.`);
          } else {
            const allInventory: InventoryItem[] = JSON.parse(localStorage.getItem('inventory') || '[]');
            const updatedInventory = [...allInventory, ...importedInventory];
            localStorage.setItem('inventory', JSON.stringify(updatedInventory));
            loadInventory();
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const filteredInventory = inventory.filter(item => item.type === activeTab);

  const getColumns = () => {
    const baseColumns = [
      { key: 'name', label: 'Name', sortable: true },
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
      { key: 'developerOwnerName', label: 'Developer / Owner Name', sortable: true },
      { key: 'contactNo', label: 'Contact No.', sortable: true },
      { key: 'city', label: 'City', sortable: true },
      { key: 'location', label: 'Location', sortable: true }
    ];

    // Add type-specific columns
    if (activeTab === 'corporate_building' || activeTab === 'warehouse' || activeTab === 'retail_mall') {
      baseColumns.push({ key: 'saleableArea', label: 'Saleable Area', sortable: true });
      baseColumns.push({ key: 'carpetArea', label: 'Carpet Area', sortable: true });
    }
    
    if (activeTab === 'coworking_space') {
      baseColumns.push({ key: 'noOfSaleableSeats', label: 'No. of Saleable Seats', sortable: true });
    }

    baseColumns.push(
      { key: 'floor', label: 'Floor', sortable: true },
      { 
        key: 'status', 
        label: 'Status', 
        sortable: true,
        render: (value: string) => (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            value === 'Available' ? 'bg-green-100 text-green-800' :
            value === 'Occupied' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {value}
          </span>
        )
      }
    );

    return baseColumns;
  };

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

  const getTabLabel = (type: string) => {
    switch (type) {
      case 'corporate_building': return 'Corporate Building';
      case 'coworking_space': return 'Coworking Space';
      case 'warehouse': return 'Warehouse';
      case 'retail_mall': return 'Retail / Mall';
      default: return type;
    }
  };

  const getTabIcon = (type: string) => {
    switch (type) {
      case 'corporate_building': return <Building className="w-4 h-4" />;
      case 'coworking_space': return <Users className="w-4 h-4" />;
      case 'warehouse': return <Package className="w-4 h-4" />;
      case 'retail_mall': return <ShoppingBag className="w-4 h-4" />;
      default: return <Building className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Inventory List</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage inventory across different property types</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <button
            onClick={() => downloadTemplate('inventory')}
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
              setFormData({ ...formData, type: activeTab });
              setShowModal(true);
            }}
            className="inline-flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add {getTabLabel(activeTab)}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="flex space-x-4 sm:space-x-8 min-w-max">
          {[
            { id: 'corporate_building', label: 'Corporate Building' },
            { id: 'coworking_space', label: 'Coworking Space' },
            { id: 'warehouse', label: 'Warehouse' },
            { id: 'retail_mall', label: 'Retail / Mall' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {getTabIcon(tab.id)}
              <span>{tab.label}</span>
              <span className="bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                {inventory.filter(i => i.type === tab.id).length}
              </span>
            </button>
          ))}
        </nav>
      </div>

      <div className="overflow-hidden">
        <DataTable
          data={filteredInventory}
          columns={getColumns()}
          actions={actions}
          searchable={true}
          exportable={false}
          importable={false}
          title={`${getTabLabel(activeTab)} Inventory`}
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingItem ? `Edit ${getTabLabel(activeTab)}` : `Add ${getTabLabel(activeTab)}`}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade *
                </label>
                <select
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value as InventoryItem['grade'] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                >
                  <option value="A">Grade A</option>
                  <option value="B">Grade B</option>
                  <option value="C">Grade C</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {activeTab === 'corporate_building' ? 'Corporate Developer / Owner Name' :
                   activeTab === 'coworking_space' ? 'Coworking Developer / Owner Name' :
                   activeTab === 'warehouse' ? 'Warehouse Developer / Owner Name' :
                   'Developer / Owner Name'} *
                </label>
                <input
                  type="text"
                  value={formData.developerOwnerName}
                  onChange={(e) => setFormData({ ...formData, developerOwnerName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as InventoryItem['status'] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                >
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact No. *
                </label>
                <input
                  type="tel"
                  value={formData.contactNo}
                  onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alternate Contact No.
                </label>
                <input
                  type="tel"
                  value={formData.alternateContactNo}
                  onChange={(e) => setFormData({ ...formData, alternateContactNo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email ID *
                </label>
                <input
                  type="email"
                  value={formData.emailId}
                  onChange={(e) => setFormData({ ...formData, emailId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-900 mb-4">Location Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="https://maps.google.com/..."
                />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
            <h3 className="text-lg font-semibold text-orange-900 mb-4">Property Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(activeTab === 'corporate_building' || activeTab === 'warehouse' || activeTab === 'retail_mall') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Saleable Area
                    </label>
                    <input
                      type="text"
                      value={formData.saleableArea}
                      onChange={(e) => setFormData({ ...formData, saleableArea: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Carpet Area
                    </label>
                    <input
                      type="text"
                      value={formData.carpetArea}
                      onChange={(e) => setFormData({ ...formData, carpetArea: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </>
              )}
              
              {activeTab === 'coworking_space' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    No. of Saleable Seats
                  </label>
                  <input
                    type="number"
                    value={formData.noOfSaleableSeats}
                    onChange={(e) => setFormData({ ...formData, noOfSaleableSeats: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Floor *
                </label>
                <input
                  type="text"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
              </div>

              {(activeTab === 'corporate_building' || activeTab === 'retail_mall') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Height
                  </label>
                  <input
                    type="text"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              )}

              {activeTab === 'warehouse' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type of Flooring
                    </label>
                    <input
                      type="text"
                      value={formData.typeOfFlooring}
                      onChange={(e) => setFormData({ ...formData, typeOfFlooring: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Flooring Size
                    </label>
                    <input
                      type="text"
                      value={formData.flooringSize}
                      onChange={(e) => setFormData({ ...formData, flooringSize: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Side Height
                    </label>
                    <input
                      type="text"
                      value={formData.sideHeight}
                      onChange={(e) => setFormData({ ...formData, sideHeight: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Centre Height
                    </label>
                    <input
                      type="text"
                      value={formData.centreHeight}
                      onChange={(e) => setFormData({ ...formData, centreHeight: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Canopy
                    </label>
                    <input
                      type="text"
                      value={formData.canopy}
                      onChange={(e) => setFormData({ ...formData, canopy: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fire Sprinklers
                    </label>
                    <input
                      type="text"
                      value={formData.fireSprinklers}
                      onChange={(e) => setFormData({ ...formData, fireSprinklers: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </>
              )}

              {activeTab === 'retail_mall' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frontage
                  </label>
                  <input
                    type="text"
                    value={formData.frontage}
                    onChange={(e) => setFormData({ ...formData, frontage: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Terrace
                </label>
                <input
                  type="text"
                  value={formData.terrace}
                  onChange={(e) => setFormData({ ...formData, terrace: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type *
                </label>
                <input
                  type="text"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specification *
                </label>
                <textarea
                  value={formData.specification}
                  onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-lg border border-red-200">
            <h3 className="text-lg font-semibold text-red-900 mb-4">Pricing & Agreement Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {activeTab === 'warehouse' ? 'Cost Per Seat' : 'Rent Per Sqft'}
                </label>
                <input
                  type="number"
                  value={activeTab === 'warehouse' ? formData.costPerSeat : formData.rentPerSqft}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    ...(activeTab === 'warehouse' 
                      ? { costPerSeat: e.target.value } 
                      : { rentPerSqft: e.target.value })
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              
              {activeTab !== 'warehouse' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CAM Per Sqft
                  </label>
                  <input
                    type="number"
                    value={formData.camPerSqft}
                    onChange={(e) => setFormData({ ...formData, camPerSqft: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              )}

              {activeTab === 'warehouse' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Setup Fees
                  </label>
                  <input
                    type="number"
                    value={formData.setupFeesInventory}
                    onChange={(e) => setFormData({ ...formData, setupFeesInventory: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agreement Period *
                </label>
                <input
                  type="text"
                  value={formData.agreementPeriod}
                  onChange={(e) => setFormData({ ...formData, agreementPeriod: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lock-in Period *
                </label>
                <input
                  type="text"
                  value={formData.lockInPeriod}
                  onChange={(e) => setFormData({ ...formData, lockInPeriod: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  No. of Car Parks *
                </label>
                <input
                  type="number"
                  value={formData.noOfCarParks}
                  onChange={(e) => setFormData({ ...formData, noOfCarParks: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
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
              {editingItem ? `Update ${getTabLabel(activeTab)}` : `Create ${getTabLabel(activeTab)}`}
            </button>
          </div>
        </form>
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={`${getTabLabel(activeTab)} Details`}
        size="xl"
      >
        {selectedItem && (
          <div className="space-y-6">
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
                <label className="block text-sm font-medium text-gray-500">Developer / Owner Name</label>
                <p className="text-sm text-gray-900">{selectedItem.developerOwnerName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                  selectedItem.status === 'Available' ? 'bg-green-100 text-green-800' :
                  selectedItem.status === 'Occupied' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {selectedItem.status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Contact No.</label>
                <p className="text-sm text-gray-900">{selectedItem.contactNo}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Email ID</label>
                <p className="text-sm text-gray-900">{selectedItem.emailId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">City</label>
                <p className="text-sm text-gray-900">{selectedItem.city}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Location</label>
                <p className="text-sm text-gray-900">{selectedItem.location}</p>
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-medium text-orange-900 mb-2">Property Details</h4>
              <div className="grid grid-cols-2 gap-4">
                {selectedItem.saleableArea && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Saleable Area</label>
                    <p className="text-sm text-gray-900">{selectedItem.saleableArea}</p>
                  </div>
                )}
                {selectedItem.noOfSaleableSeats && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">No. of Saleable Seats</label>
                    <p className="text-sm text-gray-900">{selectedItem.noOfSaleableSeats}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-500">Floor</label>
                  <p className="text-sm text-gray-900">{selectedItem.floor}</p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-medium text-red-900 mb-2">Pricing & Agreement</h4>
              <div className="grid grid-cols-2 gap-4">
                {selectedItem.rentPerSqft && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Rent Per Sqft</label>
                    <p className="text-sm text-gray-900">₹{selectedItem.rentPerSqft}</p>
                  </div>
                )}
                {selectedItem.costPerSeat && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Cost Per Seat</label>
                    <p className="text-sm text-gray-900">₹{selectedItem.costPerSeat}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-500">Agreement Period</label>
                  <p className="text-sm text-gray-900">{selectedItem.agreementPeriod}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Lock-in Period</label>
                  <p className="text-sm text-gray-900">{selectedItem.lockInPeriod}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Specification</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{selectedItem.specification}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InventoryManager;