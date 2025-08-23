import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Building, 
  MessageSquare, 
  Settings,
  LogOut,
  HardHat,
  MapPin,
  FileText,
  Briefcase,
  Package,
  Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  const adminMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pending-actions', label: 'Pending Actions', icon: Clock },
    { id: 'leads', label: 'Lead Tracker', icon: UserCheck },
    { id: 'developers', label: 'Developer List', icon: HardHat },
    { id: 'contacts', label: 'Contact List', icon: MessageSquare },
    { id: 'projects', label: 'Projects', icon: Building },
    { id: 'inventory', label: 'Inventory List', icon: Package },
    { id: 'land', label: 'Land', icon: MapPin },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const employeeMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Lead Tracker', icon: UserCheck },
    { id: 'developers', label: 'Developer List', icon: HardHat },
    { id: 'contacts', label: 'Contact List', icon: MessageSquare },
    { id: 'projects', label: 'Projects', icon: Building },
    { id: 'inventory', label: 'Inventory List', icon: Package },
    { id: 'land', label: 'Land', icon: MapPin },
  ];

  const menuItems = user?.role === 'admin' ? adminMenuItems : employeeMenuItems;

  return (
    <div className="bg-gray-900 text-white w-64 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Building className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">ConstructCRM</h1>
            <p className="text-sm text-gray-400">Project Management</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <IconComponent className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-gray-600 p-2 rounded-full">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;