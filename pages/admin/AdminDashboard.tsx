import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { getDashboardStats } from '../../services/mockService';
import { CURRENCY_SYMBOL } from '../../constants';
import MapMock from '../../components/MapMock';
import { Users, TrendingUp, AlertTriangle, ShieldCheck, Truck, CreditCard } from 'lucide-react';
import AdminSettings from './AdminSettings';
import UserManagement from './UserManagement';

interface AdminDashboardProps {
    view: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ view }) => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    getDashboardStats().then(setStats);
  }, []);

  const data = [
    { name: 'Mon', revenue: 400000 },
    { name: 'Tue', revenue: 300000 },
    { name: 'Wed', revenue: 200000 },
    { name: 'Thu', revenue: 278000 },
    { name: 'Fri', revenue: 189000 },
    { name: 'Sat', revenue: 239000 },
    { name: 'Sun', revenue: 349000 },
  ];

  if (view === 'settings') return <AdminSettings />;
  if (view === 'users') return <UserManagement />;
  
  if (view === 'logistics') return (
      <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Logistics Operations</h1>
          <div className="bg-white p-12 rounded-xl text-center border border-dashed border-gray-300">
              <Truck size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Logistics Panel Under Construction</h3>
              <p className="text-gray-500">Real-time parcel tracking module coming in next update.</p>
          </div>
      </div>
  );

  if (view === 'finance') return (
      <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
           <div className="bg-white p-12 rounded-xl text-center border border-dashed border-gray-300">
              <CreditCard size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Finance Module Loading...</h3>
              <p className="text-gray-500">Connecting to Paystack & Flutterwave APIs...</p>
          </div>
      </div>
  );

  if (!stats) return <div className="p-10 text-center animate-pulse text-gray-500">Connecting to NaijaMove Servers...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Super Admin Console</h1>
        <div className="flex gap-2">
            <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Export Report</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-500">Total Revenue</span>
                <div className="p-2 bg-emerald-50 rounded-lg"><TrendingUp size={20} className="text-emerald-600"/></div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{CURRENCY_SYMBOL}{stats.totalRevenue.toLocaleString()}</p>
            <span className="text-xs text-emerald-600 font-medium">+12.5% from last week</span>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-500">Active Drivers</span>
                <div className="p-2 bg-blue-50 rounded-lg"><Users size={20} className="text-blue-600"/></div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.activeDrivers}</p>
            <span className="text-xs text-blue-600 font-medium">Currently online</span>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-500">Security Alerts</span>
                <div className="p-2 bg-red-50 rounded-lg"><AlertTriangle size={20} className="text-red-600"/></div>
            </div>
            <p className="text-2xl font-bold text-gray-900">2</p>
            <span className="text-xs text-red-600 font-medium">Require attention</span>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-500">Platform Commission</span>
                <div className="p-2 bg-purple-50 rounded-lg"><ShieldCheck size={20} className="text-purple-600"/></div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{CURRENCY_SYMBOL}{stats.platformCommission.toLocaleString()}</p>
            <span className="text-xs text-gray-500">Accumulated this month</span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Map - Takes up 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[500px]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-semibold text-gray-800">Live Fleet Tracking</h3>
                <span className="text-xs font-mono bg-emerald-100 text-emerald-800 px-2 py-1 rounded">LIVE UPDATES</span>
            </div>
            <div className="flex-1">
                <MapMock />
            </div>
        </div>

        {/* Charts & Actions */}
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[300px]">
                <h3 className="font-semibold text-gray-800 mb-6">Revenue Overview</h3>
                <ResponsiveContainer width="100%" height="80%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                    <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors flex justify-between items-center">
                        Review Pending Driver Docs
                        <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">5</span>
                    </button>
                    <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors">
                        Manage Surge Pricing (Lagos)
                    </button>
                    <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors">
                        Broadcast Message to Riders
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;