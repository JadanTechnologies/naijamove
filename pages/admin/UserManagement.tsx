
import React, { useEffect, useState } from 'react';
import { User, UserActivity, VehicleType, UserRole } from '../../types';
import { getAllUsers, updateUserStatus, getUserActivity, recruitDriver } from '../../services/mockService';
import { Button } from '../../components/ui/Button';
import { ShieldAlert, CheckCircle, Ban, Trash2, Smartphone, Globe, MapPin, Wifi, Activity, X, UserPlus, Bike, Car, Truck } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { useToast } from '../../components/ui/Toast';

// Fix Leaflet Icons
const icon = L.icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const { addToast } = useToast();

  // Recruitment State
  const [isRecruitOpen, setIsRecruitOpen] = useState(false);
  const [newDriver, setNewDriver] = useState({
      name: '', email: '', phone: '', vehicleType: VehicleType.OKADA, licensePlate: ''
  });
  const [recruiting, setRecruiting] = useState(false);

  const refresh = () => getAllUsers().then(setUsers);

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
      if(selectedUser) {
          getUserActivity(selectedUser.id).then(setUserActivities);
      }
  }, [selectedUser]);

  const handleStatusChange = async (userId: string, status: 'ACTIVE' | 'BANNED' | 'SUSPENDED') => {
      await updateUserStatus(userId, status);
      refresh();
      if(selectedUser?.id === userId) setSelectedUser(prev => prev ? {...prev, status} : null);
      addToast(`User status updated to ${status}`, 'info');
  };

  const handleRecruitDriver = async () => {
      if(!newDriver.name || !newDriver.email || !newDriver.licensePlate) return;
      setRecruiting(true);
      try {
          await recruitDriver('admin-1', newDriver);
          addToast(`Driver ${newDriver.name} recruited successfully!`, 'success');
          setIsRecruitOpen(false);
          setNewDriver({ name: '', email: '', phone: '', vehicleType: VehicleType.OKADA, licensePlate: '' });
          refresh();
      } catch (e: any) {
          addToast(e.message, 'error');
      } finally {
          setRecruiting(false);
      }
  };

  return (
    <div className="relative h-full">
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                <Button onClick={() => setIsRecruitOpen(true)}>
                    <UserPlus size={18} className="mr-2"/> Recruit Driver
                </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">User Identity</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Device & Network</th>
                            <th className="px-6 py-4">Location</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map(user => (
                            <tr 
                                key={user.id} 
                                className={`hover:bg-blue-50 transition-colors cursor-pointer ${selectedUser?.id === user.id ? 'bg-blue-50' : ''}`}
                                onClick={() => setSelectedUser(user)}
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                            <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} alt="" className="w-full h-full object-cover"/>
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">{user.name}</div>
                                            <div className="text-xs text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : user.role === 'DRIVER' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-xs space-y-1">
                                        <div className="flex items-center gap-1 text-gray-700"><Smartphone size={12}/> {user.device || 'Unknown'}</div>
                                        <div className="flex items-center gap-1 text-gray-500"><Wifi size={12}/> {user.isp || 'Unknown ISP'}</div>
                                        <div className="flex items-center gap-1 text-gray-400 font-mono"><Globe size={12}/> {user.ip || '0.0.0.0'}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {user.location ? (
                                        <div className="flex items-center gap-1 text-xs text-emerald-600">
                                            <MapPin size={12} />
                                            Active
                                        </div>
                                    ) : <span className="text-xs text-gray-400">Offline</span>}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                        {user.status !== 'BANNED' ? (
                                            <button 
                                                onClick={() => handleStatusChange(user.id, 'BANNED')}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded" 
                                                title="Ban User"
                                            >
                                                <Ban size={18} />
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => handleStatusChange(user.id, 'ACTIVE')}
                                                className="p-2 text-emerald-500 hover:bg-emerald-50 rounded" 
                                                title="Reactivate User"
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Recruit Modal */}
        {isRecruitOpen && (
            <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-2xl animate-in zoom-in-95">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-900">Recruit New Driver</h3>
                        <button onClick={() => setIsRecruitOpen(false)}><X size={20}/></button>
                    </div>
                    <div className="space-y-4">
                        <input 
                            className="w-full p-2 border rounded" 
                            placeholder="Full Name"
                            value={newDriver.name}
                            onChange={e => setNewDriver({...newDriver, name: e.target.value})}
                        />
                        <input 
                            className="w-full p-2 border rounded" 
                            placeholder="Email Address"
                            type="email"
                            value={newDriver.email}
                            onChange={e => setNewDriver({...newDriver, email: e.target.value})}
                        />
                        <input 
                            className="w-full p-2 border rounded" 
                            placeholder="Phone Number"
                            value={newDriver.phone}
                            onChange={e => setNewDriver({...newDriver, phone: e.target.value})}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <select 
                                className="w-full p-2 border rounded"
                                value={newDriver.vehicleType}
                                onChange={e => setNewDriver({...newDriver, vehicleType: e.target.value as any})}
                            >
                                <option value={VehicleType.OKADA}>Okada</option>
                                <option value={VehicleType.KEKE}>Keke</option>
                                <option value={VehicleType.MINIBUS}>Minibus</option>
                                <option value={VehicleType.TRUCK}>Truck</option>
                            </select>
                            <input 
                                className="w-full p-2 border rounded uppercase" 
                                placeholder="License Plate"
                                value={newDriver.licensePlate}
                                onChange={e => setNewDriver({...newDriver, licensePlate: e.target.value})}
                            />
                        </div>
                        <div className="bg-blue-50 p-3 rounded text-xs text-blue-700">
                            Driver will be added with ACTIVE status and Verified NIN (Admin Override).
                        </div>
                        <Button className="w-full" onClick={handleRecruitDriver} isLoading={recruiting}>
                            Add Driver to Fleet
                        </Button>
                    </div>
                </div>
            </div>
        )}

        {/* User Detail Side Panel */}
        {selectedUser && (
            <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-gray-200 z-50 overflow-y-auto animate-in slide-in-from-right">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                            <img src={selectedUser.avatar || `https://ui-avatars.com/api/?name=${selectedUser.name}`} className="w-16 h-16 rounded-full border-2 border-gray-100" />
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{selectedUser.name}</h2>
                                <p className="text-sm text-gray-500">{selectedUser.email}</p>
                                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${selectedUser.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                    {selectedUser.status}
                                </span>
                            </div>
                        </div>
                        <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
                    </div>

                    <div className="space-y-6">
                        {/* Driver Specific Load Info */}
                        {selectedUser.role === UserRole.DRIVER && (
                            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                                <h3 className="font-bold text-orange-900 mb-3 flex items-center gap-2"><Truck size={16}/> Load Monitor</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs text-orange-800">
                                        <span>Current Load</span>
                                        <span>{selectedUser.currentLoadKg} / {selectedUser.vehicleCapacityKg} kg</span>
                                    </div>
                                    <div className="w-full bg-orange-200 rounded-full h-2">
                                        <div 
                                            className={`h-2 rounded-full transition-all ${selectedUser.loadStatus === 'OVERLOAD' ? 'bg-red-600' : 'bg-emerald-500'}`} 
                                            style={{width: `${Math.min(100, (selectedUser.currentLoadKg! / selectedUser.vehicleCapacityKg!) * 100)}%`}}
                                        ></div>
                                    </div>
                                    <div className="text-right text-[10px] font-bold text-orange-800 uppercase">{selectedUser.loadStatus}</div>
                                </div>
                            </div>
                        )}

                        {/* Device Info */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Smartphone size={16}/> Device Fingerprint</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500 text-xs">Model</p>
                                    <p className="font-medium">{selectedUser.device || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs">OS</p>
                                    <p className="font-medium">Android 13</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs">IP Address</p>
                                    <p className="font-mono text-gray-700">{selectedUser.ip || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs">Provider</p>
                                    <p className="font-medium">{selectedUser.isp || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Location Map */}
                        <div className="h-48 rounded-xl overflow-hidden border border-gray-200 relative">
                             {selectedUser.location ? (
                                <MapContainer center={[selectedUser.location.lat, selectedUser.location.lng]} zoom={13} style={{height: '100%', width: '100%'}}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <Marker position={[selectedUser.location.lat, selectedUser.location.lng]} icon={icon} />
                                </MapContainer>
                             ) : (
                                 <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 text-sm">Location Offline</div>
                             )}
                        </div>

                        {/* Activity Log */}
                        <div>
                            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Activity size={16}/> Activity Log</h3>
                            <div className="space-y-4">
                                {userActivities.length > 0 ? userActivities.map(act => (
                                    <div key={act.id} className="relative pl-4 border-l-2 border-gray-200 pb-4 last:pb-0">
                                        <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-gray-400"></div>
                                        <p className="text-sm font-medium text-gray-800">{act.action}</p>
                                        <p className="text-xs text-gray-500">{act.details}</p>
                                        <p className="text-[10px] text-gray-400 mt-1">{new Date(act.timestamp).toLocaleString()}</p>
                                    </div>
                                )) : (
                                    <p className="text-sm text-gray-500 italic">No recent activity.</p>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                            <Button variant="outline" size="sm" onClick={() => handleStatusChange(selectedUser.id, 'BANNED')}>
                                Block User
                            </Button>
                            <Button size="sm">
                                View Wallet
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default UserManagement;
