
import React, { useState, useEffect } from 'react';
import { User, VehicleType, RideRequest, RideStatus } from '../../types';
import { calculateFare, createRide, getActiveRides, updateRideStatus } from '../../services/mockService';
import { Button } from '../../components/ui/Button';
import { CURRENCY_SYMBOL } from '../../constants';
import MapMock from '../../components/MapMock';
import { Bike, Car, Box, Truck, MapPin, Phone, MessageSquare, History, Clock, Bell, X, Star, CheckCircle, Navigation } from 'lucide-react';
import { ChatWindow } from '../../components/ChatWindow';
import { VoiceCallModal } from '../../components/VoiceCallModal';
import { useToast } from '../../components/ui/Toast';

interface PassengerDashboardProps {
  user: User;
}

const PassengerDashboard: React.FC<PassengerDashboardProps> = ({ user }) => {
  const [view, setView] = useState<'BOOKING' | 'HISTORY'>('BOOKING');
  const [mode, setMode] = useState<'RIDE' | 'LOGISTICS'>('RIDE');
  const [pickup, setPickup] = useState('Sokoto Central Market');
  const [dropoff, setDropoff] = useState('');
  const [distance, setDistance] = useState(0);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeRide, setActiveRide] = useState<RideRequest | null>(null);
  const [history, setHistory] = useState<RideRequest[]>([]);
  const { addToast } = useToast();
  
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

  useEffect(() => {
    // Check for active rides and history on mount
    getActiveRides(user.role, user.id).then(rides => {
        const active = rides.find(r => r.status !== RideStatus.COMPLETED && r.status !== RideStatus.CANCELLED);
        const past = rides.filter(r => r.status === RideStatus.COMPLETED || r.status === RideStatus.CANCELLED).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        // Check if a ride just finished
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
  }, [user.id, user.role, activeRide]); // Re-run when activeRide changes locally to sync

  // Simulate distance calculation when dropoff changes
  useEffect(() => {
    if (dropoff.length > 3) {
      setDistance(Math.floor(Math.random() * 15) + 2); // Random 2-17km
    } else {
        setDistance(0);
        setSelectedVehicle(null);
    }
  }, [dropoff]);

  const handleBooking = async () => {
    if (!selectedVehicle || !pickup || !dropoff) return;
    
    setLoading(true);
    // Simulate finding drivers near location
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

  const handleProgressUpdate = (progress: number) => {
      setRideProgress(progress);

      // Trigger notification when driver is 90% of the way there (approaching)
      if (progress > 0.9 && !hasNotifiedArrival && activeRide?.status === RideStatus.IN_PROGRESS) {
          setNotification(`Your driver is approaching ${activeRide.dropoffAddress}. Please get ready.`);
          setHasNotifiedArrival(true);
      }
      
      // Auto-complete simulation for demo purposes if we reach 100%
      if (progress >= 1 && activeRide?.status === RideStatus.IN_PROGRESS) {
          // In real app, driver finishes. Here we can simulate it or wait for driver action.
          // For now, let driver finish it in DriverDashboard or user waits.
      }
  };

  const VehicleCard = ({ type, icon: Icon, label, eta }: any) => {
    if (!distance) return null;
    const price = calculateFare(type, distance);
    const isSelected = selectedVehicle === type;

    return (
      <div 
        onClick={() => setSelectedVehicle(type)}
        className={`cursor-pointer p-4 rounded-xl border transition-all ${isSelected ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
      >
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-emerald-200' : 'bg-gray-100'}`}>
                    <Icon size={24} className={isSelected ? 'text-emerald-800' : 'text-gray-600'} />
                </div>
                <div>
                    <h4 className="font-bold text-gray-900">{label}</h4>
                    <span className="text-xs text-gray-500">{eta} away • {distance}km</span>
                </div>
            </div>
            <div className="text-right">
                <p className="font-bold text-lg">{CURRENCY_SYMBOL}{price}</p>
                {type === VehicleType.OKADA && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Fastest</span>}
            </div>
        </div>
      </div>
    );
  };

  // Receipt Modal
  if (showReceipt && completedRideData) {
      return (
          <div className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                  <div className="bg-emerald-600 p-6 text-center text-white">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CheckCircle size={32} />
                      </div>
                      <h2 className="text-2xl font-bold">Trip Completed!</h2>
                      <p className="text-emerald-100">You have arrived safely.</p>
                  </div>
                  <div className="p-6 space-y-6">
                      <div className="flex justify-between items-end border-b border-gray-100 pb-4">
                          <span className="text-gray-500 text-sm">Total Fare</span>
                          <span className="text-3xl font-bold text-gray-900">{CURRENCY_SYMBOL}{completedRideData.price}</span>
                      </div>
                      <div className="space-y-4">
                          <div className="flex gap-4">
                              <div className="flex flex-col items-center">
                                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                  <div className="w-0.5 h-full bg-gray-200"></div>
                                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                              </div>
                              <div className="space-y-6 flex-1">
                                  <div>
                                      <p className="text-xs text-gray-500">Pickup</p>
                                      <p className="text-sm font-medium">{completedRideData.pickupAddress}</p>
                                      <p className="text-xs text-gray-400">{new Date(completedRideData.createdAt).toLocaleTimeString()}</p>
                                  </div>
                                  <div>
                                      <p className="text-xs text-gray-500">Dropoff</p>
                                      <p className="text-sm font-medium">{completedRideData.dropoffAddress}</p>
                                      <p className="text-xs text-gray-400">{new Date().toLocaleTimeString()}</p>
                                  </div>
                              </div>
                          </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-4">
                          <img src="https://ui-avatars.com/api/?name=Musa+Ibrahim&background=f97316&color=fff" className="w-12 h-12 rounded-full" />
                          <div className="flex-1">
                              <p className="font-bold text-sm">How was Musa?</p>
                              <div className="flex text-yellow-400 gap-1 mt-1">
                                  {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="currentColor" />)}
                              </div>
                          </div>
                      </div>

                      <Button className="w-full" onClick={() => setShowReceipt(false)}>Close Receipt</Button>
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
                      <div className="bg-white/90 backdrop-blur-md border border-emerald-100 shadow-2xl rounded-2xl p-4 flex gap-4 items-center">
                          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 flex-shrink-0 animate-bounce">
                              <Car size={24} />
                          </div>
                          <div className="flex-1">
                              <h4 className="font-bold text-gray-900 text-sm">Arriving Soon</h4>
                              <p className="text-xs text-gray-600">{notification}</p>
                          </div>
                          <button 
                            onClick={() => setNotification(null)}
                            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"
                          >
                              <X size={18} />
                          </button>
                      </div>
                  </div>
              )}

              <div className="lg:w-1/3 space-y-6">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                      <div className="flex items-center gap-3 mb-4">
                          <div className={`w-3 h-3 rounded-full ${activeRide.status === RideStatus.IN_PROGRESS ? 'bg-emerald-500 animate-ping' : 'bg-yellow-500'}`}></div>
                          <h2 className="text-xl font-bold text-gray-900">
                              {activeRide.status === RideStatus.PENDING ? 'Looking for Driver...' : 
                               activeRide.status === RideStatus.ACCEPTED ? 'Driver En Route' : 'Trip in Progress'}
                          </h2>
                      </div>

                      {/* Visual Progress Indicator */}
                      <div className="mb-6">
                          {activeRide.status === RideStatus.IN_PROGRESS && (
                              <>
                                <div className="flex justify-between text-xs font-semibold text-gray-500 mb-2">
                                    <span>Pickup</span>
                                    <span>{Math.round(rideProgress * 100)}%</span>
                                    <span>Dropoff</span>
                                </div>
                                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-300 ease-out flex items-center justify-end pr-1" 
                                        style={{ width: `${Math.max(5, rideProgress * 100)}%` }}
                                    >
                                        {/* Little car icon on the bar */}
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                    </div>
                                </div>
                              </>
                          )}
                          {activeRide.status === RideStatus.ACCEPTED && (
                              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700 font-medium flex items-center gap-2">
                                  <Clock size={14} />
                                  Driver is on the way to your pickup location.
                              </div>
                          )}
                          {activeRide.status === RideStatus.PENDING && (
                              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-yellow-400 rounded-full w-1/3 animate-indeterminate"></div>
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
                      
                      <div className="space-y-6">
                          <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                              <div className="space-y-1">
                                  <p className="text-sm text-gray-500">Pickup</p>
                                  <p className="font-medium">{activeRide.pickupAddress}</p>
                              </div>
                          </div>
                          
                          <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                              <div className="space-y-1">
                                  <p className="text-sm text-gray-500">Destination</p>
                                  <p className="font-medium">{activeRide.dropoffAddress}</p>
                              </div>
                          </div>

                          <div className="border-t pt-4">
                              <div className="flex justify-between items-center mb-4">
                                  <span className="text-gray-600">Total Fare</span>
                                  <span className="text-xl font-bold">{CURRENCY_SYMBOL}{activeRide.price}</span>
                              </div>
                              {activeRide.status === RideStatus.PENDING && (
                                <Button variant="danger" className="w-full" onClick={() => setActiveRide(null)}>Cancel Request</Button>
                              )}
                              {activeRide.status === RideStatus.IN_PROGRESS && (
                                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-sm text-center font-medium">
                                    Ride in progress. Enjoy your trip!
                                </div>
                              )}
                          </div>
                      </div>
                  </div>
              </div>
              <div className="flex-1 h-[500px] lg:h-auto bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
                  {/* Pass activeRide to Map for real-time tracking */}
                  <MapMock activeRide={activeRide} onProgressUpdate={handleProgressUpdate} />
                  
                  {activeRide.driverId && (
                    <div className="absolute bottom-6 left-6 right-6 bg-white p-4 rounded-lg shadow-lg z-[1000] flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                                <img src="https://ui-avatars.com/api/?name=Musa+Ibrahim&background=f97316&color=fff" alt="Driver" />
                            </div>
                            <div>
                                <p className="font-bold">Musa Ibrahim</p>
                                <p className="text-sm text-gray-500">{activeRide.vehicleType} • 4.8★</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                             <Button size="sm" variant="outline" onClick={() => setShowCall(true)} className="border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100">
                                <Phone size={18} className="mr-2" /> Call
                             </Button>
                             <Button size="sm" variant="outline" onClick={() => setShowChat(!showChat)} className="border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100">
                                <MessageSquare size={18} className="mr-2" /> Chat
                             </Button>
                        </div>
                    </div>
                  )}

                  {/* SOS Button for Active Rides */}
                  <button 
                    onClick={handleSOS}
                    className="absolute top-4 right-4 z-[1001] bg-red-600 text-white w-14 h-14 rounded-full flex items-center justify-center font-bold shadow-lg sos-btn hover:bg-red-700 transition-colors"
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
      <div className="lg:w-1/3 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-fit">
        {/* Toggle View */}
        <div className="flex p-1 bg-gray-100 rounded-lg mb-6">
             <button 
                onClick={() => setView('BOOKING')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${view === 'BOOKING' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
             >
                 Book Ride
             </button>
             <button 
                onClick={() => setView('HISTORY')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${view === 'HISTORY' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
             >
                 History
             </button>
        </div>

        {view === 'BOOKING' ? (
            <>
                {/* Toggle Mode */}
                <div className="flex gap-4 mb-6">
                    <button 
                        onClick={() => setMode('RIDE')}
                        className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold flex flex-col items-center gap-2 transition-all ${mode === 'RIDE' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                    >
                        <Car size={20}/> Ride
                    </button>
                    <button 
                        onClick={() => setMode('LOGISTICS')}
                        className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold flex flex-col items-center gap-2 transition-all ${mode === 'LOGISTICS' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                    >
                        <Box size={20}/> Logistics
                    </button>
                </div>

                <div className="space-y-4 mb-6">
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 text-emerald-500" size={20} />
                        <input 
                            type="text" 
                            value={pickup}
                            onChange={(e) => setPickup(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                            placeholder="Pickup location"
                        />
                    </div>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input 
                            type="text"
                            value={dropoff}
                            onChange={(e) => setDropoff(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                            placeholder="Where to?"
                        />
                    </div>

                    {mode === 'LOGISTICS' && (
                        <div className="p-4 border border-dashed border-gray-300 rounded-lg space-y-3 bg-orange-50/50 animate-in fade-in">
                            <h4 className="text-sm font-semibold text-gray-700">Parcel Details</h4>
                            <input 
                                type="text" 
                                placeholder="What are you sending?"
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded"
                                value={parcelDesc}
                                onChange={e => setParcelDesc(e.target.value)}
                            />
                            <input 
                                type="tel" 
                                placeholder="Receiver's Phone Number"
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded"
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
                    className="w-full py-4 text-lg mt-auto" 
                    disabled={!selectedVehicle || !pickup || !dropoff || (mode === 'LOGISTICS' && (!parcelDesc || !receiverPhone))}
                    onClick={handleBooking}
                    isLoading={loading}
                >
                    {mode === 'RIDE' ? 'Confirm Ride' : 'Confirm Delivery'}
                </Button>
            </>
        ) : (
            <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2">
                {history.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        <History className="mx-auto mb-2 opacity-50" size={32}/>
                        <p>No trip history yet.</p>
                    </div>
                ) : (
                    history.map(trip => (
                        <div key={trip.id} className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={`p-1.5 rounded-lg ${trip.type === 'LOGISTICS' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {trip.type === 'LOGISTICS' ? <Box size={14}/> : <Car size={14}/>}
                                    </span>
                                    <span className="font-bold text-sm">{new Date(trip.createdAt).toLocaleDateString()}</span>
                                </div>
                                <span className="font-bold text-gray-900">{CURRENCY_SYMBOL}{trip.price}</span>
                            </div>
                            <div className="space-y-1 ml-9 relative border-l-2 border-gray-100 pl-4 py-1">
                                <div className="absolute top-1 -left-[5px] w-2 h-2 rounded-full bg-gray-400"></div>
                                <div className="absolute bottom-1 -left-[5px] w-2 h-2 rounded-full bg-emerald-500"></div>
                                <p className="text-xs text-gray-500 truncate">{trip.pickupAddress}</p>
                                <p className="text-sm font-medium text-gray-800 truncate">{trip.dropoffAddress}</p>
                            </div>
                            <div className="mt-3 flex justify-between items-center pl-9">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${trip.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{trip.status}</span>
                                <Button size="sm" variant="outline" className="text-xs h-7 py-0">Receipt</Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
          <MapMock />
      </div>
    </div>
  );
};

export default PassengerDashboard;
