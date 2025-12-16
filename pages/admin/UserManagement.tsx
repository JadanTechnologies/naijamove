import React, { useEffect, useState } from 'react';
import { User, UserActivity } from '../../types';
import { getAllUsers, updateUserStatus, getUserActivity } from '../../services/mockService';
import { Button } from '../../components/ui/Button';
import { ShieldAlert, CheckCircle, Ban, Trash2, Smartphone, Globe, MapPin, Wifi, Activity, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

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
  };

  return (
    <div className="relative h-full">
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                <Button>Add Staff Member</Button>
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