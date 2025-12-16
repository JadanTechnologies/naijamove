export enum UserRole {
  ADMIN = 'ADMIN',
  DRIVER = 'DRIVER',
  PASSENGER = 'PASSENGER',
  STAFF = 'STAFF',
}

export enum VehicleType {
  OKADA = 'OKADA', // Motorbike
  KEKE = 'KEKE',   // Tricycle
  MINIBUS = 'MINIBUS',
  TRUCK = 'TRUCK', // For heavy logistics
}

export enum RideStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  walletBalance: number;
  phone?: string;
  avatar?: string;
  status?: 'ACTIVE' | 'BANNED' | 'SUSPENDED';
  ip?: string;
  device?: string;
  // Driver specific
  isOnline?: boolean;
  vehicleType?: VehicleType;
  rating?: number;
  totalTrips?: number;
  // Staff Specific
  token?: string;
  permissions?: string[];
}

export interface RideRequest {
  id: string;
  passengerId: string;
  driverId?: string;
  type: 'RIDE' | 'LOGISTICS';
  vehicleType: VehicleType;
  pickupAddress: string;
  dropoffAddress: string;
  price: number;
  status: RideStatus;
  createdAt: string;
  distanceKm: number;
  // Logistics specific
  parcelDescription?: string;
  parcelWeight?: string;
  receiverPhone?: string;
}

export interface SystemSettings {
  branding: {
    appName: string;
    logoUrl: string;
    primaryColor: string;
  };
  payments: {
    paystackEnabled: boolean;
    flutterwaveEnabled: boolean;
    monnifyEnabled: boolean;
    manualEnabled: boolean;
    manualBankDetails?: string;
  };
  communication: {
    emailProvider: 'RESEND' | 'SMTP';
    smsProvider: 'TWILIO';
    pushProvider: 'ONESIGNAL' | 'FIREBASE';
  };
  ai: {
    geminiEnabled: boolean; // For auto-reply & fraud detection
  };
  maintenanceMode: boolean;
  security: {
    blockedIps: string[];
    blockedCountries: string[];
  };
}

export interface Coordinates {
  lat: number;
  lng: number;
}