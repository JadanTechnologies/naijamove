import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { getDashboardStats, getActiveRides } from '../../services/mockService';
import { CURRENCY_SYMBOL } from '../../constants';
import MapMock from '../../components/MapMock';
import { Users, TrendingUp, AlertTriangle, ShieldCheck, Truck, CreditCard, Download, Search } from 'lucide-react';
import AdminSettings from './AdminSettings';
import UserManagement from './UserManagement';
import { RideRequest, UserRole } from '../../types';

interface AdminDashboardProps {
    view: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ view }) => {
  const [stats, setStats] = useState<any>(null);
  const [allRides, setAllRides] = useState<RideRequest[]>([]);

  useEffect(() => {
    getDashboardStats().then(setStats);
    // Fetch all rides for admin views
    getActiveRides(UserRole.ADMIN, 'admin-1').then(setAllRides);
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
  
  if (view === 'logistics') {
      const logisticsRides = allRides.filter(r => r.type === 'LOGISTICS');
      return (
          <div className="space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Logistics Operations</h1>
                <div className="flex gap-2">
                    <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-2">
                        <Download size={16} /> Export Manifest
                    </button>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input type="text" placeholder="Search Tracking ID or Sender..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" />
                    </div>
                    <select className="px-4 py-2 border rounded-lg text-sm bg-white">
                        <option>All Statuses</option>
                        <option>In Transit</option>
                        <option>Delivered</option>
                    </select>
                </div>
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Tracking ID</th>
                            <th className="px-6 py-4">Item Details</th>
                            <th className="px-6 py-4">Route</th>
                            <th className="px-6 py-4">Vehicle</th>
                            <th className="px-6 py-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {logisticsRides.map(ride => (
                            <tr key={ride.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-mono text-xs font-medium text-gray-600">#{ride.id.slice(-8).toUpperCase()}</td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{ride.parcelDescription}</div>
                                    <div className="text-xs text-gray-500">{ride.parcelWeight} • {ride.receiverPhone}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-xs">
                                        <span className="block text-gray-500">From: {ride.pickupAddress.split(',')[0]}</span>
                                        <span className="block text-gray-900 font-medium">To: {ride.dropoffAddress.split(',')[0]}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-xs font-bold text-gray-600">{ride.vehicleType}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        ride.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                        ride.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                                        'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {ride.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {logisticsRides.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500">No active logistics requests found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
              </div>
          </div>
      );
  }

  if (view === 'finance') {
    return (
      <div className="space-y-6 animate-in fade-in">
          <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500 font-medium mb-2">Total Platform Revenue</p>
                  <h3 className="text-3xl font-bold text-emerald-600">{CURRENCY_SYMBOL}{stats?.totalRevenue.toLocaleString()}</h3>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500 font-medium mb-2">Admin Commission (20%)</p>
                  <h3 className="text-3xl font-bold text-purple-600">{CURRENCY_SYMBOL}{stats?.platformCommission.toLocaleString()}</h3>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500 font-medium mb-2">Pending Driver Payouts</p>
                  <h3 className="text-3xl font-bold text-orange-600">{CURRENCY_SYMBOL}{(stats?.totalRevenue * 0.8).toLocaleString()}</h3>
              </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-800">Recent Transactions</h3>
              </div>
              <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                      <tr>
                          <th className="px-6 py-4">Transaction Ref</th>
                          <th className="px-6 py-4">Type</th>
                          <th className="px-6 py-4">Amount</th>
                          <th className="px-6 py-4">Commission</th>
                          <th className="px-6 py-4">Date</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {allRides.slice(0, 10).map(ride => (
                          <tr key={ride.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 font-mono text-xs text-gray-500">#{ride.id.replace('ride-', 'TRX-').toUpperCase()}</td>
                              <td className="px-6 py-4 text-sm font-medium">{ride.type}</td>
                              <td className="px-6 py-4 font-bold text-gray-900">{CURRENCY_SYMBOL}{ride.price.toLocaleString()}</td>
                              <td className="px-6 py-4 text-red-600 text-sm">-{CURRENCY_SYMBOL}{(ride.price * 0.2).toLocaleString()}</td>
                              <td className="px-6 py-4 text-xs text-gray-500">{new Date(ride.createdAt).toLocaleDateString()}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
    );
  }

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