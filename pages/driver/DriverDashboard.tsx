import React, { useState, useEffect } from 'react';
import { User, RideRequest, RideStatus } from '../../types';
import { getActiveRides, updateRideStatus, rejectRide } from '../../services/mockService';
import { Button } from '../../components/ui/Button';
import { CURRENCY_SYMBOL } from '../../constants';
import { MapPin, Navigation, Package, Phone, CheckCircle, XCircle, MessageSquare, AlertOctagon } from 'lucide-react';
import MapMock from '../../components/MapMock';
import { ChatWindow } from '../../components/ChatWindow';
import { VoiceCallModal } from '../../components/VoiceCallModal';

interface DriverDashboardProps {
  user: User;
}

const DriverDashboard: React.FC<DriverDashboardProps> = ({ user }) => {
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [currentRide, setCurrentRide] = useState<RideRequest | null>(null);
  const [isOnline, setIsOnline] = useState(user.isOnline || false);
  const [showChat, setShowChat] = useState(false);
  const [showCall, setShowCall] = useState(false);

  useEffect(() => {
    // Poll for rides
    const interval = setInterval(() => {
        if(isOnline) {
            getActiveRides(user.role, user.id).then(rides => {
                const active = rides.find(r => r.status === RideStatus.ACCEPTED || r.status === RideStatus.IN_PROGRESS);
                setCurrentRide(active || null);
                // Filter out rides that are not PENDING for the request list
                setRequests(rides.filter(r => r.status === RideStatus.PENDING));
            });
        }
    }, 3000);
    return () => clearInterval(interval);
  }, [user.id, user.role, isOnline]);

  const handleAccept = async (rideId: string) => {
    await updateRideStatus(rideId, RideStatus.ACCEPTED, user.id);
    // Refresh immediately handled by effect
  };

  const handleReject = async (rideId: string) => {
      await rejectRide(rideId, user.id);
      setRequests(prev => prev.filter(r => r.id !== rideId));
  };

  const handleStatusUpdate = async (status: RideStatus) => {
      if(!currentRide) return;
      await updateRideStatus(currentRide.id, status);
      if (status === RideStatus.COMPLETED) {
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

  const handleSOS = () => {
      if(confirm("EMERGENCY: Report security threat? Admin and nearby police stations will be notified.")) {
          alert("Distress signal sent! Help is on the way.");
      }
  };

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

export default DriverDashboard;