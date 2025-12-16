import React, { useEffect, useState } from 'react';
import { User } from '../../types';
import { getAllUsers, updateUserStatus } from '../../services/mockService';
import { Button } from '../../components/ui/Button';
import { ShieldAlert, CheckCircle, Ban, Trash2 } from 'lucide-react';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);

  const refresh = () => getAllUsers().then(setUsers);

  useEffect(() => {
    refresh();
  }, []);

  const handleStatusChange = async (userId: string, status: 'ACTIVE' | 'BANNED' | 'SUSPENDED') => {
      await updateUserStatus(userId, status);
      refresh();
  };

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <Button>Add Staff Member</Button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                    <tr>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Wallet</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {users.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                        <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} alt="" className="w-full h-full object-cover"/>
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900">{user.name}</div>
                                        <div className="text-xs text-gray-500">{user.email}</div>
                                        {user.ip && <div className="text-[10px] text-gray-400 font-mono">IP: {user.ip}</div>}
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : user.role === 'DRIVER' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {user.role}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${user.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                    {user.status || 'ACTIVE'}
                                </span>
                            </td>
                            <td className="px-6 py-4 font-mono text-sm">
                                ₦{user.walletBalance.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
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
                                    <button className="p-2 text-gray-400 hover:text-red-600 rounded" title="Delete">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default UserManagement;