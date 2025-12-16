import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { getDashboardStats, getActiveRides, getSystemHealth, getTransactions, getOnlineDrivers, manualAssignDriver } from '../../services/mockService';
import { CURRENCY_SYMBOL } from '../../constants';
import MapMock from '../../components/MapMock';
import { 
  Users, TrendingUp, AlertTriangle, ShieldCheck, Truck, CreditCard, 
  Download, Search, Car, Activity, Server, Database, Radio, 
  CheckCircle, AlertCircle, XCircle, Cpu, RefreshCw, Briefcase, Map, Phone, Wallet, User as UserIcon
} from 'lucide-react';
import AdminSettings from './AdminSettings';
import UserManagement from './UserManagement';
import SupportManagement from './SupportManagement';
import { RideRequest, UserRole, SystemHealth, DashboardStats, PaymentTransaction, User, RideStatus } from '../../types';
import { VoiceCallModal } from '../../components/VoiceCallModal';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

interface AdminDashboardProps {
    view: string;
}

// Helper Components
const StatusDot = ({ status }: { status: string }) => {
    let color = 'bg-gray-300';
    if (['OPTIMAL', 'OPERATIONAL', 'CONNECTED', 'UP', 'SUCCESS', 'ACTIVE', 'ACCEPTED', 'IN_PROGRESS'].includes(status)) color = 'bg-emerald-500';
    else if (['DEGRADED', 'ISSUES', 'PENDING'].includes(status)) color = 'bg-yellow-500';
    else if (['DOWN', 'DISCONNECTED', 'FAILED', 'BANNED', 'CANCELLED', 'SUSPENDED'].includes(status)) color = 'bg-red-500';

    return <span className={`w-3 h-3 rounded-full ${color} inline-block`}></span>;
};

