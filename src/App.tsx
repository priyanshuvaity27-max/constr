import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginForm from './components/Auth/LoginForm';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './components/Dashboard/Dashboard';
import LeadsManager from './components/Leads/LeadsManager';
import DevelopersManager from './components/Developers/DevelopersManager';
import ContactsManager from './components/Contacts/ContactsManager';
import ProjectsManager from './components/Projects/ProjectsManager';
import LandManager from './components/Land/LandManager';
import DocumentsManager from './components/Documents/DocumentsManager';
import InventoryManager from './components/Inventory/InventoryManager';
import UsersManager from './components/Users/UsersManager';
import Settings from './components/Settings/Settings';
import PendingActionsManager from './components/Common/PendingActionsManager';

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'pending-actions':
        return <PendingActionsManager />;
      case 'leads':
        return <LeadsManager />;
      case 'developers':
        return <DevelopersManager />;
      case 'contacts':
        return <ContactsManager />;
      case 'projects':
        return <ProjectsManager />;
      case 'land':
        return <LandManager />;
      case 'inventory':
        return <InventoryManager />;
      case 'documents':
        return <DocumentsManager />;
      case 'users':
        return <UsersManager />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block fixed lg:relative z-40 lg:z-0`}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-gray-600 bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;