import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import { UserRole, VehicleType } from '../types';
import { Bike, Car, Truck, User, Navigation } from 'lucide-react';

// NOTE: CSS is imported in index.html to prevent ESM loader errors

// Fix Leaflet Default Icon Issue
// We need to check if properties exist before deleting to avoid strict mode errors in some envs
if ((L.Icon.Default.prototype as any)._getIconUrl) {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
}

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapMockProps {
  role?: UserRole;
  showDrivers?: boolean;
}

// Custom Icons
const createIcon = (color: string) => new L.DivIcon({
  className: 'custom-icon',
  html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const MapMock: React.FC<MapMockProps> = ({ role, showDrivers = true }) => {
  // Center on Lagos
  const position: [number, number] = [6.5244, 3.3792];

  const [drivers, setDrivers] = useState([
    { id: 1, type: VehicleType.OKADA, lat: 6.528, lng: 3.385, name: "Musa", status: "BUSY" },
    { id: 2, type: VehicleType.KEKE, lat: 6.520, lng: 3.370, name: "Chinedu", status: "IDLE" },
    { id: 3, type: VehicleType.MINIBUS, lat: 6.530, lng: 3.390, name: "Sola", status: "BUSY" },
  ]);

  // Simulate movement
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

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-gray-200 z-0 relative">
      <MapContainer center={position} zoom={13} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
        <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Street View">
                <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satellite (Esri)">
                <TileLayer
                attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
            </LayersControl.BaseLayer>
        </LayersControl>

        {showDrivers && drivers.map(d => (
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
      </MapContainer>
    </div>
  );
};

export default MapMock;