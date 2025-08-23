
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, FileText, Building, Users, Package, ShoppingBag, Upload, Download } from 'lucide-react';
import DataTable from '../Common/DataTable';
import Modal from '../Common/Modal';
import { ProjectMaster, PendingAction } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { exportToCSV, downloadTemplate } from '../../utils/exportUtils';

// Define section configuration for each project type
const sectionConfig = {
  corporate_building: {
    showBasicInfo: true,
    showContactInfo: true,
    showLocationDetails: true,
    showTypeSpecificFields: true,
    showPricingInfo: true,
    showAdditionalInfo: true,
  },
  coworking_space: {
    showBasicInfo: true,
    showContactInfo: true,
    showLocationDetails: true,
    showTypeSpecificFields: true,
    showPricingCoworkingSpace: true,
    showPricingInfo: false,
    showAdditionalInfo: true,
  },
  warehouse: {
    showBasicInfo: true,
    showContactInfo: true,
    showLocationDetails: true,
    showTypeSpecificFields: true,
    showPricingInfo: true,
    showAdditionalInfo: true,
  },
  retail_mall: {
    showBasicInfo: true,
    showContactInfo: true,
    showLocationDetails: true,
    showTypeSpecificFields: true,
    showPricingInfo: true,
    showAdditionalInfo: true,
  },
};

// Function to create pending actions for employees
const createPendingAction = (
  type: 'create' | 'update' | 'delete',
  module: string,
  data: any,
  originalData?: any,
  user?: any
) => {
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
    requestedBy: user.id || '',
    requestedByName: user.name || '',
    requestedAt: new Date().toISOString(),
    status: 'pending',
  };
  pendingActions.push(newAction);
  localStorage.setItem('pendingActions', JSON.stringify(pendingActions));
};

