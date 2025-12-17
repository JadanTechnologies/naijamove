
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { UserRole, VehicleType, RideRequest, RideStatus } from '../types';
import { socketService } from '../services/mockService';
import { Navigation, Gauge, Radio, ChevronRight, ChevronLeft } from 'lucide-react';

interface MapMockProps {
  role?: UserRole;
  showDrivers?: boolean;
  activeRide?: RideRequest | null;
  onProgressUpdate?: (progress: number) => void;
  enableAdminFeatures?: boolean;
}

// SVG Strings for Vehicle Types
const ICONS = {
    [VehicleType.OKADA]: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3.2-1.8"/><path d="M9 19c-5 1.5-7-2-7-5.5S2 10 5 9c2 0 4 1 4 4"/><path d="m12 14 4-9 2.5-.5"/><path d="M19 17.5V14l-3-3 4-3 2 1"/></svg>`,
    [VehicleType.KEKE]: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10h18"/><path d="M5 10v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/><path d="m4 10 3-7h10l3 7"/><circle cx="7" cy="19" r="2"/><circle cx="17" cy="19" r="2"/></svg>`,
    [VehicleType.MINIBUS]: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="17" cy="18" r="2"/></svg>`,
    [VehicleType.TRUCK]: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="8" x="2" y="6" rx="1.5"/><path d="M10 14h3.6c.4 0 .9-.2 1.2-.6l2.7-3.6c.3-.4.8-.7 1.3-.7H22v8h-2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 18h8"/></svg>`,
    PIN: `<div style="background-color: white; width: 8px; height: 8px; border-radius: 50%;"></div>`
};

const createIcon = (color: string, type: VehicleType | 'PIN' = 'PIN') => {
  const isVehicle = type !== 'PIN';
  const size = isVehicle ? 32 : 16;
  const iconContent = isVehicle ? ICONS[type as VehicleType] : ICONS.PIN;

  return new L.DivIcon({
    className: 'custom-icon',
    html: `
      <div style="
        background-color: ${color}; 
        width: ${size}px; 
        height: ${size}px; 
        border-radius: 50%; 
        border: 2px solid white; 
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        ${iconContent}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

const RecenterMap = ({ coords }: { coords: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
        map.flyTo(coords, 14, { duration: 1.5 });
    }, [coords[0], coords[1], map]);
    return null;
}

