
import React, { useState, useEffect } from 'react';
import { User, VehicleType, RideRequest, RideStatus, PaymentTransaction } from '../../types';
import { calculateFare, createRide, getActiveRides, updateRideStatus, getUserTransactions, simulateDeposit, generateReferralCode, getReferralStats } from '../../services/mockService';
import { Button } from '../../components/ui/Button';
import { CURRENCY_SYMBOL } from '../../constants';
import MapMock from '../../components/MapMock';
import { Bike, Car, Box, Truck, MapPin, Phone, MessageSquare, History, Clock, Bell, X, Star, CheckCircle, Navigation, Wallet, Copy, ArrowUpRight, ArrowDownLeft, Users, TrendingUp } from 'lucide-react';
import { ChatWindow } from '../../components/ChatWindow';
import { VoiceCallModal } from '../../components/VoiceCallModal';
import { useToast } from '../../components/ui/Toast';

interface PassengerDashboardProps {
  user: User;
}

const PassengerDashboard: React.FC<PassengerDashboardProps> = ({ user }) => {
  const [view, setView] = useState<'BOOKING' | 'HISTORY' | 'WALLET' | 'REFERRALS'>('BOOKING');
  const [mode, setMode] = useState<'RIDE' | 'LOGISTICS'>('RIDE');
  const [pickup, setPickup] = useState('Sokoto Central Market');
  const [dropoff, setDropoff] = useState('');
  const [distance, setDistance] = useState(0);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeRide, setActiveRide] = useState<RideRequest | null>(null);
  const [history, setHistory] = useState<RideRequest[]>([]);
  const { addToast } = useToast();
  
  // Wallet State
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [isDepositing, setIsDepositing] = useState(false);
  const [balance, setBalance] = useState(user.walletBalance);
  
  // Modals
  const [showChat, setShowChat] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedRideData, setCompletedRideData] = useState<RideRequest | null>(null);

  // Logistics Fields
  const [parcelDesc, setParcelDesc] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');

  // Notification State
  const [notification, setNotification] = useState<string | null>(null);
  const [hasNotifiedArrival, setHasNotifiedArrival] = useState(false);

  // Progress State
  const [rideProgress, setRideProgress] = useState(0);

  // Referral State
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralStats, setReferralStats] = useState<any>(null);
  const [generatingCode, setGeneratingCode] = useState(false);

  useEffect(() => {
    getActiveRides(user.role, user.id).then(rides => {
        const active = rides.find(r => r.status !== RideStatus.COMPLETED && r.status !== RideStatus.CANCELLED);
        const past = rides.filter(r => r.status === RideStatus.COMPLETED || r.status === RideStatus.CANCELLED).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        if (!active && activeRide) {
             const justFinished = past.find(r => r.id === activeRide.id);
             if (justFinished && justFinished.status === RideStatus.COMPLETED) {
                 setCompletedRideData(justFinished);
                 setShowReceipt(true);
             }
        }

        setActiveRide(active || null);
        setHistory(past);
    });
  }, [user.id, user.role, activeRide]); 

  useEffect(() => {
      if (view === 'WALLET') {
          getUserTransactions(user.id).then(setTransactions);
      }
  }, [view, user.id, balance]);

  useEffect(() => setBalance(user.walletBalance), [user.walletBalance]);

  useEffect(() => {
    if (dropoff.length > 3) {
      setDistance(Math.floor(Math.random() * 15) + 2);
    } else {
        setDistance(0);
        setSelectedVehicle(null);
    }
  }, [dropoff]);

  useEffect(() => {
    if (view === 'REFERRALS') {
      getReferralStats(user.id).then(setReferralStats);
      if (!referralCode) {
        generateReferralCode(user.id).then(setReferralCode);
      }
    }
  }, [view, user.id, referralCode]);

  const handleBooking = async () => {
    if (!selectedVehicle || !pickup || !dropoff) return;
    setLoading(true);
    setTimeout(async () => {
        try {
            const price = calculateFare(selectedVehicle, distance);
            const ride = await createRide({
                passengerId: user.id,
                type: mode,
                vehicleType: selectedVehicle,
                pickupAddress: pickup,
                dropoffAddress: dropoff,
                price,
                distanceKm: distance,
                parcelDescription: mode === 'LOGISTICS' ? parcelDesc : undefined,
                receiverPhone: mode === 'LOGISTICS' ? receiverPhone : undefined,
            });
            setActiveRide(ride);
            setHasNotifiedArrival(false); 
            setRideProgress(0);
            addToast('Ride requested successfully! Searching for drivers...', 'success');
        } catch (e) {
            addToast("Booking failed. Try again.", 'error');
        } finally {
            setLoading(false);
        }
    }, 2000);
  };

  const handleSOS = () => {
      if(confirm("ALERT: Are you in danger? This will immediately alert the admin team and nearby security patrols.")) {
          addToast("SOS Signal Sent! Support team is contacting you now.", 'error');
      }
  };

  const handleSimulateDeposit = async () => {
      setIsDepositing(true);
      try {
          await simulateDeposit(user.id, 5000);
          setBalance(prev => prev + 5000);
          addToast("Wallet funded with ₦5,000!", 'success');
      } catch (e) {
          addToast("Deposit failed", 'error');
      } finally {
          setIsDepositing(false);
      }
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      addToast("Copied to clipboard", 'success');
  };

  const handleProgressUpdate = (progress: number) => {
      setRideProgress(progress);
      if (progress > 0.9 && !hasNotifiedArrival && activeRide?.status === RideStatus.IN_PROGRESS) {
          setNotification(`Your driver is approaching ${activeRide.dropoffAddress}. Please get ready.`);
          setHasNotifiedArrival(true);
      }
  };

  const VehicleCard = ({ type, icon: Icon, label, eta }: any) => {
    if (!distance) return null;
    const price = calculateFare(type, distance);
    const isSelected = selectedVehicle === type;

    return (
      <div 
        onClick={() => setSelectedVehicle(type)}
        className={`cursor-pointer p-4 rounded-xl border transition-all ${isSelected ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10'}`}
      >
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-400'}`}>
                    <Icon size={24} />
                </div>
                <div>
                    <h4 className={`font-bold ${isSelected ? 'text-white' : 'text-gray-300'}`}>{label}</h4>
                    <span className="text-xs text-gray-500">{eta} away • {distance}km</span>
                </div>
            </div>
            <div className="text-right">
                <p className={`font-bold text-lg ${isSelected ? 'text-emerald-400' : 'text-gray-300'}`}>{CURRENCY_SYMBOL}{price}</p>
                {type === VehicleType.OKADA && <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30">Fastest</span>}
            </div>
        </div>
      </div>
    );
  };

  // Receipt Modal
  if (showReceipt && completedRideData) {
      return (
          <div className="fixed inset-0 bg-black/80 z-[2000] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
              <div className="glass-panel w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-white/10">
                  <div className="bg-emerald-600/20 p-6 text-center text-white border-b border-white/10">
                      <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                          <CheckCircle size={32} className="text-emerald-400" />
                      </div>
                      <h2 className="text-2xl font-bold">Trip Completed!</h2>
                      <p className="text-emerald-200 text-sm">You have arrived safely.</p>
                  </div>
                  <div className="p-6 space-y-6">
                      <div className="flex justify-between items-end border-b border-white/10 pb-4">
                          <span className="text-gray-400 text-sm">Total Fare</span>
                          <span className="text-3xl font-bold text-emerald-400">{CURRENCY_SYMBOL}{completedRideData.price}</span>
                      </div>
                      <div className="space-y-4">
                          <div className="flex gap-4">
                              <div className="flex flex-col items-center">
                                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                  <div className="w-0.5 h-full bg-gray-700"></div>
                                  <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]"></div>
                              </div>
                              <div className="space-y-6 flex-1">
                                  <div>
                                      <p className="text-xs text-gray-500">Pickup</p>
                                      <p className="text-sm font-medium text-gray-200">{completedRideData.pickupAddress}</p>
                                      <p className="text-xs text-gray-600">{new Date(completedRideData.createdAt).toLocaleTimeString()}</p>
                                  </div>
                                  <div>
                                      <p className="text-xs text-gray-500">Dropoff</p>
                                      <p className="text-sm font-medium text-gray-200">{completedRideData.dropoffAddress}</p>
                                      <p className="text-xs text-gray-600">{new Date().toLocaleTimeString()}</p>
                                  </div>
                              </div>
                          </div>
                      </div>
                      
                      <div className="bg-white/5 p-4 rounded-xl flex items-center gap-4 border border-white/10">
                          <img src="https://ui-avatars.com/api/?name=Musa+Ibrahim&background=f97316&color=fff" className="w-12 h-12 rounded-full border border-gray-600" />
                          <div className="flex-1">
                              <p className="font-bold text-sm text-gray-200">How was Musa?</p>
                              <div className="flex text-yellow-500 gap-1 mt-1">
                                  {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="currentColor" />)}
                              </div>
                          </div>
                      </div>

                      <Button className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700" onClick={() => setShowReceipt(false)}>Close Receipt</Button>
                  </div>
              </div>
          </div>
      )
  }

  if (activeRide) {
      return (
          <div className="h-full flex flex-col lg:flex-row gap-6 relative">
              {/* --- Push Notification Toast --- */}
              {notification && (
                  <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[2000] w-[90%] max-w-md animate-in slide-in-from-top-4 fade-in">
                      <div className="glass-panel border-emerald-500/30 shadow-2xl rounded-2xl p-4 flex gap-4 items-center">
                          <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 flex-shrink-0 animate-bounce border border-emerald-500/30">
                              <Car size={24} />
                          </div>
                          <div className="flex-1">
                              <h4 className="font-bold text-white text-sm">Arriving Soon</h4>
                              <p className="text-xs text-gray-300">{notification}</p>
                          </div>
                          <button 
                            onClick={() => setNotification(null)}
                            className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white"
                          >
                              <X size={18} />
                          </button>
                      </div>
                  </div>
              )}

              <div className="lg:w-1/3 space-y-6">
                  <div className="glass-panel p-6 rounded-xl shadow-lg">
                      <div className="flex items-center gap-3 mb-4">
                          <div className={`w-3 h-3 rounded-full ${activeRide.status === RideStatus.IN_PROGRESS ? 'bg-emerald-500 animate-ping shadow-[0_0_10px_#10b981]' : 'bg-yellow-500 animate-pulse'}`}></div>
                          <h2 className="text-xl font-bold text-white">
                              {activeRide.status === RideStatus.PENDING ? 'Looking for Driver...' : 
                               activeRide.status === RideStatus.ACCEPTED ? 'Driver En Route' : 'Trip in Progress'}
                          </h2>
                      </div>

                      {/* Visual Progress Indicator */}
                      <div className="mb-6">
                          {activeRide.status === RideStatus.IN_PROGRESS && (
                              <>
                                <div className="flex justify-between text-xs font-semibold text-gray-400 mb-2">
                                    <span>Pickup</span>
                                    <span>{Math.round(rideProgress * 100)}%</span>
                                    <span>Dropoff</span>
                                </div>
                                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden border border-white/5">
                                    <div 
                                        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-300 ease-out flex items-center justify-end pr-1 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                                        style={{ width: `${Math.max(5, rideProgress * 100)}%` }}
                                    >
                                        <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_5px_white]"></div>
                                    </div>
                                </div>
                              </>
                          )}
                          {activeRide.status === RideStatus.ACCEPTED && (
                              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs text-blue-300 font-medium flex items-center gap-2">
                                  <Clock size={14} />
                                  Driver is on the way to your pickup location.
                              </div>
                          )}
                          {activeRide.status === RideStatus.PENDING && (
                              <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-yellow-500 rounded-full w-1/3 animate-indeterminate shadow-[0_0_10px_#eab308]"></div>
                              </div>
                          )}
                          <style>{`
                            @keyframes indeterminate {
                                0% { margin-left: -30%; width: 30%; }
                                50% { width: 60%; }
                                100% { margin-left: 100%; width: 30%; }
                            }
                            .animate-indeterminate { animation: indeterminate 1.5s infinite linear; }
                          `}</style>
                      </div>
                      
                      <div className="space-y-4">
                          <div className="flex gap-4 p-4 bg-white/5 rounded-lg border border-white/5">
                              <div className="space-y-1">
                                  <p className="text-sm text-gray-500">Pickup</p>
                                  <p className="font-medium text-gray-200">{activeRide.pickupAddress}</p>
                              </div>
                          </div>
                          
                          <div className="flex gap-4 p-4 bg-white/5 rounded-lg border border-white/5">
                              <div className="space-y-1">
                                  <p className="text-sm text-gray-500">Destination</p>
                                  <p className="font-medium text-gray-200">{activeRide.dropoffAddress}</p>
                              </div>
                          </div>

                          <div className="border-t border-white/10 pt-4">
                              <div className="flex justify-between items-center mb-4">
                                  <span className="text-gray-400">Total Fare</span>
                                  <span className="text-xl font-bold text-emerald-400">{CURRENCY_SYMBOL}{activeRide.price}</span>
                              </div>
                              {activeRide.status === RideStatus.PENDING && (
                                <Button variant="danger" className="w-full bg-red-600/20 text-red-400 border border-red-500/50 hover:bg-red-600/40" onClick={() => setActiveRide(null)}>Cancel Request</Button>
                              )}
                              {activeRide.status === RideStatus.IN_PROGRESS && (
                                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm text-center font-medium border border-emerald-500/30">
                                    Ride in progress. Enjoy your trip!
                                </div>
                              )}
                          </div>
                      </div>
                  </div>
              </div>
              <div className="flex-1 h-[500px] lg:h-auto glass-panel rounded-xl shadow-lg overflow-hidden relative">
                  {/* Pass activeRide to Map for real-time tracking */}
                  <MapMock activeRide={activeRide} onProgressUpdate={handleProgressUpdate} />
                  
                  {activeRide.driverId && (
                    <div className="absolute bottom-6 left-6 right-6 glass-panel p-4 rounded-lg shadow-2xl z-[1000] flex justify-between items-center border border-white/20">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
                                <img src="https://ui-avatars.com/api/?name=Musa+Ibrahim&background=f97316&color=fff" alt="Driver" />
                            </div>
                            <div>
                                <p className="font-bold text-white">Musa Ibrahim</p>
                                <p className="text-sm text-gray-400">{activeRide.vehicleType} • 4.8★</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                             <Button size="sm" variant="outline" onClick={() => setShowCall(true)} className="border-blue-500/30 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20">
                                <Phone size={18} className="mr-2" /> Call
                             </Button>
                             <Button size="sm" variant="outline" onClick={() => setShowChat(!showChat)} className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20">
                                <MessageSquare size={18} className="mr-2" /> Chat
                             </Button>
                        </div>
                    </div>
                  )}

                  {/* SOS Button for Active Rides */}
                  <button 
                    onClick={handleSOS}
                    className="absolute top-4 right-4 z-[1001] bg-red-600 text-white w-14 h-14 rounded-full flex items-center justify-center font-bold shadow-[0_0_20px_rgba(239,68,68,0.6)] sos-btn hover:bg-red-500 transition-colors border-2 border-white/20"
                  >
                      SOS
                  </button>

                  {/* Chat Window */}
                  {showChat && activeRide.driverId && (
                      <ChatWindow 
                        rideId={activeRide.id} 
                        currentUser={user} 
                        recipientName="Musa Ibrahim" 
                        onClose={() => setShowChat(false)} 
                      />
                  )}

                  {/* Call Modal */}
                  {showCall && activeRide.driverId && (
                      <VoiceCallModal 
                          recipientName="Musa Ibrahim"
                          recipientRole="Driver"
                          onEndCall={() => setShowCall(false)}
                      />
                  )}
              </div>
          </div>
      );
  }

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
      {/* Sidebar / Form */}
      <div className="lg:w-1/3 glass-panel p-6 rounded-xl shadow-lg border border-white/10 flex flex-col h-fit">
        {/* Toggle View */}
        <div className="flex p-1 bg-gray-900/50 rounded-lg mb-6 border border-white/5">
              <button
                onClick={() => setView('BOOKING')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${view === 'BOOKING' ? 'bg-white/10 shadow text-white border border-white/10' : 'text-gray-500 hover:text-gray-300'}`}
              >
                  Book
              </button>
              <button
                onClick={() => setView('HISTORY')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${view === 'HISTORY' ? 'bg-white/10 shadow text-white border border-white/10' : 'text-gray-500 hover:text-gray-300'}`}
              >
                  History
              </button>
              <button
                onClick={() => setView('WALLET')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${view === 'WALLET' ? 'bg-white/10 shadow text-white border border-white/10' : 'text-gray-500 hover:text-gray-300'}`}
              >
                  Wallet
              </button>
              <button
                onClick={() => setView('REFERRALS')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${view === 'REFERRALS' ? 'bg-white/10 shadow text-white border border-white/10' : 'text-gray-500 hover:text-gray-300'}`}
              >
                  Referrals
              </button>
        </div>

        {view === 'WALLET' ? (
            <div className="space-y-6 animate-in fade-in">
                {/* Balance Card */}
                <div className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-emerald-500/30">
                    <div className="absolute -right-6 -top-6 text-white/10 rotate-12">
                        <Wallet size={100} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-emerald-100 font-medium mb-1">Available Balance</p>
                        <h2 className="text-3xl font-bold mb-4">{CURRENCY_SYMBOL}{balance.toLocaleString()}</h2>
                        <div className="bg-black/30 backdrop-blur-md rounded-lg p-3 text-xs border border-white/10 shadow-inner">
                            <p className="font-bold opacity-80 mb-2">Fund via Bank Transfer:</p>
                            <p className="text-[10px] opacity-70 mb-1">Transfer to this dedicated account number:</p>
                            {user.bankAccount ? (
                                <div className="flex flex-col gap-1">
                                    <span className="font-bold text-sm text-emerald-300">Wema Bank</span>
                                    <div className="flex items-center justify-between bg-black/40 p-2 rounded border border-white/5">
                                        <span className="font-mono text-lg tracking-widest">{user.bankAccount.accountNumber}</span>
                                        <button onClick={() => copyToClipboard(user.bankAccount!.accountNumber)} className="hover:text-emerald-300"><Copy size={14}/></button>
                                    </div>
                                    <span className="text-[10px] opacity-70">{user.bankAccount.accountName}</span>
                                </div>
                            ) : (
                                <p className="text-red-300">Account not generated.</p>
                            )}
                        </div>
                        <Button 
                            onClick={handleSimulateDeposit}
                            isLoading={isDepositing}
                            className="w-full mt-4 bg-white text-emerald-800 hover:bg-emerald-50 border-none font-bold shadow-lg"
                        >
                            Simulate Deposit (+₦5,000)
                        </Button>
                    </div>
                </div>

                {/* Transactions */}
                <div>
                    <h3 className="font-bold text-gray-200 mb-3">Recent Transactions</h3>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {transactions.length === 0 ? (
                            <div className="text-center py-8 text-gray-600 text-sm">No transactions yet.</div>
                        ) : (
                            transactions.map(txn => (
                                <div key={txn.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${txn.type === 'DEPOSIT' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {txn.type === 'DEPOSIT' ? <ArrowDownLeft size={16}/> : <ArrowUpRight size={16}/>}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-200">{txn.type === 'DEPOSIT' ? 'Wallet Funding' : 'Ride Payment'}</p>
                                            <p className="text-[10px] text-gray-500">{new Date(txn.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className={`font-bold text-sm ${txn.type === 'DEPOSIT' ? 'text-emerald-400' : 'text-gray-400'}`}>
                                        {txn.type === 'DEPOSIT' ? '+' : '-'}{CURRENCY_SYMBOL}{txn.amount.toLocaleString()}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        ) : view === 'BOOKING' ? (
            <>
                {/* Toggle Mode */}
                <div className="flex gap-4 mb-6">
                    <button 
                        onClick={() => setMode('RIDE')}
                        className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold flex flex-col items-center gap-2 transition-all ${mode === 'RIDE' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-white/10 text-gray-500 hover:border-white/20 bg-white/5 hover:text-white'}`}
                    >
                        <Car size={20}/> Ride
                    </button>
                    <button 
                        onClick={() => setMode('LOGISTICS')}
                        className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold flex flex-col items-center gap-2 transition-all ${mode === 'LOGISTICS' ? 'border-orange-500 bg-orange-500/10 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'border-white/10 text-gray-500 hover:border-white/20 bg-white/5 hover:text-white'}`}
                    >
                        <Box size={20}/> Logistics
                    </button>
                </div>

                <div className="space-y-4 mb-6">
                    <div className="relative group">
                        <MapPin className="absolute left-3 top-3 text-emerald-500 group-focus-within:animate-bounce" size={20} />
                        <input 
                            type="text" 
                            value={pickup}
                            onChange={(e) => setPickup(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-white/10 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm font-medium text-white placeholder-gray-600 transition-all"
                            placeholder="Pickup location"
                        />
                    </div>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 text-gray-500" size={20} />
                        <input 
                            type="text"
                            value={dropoff}
                            onChange={(e) => setDropoff(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-white/10 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm font-medium text-white placeholder-gray-600 transition-all"
                            placeholder="Where to?"
                        />
                    </div>

                    {mode === 'LOGISTICS' && (
                        <div className="p-4 border border-dashed border-orange-500/30 rounded-lg space-y-3 bg-orange-500/5 animate-in fade-in">
                            <h4 className="text-sm font-semibold text-orange-400">Parcel Details</h4>
                            <input 
                                type="text" 
                                placeholder="What are you sending?"
                                className="w-full px-3 py-2 text-sm border border-white/10 rounded bg-gray-900/50 text-white focus:border-orange-500 outline-none"
                                value={parcelDesc}
                                onChange={e => setParcelDesc(e.target.value)}
                            />
                            <input 
                                type="tel" 
                                placeholder="Receiver's Phone Number"
                                className="w-full px-3 py-2 text-sm border border-white/10 rounded bg-gray-900/50 text-white focus:border-orange-500 outline-none"
                                value={receiverPhone}
                                onChange={e => setReceiverPhone(e.target.value)}
                            />
                        </div>
                    )}
                </div>

                {distance > 0 && (
                    <div className="space-y-3 mb-6">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Select Vehicle</h3>
                        <VehicleCard type={VehicleType.OKADA} icon={Bike} label="Okada" eta="3 min" />
                        <VehicleCard type={VehicleType.KEKE} icon={Box} label="Keke" eta="7 min" />
                        <VehicleCard type={VehicleType.MINIBUS} icon={Car} label="Mini Bus" eta="12 min" />
                        {mode === 'LOGISTICS' && (
                            <VehicleCard type={VehicleType.TRUCK} icon={Truck} label="Cargo Truck" eta="45 min" />
                        )}
                    </div>
                )}

                <Button 
                    className="w-full py-4 text-lg mt-auto shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all bg-gradient-to-r from-emerald-600 to-emerald-500" 
                    disabled={!selectedVehicle || !pickup || !dropoff || (mode === 'LOGISTICS' && (!parcelDesc || !receiverPhone))}
                    onClick={handleBooking}
                    isLoading={loading}
                >
                    {mode === 'RIDE' ? 'Confirm Ride' : 'Confirm Delivery'}
                </Button>
            </>
        ) : view === 'REFERRALS' ? (
            <div className="space-y-6 animate-in fade-in">
                {/* Referral Code Card */}
                <div className="glass-panel p-6 rounded-xl shadow-lg border border-white/10">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                        <Star size={20} className="text-yellow-400" />
                        Your Referral Code
                    </h3>
                    <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                        <p className="text-sm text-gray-400 mb-2">Share this code with friends to earn rewards!</p>
                        <div className="flex items-center gap-3">
                            <code className="flex-1 bg-black/30 p-3 rounded font-mono text-lg text-emerald-400 border border-white/10">
                                {referralCode || 'Generating...'}
                            </code>
                            <Button
                                onClick={() => navigator.clipboard.writeText(referralCode || '')}
                                className="bg-emerald-600 hover:bg-emerald-700"
                                disabled={!referralCode}
                            >
                                <Copy size={18} className="mr-2" />
                                Copy
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Referral Stats */}
                {referralStats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="glass-panel p-4 rounded-xl border border-white/10 text-center">
                            <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Users size={20} />
                            </div>
                            <p className="text-2xl font-bold text-white">{referralStats.referralCount}</p>
                            <p className="text-xs text-gray-400">Friends Referred</p>
                        </div>
                        <div className="glass-panel p-4 rounded-xl border border-white/10 text-center">
                            <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Wallet size={20} />
                            </div>
                            <p className="text-2xl font-bold text-white">{CURRENCY_SYMBOL}{referralStats.referralEarnings}</p>
                            <p className="text-xs text-gray-400">Earnings</p>
                        </div>
                        <div className="glass-panel p-4 rounded-xl border border-white/10 text-center">
                            <div className="w-10 h-10 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center mx-auto mb-2">
                                <TrendingUp size={20} />
                            </div>
                            <p className="text-2xl font-bold text-white">{referralStats.referredUsers.length}</p>
                            <p className="text-xs text-gray-400">Active Referrals</p>
                        </div>
                    </div>
                )}

                {/* Referred Users List */}
                {referralStats && referralStats.referredUsers.length > 0 && (
                    <div className="glass-panel p-6 rounded-xl shadow-lg border border-white/10">
                        <h3 className="font-bold text-white mb-4">Your Referrals</h3>
                        <div className="space-y-3">
                            {referralStats.referredUsers.map((ref: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                                    <div>
                                        <p className="font-medium text-white">{ref.name}</p>
                                        <p className="text-sm text-gray-400">{ref.email}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">Joined {new Date(ref.joinedAt).toLocaleDateString()}</p>
                                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">Active</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* How it Works */}
                <div className="glass-panel p-6 rounded-xl shadow-lg border border-white/10">
                    <h3 className="font-bold text-white mb-4">How Referrals Work</h3>
                    <div className="space-y-3 text-sm text-gray-300">
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                            <p>Share your referral code with friends and family</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                            <p>When they sign up and complete their first ride, you both get {CURRENCY_SYMBOL}500 bonus</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                            <p>Earn more with each successful referral!</p>
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                {history.length === 0 ? (
                    <div className="text-center py-10 text-gray-600">
                        <History className="mx-auto mb-2 opacity-50" size={32}/>
                        <p>No trip history yet.</p>
                    </div>
                ) : (
                    history.map(trip => (
                        <div key={trip.id} className="p-4 border border-white/10 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={`p-1.5 rounded-lg ${trip.type === 'LOGISTICS' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                        {trip.type === 'LOGISTICS' ? <Box size={14}/> : <Car size={14}/>}
                                    </span>
                                    <span className="font-bold text-sm text-gray-300">{new Date(trip.createdAt).toLocaleDateString()}</span>
                                </div>
                                <span className="font-bold text-white">{CURRENCY_SYMBOL}{trip.price}</span>
                            </div>
                            <div className="space-y-1 ml-9 relative border-l-2 border-white/10 pl-4 py-1">
                                <div className="absolute top-1 -left-[5px] w-2 h-2 rounded-full bg-gray-600"></div>
                                <div className="absolute bottom-1 -left-[5px] w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]"></div>
                                <p className="text-xs text-gray-500 truncate">{trip.pickupAddress}</p>
                                <p className="text-sm font-medium text-gray-200 truncate">{trip.dropoffAddress}</p>
                            </div>
                            <div className="mt-3 flex justify-between items-center pl-9">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${trip.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{trip.status}</span>
                                <Button size="sm" variant="outline" className="text-xs h-7 py-0 border-white/10 text-gray-400 hover:text-white hover:bg-white/10">Receipt</Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 glass-panel rounded-xl shadow-2xl border border-white/10 overflow-hidden min-h-[400px]">
          <MapMock />
      </div>
    </div>
  );
};

export default PassengerDashboard;
