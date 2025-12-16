import { VehicleType } from './types';

export const APP_NAME = "NaijaMove";
export const CURRENCY_SYMBOL = "₦";

export const CITIES = ["Lagos", "Abuja", "Port Harcourt", "Kano", "Ibadan"];

export const VEHICLE_PRICING = {
  [VehicleType.OKADA]: { base: 200, perKm: 50 },
  [VehicleType.KEKE]: { base: 300, perKm: 80 },
  [VehicleType.MINIBUS]: { base: 500, perKm: 120 },
  [VehicleType.TRUCK]: { base: 2000, perKm: 500 },
};

export const MOCK_LOCATIONS = {
  Lagos: { lat: 6.5244, lng: 3.3792 },
  Abuja: { lat: 9.0765, lng: 7.3986 },
};