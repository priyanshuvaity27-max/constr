import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, FileText } from 'lucide-react';
import DataTable from '../Common/DataTable';
import Modal from '../Common/Modal';
import { Entity, Developer } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { exportToCSV, downloadTemplate } from '../../utils/exportUtils';

const EntitiesManager: React.FC = () => {
  const { user } = useAuth();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);

  const [formData, setFormData] = useState({
    type: 'Project' as Entity['type'],
    name: '',
    location: '',
    area: '',
    developer: '',
    startDate: '',
    endDate: '',
    status: 'Planning' as Entity['status'],
    description: '',
    budget: ''
  });

  useEffect(() => {
    loadEntities();
    loadDevelopers();
  }, [user]);

  const loadEntities = () => {
    const storedEntities: Entity[] = JSON.parse(localStorage.getItem('entities') || '[]');
    const filteredEntities = user?.role === 'admin' 
      ? storedEntities 
      : storedEntities.filter(entity => entity.developer === user?.id);
    setEntities(filteredEntities);
  };

  const loadDevelopers = () => {
    const storedDevelopers: Developer[] = JSON.parse(localStorage.getItem('developers') || '[]');
    setDevelopers(storedDevelopers.filter(d => d.status === 'active'));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allEntities: Entity[] = JSON.parse(localStorage.getItem('entities') || '[]');
    
    const assignedDeveloper = developers.find(d => d.id === formData.developer);
    
    if (editingEntity) {
      const updatedEntities = allEntities.map(entity =>
        entity.id === editingEntity.id
          ? {
              ...entity,
              ...formData,
              developerName: assignedDeveloper?.name,
              budget: formData.budget ? parseFloat(formData.budget) : undefined
            }
          : entity
      );
      localStorage.setItem('entities', JSON.stringify(updatedEntities));
    } else {
      const newEntity: Entity = {
        id: Date.now().toString(),
        ...formData,
        developerName: assignedDeveloper?.name,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        createdAt: new Date().toISOString().split('T')[0]
      };
      allEntities.push(newEntity);
      localStorage.setItem('entities', JSON.stringify(allEntities));
    }

    loadEntities();
    resetForm();
    setShowModal(false);
  };

  const handleEdit = (entity: Entity) => {
    setEditingEntity(entity);
    setFormData({
      type: entity.type,
      name: entity.name,
      location: entity.location,
      area: entity.area,
      developer: entity.developer,
      startDate: entity.startDate,
      endDate: entity.endDate,
      status: entity.status,
      description: entity.description,
      budget: entity.budget?.toString() || ''
    });
    setShowModal(true);
  };

  const handleDelete = (entity: Entity) => {
    if (window.confirm('Are you sure you want to delete this entity?')) {
      const allEntities: Entity[] = JSON.parse(localStorage.getItem('entities') || '[]');
      const updatedEntities = allEntities.filter(e => e.id !== entity.id);
      localStorage.setItem('entities', JSON.stringify(updatedEntities));
      loadEntities();
    }
  };

  const handleViewDetails = (entity: Entity) => {
    setSelectedEntity(entity);
    setShowDetailsModal(true);
  };

  const resetForm = () => {
    setFormData({
      type: 'Project',
      name: '',
      location: '',
      area: '',
      developer: '',
      startDate: '',
      endDate: '',
      status: 'Planning',
      description: '',
      budget: ''
    });
    setEditingEntity(null);
  };

  const handleExport = () => {
    exportToCSV(entities, 'entities');
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
          
          const importedEntities = lines.slice(1)
            .filter(line => line.trim())
            .map(line => {
              const values = line.split(',');
              const entity: Partial<Entity> = {};
              headers.forEach((header, index) => {
                const key = header.trim() as keyof Entity;
                if (key === 'budget') {
                  entity[key] = values[index] ? parseFloat(values[index]) : undefined;
                } else {
                  (entity as any)[key] = values[index]?.trim();
                }
              });
              return {
                ...entity,
                id: Date.now().toString() + Math.random(),
                createdAt: new Date().toISOString().split('T')[0]
              } as Entity;
            });

          const allEntities: Entity[] = JSON.parse(localStorage.getItem('entities') || '[]');
          const updatedEntities = [...allEntities, ...importedEntities];
          localStorage.setItem('entities', JSON.stringify(updatedEntities));
          loadEntities();
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { 
      key: 'type', 
      label: 'Type', 
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          value === 'Project' ? 'bg-blue-100 text-blue-800' :
          value === 'Property' ? 'bg-green-100 text-green-800' :
          value === 'Site Visit' ? 'bg-orange-100 text-orange-800' :
          'bg-purple-100 text-purple-800'
        }`}>
          {value}
        </span>
      )
    },
    { key: 'location', label: 'Location', sortable: true },
    { key: 'area', label: 'Area', sortable: true },
    { key: 'developerName', label: 'Developer', sortable: true },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          value === 'Planning' ? 'bg-yellow-100 text-yellow-800' :
          value === 'Ongoing' ? 'bg-blue-100 text-blue-800' :
          value === 'Completed' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          {value}
        </span>
      )
    },
    { 
      key: 'budget', 
      label: 'Budget', 
      sortable: true,
      render: (value: number) => value ? `₹${value.toLocaleString()}` : '-'
    },
    { key: 'startDate', label: 'Start Date', sortable: true },
    { key: 'endDate', label: 'End Date', sortable: true }
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
            {user?.role === 'admin' ? 'Projects & Entities' : 'My Projects'}
          </h1>
          <p className="text-gray-600">Manage projects, properties, and other entities</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => downloadTemplate('entities')}
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
            <span>Add Entity</span>
          </button>
        </div>
      </div>

      <DataTable
        data={entities}
        columns={columns}
        actions={actions}
        searchable={true}
        exportable={true}
        importable={user?.role === 'admin'}
        onExport={handleExport}
        onImport={handleImport}
        title="Entities"
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingEntity ? 'Edit Entity' : 'Add New Entity'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as Entity['type'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="Project">Project</option>
                <option value="Property">Property</option>
                <option value="Site Visit">Site Visit</option>
                <option value="Task">Task</option>
              </select>
            </div>
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
                Location *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Area *
              </label>
              <input
                type="text"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., 1000 sq ft"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Developer *
              </label>
              <select
                value={formData.developer}
                onChange={(e) => setFormData({ ...formData, developer: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="">Select Developer</option>
                {developers.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Entity['status'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="Planning">Planning</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget
              </label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter budget amount"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Detailed description of the entity..."
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
              {editingEntity ? 'Update Entity' : 'Create Entity'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Entity Details"
        size="lg"
      >
        {selectedEntity && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Name</label>
                <p className="text-sm text-gray-900">{selectedEntity.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Type</label>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                  selectedEntity.type === 'Project' ? 'bg-blue-100 text-blue-800' :
                  selectedEntity.type === 'Property' ? 'bg-green-100 text-green-800' :
                  selectedEntity.type === 'Site Visit' ? 'bg-orange-100 text-orange-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {selectedEntity.type}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Location</label>
                <p className="text-sm text-gray-900">{selectedEntity.location}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Area</label>
                <p className="text-sm text-gray-900">{selectedEntity.area}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Developer</label>
                <p className="text-sm text-gray-900">{selectedEntity.developerName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                  selectedEntity.status === 'Planning' ? 'bg-yellow-100 text-yellow-800' :
                  selectedEntity.status === 'Ongoing' ? 'bg-blue-100 text-blue-800' :
                  selectedEntity.status === 'Completed' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {selectedEntity.status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Start Date</label>
                <p className="text-sm text-gray-900">{selectedEntity.startDate}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">End Date</label>
                <p className="text-sm text-gray-900">{selectedEntity.endDate}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Budget</label>
                <p className="text-sm text-gray-900">
                  {selectedEntity.budget ? `₹${selectedEntity.budget.toLocaleString()}` : 'Not specified'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Created Date</label>
                <p className="text-sm text-gray-900">{selectedEntity.createdAt}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Description</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{selectedEntity.description}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EntitiesManager;