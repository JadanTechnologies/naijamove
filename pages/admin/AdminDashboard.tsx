
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { getDashboardStats, getActiveRides, getSystemHealth, getTransactions, getOnlineDrivers, manualAssignDriver, approveTransaction, generateReport, getSupportTickets } from '../../services/mockService';
import { CURRENCY_SYMBOL } from '../../constants';
import MapMock from '../../components/MapMock';
import { 
  Users, TrendingUp, AlertTriangle, ShieldCheck, Truck, CreditCard, 
  Download, Search, Car, Activity, Server, Database, Radio, 
  CheckCircle, AlertCircle, XCircle, Cpu, RefreshCw, Briefcase, Map, Phone, Wallet, User as UserIcon, FileText, Check, X, Clock, MessageSquare
} from 'lucide-react';
import AdminSettings from './AdminSettings';
import UserManagement from './UserManagement';
import SupportManagement from './SupportManagement';
import Automation from './Automation';
import { RideRequest, UserRole, SystemHealth, DashboardStats, PaymentTransaction, User, RideStatus, SupportTicket } from '../../types';
import { VoiceCallModal } from '../../components/VoiceCallModal';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

interface AdminDashboardProps {
    view: string;
}

// Helper Components
const StatusDot = ({ status }: { status: string }) => {
    let color = 'bg-gray-500';
    if (['OPTIMAL', 'OPERATIONAL', 'CONNECTED', 'UP', 'SUCCESS', 'ACTIVE', 'ACCEPTED', 'IN_PROGRESS', 'IDLE', 'OPEN'].includes(status)) color = 'bg-emerald-500 shadow-[0_0_8px_#10b981]';
    else if (['DEGRADED', 'ISSUES', 'PENDING', 'RUNNING', 'PENDING_APPROVAL'].includes(status)) color = 'bg-yellow-500 shadow-[0_0_8px_#eab308]';
    else if (['DOWN', 'DISCONNECTED', 'FAILED', 'BANNED', 'CANCELLED', 'SUSPENDED', 'ESCALATED'].includes(status)) color = 'bg-red-500 shadow-[0_0_8px_#ef4444]';

    return <span className={`w-2.5 h-2.5 rounded-full ${color} inline-block`}></span>;
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ view }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [allRides, setAllRides] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState<SystemHealth | null>(null);
  const [recentTickets, setRecentTickets] = useState<SupportTicket[]>([]);
  const { addToast } = useToast();
  
  // Payment View State
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [paymentActionLoading, setPaymentActionLoading] = useState<string | null>(null);

  // Manual Assign State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedRideForAssign, setSelectedRideForAssign] = useState<RideRequest | null>(null);
  const [availableDrivers, setAvailableDrivers] = useState<User[]>([]);
  const [assigning, setAssigning] = useState(false);

  // Reports State
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [view]);

  const loadData = async () => {
        try {
            const [s, r, t] = await Promise.all([
                getDashboardStats(),
                getActiveRides(UserRole.ADMIN, 'admin-1'),
                getSupportTickets()
            ]);
            setStats(s);
            setAllRides(r);
            setRecentTickets(t.slice(0, 5)); // Recent 5 tickets
        } catch(e) {
            console.error("Failed to load admin data", e);
        } finally {
            setLoading(false);
        }
  };

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

  useEffect(() => {
      if (view === 'finance') {
          getTransactions().then(setTransactions);
      }
  }, [view]);

  const openAssignModal = async (ride: RideRequest) => {
      setSelectedRideForAssign(ride);
      const drivers = await getOnlineDrivers();
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
          loadData(); 
      } catch (e: any) {
          addToast(e.message, 'error');
      } finally {
          setAssigning(false);
      }
  };

  const handlePaymentApproval = async (txnId: string, approved: boolean) => {
      setPaymentActionLoading(txnId);
      try {
          await approveTransaction(txnId, 'admin-1', approved);
          addToast(approved ? "Transaction Approved" : "Transaction Rejected", approved ? 'success' : 'info');
          setTransactions(await getTransactions()); // Refresh
      } catch (e: any) {
          addToast(e.message, 'error');
      } finally {
          setPaymentActionLoading(null);
      }
  };

  const handleGenerateReport = async (type: 'FINANCE' | 'GROWTH' | 'TRIPS') => {
      setGeneratingReport(type);
      try {
          const result = await generateReport(type, 'LAST_30_DAYS');
          addToast(`Report Generated: ${type}`, 'success');
          // Mock download
          window.open(result.url, '_blank');
      } catch (e: any) {
          addToast("Report generation failed", 'error');
      } finally {
          setGeneratingReport(null);
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
  if (view === 'automation') return <Automation />;
  
  if (view === 'reports') {
      return (
          <div className="space-y-6 animate-in fade-in">
              <h1 className="text-2xl font-bold text-white">System Reports</h1>
              <p className="text-gray-400">Generate comprehensive reports for audits and analysis.</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Financial Report */}
                  <div className="glass-panel p-6 rounded-xl border border-white/10 shadow-lg flex flex-col justify-between h-64">
                      <div>
                          <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mb-4 border border-emerald-500/30">
                              <CreditCard size={24} />
                          </div>
                          <h3 className="font-bold text-lg text-white">Financial Statement</h3>
                          <p className="text-sm text-gray-400 mt-2">Revenue, payouts, commissions, and manual transaction logs.</p>
                      </div>
                      <Button onClick={() => handleGenerateReport('FINANCE')} isLoading={generatingReport === 'FINANCE'} className="w-full bg-emerald-600 hover:bg-emerald-700">
                          <Download size={18} className="mr-2"/> Download PDF
                      </Button>
                  </div>

                  {/* Growth Report */}
                  <div className="glass-panel p-6 rounded-xl border border-white/10 shadow-lg flex flex-col justify-between h-64">
                      <div>
                          <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 mb-4 border border-blue-500/30">
                              <TrendingUp size={24} />
                          </div>
                          <h3 className="font-bold text-lg text-white">User Growth</h3>
                          <p className="text-sm text-gray-400 mt-2">New signups, active users, driver retention rates, and churn analysis.</p>
                      </div>
                      <Button onClick={() => handleGenerateReport('GROWTH')} isLoading={generatingReport === 'GROWTH'} className="w-full bg-blue-600 hover:bg-blue-700">
                          <Download size={18} className="mr-2"/> Download CSV
                      </Button>
                  </div>

                  {/* Operational Report */}
                  <div className="glass-panel p-6 rounded-xl border border-white/10 shadow-lg flex flex-col justify-between h-64">
                      <div>
                          <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-400 mb-4 border border-orange-500/30">
                              <Map size={24} />
                          </div>
                          <h3 className="font-bold text-lg text-white">Trip & Logistics</h3>
                          <p className="text-sm text-gray-400 mt-2">Completed trips, cancellation reasons, heatmaps, and logistics volume.</p>
                      </div>
                      <Button onClick={() => handleGenerateReport('TRIPS')} isLoading={generatingReport === 'TRIPS'} className="w-full bg-orange-600 hover:bg-orange-700">
                          <Download size={18} className="mr-2"/> Download PDF
                      </Button>
                  </div>
              </div>
          </div>
      );
  }

  // Logistics View
  if (view === 'logistics') {
      const logisticsRides = allRides.filter(r => r.type === 'LOGISTICS');
      return (
          <div className="space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Logistics Operations</h1>
                <div className="flex gap-2">
                    <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-2">
                        <Download size={16} /> Export Manifest
                    </button>
                </div>
              </div>
              <div className="glass-panel rounded-xl shadow-lg border border-white/10 overflow-hidden">
                <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-white/5 text-gray-400 font-semibold border-b border-white/10">
                        <tr>
                            <th className="px-6 py-4">Tracking ID</th>
                            <th className="px-6 py-4">Item Details</th>
                            <th className="px-6 py-4">Route</th>
                            <th className="px-6 py-4">Vehicle</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {logisticsRides.map(ride => (
                            <tr key={ride.id} className="hover:bg-white/5 text-gray-300">
                                <td className="px-6 py-4 font-mono text-xs font-medium text-gray-500">#{ride.id.slice(-8).toUpperCase()}</td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-white">{ride.parcelDescription}</div>
                                    <div className="text-xs text-gray-500">{ride.parcelWeight} • {ride.receiverPhone}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-xs">
                                        <span className="block text-gray-500">From: {ride.pickupAddress.split(',')[0]}</span>
                                        <span className="block text-white font-medium">To: {ride.dropoffAddress.split(',')[0]}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-xs font-bold text-gray-400">{ride.vehicleType}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <StatusDot status={ride.status} /> 
                                        <span className="text-xs font-medium">{ride.status}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {ride.status === 'PENDING' && (
                                        <Button size="sm" variant="outline" onClick={() => openAssignModal(ride)} className="border-white/20 text-white hover:bg-white/10">Assign Driver</Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
              </div>
              {assignModalOpen && (
                  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="glass-panel bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 border border-white/20">
                          <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                              <h4 className="font-bold text-white">Assign Driver</h4>
                              <button onClick={() => setAssignModalOpen(false)}><XCircle size={20} className="text-gray-400 hover:text-red-500" /></button>
                          </div>
                          <div className="p-4 max-h-96 overflow-y-auto custom-scrollbar">
                              <p className="text-sm text-gray-400 mb-4">Select an available driver for Trip #{selectedRideForAssign?.id.slice(-6)} ({selectedRideForAssign?.vehicleType})</p>
                              {availableDrivers.length === 0 ? (
                                  <div className="text-center py-8 text-gray-500">No online drivers available for this vehicle type.</div>
                              ) : (
                                  <div className="space-y-2">
                                      {availableDrivers.map(d => (
                                          <div key={d.id} className="flex items-center justify-between p-3 border border-white/10 rounded-lg hover:bg-white/5 bg-black/20">
                                              <div className="flex items-center gap-3">
                                                  <div className="w-8 h-8 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
                                                      <img src={d.avatar} className="w-full h-full object-cover"/>
                                                  </div>
                                                  <div>
                                                      <p className="font-bold text-sm text-white">{d.name}</p>
                                                      <p className="text-xs text-gray-500">{d.vehicleType} • {d.licensePlate}</p>
                                                  </div>
                                              </div>
                                              <Button size="sm" onClick={() => handleAssignDriver(d.id)} isLoading={assigning} className="bg-emerald-600 hover:bg-emerald-700">Assign</Button>
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
                <h1 className="text-2xl font-bold text-white">Active Ride Monitoring</h1>
             </div>
             <div className="glass-panel rounded-xl shadow-lg border border-white/10 overflow-hidden">
                <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-white/5 text-gray-400 font-semibold border-b border-white/10">
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
                    <tbody className="divide-y divide-white/10 text-gray-300">
                        {allRides.filter(r => r.type === 'RIDE').map(ride => (
                            <tr key={ride.id} className="hover:bg-white/5">
                                <td className="px-6 py-4 font-mono text-xs font-medium text-gray-500">#{ride.id.slice(-6)}</td>
                                <td className="px-6 py-4 text-sm"><Car size={16} className="inline mr-1 text-gray-500"/>{ride.vehicleType}</td>
                                <td className="px-6 py-4 text-xs max-w-xs truncate">{ride.pickupAddress} → {ride.dropoffAddress}</td>
                                <td className="px-6 py-4 text-sm text-gray-400">{ride.driverId ? 'Assigned' : 'Unassigned'}</td>
                                <td className="px-6 py-4">
                                     <div className="flex items-center gap-2">
                                        <StatusDot status={ride.status} /> <span className="text-xs font-medium">{ride.status}</span>
                                     </div>
                                </td>
                                <td className="px-6 py-4 font-bold text-emerald-400">{CURRENCY_SYMBOL}{ride.price}</td>
                                <td className="px-6 py-4 text-right">
                                    {ride.status === 'PENDING' && (
                                        <Button size="sm" variant="outline" onClick={() => openAssignModal(ride)} className="border-white/20 text-white hover:bg-white/10">Assign Driver</Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
             {assignModalOpen && (
                  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="glass-panel bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 border border-white/20">
                          <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                              <h4 className="font-bold text-white">Assign Driver</h4>
                              <button onClick={() => setAssignModalOpen(false)}><XCircle size={20} className="text-gray-400 hover:text-red-500" /></button>
                          </div>
                          <div className="p-4 max-h-96 overflow-y-auto custom-scrollbar">
                              <p className="text-sm text-gray-400 mb-4">Select an available driver for Trip #{selectedRideForAssign?.id.slice(-6)} ({selectedRideForAssign?.vehicleType})</p>
                              {availableDrivers.length === 0 ? (
                                  <div className="text-center py-8 text-gray-500">No online drivers available for this vehicle type.</div>
                              ) : (
                                  <div className="space-y-2">
                                      {availableDrivers.map(d => (
                                          <div key={d.id} className="flex items-center justify-between p-3 border border-white/10 rounded-lg hover:bg-white/5 bg-black/20">
                                              <div className="flex items-center gap-3">
                                                  <div className="w-8 h-8 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
                                                      <img src={d.avatar} className="w-full h-full object-cover"/>
                                                  </div>
                                                  <div>
                                                      <p className="font-bold text-sm text-white">{d.name}</p>
                                                      <p className="text-xs text-gray-500">{d.vehicleType} • {d.licensePlate}</p>
                                                  </div>
                                              </div>
                                              <Button size="sm" onClick={() => handleAssignDriver(d.id)} isLoading={assigning} className="bg-emerald-600 hover:bg-emerald-700">Assign</Button>
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
      if (!healthData) return <div className="p-8 text-center animate-pulse text-gray-500">Scanning system health...</div>;
      
      const cpuData = [
          { time: '10:00', value: 30 }, { time: '10:05', value: 45 }, { time: '10:10', value: 35 },
          { time: '10:15', value: 60 }, { time: '10:20', value: 55 }, { time: '10:25', value: 70 },
          { time: '10:30', value: healthData.server.cpuUsage }
      ];

      return (
          <div className="space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center">
                  <h1 className="text-2xl font-bold text-white">System Health Monitor</h1>
                  <button className="flex items-center gap-2 text-sm text-gray-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors" onClick={() => getSystemHealth().then(setHealthData)}>
                      <RefreshCw size={14} /> Refresh
                  </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="glass-panel p-6 rounded-xl shadow-lg border border-white/10 flex items-start justify-between">
                      <div>
                          <p className="text-sm font-bold text-gray-400 mb-1">Database Cluster</p>
                          <div className="flex items-center gap-2 mb-2">
                              <StatusDot status={healthData.database.status} />
                              <span className="text-xl font-bold text-white">{healthData.database.status}</span>
                          </div>
                          <p className="text-xs text-gray-500">Latency: {healthData.database.latency}ms</p>
                      </div>
                      <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20"><Database size={24} /></div>
                  </div>
                  <div className="glass-panel p-6 rounded-xl shadow-lg border border-white/10 flex items-start justify-between">
                      <div>
                          <p className="text-sm font-bold text-gray-400 mb-1">API Gateway</p>
                          <div className="flex items-center gap-2 mb-2">
                              <StatusDot status="OPERATIONAL" />
                              <span className="text-xl font-bold text-white">{healthData.api.uptime}% Uptime</span>
                          </div>
                          <p className="text-xs text-gray-500">Req/sec: {healthData.api.requestsPerSecond}</p>
                      </div>
                      <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20"><Activity size={24} /></div>
                  </div>
                  <div className="glass-panel p-6 rounded-xl shadow-lg border border-white/10 flex items-start justify-between">
                      <div>
                          <p className="text-sm font-bold text-gray-400 mb-1">WebSocket Server</p>
                          <div className="flex items-center gap-2 mb-2">
                              <StatusDot status={healthData.realtime.status} />
                              <span className="text-xl font-bold text-white">{healthData.realtime.status}</span>
                          </div>
                          <p className="text-xs text-gray-500">Active Sockets: {healthData.realtime.activeSockets.toLocaleString()}</p>
                      </div>
                      <div className="p-3 bg-orange-500/10 text-orange-400 rounded-lg border border-orange-500/20"><Radio size={24} /></div>
                  </div>
              </div>

              {/* Resource Usage Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-panel p-6 rounded-xl shadow-lg border border-white/10 h-80">
                      <h3 className="font-bold text-gray-300 mb-4 flex items-center gap-2"><Cpu size={18}/> Server CPU Load</h3>
                      <ResponsiveContainer width="100%" height="90%">
                          <AreaChart data={cpuData}>
                              <defs>
                                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <XAxis dataKey="time" axisLine={false} tickLine={false} stroke="#9ca3af" />
                              <YAxis axisLine={false} tickLine={false} stroke="#9ca3af" />
                              <Tooltip contentStyle={{backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff'}} />
                              <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#colorCpu)" />
                          </AreaChart>
                      </ResponsiveContainer>
                  </div>
                  <div className="glass-panel p-6 rounded-xl shadow-lg border border-white/10 h-80">
                      <h3 className="font-bold text-gray-300 mb-4 flex items-center gap-2"><Server size={18}/> Services Status</h3>
                      <div className="space-y-4 overflow-y-auto h-64 custom-scrollbar">
                          {healthData.services.map((svc, i) => (
                              <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                                  <div className="flex items-center gap-3">
                                      <StatusDot status={svc.status} />
                                      <span className="font-medium text-sm text-gray-200">{svc.name}</span>
                                  </div>
                                  <span className="text-xs font-mono text-gray-500">{svc.latency}ms</span>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // Finance / Payment Management View
  if (view === 'finance') {
    const pendingTransactions = transactions.filter(t => t.status === 'PENDING_APPROVAL');
    
    return (
      <div className="space-y-6 animate-in fade-in relative">
          <h1 className="text-2xl font-bold text-white">Payment Management</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-panel p-6 rounded-xl shadow-lg border border-white/10">
                  <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm text-gray-400 font-medium mb-1">Total Platform Revenue</p>
                        <h3 className="text-3xl font-bold text-emerald-400">{CURRENCY_SYMBOL}{stats?.totalRevenue.toLocaleString()}</h3>
                    </div>
                    <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400 border border-emerald-500/30"><TrendingUp size={24}/></div>
                  </div>
              </div>
              <div className="glass-panel p-6 rounded-xl shadow-lg border border-white/10">
                   <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-400 font-medium mb-1">Admin Commission (20%)</p>
                        <h3 className="text-3xl font-bold text-purple-400">{CURRENCY_SYMBOL}{stats?.platformCommission.toLocaleString()}</h3>
                      </div>
                      <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400 border border-purple-500/30"><Briefcase size={24}/></div>
                  </div>
              </div>
              <div className="glass-panel p-6 rounded-xl shadow-lg border border-white/10">
                  <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-400 font-medium mb-1">Pending Driver Payouts</p>
                        <h3 className="text-3xl font-bold text-orange-400">{CURRENCY_SYMBOL}{(stats ? stats.totalRevenue * 0.8 : 0).toLocaleString()}</h3>
                      </div>
                      <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400 border border-orange-500/30"><Wallet size={24}/></div>
                  </div>
              </div>
          </div>

          {/* Pending Approvals Section */}
          {pendingTransactions.length > 0 && (
              <div className="bg-yellow-900/20 rounded-xl shadow-sm border border-yellow-500/30 overflow-hidden">
                  <div className="p-4 border-b border-yellow-500/20 flex justify-between items-center">
                      <h3 className="font-bold text-yellow-400 flex items-center gap-2">
                          <AlertTriangle size={20}/> Pending Manual Approvals
                      </h3>
                      <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs font-bold border border-yellow-500/30">{pendingTransactions.length} Pending</span>
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-yellow-900/30 text-yellow-300 text-xs uppercase font-semibold">
                              <tr>
                                  <th className="px-6 py-3">Reference</th>
                                  <th className="px-6 py-3">User</th>
                                  <th className="px-6 py-3">Type</th>
                                  <th className="px-6 py-3">Amount</th>
                                  <th className="px-6 py-3">Details</th>
                                  <th className="px-6 py-3 text-right">Action</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-yellow-500/10 text-gray-300">
                              {pendingTransactions.map(txn => (
                                  <tr key={txn.id} className="hover:bg-yellow-900/10">
                                      <td className="px-6 py-4 font-mono text-xs">{txn.reference}</td>
                                      <td className="px-6 py-4 text-sm font-bold text-white">{txn.passengerName || txn.driverName}</td>
                                      <td className="px-6 py-4 text-xs font-medium">{txn.type}</td>
                                      <td className="px-6 py-4 font-bold text-yellow-200">{CURRENCY_SYMBOL}{txn.amount.toLocaleString()}</td>
                                      <td className="px-6 py-4 text-xs text-gray-400 max-w-xs truncate">{txn.bankDetails || 'Proof Uploaded'}</td>
                                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                                          <Button 
                                            size="sm" 
                                            className="bg-red-600 hover:bg-red-700 h-8 px-2"
                                            onClick={() => handlePaymentApproval(txn.id, false)}
                                            isLoading={paymentActionLoading === txn.id}
                                            disabled={!!paymentActionLoading}
                                          >
                                              <X size={14}/>
                                          </Button>
                                          <Button 
                                            size="sm" 
                                            className="bg-emerald-600 hover:bg-emerald-700 h-8 px-2"
                                            onClick={() => handlePaymentApproval(txn.id, true)}
                                            isLoading={paymentActionLoading === txn.id}
                                            disabled={!!paymentActionLoading}
                                          >
                                              <Check size={14}/>
                                          </Button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {/* Transactions Table */}
          <div className="glass-panel rounded-xl shadow-lg border border-white/10">
              <div className="p-4 border-b border-white/10 flex flex-col md:flex-row gap-4 justify-between items-center">
                  <h3 className="font-bold text-white">Recent Transactions</h3>
                  <div className="flex gap-2">
                       <input placeholder="Search Reference..." className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm outline-none focus:border-emerald-500 text-white" />
                  </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-gray-400 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Reference</th>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Channel</th>
                            <th className="px-6 py-4">Amount</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 text-gray-300">
                        {transactions.filter(t => t.status !== 'PENDING_APPROVAL').map(txn => (
                            <tr key={txn.id} className="hover:bg-white/5">
                                <td className="px-6 py-4 font-mono text-xs text-gray-500">{txn.reference}</td>
                                <td className="px-6 py-4 text-sm font-medium text-white">{txn.passengerName || txn.driverName}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold border ${
                                        txn.channel === 'PAYSTACK' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                        txn.channel === 'WALLET' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                        'bg-gray-700 text-gray-300 border-gray-600'
                                    }`}>
                                        {txn.channel}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-bold text-white">{CURRENCY_SYMBOL}{txn.amount.toLocaleString()}</td>
                                <td className="px-6 py-4">
                                     <div className="flex items-center gap-2">
                                        <StatusDot status={txn.status} /> <span className="text-xs">{txn.status}</span>
                                     </div>
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-500">{new Date(txn.date).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
              </div>
          </div>
      </div>
    );
  }

  if (loading || !stats) return <div className="p-10 text-center animate-pulse text-gray-500">Connecting to AmanaRide Servers...</div>;

  // Default Dashboard View (view === 'dashboard' or fallback)
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Super Admin Console</h1>
        <div className="flex gap-2">
            <button className="bg-white/5 border border-white/10 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/10">Export Report</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-5 rounded-xl shadow-lg border border-white/10">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase">Total Users</span>
                <Users size={18} className="text-blue-400"/>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalUsers.toLocaleString()}</p>
        </div>
        <div className="glass-panel p-5 rounded-xl shadow-lg border border-white/10">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase">Active Users</span>
                <Activity size={18} className="text-emerald-400"/>
            </div>
            <p className="text-2xl font-bold text-white">{stats.activeUsers.toLocaleString()}</p>
        </div>
        <div className="glass-panel p-5 rounded-xl shadow-lg border border-white/10">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase">Total Trips</span>
                <Truck size={18} className="text-purple-400"/>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalTrips.toLocaleString()}</p>
        </div>
        <div className="glass-panel p-5 rounded-xl shadow-lg border border-white/10">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase">Total Drivers</span>
                <Car size={18} className="text-orange-400"/>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalDrivers.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-xl shadow-lg border border-white/10 overflow-hidden flex flex-col h-[500px]">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="font-semibold text-gray-200">Live Fleet Tracking</h3>
                <span className="text-xs font-mono bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded border border-emerald-500/30">LIVE UPDATES</span>
            </div>
            <div className="flex-1 relative">
                {/* Enable Admin Features on Map */}
                <MapMock enableAdminFeatures={true} />
            </div>
        </div>

        <div className="space-y-6">
            {/* Revenue Chart */}
            <div className="glass-panel p-6 rounded-xl shadow-lg border border-white/10 h-[280px]">
                <h3 className="font-semibold text-gray-200 mb-6">Revenue Overview</h3>
                <ResponsiveContainer width="100%" height="80%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} stroke="#9ca3af" />
                        <YAxis axisLine={false} tickLine={false} fontSize={12} stroke="#9ca3af" />
                        <Tooltip contentStyle={{backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff'}} />
                        <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981'}} activeDot={{r: 6}} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Recent Tickets Widget - "Chats" */}
            <div className="glass-panel p-6 rounded-xl shadow-lg border border-white/10 h-[200px] overflow-hidden flex flex-col">
                <h3 className="font-semibold text-gray-200 mb-4 flex items-center gap-2">
                    <MessageSquare size={16} /> Recent Support
                </h3>
                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                    {recentTickets.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No open tickets.</p>
                    ) : (
                        recentTickets.map(ticket => (
                            <div key={ticket.id} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0 hover:bg-white/5 p-1 rounded cursor-pointer">
                                <div>
                                    <p className="font-medium truncate max-w-[150px] text-gray-300">{ticket.subject}</p>
                                    <p className="text-xs text-gray-500">{ticket.userName}</p>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded ${ticket.status === 'OPEN' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700 text-gray-400'}`}>
                                    {ticket.status}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