const ProjectsManager: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectMaster[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectMaster | null>(null);
  const [editingProject, setEditingProject] = useState<ProjectMaster | null>(null);
  const [activeTab, setActiveTab] = useState<'corporate_building' | 'coworking_space' | 'warehouse' | 'retail_mall'>(
    'corporate_building'
  );

  const [formData, setFormData] = useState({
    type: 'corporate_building' as ProjectMaster['type'],
    name: '',
    grade: 'A' as ProjectMaster['grade'],
    developerOwner: '',
    contactNo: '',
    alternateNo: '',
    email: '',
    city: '',
    location: '',
    landmark: '',
    googleLocation: '',
    noOfFloors: '',
    floorPlate: '',
    noOfSeats: '',
    availabilityOfSeats: '',
    perOpenDeskCost: '',
    perDedicatedDeskCost: '',
    setupFees: '',
    noOfWarehouses: '',
    warehouseSize: '',
    totalArea: '',
    efficiency: '',
    floorPlateArea: '',
    rentPerSqft: '',
    camPerSqft: '',
    amenities: '',
    remark: '',
    status: 'Active' as ProjectMaster['status'],
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    const storedProjects: ProjectMaster[] = JSON.parse(localStorage.getItem('projects') || '[]');
    setProjects(storedProjects);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation for required fields
    const requiredFields = ['name', 'developerOwner', 'contactNo', 'email', 'city', 'location'];
    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        alert(`${field.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())} is required.`);
        return;
      }
    }

    // Validation for coworking_space
    if (formData.type === 'coworking_space' && formData.noOfSeats && formData.availabilityOfSeats) {
      const noOfSeats = parseInt(formData.noOfSeats);
      const availabilityOfSeats = parseInt(formData.availabilityOfSeats);
      if (isNaN(noOfSeats) || isNaN(availabilityOfSeats)) {
        alert('Number of Seats and Availability of Seats must be valid numbers.');
        return;
      }
      if (availabilityOfSeats > noOfSeats) {
        alert('Availability of Seats cannot exceed Number of Seats.');
        return;
      }
    }

    const projectData = {
      ...formData,
      noOfFloors: formData.noOfFloors ? parseInt(formData.noOfFloors) || undefined : undefined,
      noOfSeats: formData.noOfSeats ? parseInt(formData.noOfSeats) || undefined : undefined,
      availabilityOfSeats: formData.availabilityOfSeats ? parseInt(formData.availabilityOfSeats) || undefined : undefined,
      perOpenDeskCost: formData.perOpenDeskCost ? parseFloat(formData.perOpenDeskCost) || undefined : undefined,
      perDedicatedDeskCost: formData.perDedicatedDeskCost
        ? parseFloat(formData.perDedicatedDeskCost) || undefined
        : undefined,
      setupFees: formData.setupFees ? parseFloat(formData.setupFees) || undefined : undefined,
      noOfWarehouses: formData.noOfWarehouses ? parseInt(formData.noOfWarehouses) || undefined : undefined,
      rentPerSqft: parseFloat(formData.rentPerSqft) || 0,
      camPerSqft: parseFloat(formData.camPerSqft) || 0,
    };

    const allProjects: ProjectMaster[] = JSON.parse(localStorage.getItem('projects') || '[]');

    if (user?.role === 'employee') {
      if (editingProject) {
        createPendingAction('update', 'projects', { ...editingProject, ...projectData }, editingProject, user);
      } else {
        const newProject: ProjectMaster = {
          id: Date.now().toString(),
          ...projectData,
          createdAt: new Date().toISOString().split('T')[0],
        };
        createPendingAction('create', 'projects', newProject, undefined, user);
      }
      alert('Your request has been sent to admin for approval.');
    } else {
      if (editingProject) {
        const updatedProjects = allProjects.map((project) =>
          project.id === editingProject.id ? { ...project, ...projectData } : project
        );
        localStorage.setItem('projects', JSON.stringify(updatedProjects));
      } else {
        const newProject: ProjectMaster = {
          id: Date.now().toString(),
          ...projectData,
          createdAt: new Date().toISOString().split('T')[0],
        };
        allProjects.push(newProject);
        localStorage.setItem('projects', JSON.stringify(allProjects));
      }
    }

    loadProjects();
    resetForm();
    setShowModal(false);
  };

  const handleEdit = (project: ProjectMaster) => {
    setEditingProject(project);
    setFormData({
      type: project.type,
      name: project.name,
      grade: project.grade,
      developerOwner: project.developerOwner,
      contactNo: project.contactNo,
      alternateNo: project.alternateNo || '',
      email: project.email,
      city: project.city,
      location: project.location,
      landmark: project.landmark || '',
      googleLocation: project.googleLocation || '',
      noOfFloors: project.noOfFloors?.toString() || '',
      floorPlate: project.floorPlate || '',
      noOfSeats: project.noOfSeats?.toString() || '',
      availabilityOfSeats: project.availabilityOfSeats?.toString() || '',
      perOpenDeskCost: project.perOpenDeskCost?.toString() || '',
      perDedicatedDeskCost: project.perDedicatedDeskCost?.toString() || '',
      setupFees: project.setupFees?.toString() || '',
      noOfWarehouses: project.noOfWarehouses?.toString() || '',
      warehouseSize: project.warehouseSize || '',
      totalArea: project.totalArea || '',
      efficiency: project.efficiency || '',
      floorPlateArea: project.floorPlateArea || '',
      rentPerSqft: project.rentPerSqft.toString(),
      camPerSqft: project.camPerSqft.toString(),
      amenities: project.amenities || '',
      remark: project.remark || '',
      status: project.status,
    });
    setShowModal(true);
  };

  const handleDelete = (project: ProjectMaster) => {
    if (user?.role === 'employee') {
      if (window.confirm('Your delete request will be sent to admin for approval. Continue?')) {
        createPendingAction('delete', 'projects', project, undefined, user);
        alert('Delete request sent to admin for approval.');
      }
    } else {
      if (window.confirm('Are you sure you want to delete this project?')) {
        const allProjects: ProjectMaster[] = JSON.parse(localStorage.getItem('projects') || '[]');
        const updatedProjects = allProjects.filter((p) => p.id !== project.id);
        localStorage.setItem('projects', JSON.stringify(updatedProjects));
        loadProjects();
      }
    }
  };

  const handleViewDetails = (project: ProjectMaster) => {
    setSelectedProject(project);
    setShowDetailsModal(true);
  };

  const resetForm = () => {
    setFormData({
      type: activeTab,
      name: '',
      grade: 'A',
      developerOwner: '',
      contactNo: '',
      alternateNo: '',
      email: '',
      city: '',
      location: '',
      landmark: '',
      googleLocation: '',
      noOfFloors: '',
      floorPlate: '',
      noOfSeats: '',
      availabilityOfSeats: '',
      perOpenDeskCost: '',
      perDedicatedDeskCost: '',
      setupFees: '',
      noOfWarehouses: '',
      warehouseSize: '',
      totalArea: '',
      efficiency: '',
      floorPlateArea: '',
      rentPerSqft: '',
      camPerSqft: '',
      amenities: '',
      remark: '',
      status: 'Active',
    });
    setEditingProject(null);
  };

  const handleExport = () => {
    const filteredProjects = projects.filter((project) => project.type === activeTab);
    exportToCSV(filteredProjects, `${activeTab}_projects`);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target?.result as string;
        const lines = csv.split('\n').filter((line) => line.trim());
        if (lines.length < 1) {
          alert('Empty or invalid CSV file.');
          return;
        }

        const headers = lines[0].split(',').map((h) => h.trim());
        const requiredHeaders = ['name', 'grade', 'developerOwner', 'contactNo', 'city', 'location'];
        const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
        if (missingHeaders.length > 0) {
          alert(`Missing required headers: ${missingHeaders.join(', ')}`);
          return;
        }

        const importedProjects = lines.slice(1).map((line) => {
          const values = line.split(',').map((v) => v.trim());
          const project: Partial<ProjectMaster> = {};
          headers.forEach((header, index) => {
            const key = header as keyof ProjectMaster;
            if (['noOfFloors', 'noOfSeats', 'availabilityOfSeats', 'noOfWarehouses'].includes(key)) {
              (project as any)[key] = values[index] ? parseInt(values[index]) || undefined : undefined;
            } else if (
              ['perOpenDeskCost', 'perDedicatedDeskCost', 'setupFees', 'rentPerSqft', 'camPerSqft'].includes(key)
            ) {
              (project as any)[key] = values[index] ? parseFloat(values[index]) || undefined : undefined;
            } else {
              (project as any)[key] = values[index] || '';
            }
          });
          return {
            ...project,
            id: Date.now().toString() + Math.random(),
            type: activeTab,
            createdAt: new Date().toISOString().split('T')[0],
          } as ProjectMaster;
        });

        if (user?.role === 'employee') {
          importedProjects.forEach((project) => {
            createPendingAction('create', 'projects', project, undefined, user);
          });
          alert(`${importedProjects.length} projects sent to admin for approval.`);
        } else {
          const allProjects: ProjectMaster[] = JSON.parse(localStorage.getItem('projects') || '[]');
          const updatedProjects = [...allProjects, ...importedProjects];
          localStorage.setItem('projects', JSON.stringify(updatedProjects));
          loadProjects();
        }
      };
      reader.onerror = () => alert('Error reading CSV file.');
      reader.readAsText(file);
    };
    input.click();
  };

  const filteredProjects = projects.filter((project) => project.type === activeTab);

  const getColumns = () => {
    const baseColumns = [
      { key: 'name', label: 'Name', sortable: true },
      {
        key: 'grade',
        label: 'Grade',
        sortable: true,
        render: (value: string) => (
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              value === 'A' ? 'bg-green-100 text-green-800' : value === 'B' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
            }`}
          >
            Grade {value}
          </span>
        ),
      },
      { key: 'developerOwner', label: 'Developer / Owner', sortable: true },
      { key: 'contactNo', label: 'Contact No.', sortable: true },
      { key: 'city', label: 'City', sortable: true },
      { key: 'location', label: 'Location', sortable: true },
      { key: 'landmark', label: 'Landmark', sortable: true },
    ];

    if (activeTab === 'corporate_building') {
      baseColumns.push(
        { key: 'noOfFloors', label: 'No. of Floors', sortable: true },
        { key: 'floorPlate', label: 'Floor Plate', sortable: true },
        { key: 'rentPerSqft', label: 'Rent (per Sq.ft)', sortable: true },
        { key: 'camPerSqft', label: 'CAM (per Sq.ft)', sortable: true }
      );
    } else if (activeTab === 'coworking_space') {
      baseColumns.push(
        { key: 'noOfSeats', label: 'No. of Seats', sortable: true },
        { key: 'availabilityOfSeats', label: 'Availability of Seats', sortable: true }
      );
    } else if (activeTab === 'warehouse') {
      baseColumns.push(
        { key: 'noOfWarehouses', label: 'No. of Warehouses', sortable: true },
        { key: 'warehouseSize', label: 'Warehouse Size', sortable: true }
      );
    } else if (activeTab === 'retail_mall') {
      baseColumns.push(
        { key: 'totalArea', label: 'Total Area', sortable: true },
        { key: 'efficiency', label: 'Efficiency', sortable: true }
      );
    }

    baseColumns.push({
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            value === 'Active' ? 'bg-green-100 text-green-800' : value === 'Inactive' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {value}
        </span>
      ),
    });

    return baseColumns;
  };

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

  const getTabLabel = (type: string) => {
    switch (type) {
      case 'corporate_building':
        return 'Corporate Building';
      case 'coworking_space':
        return 'Coworking Space';
      case 'warehouse':
        return 'Warehouse';
      case 'retail_mall':
        return 'Retail / Mall';
      default:
        return type;
    }
  };

  const getTabIcon = (type: string) => {
    switch (type) {
      case 'corporate_building':
        return <Building className="w-4 h-4" />;
      case 'coworking_space':
        return <Users className="w-4 h-4" />;
      case 'warehouse':
        return <Package className="w-4 h-4" />;
      case 'retail_mall':
        return <ShoppingBag className="w-4 h-4" />;
      default:
        return <Building className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Project Master</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage project master data across different categories</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <button
            onClick={() => downloadTemplate('projects')}
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
            { id: 'retail_mall', label: 'Retail / Mall' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'corporate_building' | 'coworking_space' | 'warehouse' | 'retail_mall')}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {getTabIcon(tab.id)}
              <span>{tab.label}</span>
              <span className="bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                {projects.filter((p) => p.type === tab.id).length}
              </span>
            </button>
          ))}
        </nav>
      </div>

      <div className="overflow-hidden">
        <DataTable
          data={filteredProjects}
          columns={getColumns()}
          actions={actions}
          searchable={true}
          exportable={false}
          importable={false}
          title={`${getTabLabel(activeTab)} Projects`}
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingProject ? `Edit ${getTabLabel(activeTab)}` : `Add ${getTabLabel(activeTab)}`}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Section */}
          {sectionConfig[activeTab].showBasicInfo && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    {getTabLabel(activeTab)} Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
                    Grade *
                  </label>
                  <select
                    id="grade"
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value as ProjectMaster['grade'] })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  >
                    <option value="A">Grade A</option>
                    <option value="B">Grade B</option>
                    <option value="C">Grade C</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="developerOwner" className="block text-sm font-medium text-gray-700 mb-2">
                    Developer / Owner *
                  </label>
                  <input
                    id="developerOwner"
                    type="text"
                    value={formData.developerOwner}
                    onChange={(e) => setFormData({ ...formData, developerOwner: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectMaster['status'] })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Under Construction">Under Construction</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Contact Information Section */}
          {sectionConfig[activeTab].showContactInfo && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold text-green-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contactNo" className="block text-sm font-medium text-gray-700 mb-2">
                    Contact No. *
                  </label>
                  <input
                    id="contactNo"
                    type="tel"
                    value={formData.contactNo}
                    onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
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
                    value={formData.alternateNo}
                    onChange={(e) => setFormData({ ...formData, alternateNo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Location Details Section */}
          {sectionConfig[activeTab].showLocationDetails && (
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
              <h3 className="text-lg font-semibold text-purple-900 mb-4">Location Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <input
                    id="location"
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="landmark" className="block text-sm font-medium text-gray-700 mb-2">
                    Landmarks
                  </label>
                  <input
                    id="landmark"
                    type="text"
                    value={formData.landmark}
                    onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="googleLocation" className="block text-sm font-medium text-gray-700 mb-2">
                    Google Location
                  </label>
                  <input
                    id="googleLocation"
                    type="url"
                    value={formData.googleLocation}
                    onChange={(e) => setFormData({ ...formData, googleLocation: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="https://maps.google.com/..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Type-specific fields */}
          {sectionConfig[activeTab].showTypeSpecificFields && (
            <>
              {activeTab === 'corporate_building' && (
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
                  <h3 className="text-lg font-semibold text-orange-900 mb-4">Corporate Building Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="noOfFloors" className="block text-sm font-medium text-gray-700 mb-2">
                        No. of Floors
                      </label>
                      <input
                        id="noOfFloors"
                        type="number"
                        value={formData.noOfFloors}
                        onChange={(e) => setFormData({ ...formData, noOfFloors: e.target.value })}
                        min="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="floorPlate" className="block text-sm font-medium text-gray-700 mb-2">
                        Floor Plate Size
                      </label>
                      <input
                        id="floorPlate"
                        type="text"
                        value={formData.floorPlate}
                        onChange={(e) => setFormData({ ...formData, floorPlate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'coworking_space' && (
                <>
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
                    <h3 className="text-lg font-semibold text-orange-900 mb-4">Coworking Space Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="noOfSeats" className="block text-sm font-medium text-gray-700 mb-2">
                          No. of Seats
                        </label>
                        <input
                          id="noOfSeats"
                          type="number"
                          value={formData.noOfSeats}
                          onChange={(e) => setFormData({ ...formData, noOfSeats: e.target.value })}
                          min="0"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="availabilityOfSeats" className="block text-sm font-medium text-gray-700 mb-2">
                          Availability of Seats
                        </label>
                        <input
                          id="availabilityOfSeats"
                          type="number"
                          value={formData.availabilityOfSeats}
                          onChange={(e) => setFormData({ ...formData, availabilityOfSeats: e.target.value })}
                          min="0"
                          max={formData.noOfSeats || undefined}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-4 rounded-lg border border-rose-200 mt-6">
                    <h3 className="text-lg font-semibold text-rose-900 mb-4">Pricing Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="perOpenDeskCost" className="block text-sm font-medium text-gray-700 mb-2">
                          Per Open Desk Cost
                        </label>
                        <input
                          id="perOpenDeskCost"
                          type="number"
                          value={formData.perOpenDeskCost}
                          onChange={(e) => setFormData({ ...formData, perOpenDeskCost: e.target.value })}
                          min="0"
                          step="0.01"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="perDedicatedDeskCost" className="block text-sm font-medium text-gray-700 mb-2">
                          Per Dedicated Desk Cost
                        </label>
                        <input
                          id="perDedicatedDeskCost"
                          type="number"
                          value={formData.perDedicatedDeskCost}
                          onChange={(e) => setFormData({ ...formData, perDedicatedDeskCost: e.target.value })}
                          min="0"
                          step="0.01"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label htmlFor="setupFees" className="block text-sm font-medium text-gray-700 mb-2">
                          Setup Fees
                        </label>
                        <input
                          id="setupFees"
                          type="number"
                          value={formData.setupFees}
                          onChange={(e) => setFormData({ ...formData, setupFees: e.target.value })}
                          min="0"
                          step="0.01"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'warehouse' && (
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
                  <h3 className="text-lg font-semibold text-orange-900 mb-4">Warehouse Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="noOfWarehouses" className="block text-sm font-medium text-gray-700 mb-2">
                        No. of Warehouses
                      </label>
                      <input
                        id="noOfWarehouses"
                        type="number"
                        value={formData.noOfWarehouses}
                        onChange={(e) => setFormData({ ...formData, noOfWarehouses: e.target.value })}
                        min="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="warehouseSize" className="block text-sm font-medium text-gray-700 mb-2">
                        Warehouse Size
                      </label>
                      <input
                        id="warehouseSize"
                        type="text"
                        value={formData.warehouseSize}
                        onChange={(e) => setFormData({ ...formData, warehouseSize: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'retail_mall' && (
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
                  <h3 className="text-lg font-semibold text-orange-900 mb-4">Retail / Mall Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="totalArea" className="block text-sm font-medium text-gray-700 mb-2">
                        Total Area
                      </label>
                      <input
                        id="totalArea"
                        type="text"
                        value={formData.totalArea}
                        onChange={(e) => setFormData({ ...formData, totalArea: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="efficiency" className="block text-sm font-medium text-gray-700 mb-2">
                        Efficiency
                      </label>
                      <input
                        id="efficiency"
                        type="text"
                        value={formData.efficiency}
                        onChange={(e) => setFormData({ ...formData, efficiency: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="floorPlateArea" className="block text-sm font-medium text-gray-700 mb-2">
                        Floor Plate Area
                      </label>
                      <input
                        id="floorPlateArea"
                        type="text"
                        value={formData.floorPlateArea}
                        onChange={(e) => setFormData({ ...formData, floorPlateArea: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Pricing Information Section */}
          {sectionConfig[activeTab].showPricingInfo && (
            <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-4 rounded-lg border border-rose-200">
              <h3 className="text-lg font-semibold text-rose-900 mb-4">Pricing Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="rentPerSqft" className="block text-sm font-medium text-gray-700 mb-2">
                    Rent (per Sq.ft) *
                  </label>
                  <input
                    id="rentPerSqft"
                    type="number"
                    value={formData.rentPerSqft}
                    onChange={(e) => setFormData({ ...formData, rentPerSqft: e.target.value })}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="camPerSqft" className="block text-sm font-medium text-gray-700 mb-2">
                    CAM (per Sq.ft) *
                  </label>
                  <input
                    id="camPerSqft"
                    type="number"
                    value={formData.camPerSqft}
                    onChange={(e) => setFormData({ ...formData, camPerSqft: e.target.value })}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Additional Information Section */}
          {sectionConfig[activeTab].showAdditionalInfo && (
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="amenities" className="block text-sm font-medium text-gray-700 mb-2">
                    Amenities
                  </label>
                  <textarea
                    id="amenities"
                    value={formData.amenities}
                    onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    rows={3}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="remark" className="block text-sm font-medium text-gray-700 mb-2">
                    Remark
                  </label>
                  <textarea
                    id="remark"
                    value={formData.remark}
                    onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    rows={3}
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
              {editingProject ? 'Save Changes' : 'Add Project'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Details Modal */}
      {selectedProject && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedProject(null);
          }}
          title={`Project Details: ${selectedProject.name}`}
          size="lg"
        >
          <div className="space-y-4">
            {Object.entries(selectedProject).map(([key, value]) => {
              if (key === 'id' || key === 'createdAt' || !value) return null;
              const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
              return (
                <div key={key} className="flex flex-col sm:flex-row">
                  <p className="w-full sm:w-1/3 text-sm font-semibold text-gray-600">{formattedKey}:</p>
                  <p className="w-full sm:w-2/3 text-sm text-gray-800">{value.toString()}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => {
                setShowDetailsModal(false);
                setSelectedProject(null);
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

export default ProjectsManager;
