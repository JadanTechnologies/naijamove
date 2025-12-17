
import React, { useState, useEffect } from 'react';
import { User, RideRequest, RideStatus, VehicleType, PaymentTransaction } from '../../types';
import { getActiveRides, updateRideStatus, rejectRide, withdrawFunds, createSupportTicket, updateUserProfile, getUserTransactions, triggerSOS } from '../../services/mockService';
import { Button } from '../../components/ui/Button';
import { CURRENCY_SYMBOL } from '../../constants';
import { Navigation, Package, Phone, CheckCircle, XCircle, MessageSquare, AlertOctagon, TrendingUp, Banknote, Clock, Headphones, Send, Settings, Star, ShieldCheck, Truck, ArrowUpRight, ArrowDownLeft, Siren } from 'lucide-react';
import MapMock from '../../components/MapMock';
import { ChatWindow } from '../../components/ChatWindow';
import { VoiceCallModal } from '../../components/VoiceCallModal';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '../../components/ui/Toast';

interface DriverDashboardProps {
  user: User;
  view?: string;
}

const DriverDashboard: React.FC<DriverDashboardProps> = ({ user, view = 'dashboard' }) => {
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [currentRide, setCurrentRide] = useState<RideRequest | null>(null);
  const [tripHistory, setTripHistory] = useState<RideRequest[]>([]);
  const [isOnline, setIsOnline] = useState(user.isOnline || false);
  const [showChat, setShowChat] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [walletBalance, setWalletBalance] = useState(user.walletBalance);
  
  // Withdrawal State
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);

  // Support State
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSent, setSupportSent] = useState(false);
  const [showSupportCall, setShowSupportCall] = useState(false);

  // Profile State
  const [profileData, setProfileData] = useState({
      phone: user.phone || '',
      vehicleType: user.vehicleType || VehicleType.OKADA,
      licensePlate: user.licensePlate || '',
      nin: user.nin || ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const { addToast } = useToast();
  const [sosLoading, setSosLoading] = useState(false);

  useEffect(() => {
    // Poll for rides & update data
    const refreshData = async () => {
        const allRides = await getActiveRides(user.role, user.id);
        
        // Active ride logic
        const active = allRides.find(r => r.status === RideStatus.ACCEPTED || r.status === RideStatus.IN_PROGRESS);
        setCurrentRide(active || null);
        
        // Request logic
        if(isOnline) {
            setRequests(allRides.filter(r => r.status === RideStatus.PENDING));
        }

        // History logic
        const history = allRides.filter(r => 
            (r.status === RideStatus.COMPLETED || r.status === RideStatus.CANCELLED) && 
            r.driverId === user.id
        ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setTripHistory(history);
    };

    refreshData();
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, [user.id, user.role, isOnline]);

  useEffect(() => {
      if (view === 'wallet') {
          getUserTransactions(user.id).then(setTransactions);
      }
  }, [view, user.id, walletBalance]);

  const handleAccept = async (rideId: string) => {
    await updateRideStatus(rideId, RideStatus.ACCEPTED, user.id);
  };

  const handleReject = async (rideId: string) => {
      await rejectRide(rideId, user.id);
      setRequests(prev => prev.filter(r => r.id !== rideId));
  };

  const handleStatusUpdate = async (status: RideStatus) => {
      if(!currentRide) return;
      await updateRideStatus(currentRide.id, status);
      if (status === RideStatus.COMPLETED) {
          setWalletBalance(prev => prev + (currentRide.price * 0.8));
          setCurrentRide(null);
      }
  };

  const handleCancel = async () => {
      if(!currentRide) return;
      if(confirm("Are you sure you want to cancel this active ride? This may negatively impact your driver rating.")) {
          await updateRideStatus(currentRide.id, RideStatus.CANCELLED);
          setCurrentRide(null);
          addToast("Ride cancelled successfully.", 'info');
      }
  };

  const handleWithdraw = async () => {
      const amount = parseFloat(withdrawAmount);
      if(isNaN(amount) || amount <= 0) return alert("Invalid amount");
      if(amount > walletBalance) return alert("Insufficient funds");

      if(!user.bankAccount) return alert("Please set up your bank account in Profile settings first.");

      setWithdrawLoading(true);
      try {
          await withdrawFunds(user.id, amount);
          setWalletBalance(prev => prev - amount);
          setWithdrawAmount('');
          addToast("Withdrawal request initiated successfully! Status: PENDING", 'success');
      } catch (e: any) {
          addToast(e.message, 'error');
      } finally {
          setWithdrawLoading(false);
      }
  };

  const handleSupportSubmit = async () => {
      if(!supportMessage.trim()) return;
      await createSupportTicket(user.id, user.name, "Driver Support Request", supportMessage);
      setSupportMessage('');
      setSupportSent(true);
      setTimeout(() => setSupportSent(false), 3000);
  };

  const handleSaveProfile = async () => {
      setIsSavingProfile(true);
      try {
          await updateUserProfile(user.id, {
              phone: profileData.phone,
              vehicleType: profileData.vehicleType,
              licensePlate: profileData.licensePlate
          });
          addToast("Profile updated successfully!", 'success');
      } catch (e: any) {
          addToast("Failed to update profile", 'error');
      } finally {
          setIsSavingProfile(false);
      }
  };

  const handleSOS = async () => {
      if(!confirm("EMERGENCY: Are you sure you want to send an SOS alert? This will share your live location with Admin and Emergency Services.")) return;
      
      setSosLoading(true);
      try {
          const location = user.location || { lat: 13.0059, lng: 5.2476 }; 
          await triggerSOS(user.id, location);
          addToast("SOS Alert Sent! Emergency contacts have been notified.", "error");
      } catch (e) {
          addToast("Failed to send SOS", "error");
      } finally {
          setSosLoading(false);
      }
  };

  // --- Views ---

  if (view === 'profile') {
      return (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
              <h1 className="text-2xl font-bold text-white">Profile Management</h1>
              
              {/* Header Card */}
              <div className="glass-panel p-6 rounded-xl shadow-lg border border-white/10 flex flex-col md:flex-row items-center gap-6">
                  <div className="relative">
                      <img src={user.avatar} alt="Profile" className="w-24 h-24 rounded-full border-4 border-emerald-500/50 object-cover" />
                      <div className="absolute bottom-0 right-0 bg-emerald-500 text-white p-1 rounded-full border-2 border-gray-900">
                          <CheckCircle size={14} />
                      </div>
                  </div>
                  <div className="text-center md:text-left flex-1">
                      <h2 className="text-xl font-bold text-white">{user.name}</h2>
                      <p className="text-sm text-gray-400">{user.email}</p>
                      <div className="flex items-center justify-center md:justify-start gap-4 mt-3">
                          <div className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-sm font-medium border border-yellow-500/30">
                              <Star size={14} fill="currentColor" /> {user.rating} Rating
                          </div>
                          <div className="flex items-center gap-1 bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-sm font-medium border border-blue-500/30">
                              <TrendingUp size={14} /> {user.totalTrips} Trips
                          </div>
                      </div>
                  </div>
              </div>

              {/* Edit Form */}
              <div className="glass-panel p-6 rounded-xl shadow-lg border border-white/10">
                  <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                      <Settings size={20} /> Account Details
                  </h3>
                  
                  <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-400 mb-1">Full Name</label>
                              <input 
                                  value={user.name} 
                                  disabled 
                                  className="w-full p-2 bg-gray-800/50 border border-white/10 rounded text-gray-500 cursor-not-allowed"
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-400 mb-1">Email Address</label>
                              <input 
                                  value={user.email} 
                                  disabled 
                                  className="w-full p-2 bg-gray-800/50 border border-white/10 rounded text-gray-500 cursor-not-allowed"
                              />
                          </div>
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-gray-400 mb-1">Phone Number</label>
                          <input 
                              value={profileData.phone}
                              onChange={e => setProfileData({...profileData, phone: e.target.value})}
                              className="w-full p-2 bg-black/20 border border-white/10 rounded focus:ring-2 focus:ring-emerald-500 outline-none text-white"
                              placeholder="+234..."
                          />
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-gray-400 mb-1">NIN (Verified)</label>
                          <div className="relative">
                              <ShieldCheck className="absolute left-2 top-2.5 text-emerald-500" size={16} />
                              <input 
                                  value={profileData.nin} 
                                  disabled 
                                  className="w-full pl-8 p-2 bg-emerald-900/20 border border-emerald-500/30 rounded text-emerald-400 font-mono cursor-not-allowed"
                              />
                          </div>
                      </div>

                      <div className="border-t border-white/10 pt-4 mt-4">
                          <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                              <Truck size={18} /> Vehicle Information
                          </h4>
                          <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-xs font-bold text-gray-400 mb-1">Vehicle Type</label>
                                  <select 
                                      value={profileData.vehicleType}
                                      onChange={e => setProfileData({...profileData, vehicleType: e.target.value as any})}
                                      className="w-full p-2 bg-black/20 border border-white/10 rounded focus:ring-2 focus:ring-emerald-500 outline-none text-white"
                                  >
                                      <option value={VehicleType.OKADA}>Okada (Motorbike)</option>
                                      <option value={VehicleType.KEKE}>Keke (Tricycle)</option>
                                      <option value={VehicleType.MINIBUS}>Mini Bus</option>
                                      <option value={VehicleType.TRUCK}>Logistics Truck</option>
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-400 mb-1">License Plate</label>
                                  <input 
                                      value={profileData.licensePlate}
                                      onChange={e => setProfileData({...profileData, licensePlate: e.target.value})}
                                      className="w-full p-2 bg-black/20 border border-white/10 rounded focus:ring-2 focus:ring-emerald-500 outline-none uppercase font-mono text-white"
                                      placeholder="e.g. SOK-123-XY"
                                  />
                              </div>
                          </div>
                      </div>

                      <div className="pt-4 flex justify-end">
                          <Button 
                              onClick={handleSaveProfile} 
                              isLoading={isSavingProfile}
                              disabled={!profileData.phone || !profileData.licensePlate}
                              className="bg-emerald-600 hover:bg-emerald-700"
                          >
                              Save Changes
                          </Button>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  if (view === 'trips') {
      return (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
              <h1 className="text-2xl font-bold text-white">Trip History</h1>
              <div className="glass-panel rounded-xl shadow-lg border border-white/10 overflow-hidden">
                  {tripHistory.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">No completed trips yet.</div>
                  ) : (
                      <div className="divide-y divide-white/10">
                          {tripHistory.map(trip => (
                              <div key={trip.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-white/5 transition-colors">
                                  <div className="mb-2 md:mb-0">
                                      <div className="flex items-center gap-2 mb-1">
                                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${trip.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                              {trip.status}
                                          </span>
                                          <span className="text-xs text-gray-400">{new Date(trip.createdAt).toLocaleString()}</span>
                                      </div>
                                      <div className="text-sm font-medium text-gray-200">
                                          {trip.pickupAddress.split(',')[0]} <span className="text-gray-500">→</span> {trip.dropoffAddress.split(',')[0]}
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <div className="font-bold text-emerald-400">{CURRENCY_SYMBOL}{(trip.price * 0.8).toFixed(2)}</div>
                                      <div className="text-xs text-gray-500">Earnings</div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>
      );
  }

  if (view === 'wallet') {
      const chartData = [
          { day: 'Mon', amount: 12000 },
          { day: 'Tue', amount: 15500 },
          { day: 'Wed', amount: 8000 },
          { day: 'Thu', amount: 21000 },
          { day: 'Fri', amount: 18000 },
          { day: 'Sat', amount: 25000 },
          { day: 'Sun', amount: 19000 },
      ];

      return (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
              <div className="grid md:grid-cols-2 gap-6">
                  {/* Balance Card */}
                  <div className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-emerald-500/30">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                          <WalletIcon size={120} />
                      </div>
                      <div className="relative z-10">
                          <p className="text-emerald-100 font-medium mb-1">Available Balance</p>
                          <h2 className="text-4xl font-bold mb-6">{CURRENCY_SYMBOL}{walletBalance.toLocaleString()}</h2>
                          
                          <div className="bg-black/30 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                              <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-emerald-100"><Banknote size={16}/> Withdraw Earnings</h3>
                              
                              <div className="mb-3 p-2 bg-emerald-900/40 rounded border border-emerald-500/30 text-xs text-emerald-100">
                                  <p className="font-bold mb-1">Bank Account (Pre-filled):</p>
                                  {user.bankAccount ? (
                                      <p>{user.bankAccount.bankName} - {user.bankAccount.accountNumber}</p>
                                  ) : (
                                      <p className="text-red-300">No account linked. Check Profile.</p>
                                  )}
                              </div>

                              <div className="flex gap-2">
                                  <div className="relative flex-1">
                                      <span className="absolute left-3 top-2.5 text-emerald-200">{CURRENCY_SYMBOL}</span>
                                      <input 
                                          type="number" 
                                          className="w-full pl-8 pr-4 py-2 bg-emerald-900/60 border border-emerald-500/50 rounded-lg text-white placeholder-emerald-300/50 outline-none focus:ring-1 focus:ring-emerald-400"
                                          placeholder="0.00"
                                          value={withdrawAmount}
                                          onChange={e => setWithdrawAmount(e.target.value)}
                                      />
                                  </div>
                                  <Button 
                                    onClick={handleWithdraw} 
                                    isLoading={withdrawLoading}
                                    className="bg-white text-emerald-800 hover:bg-emerald-50 border-none font-bold"
                                    disabled={!user.bankAccount}
                                  >
                                      Withdraw
                                  </Button>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Activity Stats */}
                  <div className="grid grid-cols-2 gap-4">
                      <div className="glass-panel p-4 rounded-xl border border-white/10 shadow-lg flex flex-col justify-center">
                          <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center mb-2">
                              <TrendingUp size={20} />
                          </div>
                          <p className="text-gray-400 text-xs font-medium">Total Trips</p>
                          <h3 className="text-2xl font-bold text-white">{user.totalTrips || tripHistory.length}</h3>
                      </div>
                      <div className="glass-panel p-4 rounded-xl border border-white/10 shadow-lg flex flex-col justify-center">
                          <div className="w-10 h-10 bg-orange-500/20 text-orange-400 rounded-lg flex items-center justify-center mb-2">
                              <Clock size={20} />
                          </div>
                          <p className="text-gray-400 text-xs font-medium">Hours Online</p>
                          <h3 className="text-2xl font-bold text-white">42.5</h3>
                      </div>
                      <div className="col-span-2 glass-panel p-4 rounded-xl border border-white/10 shadow-lg h-48">
                          <p className="text-gray-400 text-xs font-medium mb-2">Weekly Earnings</p>
                          <ResponsiveContainer width="100%" height="85%">
                              <BarChart data={chartData}>
                                  <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={12} stroke="#9ca3af" />
                                  <Tooltip cursor={{fill: '#ffffff10'}} contentStyle={{backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff'}} />
                                  <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                  </div>
              </div>

              {/* Transaction History */}
              <div className="glass-panel rounded-xl shadow-lg border border-white/10 overflow-hidden">
                  <div className="p-4 border-b border-white/10">
                      <h3 className="font-bold text-white">Transaction History</h3>
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-white/5 text-gray-400 font-medium">
                              <tr>
                                  <th className="px-6 py-3">Type</th>
                                  <th className="px-6 py-3">Details</th>
                                  <th className="px-6 py-3">Date</th>
                                  <th className="px-6 py-3">Status</th>
                                  <th className="px-6 py-3 text-right">Amount</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10">
                              {transactions.length === 0 && (
                                  <tr>
                                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No transactions yet.</td>
                                  </tr>
                              )}
                              {transactions.map(txn => (
                                  <tr key={txn.id} className="hover:bg-white/5">
                                      <td className="px-6 py-4">
                                          <div className="flex items-center gap-2">
                                              {txn.type === 'EARNING' ? (
                                                  <div className="p-1.5 bg-green-500/20 text-green-400 rounded-full"><ArrowDownLeft size={16}/></div>
                                              ) : (
                                                  <div className="p-1.5 bg-red-500/20 text-red-400 rounded-full"><ArrowUpRight size={16}/></div>
                                              )}
                                              <span className="font-medium text-white">{txn.type === 'EARNING' ? 'Trip Earning' : 'Withdrawal'}</span>
                                          </div>
                                      </td>
                                      <td className="px-6 py-4 text-gray-400">
                                          {txn.type === 'EARNING' ? (
                                              <span>Ride #{txn.rideId?.slice(-6)}</span>
                                          ) : (
                                              <span>{txn.reference}</span>
                                          )}
                                      </td>
                                      <td className="px-6 py-4 text-gray-500">{new Date(txn.date).toLocaleDateString()}</td>
                                      <td className="px-6 py-4">
                                          <span className={`px-2 py-1 text-[10px] font-bold rounded ${
                                              txn.status === 'SUCCESS' ? 'bg-green-500/20 text-green-400' : 
                                              txn.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                                          }`}>
                                              {txn.status}
                                          </span>
                                      </td>
                                      <td className={`px-6 py-4 text-right font-bold ${txn.type === 'EARNING' ? 'text-emerald-400' : 'text-gray-200'}`}>
                                          {txn.type === 'EARNING' ? '+' : '-'}{CURRENCY_SYMBOL}{txn.amount.toLocaleString()}
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      );
  }

  if (view === 'support') {
      return (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
              <h1 className="text-2xl font-bold text-white">Driver Support Team</h1>
              
              <div className="glass-panel p-6 rounded-xl shadow-lg border border-white/10">
                  <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                          <Headphones size={24} />
                      </div>
                      <div>
                          <h3 className="font-bold text-white">Need Help?</h3>
                          <p className="text-sm text-gray-400">Contact the NaijaMove admin team directly.</p>
                      </div>
                  </div>

                  <div className="space-y-4">
                      <div className="flex gap-3">
                           <Button onClick={() => setShowSupportCall(true)} className="flex-1 border border-white/20 hover:bg-white/10 text-white" variant="outline">
                               <Phone size={18} className="mr-2" /> Call Support Agent
                           </Button>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Or leave a message</label>
                          <textarea 
                              className="w-full p-3 bg-black/30 border border-white/10 rounded-lg h-32 focus:ring-2 focus:ring-emerald-500 outline-none text-white placeholder-gray-600"
                              placeholder="Describe your issue regarding payments, app bugs, or safety..."
                              value={supportMessage}
                              onChange={e => setSupportMessage(e.target.value)}
                          ></textarea>
                      </div>
                      
                      {supportSent ? (
                          <div className="bg-emerald-500/20 text-emerald-400 p-3 rounded-lg flex items-center gap-2 animate-in fade-in border border-emerald-500/30">
                              <CheckCircle size={18} /> Ticket Created! We'll contact you shortly.
                          </div>
                      ) : (
                          <Button onClick={handleSupportSubmit} disabled={!supportMessage.trim()} className="w-full bg-emerald-600 hover:bg-emerald-700">
                              <Send size={18} className="mr-2" /> Send Message
                          </Button>
                      )}
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/30">
                      <h4 className="font-bold text-blue-300 text-sm mb-2">Emergency Line</h4>
                      <p className="text-2xl font-bold text-blue-400">0800-NAIJA</p>
                      <p className="text-xs text-blue-500 mt-1">24/7 Available</p>
                  </div>
                  <div className="bg-orange-500/10 p-4 rounded-xl border border-orange-500/30">
                      <h4 className="font-bold text-orange-300 text-sm mb-2">Office Address</h4>
                      <p className="text-sm text-orange-400">12 Ahmadu Bello Way,</p>
                      <p className="text-sm text-orange-400">Sokoto, Nigeria</p>
                  </div>
              </div>
              
              {showSupportCall && (
                  <VoiceCallModal 
                      recipientName="NaijaMove Support"
                      recipientRole="Customer Service"
                      onEndCall={() => setShowSupportCall(false)}
                  />
              )}
          </div>
      );
  }

  // --- Dashboard View (Default) ---
  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">
      {/* Floating SOS Button - Always available in Dashboard View */}
      <button 
        onClick={handleSOS}
        disabled={sosLoading}
        className="fixed bottom-6 right-6 z-[1002] bg-red-600 text-white w-16 h-16 rounded-full flex items-center justify-center font-bold shadow-[0_0_30px_rgba(220,38,38,0.6)] sos-btn hover:bg-red-700 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-70 disabled:animate-none border-2 border-white/20"
        title="Emergency SOS"
      >
          {sosLoading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
              <div className="flex flex-col items-center">
                  <Siren size={24} />
                  <span className="text-[10px] font-bold">SOS</span>
              </div>
          )}
      </button>

      {/* Status Toggle */}
      <div className="glass-panel p-4 rounded-xl shadow-lg border border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-white">Driver Console</h2>
            <p className="text-sm text-gray-400">{user.vehicleType} • {user.email}</p>
          </div>
          <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${isOnline ? 'text-emerald-400' : 'text-gray-500'}`}>
                  {isOnline ? 'You are Online' : 'You are Offline'}
              </span>
              <button 
                onClick={() => setIsOnline(!isOnline)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${isOnline ? 'bg-emerald-600' : 'bg-gray-700'}`}
              >
                  <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${isOnline ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
          </div>
      </div>

      {/* Current Active Job */}
      {currentRide && (
          <div className="glass-panel rounded-xl shadow-2xl border-l-4 border-l-emerald-500 overflow-hidden relative">
              <div className="p-6 bg-emerald-600/20 border-b border-emerald-500/30 flex justify-between items-center">
                  <h3 className="font-bold text-emerald-400 flex items-center gap-2">
                      <Navigation size={20} />
                      Current Job
                  </h3>
                  <span className="text-2xl font-bold text-emerald-400">{CURRENCY_SYMBOL}{currentRide.price}</span>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 p-6">
                  <div className="space-y-6">
                      <div className="space-y-4">
                          <div className="flex gap-3">
                              <div className="flex flex-col items-center">
                                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                                  <div className="w-0.5 h-full bg-gray-600 min-h-[40px]"></div>
                                  <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]"></div>
                              </div>
                              <div className="space-y-6 pb-2">
                                  <div>
                                      <p className="text-xs text-gray-500 uppercase font-semibold">Pickup</p>
                                      <p className="font-medium text-white">{currentRide.pickupAddress}</p>
                                  </div>
                                  <div>
                                      <p className="text-xs text-gray-500 uppercase font-semibold">Dropoff</p>
                                      <p className="font-medium text-white">{currentRide.dropoffAddress}</p>
                                  </div>
                              </div>
                          </div>
                      </div>

                      {currentRide.type === 'LOGISTICS' && (
                          <div className="bg-orange-500/10 p-4 rounded-lg border border-orange-500/30">
                              <div className="flex items-center gap-2 text-orange-400 mb-2">
                                  <Package size={18} />
                                  <span className="font-bold">Parcel Details</span>
                              </div>
                              <p className="text-sm text-gray-300">{currentRide.parcelDescription} • {currentRide.parcelWeight}</p>
                              <p className="text-sm text-gray-300 mt-1">Receiver: {currentRide.receiverPhone}</p>
                          </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        {currentRide.status === RideStatus.ACCEPTED && (
                             <Button onClick={() => handleStatusUpdate(RideStatus.IN_PROGRESS)} className="w-full col-span-2 py-3 text-lg bg-emerald-600 hover:bg-emerald-700">
                                Start Trip
                             </Button>
                        )}
                        {currentRide.status === RideStatus.IN_PROGRESS && (
                             <Button onClick={() => handleStatusUpdate(RideStatus.COMPLETED)} variant="primary" className="w-full bg-emerald-600 hover:bg-emerald-700 col-span-2 py-3 text-lg">
                                Complete Trip
                             </Button>
                        )}
                        
                        <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10" onClick={() => setShowCall(true)}>
                            <Phone size={18} className="mr-2"/> Call
                        </Button>
                        <Button variant="outline" className="w-full bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20" onClick={() => setShowChat(!showChat)}>
                            <MessageSquare size={18} className="mr-2"/> Chat
                        </Button>

                        <Button variant="danger" className="w-full col-span-2 mt-2 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30" onClick={handleCancel}>
                            <AlertOctagon size={18} className="mr-2"/> Cancel Ride
                        </Button>
                      </div>
                  </div>
                  
                  <div className="h-64 rounded-lg overflow-hidden border border-white/10">
                      {/* Pass currentRide to map for route navigation */}
                      <MapMock activeRide={currentRide} showDrivers={false} />
                  </div>
              </div>
              
              {showChat && (
                  <ChatWindow 
                      rideId={currentRide.id}
                      currentUser={user}
                      recipientName="Passenger" 
                      onClose={() => setShowChat(false)}
                  />
              )}

              {showCall && (
                  <VoiceCallModal 
                      recipientName="Passenger"
                      recipientRole="Rider"
                      onEndCall={() => setShowCall(false)}
                  />
              )}
          </div>
      )}

      {/* Incoming Requests */}
      {!currentRide && isOnline && (
          <div>
              <h3 className="text-lg font-bold text-white mb-4">Nearby Requests ({requests.length})</h3>
              <div className="space-y-4">
                  {requests.length === 0 ? (
                      <div className="text-center py-12 glass-panel rounded-xl border border-dashed border-gray-700">
                          <p className="text-gray-500 animate-pulse">Searching for nearby requests...</p>
                      </div>
                  ) : (
                      requests.map(req => (
                          <div key={req.id} className="glass-panel p-6 rounded-xl shadow-lg border border-white/10 hover:bg-white/5 transition-all">
                              <div className="flex flex-col md:flex-row justify-between gap-4">
                                  <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                          <span className={`text-xs font-bold px-2 py-1 rounded text-white ${req.type === 'LOGISTICS' ? 'bg-orange-500' : 'bg-blue-500'}`}>
                                              {req.type}
                                          </span>
                                          <span className="text-sm text-gray-400">{req.distanceKm}km away</span>
                                      </div>
                                      <h4 className="font-medium text-lg text-white">{req.pickupAddress}</h4>
                                      <p className="text-sm text-gray-500">to {req.dropoffAddress}</p>
                                  </div>
                                  
                                  <div className="flex flex-col items-end gap-2 justify-center">
                                      <span className="text-2xl font-bold text-emerald-400">{CURRENCY_SYMBOL}{req.price}</span>
                                      <div className="flex gap-2 w-full md:w-auto">
                                          <Button size="sm" variant="outline" onClick={() => handleReject(req.id)} className="flex-1 md:flex-none border-red-500/30 text-red-400 hover:bg-red-500/20">
                                              <XCircle size={18} />
                                          </Button>
                                          <Button size="sm" onClick={() => handleAccept(req.id)} className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700">
                                              Accept
                                          </Button>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

// Helper for Wallet Icon
const WalletIcon = ({ size }: {size: number}) => (
    <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
    >
        <path d="M20 7h-7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"/>
        <path d="M4 11V4a1 1 0 0 1 1-1h14"/>
        <path d="M4 11h12"/>
        <path d="M4 11v7a2 2 0 0 0 2 2h2"/>
    </svg>
);

export default DriverDashboard;
