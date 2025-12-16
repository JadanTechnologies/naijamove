import React, { useState, useEffect } from 'react';
import { User, VehicleType, RideRequest, RideStatus } from '../../types';
import { calculateFare, createRide, getActiveRides } from '../../services/mockService';
import { Button } from '../../components/ui/Button';
import { CURRENCY_SYMBOL, VEHICLE_PRICING } from '../../constants';
import MapMock from '../../components/MapMock';
import { Bike, Car, Box, Truck, MapPin, Clock, ShieldAlert } from 'lucide-react';

interface PassengerDashboardProps {
  user: User;
}

const PassengerDashboard: React.FC<PassengerDashboardProps> = ({ user }) => {
  const [mode, setMode] = useState<'RIDE' | 'LOGISTICS'>('RIDE');
  const [pickup, setPickup] = useState('Current Location');
  const [dropoff, setDropoff] = useState('');
  const [distance, setDistance] = useState(0);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeRide, setActiveRide] = useState<RideRequest | null>(null);

  // Logistics Fields
  const [parcelDesc, setParcelDesc] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');

  useEffect(() => {
    // Check for active rides on mount
    getActiveRides(user.role, user.id).then(rides => {
        const active = rides.find(r => r.status !== RideStatus.COMPLETED && r.status !== RideStatus.CANCELLED);
        setActiveRide(active || null);
    });
  }, [user.id, user.role]);

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
    } catch (e) {
        alert("Booking failed. Try again.");
    } finally {
        setLoading(false);
    }
  };

  const handleSOS = () => {
      if(confirm("ALERT: Are you in danger? This will immediately alert the admin team and nearby security patrols.")) {
          alert("SOS Signal Sent! Support team is contacting you now.");
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

  if (activeRide) {
      return (
          <div className="h-full flex flex-col lg:flex-row gap-6 relative">
              <div className="lg:w-1/3 space-y-6">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                      <div className="flex items-center gap-3 mb-6">
                          <div className={`w-3 h-3 rounded-full ${activeRide.status === RideStatus.IN_PROGRESS ? 'bg-emerald-500 animate-ping' : 'bg-yellow-500'}`}></div>
                          <h2 className="text-xl font-bold text-gray-900">
                              {activeRide.status === RideStatus.PENDING ? 'Looking for Driver...' : 
                               activeRide.status === RideStatus.ACCEPTED ? 'Driver is coming' : 'Trip in Progress'}
                          </h2>
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
                  <MapMock activeRide={activeRide} />
                  
                  {activeRide.driverId && (
                    <div className="absolute bottom-6 left-6 right-6 bg-white p-4 rounded-lg shadow-lg z-[1000]">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                                <img src="https://picsum.photos/id/2/200/200" alt="Driver" />
                            </div>
                            <div>
                                <p className="font-bold">Musa Ibrahim</p>
                                <p className="text-sm text-gray-500">{activeRide.vehicleType} • 4.8★</p>
                            </div>
                            <div className="ml-auto">
                                <span className="text-2xl font-bold text-emerald-600">
                                    {activeRide.status === RideStatus.IN_PROGRESS ? 'Live' : '5 min'}
                                </span>
                            </div>
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
              </div>
          </div>
      );
  }

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
      {/* Booking Form */}
      <div className="lg:w-1/3 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-fit">
        {/* Toggle Mode */}
        <div className="flex p-1 bg-gray-100 rounded-lg mb-6">
            <button 
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'RIDE' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
                onClick={() => setMode('RIDE')}
            >
                Ride
            </button>
            <button 
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'LOGISTICS' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
                onClick={() => setMode('LOGISTICS')}
            >
                Send Package
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
                <div className="p-4 border border-dashed border-gray-300 rounded-lg space-y-3 bg-orange-50/50">
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
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Select Ride</h3>
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
            disabled={!selectedVehicle || !pickup || !dropoff}
            onClick={handleBooking}
            isLoading={loading}
        >
            {mode === 'RIDE' ? 'Confirm Ride' : 'Confirm Delivery'}
        </Button>
      </div>

      {/* Map */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
          <MapMock />
      </div>
    </div>
  );
};

export default PassengerDashboard;