const MapMock: React.FC<MapMockProps> = ({ role, showDrivers = true, activeRide, onProgressUpdate, enableAdminFeatures = false }) => {
  // Coordinates for Sokoto, Nigeria
  const defaultPosition: [number, number] = [13.0059, 5.2476];
  const [isMounted, setIsMounted] = useState(false);
  const [showFleetSidebar, setShowFleetSidebar] = useState(true);
  const [focusedDriverId, setFocusedDriverId] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    try {
        if ((L.Icon.Default.prototype as any)._getIconUrl) {
            delete (L.Icon.Default.prototype as any)._getIconUrl;
        }
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
    } catch (e) {
        console.warn("Leaflet icon fix failed:", e);
    }
  }, []);

  const [drivers, setDrivers] = useState([
    { 
        id: '1', 
        type: VehicleType.OKADA, 
        lat: 13.0100, 
        lng: 5.2500, 
        name: "Musa Ibrahim", 
        status: "BUSY",
        rating: 4.8,
        trips: 1240,
        loadKg: 75,
        maxLoad: 150,
        speed: 45,
        heading: 0,
        action: "Cruising",
        currentRide: {
            id: 'RIDE-8821',
            passenger: 'Adebayo T.',
            dest: 'Sokoto Market'
        }
    },
    { 
        id: '2', 
        type: VehicleType.KEKE, 
        lat: 13.0050, 
        lng: 5.2480, 
        name: "Sani Abacha", 
        status: "IDLE", 
        rating: 4.5, 
        trips: 890, 
        loadKg: 0, 
        maxLoad: 400,
        speed: 0,
        heading: 90,
        action: "Stopped",
        currentRide: null 
    },
    { 
        id: '3', 
        type: VehicleType.MINIBUS, 
        lat: 13.0120, 
        lng: 5.2400, 
        name: "Chinedu Okeke", 
        status: "BUSY", 
        rating: 4.9, 
        trips: 2100, 
        loadKg: 800, 
        maxLoad: 1000,
        speed: 30,
        heading: 180,
        action: "Turning",
        currentRide: { id: 'RIDE-9912', passenger: 'Fatima Z.', dest: 'University' }
    },
    { 
        id: '4', 
        type: VehicleType.OKADA, 
        lat: 13.0010, 
        lng: 5.2550, 
        name: "Aliyu Gombe", 
        status: "IDLE", 
        rating: 4.2, 
        trips: 400, 
        loadKg: 0, 
        maxLoad: 150,
        speed: 0,
        heading: 270,
        action: "Stopped",
        currentRide: null
    },
    { 
        id: '5', 
        type: VehicleType.TRUCK, 
        lat: 13.0200, 
        lng: 5.2300, 
        name: "Dangote Logistics 01", 
        status: "BUSY", 
        rating: 5.0, 
        trips: 150, 
        loadKg: 2500, 
        maxLoad: 3000,
        speed: 55,
        heading: 45,
        action: "En Route to Dropoff",
        currentRide: { id: 'LOG-1122', passenger: 'Cement Depot', dest: 'Construction Site B' }
    }
  ]);

  const [route, setRoute] = useState<{start: [number,number], end: [number,number]} | null>(null);
  const [progress, setProgress] = useState(0);

  // Subscribe to real-time socket
  useEffect(() => {
      const unsubscribe = socketService.subscribe('DRIVER_LOCATIONS', (updates: any[]) => {
          setDrivers(prev => {
              // Merge updates with existing driver data
              return prev.map(d => {
                  const update = updates.find((u: any) => u.id === d.id);
                  return update ? { 
                      ...d, 
                      lat: update.lat, 
                      lng: update.lng, 
                      speed: update.speed || d.speed,
                      heading: update.heading || d.heading,
                      action: update.action || d.action,
                      status: update.status || d.status
                  } : d;
              });
          });
      });
      return unsubscribe;
  }, []);

  useEffect(() => {
      if (activeRide) {
          const seed1 = activeRide.pickupAddress.length;
          const seed2 = activeRide.dropoffAddress.length;
          
          const startLat = 13.0059 + (seed1 % 20 - 10) * 0.003;
          const startLng = 5.2476 + (seed2 % 20 - 10) * 0.003;
          
          const endLat = 13.0059 + (seed2 % 20 - 10) * 0.003;
          const endLng = 5.2476 + (seed1 % 20 - 10) * 0.003;

          setRoute({ start: [startLat, startLng], end: [endLat, endLng] });
          
          if (activeRide.status === RideStatus.COMPLETED) setProgress(1);
          else if (activeRide.status === RideStatus.PENDING || activeRide.status === RideStatus.ACCEPTED) setProgress(0);
          else if (activeRide.status === RideStatus.IN_PROGRESS) setProgress(0.1);
      } else {
          setRoute(null);
          setProgress(0);
      }
  }, [activeRide?.id]);

  useEffect(() => {
      if (activeRide?.status === RideStatus.IN_PROGRESS && route && progress < 1) {
          const interval = setInterval(() => {
              setProgress(prev => {
                  const next = prev + 0.005; // Move 0.5% every 100ms
                  if (onProgressUpdate) onProgressUpdate(next);
                  if (next >= 1) return 1;
                  return next;
              });
          }, 100);
          return () => clearInterval(interval);
      }
  }, [activeRide?.status, route, progress, onProgressUpdate]);

  const vehiclePos: [number, number] | null = route ? [
      route.start[0] + (route.end[0] - route.start[0]) * progress,
      route.start[1] + (route.end[1] - route.start[1]) * progress
  ] : null;

  // Helper to get color based on vehicle type
  const getVehicleColor = (type: VehicleType) => {
      switch(type) {
          case VehicleType.OKADA: return '#10b981'; // Emerald
          case VehicleType.KEKE: return '#f97316'; // Orange
          case VehicleType.MINIBUS: return '#3b82f6'; // Blue
          case VehicleType.TRUCK: return '#8b5cf6'; // Purple
          default: return '#6b7280';
      }
  };

  const getFocusedDriverPos = (): [number, number] | null => {
      if(focusedDriverId) {
          const d = drivers.find(drv => drv.id === focusedDriverId);
          if(d) return [d.lat, d.lng];
      }
      return null;
  }

  if (!isMounted) return <div className="w-full h-full bg-gray-100 animate-pulse rounded-lg"></div>;

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-gray-200 z-0 relative isolate flex">
      <div className="flex-1 relative">
          <MapContainer center={defaultPosition} zoom={13} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
            {focusedDriverId && <RecenterMap coords={getFocusedDriverPos() || defaultPosition} />}
            <LayersControl position="topright">
                <LayersControl.BaseLayer checked name="Street View">
                    <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                </LayersControl.BaseLayer>
                
                <LayersControl.BaseLayer name="Satellite (Hybrid)">
                    <TileLayer
                    attribution='Google'
                    url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                    />
                </LayersControl.BaseLayer>

                <LayersControl.Overlay name="Live Traffic" checked>
                    <TileLayer
                        url="https://mt0.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}"
                        attribution="Google Traffic"
                    />
                </LayersControl.Overlay>
            </LayersControl>

            {/* --- Background Fleet with Detailed Popups --- */}
            {showDrivers && !activeRide && drivers.map(d => (
                <Marker 
                    key={d.id} 
                    position={[d.lat, d.lng]} 
                    icon={createIcon(getVehicleColor(d.type), d.type)}
                    eventHandlers={{
                        click: () => {
                            if(enableAdminFeatures) setFocusedDriverId(d.id);
                        }
                    }}
                >
                    <Popup className="driver-popup">
                        <div className="p-1 min-w-[200px]">
                            <div className="flex justify-between items-start mb-2 border-b pb-2">
                                <div>
                                    <h3 className="font-bold text-gray-900">{d.name}</h3>
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <span>{d.rating}★</span>
                                        <span>•</span>
                                        <span>{d.trips} Trips</span>
                                    </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    d.status === 'BUSY' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                    {d.status}
                                </span>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Vehicle Type:</span>
                                    <span className="font-bold text-gray-700">{d.type}</span>
                                </div>
                                <div className="flex justify-between text-xs items-center">
                                    <span className="text-gray-500">Telemetry:</span>
                                    <span className="font-mono text-[10px] bg-gray-100 px-1 rounded">{d.speed}km/h • {d.heading}°</span>
                                </div>
                                <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                    Action: <strong>{d.action}</strong>
                                </div>
                                {d.currentRide ? (
                                    <div className="bg-gray-50 p-2 rounded border border-gray-100 mt-2">
                                        <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Current Ride</div>
                                        <div className="text-xs">
                                            <div className="font-mono text-emerald-600 mb-0.5">{d.currentRide.id}</div>
                                            <div className="font-medium truncate">To: {d.currentRide.dest}</div>
                                            <div className="text-gray-500">Pass: {d.currentRide.passenger}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-xs text-gray-400 italic text-center py-2">
                                        Waiting for requests...
                                    </div>
                                )}
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}

            {/* --- Active Ride Navigation --- */}
            {activeRide && route && vehiclePos && (
                <>
                    <RecenterMap coords={vehiclePos} />
                    <Marker position={route.start} icon={createIcon('#10b981', 'PIN')}>
                        <Popup>Pickup: {activeRide.pickupAddress}</Popup>
                    </Marker>
                    <Marker position={route.end} icon={createIcon('#ef4444', 'PIN')}>
                        <Popup>Dropoff: {activeRide.dropoffAddress}</Popup>
                    </Marker>
                    <Polyline positions={[route.start, route.end]} color="#6366f1" weight={4} dashArray="10, 10" opacity={0.6} />
                    <Marker 
                        position={vehiclePos} 
                        icon={createIcon(getVehicleColor(activeRide.vehicleType), activeRide.vehicleType)}
                        zIndexOffset={1000}
                    >
                        <Popup>
                            <div className="text-center">
                                <p className="font-bold text-sm">Your {activeRide.vehicleType}</p>
                                <p className="text-xs text-gray-500">In Transit</p>
                                <p className="text-xs font-mono mt-1 text-emerald-600">
                                    Load: {activeRide.estimatedWeightKg}kg
                                </p>
                            </div>
                        </Popup>
                    </Marker>
                </>
            )}

          </MapContainer>
      </div>

      {/* Admin Fleet Sidebar */}
      {enableAdminFeatures && showDrivers && (
          <div className={`absolute top-4 left-4 bottom-4 w-64 bg-white rounded-xl shadow-2xl z-[1000] flex flex-col transition-transform duration-300 transform ${showFleetSidebar ? 'translate-x-0' : '-translate-x-72'}`}>
              <div className="p-4 border-b bg-gray-50 rounded-t-xl flex justify-between items-center">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <Radio size={16} className="text-red-500 animate-pulse"/> Live Fleet
                  </h3>
                  <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">{drivers.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                  {drivers.map(d => (
                      <div 
                        key={d.id} 
                        onClick={() => setFocusedDriverId(d.id)}
                        className={`p-3 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors ${focusedDriverId === d.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                      >
                          <div className="flex justify-between items-start mb-1">
                              <span className="font-bold text-sm text-gray-900">{d.name}</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${d.status === 'BUSY' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>{d.status}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                              <span className="capitalize">{d.type.toLowerCase()}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1"><Gauge size={10}/> {d.speed}km/h</span>
                          </div>
                          <div className="text-[10px] text-blue-600 bg-blue-50/50 p-1 rounded truncate">
                              {d.action}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}
      
      {/* Sidebar Toggle Button for Admin */}
      {enableAdminFeatures && showDrivers && (
          <button 
            onClick={() => setShowFleetSidebar(!showFleetSidebar)}
            className="absolute top-1/2 left-0 z-[1001] bg-white p-1 rounded-r-lg shadow-md border border-l-0 border-gray-200 hover:bg-gray-50"
            style={{ left: showFleetSidebar ? '256px' : '0' }}
          >
              {showFleetSidebar ? <ChevronLeft size={16}/> : <ChevronRight size={16}/>}
          </button>
      )}
    </div>
  );
};

export default MapMock;