const ProgressBar = ({ value, label, color = 'bg-blue-600' }: any) => (
    <div className="mb-2">
        <div className="flex justify-between text-xs font-medium mb-1">
            <span>{label}</span>
            <span>{value}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
            <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${value}%` }}></div>
        </div>
    </div>
);

const AdminDashboard: React.FC<AdminDashboardProps> = ({ view }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [allRides, setAllRides] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState<SystemHealth | null>(null);
  const { addToast } = useToast();
  
  // Payment View State
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [callRecipient, setCallRecipient] = useState<{name: string, role: string} | null>(null);

  // Manual Assign State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedRideForAssign, setSelectedRideForAssign] = useState<RideRequest | null>(null);
  const [availableDrivers, setAvailableDrivers] = useState<User[]>([]);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadData();
  }, [view]); // Reload when view changes to refresh lists

  const loadData = async () => {
        try {
            const [s, r] = await Promise.all([
                getDashboardStats(),
                getActiveRides(UserRole.ADMIN, 'admin-1')
            ]);
            setStats(s);
            setAllRides(r);
        } catch(e) {
            console.error("Failed to load admin data", e);
        } finally {
            setLoading(false);
        }
  };

  // Poll health data when in health view
  useEffect(() => {
      let interval: any;
      if (view === 'health') {
          const fetchHealth = () => getSystemHealth().then(setHealthData);
          fetchHealth();
          interval = setInterval(fetchHealth, 5000);
      }
      return () => {
          if (interval) clearInterval(interval);
      };
  }, [view]);

  // Load transactions when in finance view
  useEffect(() => {
      if (view === 'finance') {
          getTransactions().then(setTransactions);
      }
  }, [view]);

  const openAssignModal = async (ride: RideRequest) => {
      setSelectedRideForAssign(ride);
      const drivers = await getOnlineDrivers();
      // Filter drivers matching vehicle type if possible, or show all
      setAvailableDrivers(drivers.filter(d => d.vehicleType === ride.vehicleType));
      setAssignModalOpen(true);
  };

  const handleAssignDriver = async (driverId: string) => {
      if(!selectedRideForAssign) return;
      setAssigning(true);
      try {
          await manualAssignDriver(selectedRideForAssign.id, driverId);
          addToast("Driver assigned successfully", 'success');
          setAssignModalOpen(false);
          loadData(); // Refresh list
      } catch (e: any) {
          addToast(e.message, 'error');
      } finally {
          setAssigning(false);
      }
  };

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
  if (view === 'support') return <SupportManagement />;
  
  // Logistics View
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
                {/* ... (Search bar same as before) ... */}
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Tracking ID</th>
                            <th className="px-6 py-4">Item Details</th>
                            <th className="px-6 py-4">Route</th>
                            <th className="px-6 py-4">Vehicle</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
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
                                    <StatusDot status={ride.status} /> <span className="text-xs ml-1 font-medium">{ride.status}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {ride.status === 'PENDING' && (
                                        <Button size="sm" variant="outline" onClick={() => openAssignModal(ride)}>Assign Driver</Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
              </div>
              
              {/* Assign Driver Modal */}
              {assignModalOpen && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                              <h4 className="font-bold">Assign Driver</h4>
                              <button onClick={() => setAssignModalOpen(false)}><XCircle size={20} className="text-gray-400 hover:text-red-500" /></button>
                          </div>
                          <div className="p-4 max-h-96 overflow-y-auto">
                              <p className="text-sm text-gray-600 mb-4">Select an available driver for Trip #{selectedRideForAssign?.id.slice(-6)} ({selectedRideForAssign?.vehicleType})</p>
                              {availableDrivers.length === 0 ? (
                                  <div className="text-center py-8 text-gray-500">No online drivers available for this vehicle type.</div>
                              ) : (
                                  <div className="space-y-2">
                                      {availableDrivers.map(d => (
                                          <div key={d.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                              <div className="flex items-center gap-3">
                                                  <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden">
                                                      <img src={d.avatar} className="w-full h-full object-cover"/>
                                                  </div>
                                                  <div>
                                                      <p className="font-bold text-sm">{d.name}</p>
                                                      <p className="text-xs text-gray-500">{d.vehicleType} • {d.licensePlate}</p>
                                                  </div>
                                              </div>
                                              <Button size="sm" onClick={() => handleAssignDriver(d.id)} isLoading={assigning}>Assign</Button>
                                          </div>
                                      ))}
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  // Active Trips View
  if (view === 'trips') {
    return (
        <div className="space-y-6 animate-in fade-in">
             <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Active Ride Monitoring</h1>
             </div>
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Ride ID</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Route</th>
                            <th className="px-6 py-4">Driver</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Price</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {allRides.filter(r => r.type === 'RIDE').map(ride => (
                            <tr key={ride.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-mono text-xs font-medium text-gray-600">#{ride.id.slice(-6)}</td>
                                <td className="px-6 py-4 text-sm"><Car size={16} className="inline mr-1"/>{ride.vehicleType}</td>
                                <td className="px-6 py-4 text-xs max-w-xs truncate">{ride.pickupAddress} → {ride.dropoffAddress}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{ride.driverId ? 'Assigned' : 'Unassigned'}</td>
                                <td className="px-6 py-4">
                                     <StatusDot status={ride.status} /> <span className="text-xs ml-1 font-medium">{ride.status}</span>
                                </td>
                                <td className="px-6 py-4 font-bold">{CURRENCY_SYMBOL}{ride.price}</td>
                                <td className="px-6 py-4 text-right">
                                    {ride.status === 'PENDING' && (
                                        <Button size="sm" variant="outline" onClick={() => openAssignModal(ride)}>Assign Driver</Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
             
             {/* Re-use assign modal logic (would be cleaner extracted, but kept inline for now) */}
             {assignModalOpen && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                              <h4 className="font-bold">Assign Driver</h4>
                              <button onClick={() => setAssignModalOpen(false)}><XCircle size={20} className="text-gray-400 hover:text-red-500" /></button>
                          </div>
                          <div className="p-4 max-h-96 overflow-y-auto">
                              <p className="text-sm text-gray-600 mb-4">Select an available driver for Trip #{selectedRideForAssign?.id.slice(-6)} ({selectedRideForAssign?.vehicleType})</p>
                              {availableDrivers.length === 0 ? (
                                  <div className="text-center py-8 text-gray-500">No online drivers available for this vehicle type.</div>
                              ) : (
                                  <div className="space-y-2">
                                      {availableDrivers.map(d => (
                                          <div key={d.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                              <div className="flex items-center gap-3">
                                                  <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden">
                                                      <img src={d.avatar} className="w-full h-full object-cover"/>
                                                  </div>
                                                  <div>
                                                      <p className="font-bold text-sm">{d.name}</p>
                                                      <p className="text-xs text-gray-500">{d.vehicleType} • {d.licensePlate}</p>
                                                  </div>
                                              </div>
                                              <Button size="sm" onClick={() => handleAssignDriver(d.id)} isLoading={assigning}>Assign</Button>
                                          </div>
                                      ))}
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              )}
        </div>
    );
  }

  // System Health View
  if (view === 'health') {
      if (!healthData) return <div className="p-8 text-center animate-pulse">Scanning system health...</div>;

      return (
          <div className="space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center">
                  <h1 className="text-2xl font-bold text-gray-900">System Health Monitor</h1>
                  <button className="flex items-center gap-2 text-sm text-gray-600 bg-white border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50" onClick={() => getSystemHealth().then(setHealthData)}>
                      <RefreshCw size={14} /> Refresh
                  </button>
              </div>

              {/* Top Level Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Database */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
                      <div>
                          <p className="text-sm font-bold text-gray-500 mb-1">Database Cluster</p>
                          <div className="flex items-center gap-2 mb-2">
                              <StatusDot status={healthData.database.status} />
                              <span className="text-xl font-bold">{healthData.database.status}</span>
                          </div>
                          <p className="text-xs text-gray-600">Latency: {healthData.database.latency}ms</p>
                          <p className="text-xs text-gray-600">Active Conn: {healthData.database.activeConnections}</p>
                      </div>
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                          <Database size={24} />
                      </div>
                  </div>

                  {/* API */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
                      <div>
                          <p className="text-sm font-bold text-gray-500 mb-1">API Gateway</p>
                          <div className="flex items-center gap-2 mb-2">
                              <StatusDot status="OPERATIONAL" />
                              <span className="text-xl font-bold">{healthData.api.uptime}% Uptime</span>
                          </div>
                          <p className="text-xs text-gray-600">Req/sec: {healthData.api.requestsPerSecond}</p>
                          <p className="text-xs text-gray-600">Avg Resp: {healthData.api.avgResponseTime}ms</p>
                      </div>
                      <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                          <Activity size={24} />
                      </div>
                  </div>

                  {/* Realtime */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
                      <div>
                          <p className="text-sm font-bold text-gray-500 mb-1">WebSocket Server</p>
                          <div className="flex items-center gap-2 mb-2">
                              <StatusDot status={healthData.realtime.status} />
                              <span className="text-xl font-bold">{healthData.realtime.status}</span>
                          </div>
                          <p className="text-xs text-gray-600">Active Sockets: {healthData.realtime.activeSockets.toLocaleString()}</p>
                          <p className="text-xs text-gray-600">Msg/sec: {healthData.realtime.messagesPerSecond}</p>
                      </div>
                      <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                          <Radio size={24} />
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Microservices Status Table */}
                  <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
                      <div className="p-4 border-b border-gray-100 bg-gray-50">
                          <h3 className="font-bold text-gray-700">Microservices Status</h3>
                      </div>
                      <table className="w-full text-left">
                          <thead className="bg-white text-gray-500 text-xs uppercase font-semibold">
                              <tr>
                                  <th className="px-6 py-3">Service Name</th>
                                  <th className="px-6 py-3">Status</th>
                                  <th className="px-6 py-3">Latency</th>
                                  <th className="px-6 py-3">Last Check</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-sm">
                              {healthData.services.map((svc, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50">
                                      <td className="px-6 py-4 font-medium">{svc.name}</td>
                                      <td className="px-6 py-4">
                                          <div className="flex items-center gap-2">
                                              {svc.status === 'OPERATIONAL' ? <CheckCircle size={16} className="text-emerald-500"/> : 
                                               svc.status === 'ISSUES' ? <AlertCircle size={16} className="text-yellow-500"/> :
                                               <XCircle size={16} className="text-red-500"/>}
                                              <span>{svc.status}</span>
                                          </div>
                                      </td>
                                      <td className="px-6 py-4 font-mono">{svc.latency}ms</td>
                                      <td className="px-6 py-4 text-gray-500">Just now</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>

                  {/* Server Load */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                      <div className="flex items-center gap-3 mb-6">
                          <Cpu size={24} className="text-gray-400" />
                          <h3 className="font-bold text-gray-700">Server Load</h3>
                      </div>
                      <div className="space-y-4">
                          <ProgressBar 
                            value={healthData.server.cpuUsage} 
                            label="CPU Usage" 
                            color={healthData.server.cpuUsage > 80 ? 'bg-red-500' : 'bg-blue-600'} 
                          />
                          <ProgressBar 
                            value={healthData.server.memoryUsage} 
                            label="Memory (RAM)" 
                            color={healthData.server.memoryUsage > 85 ? 'bg-red-500' : 'bg-purple-600'} 
                          />
                          <ProgressBar 
                            value={healthData.server.diskUsage} 
                            label="SSD Storage" 
                            color="bg-emerald-600" 
                          />
                      </div>
                      <div className="mt-6 pt-4 border-t border-gray-100">
                          <div className="text-xs text-gray-500 mb-2">Error Rate (5xx)</div>
                          <div className="text-3xl font-bold text-gray-900">{healthData.api.errorRate}%</div>
                          <div className="text-xs text-emerald-600 mt-1">Within SLA limits (&lt;1.0%)</div>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // Finance / Payment Management View
  if (view === 'finance') {
    return (
      <div className="space-y-6 animate-in fade-in relative">
          <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
          
          {/* Revenue Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm text-gray-500 font-medium mb-1">Total Platform Revenue</p>
                        <h3 className="text-3xl font-bold text-emerald-600">{CURRENCY_SYMBOL}{stats?.totalRevenue.toLocaleString()}</h3>
                    </div>
                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><TrendingUp size={24}/></div>
                  </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                   <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-500 font-medium mb-1">Admin Commission (20%)</p>
                        <h3 className="text-3xl font-bold text-purple-600">{CURRENCY_SYMBOL}{stats?.platformCommission.toLocaleString()}</h3>
                      </div>
                      <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><Briefcase size={24}/></div>
                  </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-500 font-medium mb-1">Pending Driver Payouts</p>
                        <h3 className="text-3xl font-bold text-orange-600">{CURRENCY_SYMBOL}{(stats ? stats.totalRevenue * 0.8 : 0).toLocaleString()}</h3>
                      </div>
                      <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><Wallet size={24}/></div>
                  </div>
              </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                  <h3 className="font-bold text-gray-800">Recent Transactions</h3>
                  <div className="flex gap-2">
                       <select className="px-3 py-2 border rounded-lg text-sm bg-white outline-none">
                           <option>All Channels</option>
                           <option>Paystack</option>
                           <option>Wallet</option>
                           <option>Cash</option>
                       </select>
                       <input placeholder="Search Reference..." className="px-3 py-2 border rounded-lg text-sm outline-none" />
                  </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Reference</th>
                            <th className="px-6 py-4">Passenger</th>
                            <th className="px-6 py-4">Driver</th>
                            <th className="px-6 py-4">Channel</th>
                            <th className="px-6 py-4">Amount</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {transactions.map(txn => (
                            <tr key={txn.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-mono text-xs text-gray-500">{txn.reference}</td>
                                <td className="px-6 py-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-900">{txn.passengerName}</span>
                                        <button 
                                            onClick={() => setCallRecipient({name: txn.passengerName, role: 'Passenger'})}
                                            className="text-gray-400 hover:text-emerald-600 p-1" title="Call Passenger"
                                        >
                                            <Phone size={14}/>
                                        </button>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-600">{txn.driverName}</span>
                                        {txn.driverId && (
                                            <button 
                                                onClick={() => setCallRecipient({name: txn.driverName || 'Driver', role: 'Driver'})}
                                                className="text-gray-400 hover:text-emerald-600 p-1" title="Call Driver"
                                            >
                                                <Phone size={14}/>
                                            </button>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold border ${
                                        txn.channel === 'PAYSTACK' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                        txn.channel === 'WALLET' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                        'bg-gray-50 text-gray-700 border-gray-200'
                                    }`}>
                                        {txn.channel}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-bold text-gray-900">{CURRENCY_SYMBOL}{txn.amount.toLocaleString()}</td>
                                <td className="px-6 py-4">
                                     <StatusDot status={txn.status} /> <span className="text-xs ml-1">{txn.status}</span>
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-500">{new Date(txn.date).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
              </div>
          </div>
          
          {callRecipient && (
              <VoiceCallModal 
                  recipientName={callRecipient.name}
                  recipientRole={callRecipient.role}
                  onEndCall={() => setCallRecipient(null)}
              />
          )}
      </div>
    );
  }

  if (loading || !stats) return <div className="p-10 text-center animate-pulse text-gray-500">Connecting to NaijaMove Servers...</div>;

  // Default Dashboard View (view === 'dashboard' or fallback)
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Super Admin Console</h1>
        <div className="flex gap-2">
            <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Export Report</button>
        </div>
      </div>

      {/* Stats Grid - EXPANDED as requested */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Users */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Total Users</span>
                <Users size={18} className="text-blue-500"/>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
        </div>

        {/* Active Users */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Active Users</span>
                <Activity size={18} className="text-emerald-500"/>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.activeUsers.toLocaleString()}</p>
        </div>

        {/* Total Trips */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Total Trips</span>
                <Truck size={18} className="text-purple-500"/>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalTrips.toLocaleString()}</p>
        </div>

        {/* Live Trips */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Live Trips</span>
                <div className="relative">
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                    <Map size={18} className="text-red-500"/>
                </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.liveTrips}</p>
        </div>

        {/* Total Drivers */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Total Drivers</span>
                <Car size={18} className="text-orange-500"/>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalDrivers.toLocaleString()}</p>
        </div>

        {/* Total Staff */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Total Staff</span>
                <Briefcase size={18} className="text-gray-600"/>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalStaff}</p>
        </div>

        {/* Regions */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Service Regions</span>
                <Map size={18} className="text-teal-500"/>
            </div>
            <div className="flex items-end justify-between">
                <p className="text-2xl font-bold text-gray-900">{stats.totalRegions} Cities</p>
                <div className="flex gap-1">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-[10px]">Sokoto</span>
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-[10px]">Lagos</span>
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-[10px]">Abuja</span>
                </div>
            </div>
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
                {/* Only render MapMock when explicitly on dashboard view to avoid remount issues */}
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