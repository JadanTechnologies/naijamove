import React, { useState, useEffect } from 'react';
import { User, RideRequest, RideStatus } from '../../types';
import { getActiveRides, updateRideStatus, rejectRide, withdrawFunds, createSupportTicket } from '../../services/mockService';
import { Button } from '../../components/ui/Button';
import { CURRENCY_SYMBOL } from '../../constants';
import { MapPin, Navigation, Package, Phone, CheckCircle, XCircle, MessageSquare, AlertOctagon, TrendingUp, CreditCard, Banknote, Calendar, Clock, Headphones, Send } from 'lucide-react';
import MapMock from '../../components/MapMock';
import { ChatWindow } from '../../components/ChatWindow';
import { VoiceCallModal } from '../../components/VoiceCallModal';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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

  // Support State
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSent, setSupportSent] = useState(false);

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

        // History logic (completed/cancelled rides where this user was the driver)
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
          // Optimistic balance update
          setWalletBalance(prev => prev + (currentRide.price * 0.8));
          setCurrentRide(null);
      }
  };

  const handleCancel = async () => {
      if(!currentRide) return;
      if(confirm("Are you sure you want to cancel this active ride? This may negatively impact your driver rating.")) {
          await updateRideStatus(currentRide.id, RideStatus.CANCELLED);
          setCurrentRide(null);
          alert("Ride cancelled successfully.");
      }
  };

  const handleWithdraw = async () => {
      const amount = parseFloat(withdrawAmount);
      if(isNaN(amount) || amount <= 0) return alert("Invalid amount");
      if(amount > walletBalance) return alert("Insufficient funds");

      setWithdrawLoading(true);
      try {
          await withdrawFunds(user.id, amount);
          setWalletBalance(prev => prev - amount);
          setWithdrawAmount('');
          alert("Withdrawal successful! Funds will reach your account shortly.");
      } catch (e: any) {
          alert(e.message);
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

  const handleSOS = () => {
      if(confirm("EMERGENCY: Report security threat? Admin and nearby police stations will be notified.")) {
          alert("Distress signal sent! Help is on the way.");
      }
  };

  // --- Views ---

  if (view === 'trips') {
      return (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
              <h1 className="text-2xl font-bold text-gray-900">Trip History</h1>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {tripHistory.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">No completed trips yet.</div>
                  ) : (
                      <div className="divide-y divide-gray-100">
                          {tripHistory.map(trip => (
                              <div key={trip.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-gray-50">
                                  <div className="mb-2 md:mb-0">
                                      <div className="flex items-center gap-2 mb-1">
                                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${trip.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                              {trip.status}
                                          </span>
                                          <span className="text-xs text-gray-500">{new Date(trip.createdAt).toLocaleString()}</span>
                                      </div>
                                      <div className="text-sm font-medium">
                                          {trip.pickupAddress.split(',')[0]} <span className="text-gray-400">→</span> {trip.dropoffAddress.split(',')[0]}
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <div className="font-bold text-emerald-600">{CURRENCY_SYMBOL}{(trip.price * 0.8).toFixed(2)}</div>
                                      <div className="text-xs text-gray-400">Earnings</div>
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
                  <div className="bg-emerald-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                          <WalletIcon size={120} />
                      </div>
                      <div className="relative z-10">
                          <p className="text-emerald-100 font-medium mb-1">Available Balance</p>
                          <h2 className="text-4xl font-bold mb-6">{CURRENCY_SYMBOL}{walletBalance.toLocaleString()}</h2>
                          
                          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
                              <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Banknote size={16}/> Withdraw Earnings</h3>
                              <div className="flex gap-2">
                                  <div className="relative flex-1">
                                      <span className="absolute left-3 top-2.5 text-emerald-200">{CURRENCY_SYMBOL}</span>
                                      <input 
                                          type="number" 
                                          className="w-full pl-8 pr-4 py-2 bg-emerald-800/50 border border-emerald-500/50 rounded-lg text-white placeholder-emerald-300/50 outline-none focus:ring-1 focus:ring-emerald-400"
                                          placeholder="0.00"
                                          value={withdrawAmount}
                                          onChange={e => setWithdrawAmount(e.target.value)}
                                      />
                                  </div>
                                  <Button 
                                    onClick={handleWithdraw} 
                                    isLoading={withdrawLoading}
                                    className="bg-white text-emerald-700 hover:bg-emerald-50 border-none font-bold"
                                  >
                                      Withdraw
                                  </Button>
                              </div>
                              <p className="text-[10px] text-emerald-200 mt-2">To: {user.bankAccount?.bankName} - {user.bankAccount?.accountNumber}</p>
                          </div>
                      </div>
                  </div>

                  {/* Activity Stats */}
                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
                          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-2">
                              <TrendingUp size={20} />
                          </div>
                          <p className="text-gray-500 text-xs font-medium">Total Trips</p>
                          <h3 className="text-2xl font-bold text-gray-900">{user.totalTrips || tripHistory.length}</h3>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
                          <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center mb-2">
                              <Clock size={20} />
                          </div>
                          <p className="text-gray-500 text-xs font-medium">Hours Online</p>
                          <h3 className="text-2xl font-bold text-gray-900">42.5</h3>
                      </div>
                      <div className="col-span-2 bg-white p-4 rounded-xl border border-gray-200 shadow-sm h-48">
                          <p className="text-gray-500 text-xs font-medium mb-2">Weekly Earnings</p>
                          <ResponsiveContainer width="100%" height="85%">
                              <BarChart data={chartData}>
                                  <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={12} />
                                  <Tooltip cursor={{fill: '#f0fdf4'}} />
                                  <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  if (view === 'support') {
      return (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
              <h1 className="text-2xl font-bold text-gray-900">Driver Support Team</h1>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                          <Headphones size={24} />
                      </div>
                      <div>
                          <h3 className="font-bold text-gray-900">Need Help?</h3>
                          <p className="text-sm text-gray-500">Contact the NaijaMove admin team directly.</p>
                      </div>
                  </div>

                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">How can we help you?</label>
                          <textarea 
                              className="w-full p-3 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-emerald-500 outline-none"
                              placeholder="Describe your issue regarding payments, app bugs, or safety..."
                              value={supportMessage}
                              onChange={e => setSupportMessage(e.target.value)}
                          ></textarea>
                      </div>
                      
                      {supportSent ? (
                          <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg flex items-center gap-2 animate-in fade-in">
                              <CheckCircle size={18} /> Ticket Created! We'll contact you shortly.
                          </div>
                      ) : (
                          <Button onClick={handleSupportSubmit} disabled={!supportMessage.trim()} className="w-full">
                              <Send size={18} className="mr-2" /> Send Message
                          </Button>
                      )}
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                      <h4 className="font-bold text-blue-900 text-sm mb-2">Emergency Line</h4>
                      <p className="text-2xl font-bold text-blue-700">0800-NAIJA</p>
                      <p className="text-xs text-blue-600 mt-1">24/7 Available</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                      <h4 className="font-bold text-orange-900 text-sm mb-2">Office Address</h4>
                      <p className="text-sm text-orange-800">12 Ahmadu Bello Way,</p>
                      <p className="text-sm text-orange-800">Sokoto, Nigeria</p>
                  </div>
              </div>
          </div>
      );
  }

  // --- Dashboard View (Default) ---
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Status Toggle */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Driver Console</h2>
            <p className="text-sm text-gray-500">{user.vehicleType} • {user.email}</p>
          </div>
          <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${isOnline ? 'text-emerald-600' : 'text-gray-500'}`}>
                  {isOnline ? 'You are Online' : 'You are Offline'}
              </span>
              <button 
                onClick={() => setIsOnline(!isOnline)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${isOnline ? 'bg-emerald-600' : 'bg-gray-200'}`}
              >
                  <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${isOnline ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
          </div>
      </div>

      {/* Current Active Job */}
      {currentRide && (
          <div className="bg-white rounded-xl shadow-lg border-l-4 border-emerald-500 overflow-hidden relative">
               <button 
                    onClick={handleSOS}
                    className="absolute top-4 right-4 z-[50] bg-red-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold shadow-lg sos-btn hover:bg-red-700 transition-colors text-xs"
                  >
                      SOS
               </button>

              <div className="p-6 bg-emerald-50 border-b border-emerald-100 flex justify-between items-center">
                  <h3 className="font-bold text-emerald-900 flex items-center gap-2">
                      <Navigation size={20} />
                      Current Job
                  </h3>
                  <span className="text-2xl font-bold text-emerald-700">{CURRENCY_SYMBOL}{currentRide.price}</span>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 p-6">
                  <div className="space-y-6">
                      <div className="space-y-4">
                          <div className="flex gap-3">
                              <div className="flex flex-col items-center">
                                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                                  <div className="w-0.5 h-full bg-gray-200 min-h-[40px]"></div>
                                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                              </div>
                              <div className="space-y-6 pb-2">
                                  <div>
                                      <p className="text-xs text-gray-500 uppercase font-semibold">Pickup</p>
                                      <p className="font-medium text-gray-900">{currentRide.pickupAddress}</p>
                                  </div>
                                  <div>
                                      <p className="text-xs text-gray-500 uppercase font-semibold">Dropoff</p>
                                      <p className="font-medium text-gray-900">{currentRide.dropoffAddress}</p>
                                  </div>
                              </div>
                          </div>
                      </div>

                      {currentRide.type === 'LOGISTICS' && (
                          <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                              <div className="flex items-center gap-2 text-orange-800 mb-2">
                                  <Package size={18} />
                                  <span className="font-bold">Parcel Details</span>
                              </div>
                              <p className="text-sm text-gray-700">{currentRide.parcelDescription} • {currentRide.parcelWeight}</p>
                              <p className="text-sm text-gray-700 mt-1">Receiver: {currentRide.receiverPhone}</p>
                          </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        {currentRide.status === RideStatus.ACCEPTED && (
                             <Button onClick={() => handleStatusUpdate(RideStatus.IN_PROGRESS)} className="w-full col-span-2 py-3 text-lg">
                                Start Trip
                             </Button>
                        )}
                        {currentRide.status === RideStatus.IN_PROGRESS && (
                             <Button onClick={() => handleStatusUpdate(RideStatus.COMPLETED)} variant="primary" className="w-full bg-emerald-600 col-span-2 py-3 text-lg">
                                Complete Trip
                             </Button>
                        )}
                        
                        <Button variant="outline" className="w-full" onClick={() => setShowCall(true)}>
                            <Phone size={18} className="mr-2"/> Call
                        </Button>
                        <Button variant="outline" className="w-full bg-emerald-50 text-emerald-700 border-emerald-200" onClick={() => setShowChat(!showChat)}>
                            <MessageSquare size={18} className="mr-2"/> Chat
                        </Button>

                        <Button variant="danger" className="w-full col-span-2 mt-2" onClick={handleCancel}>
                            <AlertOctagon size={18} className="mr-2"/> Cancel Ride
                        </Button>
                      </div>
                  </div>
                  
                  <div className="h-64 rounded-lg overflow-hidden border border-gray-200">
                      {/* Pass currentRide to map for route navigation */}
                      <MapMock activeRide={currentRide} showDrivers={false} />
                  </div>
              </div>
              
              {showChat && (
                  <ChatWindow 
                      rideId={currentRide.id}
                      currentUser={user}
                      recipientName="Passenger" // In real app, fetch passenger name
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
              <h3 className="text-lg font-bold text-gray-900 mb-4">Nearby Requests ({requests.length})</h3>
              <div className="space-y-4">
                  {requests.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                          <p className="text-gray-500 animate-pulse">Searching for nearby requests...</p>
                      </div>
                  ) : (
                      requests.map(req => (
                          <div key={req.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                              <div className="flex flex-col md:flex-row justify-between gap-4">
                                  <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                          <span className={`text-xs font-bold px-2 py-1 rounded text-white ${req.type === 'LOGISTICS' ? 'bg-orange-500' : 'bg-blue-500'}`}>
                                              {req.type}
                                          </span>
                                          <span className="text-sm text-gray-500">{req.distanceKm}km away</span>
                                      </div>
                                      <h4 className="font-medium text-lg">{req.pickupAddress}</h4>
                                      <p className="text-sm text-gray-500">to {req.dropoffAddress}</p>
                                  </div>
                                  
                                  <div className="flex flex-col items-end gap-2 justify-center">
                                      <span className="text-2xl font-bold text-gray-900">{CURRENCY_SYMBOL}{req.price}</span>
                                      <div className="flex gap-2 w-full md:w-auto">
                                          <Button size="sm" variant="outline" onClick={() => handleReject(req.id)} className="flex-1 md:flex-none">
                                              <XCircle size={18} />
                                          </Button>
                                          <Button size="sm" onClick={() => handleAccept(req.id)} className="flex-1 md:flex-none">
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