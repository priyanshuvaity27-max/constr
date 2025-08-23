import React, { useState, useEffect } from 'react';
import { Users, UserCheck, Building, MessageSquare, TrendingUp, Calendar, DollarSign, Target, Package } from 'lucide-react';
import StatsCard from '../Common/StatsCard';
import { useAuth } from '../../context/AuthContext';
import { Lead, Developer, Contact, Land, DashboardStats } from '../../types';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    totalDevelopers: 0,
    activeInventory: 0,
    leadsByStatus: {},
    spaceRequirementChart: {},
    leadsByCity: {},
    monthlyLeads: []
  });

  useEffect(() => {
    const calculateStats = () => {
      const leads: Lead[] = JSON.parse(localStorage.getItem('leads') || '[]');
      const developers: Developer[] = JSON.parse(localStorage.getItem('developers') || '[]');
      const contacts: Contact[] = JSON.parse(localStorage.getItem('contacts') || '[]');
      const land: Land[] = JSON.parse(localStorage.getItem('land') || '[]');

      // Filter data based on user role
      const filteredLeads = user?.role === 'admin' 
        ? leads 
        : leads.filter(lead => lead.leadManager === user?.id);

      // Calculate basic stats
      const totalLeads = filteredLeads.length;
      const totalDevelopers = developers.length;
      const activeInventory = land.length; // Using land as inventory placeholder

      // Calculate leads by status
      const leadsByStatus = filteredLeads.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

      // Calculate space requirement chart
      const spaceRequirementChart = filteredLeads.reduce((acc, lead) => {
        acc[lead.typeOfPlace] = (acc[lead.typeOfPlace] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

      // Calculate leads by city
      const leadsByCity = filteredLeads.reduce((acc, lead) => {
        if (lead.city) {
          acc[lead.city] = (acc[lead.city] || 0) + 1;
        }
        return acc;
      }, {} as { [key: string]: number });

      // Calculate monthly leads (mock data for demo)
      const monthlyLeads = [
        { month: 'Jan', count: Math.floor(Math.random() * 20) + 10 },
        { month: 'Feb', count: Math.floor(Math.random() * 20) + 15 },
        { month: 'Mar', count: Math.floor(Math.random() * 20) + 20 },
        { month: 'Apr', count: Math.floor(Math.random() * 20) + 18 },
        { month: 'May', count: Math.floor(Math.random() * 20) + 25 },
        { month: 'Jun', count: totalLeads },
      ];

      setStats({
        totalLeads,
        totalDevelopers,
        activeInventory,
        leadsByStatus,
        spaceRequirementChart,
        leadsByCity,
        monthlyLeads
      });
    };

    calculateStats();
  }, [user]);

  const recentActivities = [
    { action: 'New lead created', details: 'ABC Corporation - Office Space', time: '2 hours ago', type: 'lead' },
    { action: 'Lead status updated', details: 'XYZ Retail - Qualified', time: '4 hours ago', type: 'lead' },
    { action: 'New contact added', details: 'Tech Solutions Pvt Ltd', time: '6 hours ago', type: 'contact' },
    { action: 'Developer added', details: 'DLF Limited - Corporate', time: '1 day ago', type: 'developer' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.role === 'admin' ? 'Admin Dashboard' : 'My Dashboard'}
          </h1>
          <p className="text-gray-600">
            Welcome back, {user?.name}! Here's what's happening today.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          <span>{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Leads"
          value={stats.totalLeads}
          icon={UserCheck}
          color="blue"
          trend={{ value: 12, isPositive: true }}
        />
        {user?.role === 'admin' && (
          <StatsCard
            title="Active Developers"
            value={stats.totalDevelopers}
            icon={Users}
            color="green"
            trend={{ value: 8, isPositive: true }}
          />
        )}
        <StatsCard
          title="Active Inventory"
          value={stats.activeInventory}
          icon={Package}
          color="orange"
          trend={{ value: 5, isPositive: false }}
        />
        <StatsCard
          title="Total Developers"
          value={stats.totalDevelopers}
          icon={Building}
          color="purple"
          trend={{ value: 15, isPositive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads by Status Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Leads by Status</h2>
          <div className="space-y-4">
            {Object.entries(stats.leadsByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">{status}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${(count / stats.totalLeads) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Space Requirement Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Space Requirements</h2>
          <div className="space-y-4">
            {Object.entries(stats.spaceRequirementChart).map(([type, count]) => {
              const colorMap: { [key: string]: string } = {
                'Office': 'bg-blue-500',
                'Retail': 'bg-green-500',
                'Warehouse': 'bg-orange-500',
                'Coworking': 'bg-purple-500',
                'Industrial': 'bg-red-500',
                'Other': 'bg-gray-500'
              };
              return (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 ${colorMap[type] || 'bg-gray-500'} rounded-full`}></div>
                    <span className="text-sm font-medium text-gray-700">{type}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`${colorMap[type] || 'bg-gray-500'} h-2 rounded-full`}
                        style={{ width: `${(count / stats.totalLeads) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'lead' ? 'bg-blue-500' :
                    activity.type === 'contact' ? 'bg-green-500' :
                    activity.type === 'developer' ? 'bg-orange-500' :
                    'bg-purple-500'
                  }`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.details}</p>
                  <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;