import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { UserRole, VehicleType, RideRequest, RideStatus } from '../types';
import { Bike, Car, Truck, MapPin } from 'lucide-react';

// NOTE: CSS is imported in index.html to prevent ESM loader errors

interface MapMockProps {
  role?: UserRole;
  showDrivers?: boolean;
  activeRide?: RideRequest | null;
}

// Custom Icons
const createIcon = (color: string, type: 'VEHICLE' | 'PIN' = 'VEHICLE') => new L.DivIcon({
  className: 'custom-icon',
  html: type === 'VEHICLE' 
    ? `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${color};"></div>`
    : `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white;"></div>`,
  iconSize: type === 'VEHICLE' ? [24, 24] : [16, 16],
  iconAnchor: type === 'VEHICLE' ? [12, 12] : [8, 8]
});

// Component to recenter map when active ride changes
const RecenterMap = ({ coords }: { coords: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
        map.flyTo(coords, 14, { duration: 1.5 });
    }, [coords[0], coords[1], map]);
    return null;
}

const MapMock: React.FC<MapMockProps> = ({ role, showDrivers = true, activeRide }) => {
  // Center on Lagos
  const defaultPosition: [number, number] = [6.5244, 3.3792];
  const [isMounted, setIsMounted] = useState(false);

  // Fix Leaflet Icons on Mount only
  useEffect(() => {
    setIsMounted(true);
    // Safe check before modifying prototype
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

  // Random Background Drivers
  const [drivers, setDrivers] = useState([
    { id: 1, type: VehicleType.OKADA, lat: 6.528, lng: 3.385, name: "Musa", status: "BUSY" },
    { id: 2, type: VehicleType.KEKE, lat: 6.520, lng: 3.370, name: "Chinedu", status: "IDLE" },
    { id: 3, type: VehicleType.MINIBUS, lat: 6.530, lng: 3.390, name: "Sola", status: "BUSY" },
  ]);

  // Active Ride State
  const [route, setRoute] = useState<{start: [number,number], end: [number,number]} | null>(null);
  const [progress, setProgress] = useState(0);

  // Background Movement
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

  // Initialize Route for Active Ride
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

  // Animate Vehicle for Active Ride
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
    <div className="w-full h-full rounded-lg overflow-hidden border border-gray-200 z-0 relative">
      <MapContainer center={defaultPosition} zoom={13} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
        <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Street View">
                <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
            </LayersControl.BaseLayer>
            
            <LayersControl.BaseLayer name="Traffic View (Google)">
                <TileLayer
                    url="https://mt0.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}"
                    attribution="Google Maps"
                />
            </LayersControl.BaseLayer>

            <LayersControl.BaseLayer name="Satellite (Esri)">
                <TileLayer
                attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
            </LayersControl.BaseLayer>
        </LayersControl>

        {/* --- Background Fleet --- */}
        {showDrivers && !activeRide && drivers.map(d => (
            <Marker 
                key={d.id} 
                position={[d.lat, d.lng]} 
                icon={createIcon(d.type === VehicleType.OKADA ? '#10b981' : d.type === VehicleType.KEKE ? '#f97316' : '#2563eb')}
            >
                <Popup>
                    <div className="p-2">
                        <h3 className="font-bold">{d.name}</h3>
                        <p className="text-xs text-gray-600">{d.type} • {d.status}</p>
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