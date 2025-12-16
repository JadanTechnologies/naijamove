
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

export interface ChatMessage {
  id: string;
  rideId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
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
  // Driver specific
  rejectedBy?: string[];
}

export interface TrackerConfig {
    id: string;
    provider: 'TELTONIKA' | 'RUPTELA' | 'CONCOX' | 'CALAMP' | 'QUECLINK' | 'MEITRACK' | 'COBAN' | 'SUNTECH' | 'GOSAFE' | 'TRAMIGO';
    name: string;
    enabled: boolean;
    serverIp: string;
    port: number;
    protocol: 'TCP' | 'UDP';
}

export interface NotificationTemplate {
    id: string;
    type: 'EMAIL' | 'SMS' | 'PUSH';
    name: string;
    subject?: string; // Only for email
    body: string;
    variables: string[]; // e.g. {{name}}, {{otp}}
}

export interface Announcement {
    id: string;
    title: string;
    message: string;
    target: 'ALL' | 'DRIVERS' | 'PASSENGERS';
    status: 'DRAFT' | 'SENT';
    createdAt: string;
    sentAt?: string;
}

export interface SystemSettings {
  branding: {
    appName: string;
    logoUrl: string;
    primaryColor: string;
  };
  payments: {
    paystackEnabled: boolean;
    paystackSecretKey?: string;
    flutterwaveEnabled: boolean;
    flutterwaveSecretKey?: string;
    monnifyEnabled: boolean;
    manualEnabled: boolean;
    manualBankDetails?: string;
  };
  communication: {
    emailProvider: 'RESEND' | 'SMTP';
    emailApiKey?: string;
    smsProvider: 'TWILIO' | 'INFOBIP' | 'TERMII';
    smsApiKey?: string;
    pushProvider: 'ONESIGNAL' | 'FIREBASE';
    pushApiKey?: string;
  };
  ai: {
    geminiEnabled: boolean; // For auto-reply & fraud detection
  };
  trackers: {
      enabled: boolean;
      integrations: TrackerConfig[];
  };
  maintenanceMode: boolean;
  security: {
    blockedIps: string[];
    blockedCountries: string[];
    blockedRegions: string[];
    blockedDevices: string[];
    blockedOs: string[];
    blockedBrowsers: string[];
  };
}

export interface Coordinates {
  lat: number;
  lng: number;
}