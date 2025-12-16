import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { UserRole, VehicleType, RideRequest, RideStatus } from '../types';

interface MapMockProps {
  role?: UserRole;
  showDrivers?: boolean;
  activeRide?: RideRequest | null;
}

const createIcon = (color: string, type: 'VEHICLE' | 'PIN' = 'VEHICLE') => new L.DivIcon({
  className: 'custom-icon',
  html: type === 'VEHICLE' 
    ? `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${color};"></div>`
    : `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white;"></div>`,
  iconSize: type === 'VEHICLE' ? [24, 24] : [16, 16],
  iconAnchor: type === 'VEHICLE' ? [12, 12] : [8, 8]
});

const RecenterMap = ({ coords }: { coords: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
        map.flyTo(coords, 14, { duration: 1.5 });
    }, [coords[0], coords[1], map]);
    return null;
}

const MapMock: React.FC<MapMockProps> = ({ role, showDrivers = true, activeRide }) => {
  const defaultPosition: [number, number] = [6.5244, 3.3792];
  const [isMounted, setIsMounted] = useState(false);

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
        id: 1, 
        type: VehicleType.OKADA, 
        lat: 6.528, 
        lng: 3.385, 
        name: "Musa Ibrahim", 
        status: "BUSY",
        rating: 4.8,
        trips: 1240,
        currentRide: {
            id: 'RIDE-8821',
            passenger: 'Adebayo T.',
            dest: 'Ikeja City Mall'
        }
    },
    { 
        id: 2, 
        type: VehicleType.KEKE, 
        lat: 6.520, 
        lng: 3.370, 
        name: "Chinedu Eze", 
        status: "IDLE",
        rating: 4.5,
        trips: 850,
        currentRide: null
    },
    { 
        id: 3, 
        type: VehicleType.MINIBUS, 
        lat: 6.530, 
        lng: 3.390, 
        name: "Sola Alabi", 
        status: "BUSY",
        rating: 4.9,
        trips: 2100,
         currentRide: {
            id: 'RIDE-9942',
            passenger: 'Grace O.',
            dest: 'Victoria Island'
        }
    },
  ]);

  const [route, setRoute] = useState<{start: [number,number], end: [number,number]} | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
        setDrivers(prev => prev.map(d => ({
            ...d,
            lat: d.lat + (Math.random() - 0.5) * 0.001,
            lng: d.lng + (Math.random() - 0.5) * 0.001
        })));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
      if (activeRide) {
          const seed1 = activeRide.pickupAddress.length;
          const seed2 = activeRide.dropoffAddress.length;
          
          const startLat = 6.5244 + (seed1 % 20 - 10) * 0.003;
          const startLng = 3.3792 + (seed2 % 20 - 10) * 0.003;
          
          const endLat = 6.5244 + (seed2 % 20 - 10) * 0.003;
          const endLng = 3.3792 + (seed1 % 20 - 10) * 0.003;

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
                  if (prev >= 1) return 1;
                  return prev + 0.005; // Move 0.5% every 100ms
              });
          }, 100);
          return () => clearInterval(interval);
      }
  }, [activeRide?.status, route, progress]);

  const vehiclePos: [number, number] | null = route ? [
      route.start[0] + (route.end[0] - route.start[0]) * progress,
      route.start[1] + (route.end[1] - route.start[1]) * progress
  ] : null;

  if (!isMounted) return <div className="w-full h-full bg-gray-100 animate-pulse rounded-lg"></div>;

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-gray-200 z-0 relative isolate">
      <MapContainer center={defaultPosition} zoom={13} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
        <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Street View">
                <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
            </LayersControl.BaseLayer>
            
            <LayersControl.BaseLayer name="Satellite">
                <TileLayer
                attribution='Tiles &copy; Esri'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
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
                icon={createIcon(d.type === VehicleType.OKADA ? '#10b981' : d.type === VehicleType.KEKE ? '#f97316' : '#2563eb')}
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
                                 <span className="font-medium">{d.type}</span>
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
                    icon={createIcon(
                        activeRide.vehicleType === VehicleType.OKADA ? '#10b981' : 
                        activeRide.vehicleType === VehicleType.KEKE ? '#f97316' : '#2563eb'
                    )}
                    zIndexOffset={1000}
                >
                    <Popup>
                        <div className="text-center">
                            <p className="font-bold text-sm">Your {activeRide.vehicleType}</p>
                            <p className="text-xs text-gray-500">In Transit</p>
                        </div>
                    </Popup>
                </Marker>
            </>
        )}

      </MapContainer>
    </div>
  );
};

export default MapMock;