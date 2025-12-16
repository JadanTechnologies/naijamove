
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

export type StaffPermission = 'MANAGE_USERS' | 'MANAGE_RIDES' | 'VIEW_FINANCE' | 'MANAGE_SETTINGS' | 'SUPPORT';

export interface CronJob {
    id: string;
    name: string;
    schedule: string; // e.g. "Every 2 mins"
    lastRun?: string;
    nextRun: string;
    status: 'IDLE' | 'RUNNING' | 'FAILED';
    enabled: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  walletBalance: number;
  phone?: string;
  nin?: string; // National Identity Number
  isNinVerified?: boolean;
  bankAccount?: {
      bankName: string;
      accountNumber: string;
      accountName: string;
  };
  avatar?: string;
  status?: 'ACTIVE' | 'BANNED' | 'SUSPENDED';
  suspensionReason?: string; // Reason for suspension
  ip?: string;
  device?: string;
  isp?: string; // Internet Service Provider
  location?: Coordinates;
  // Driver specific
  isOnline?: boolean;
  vehicleType?: VehicleType;
  licensePlate?: string;
  rating?: number;
  totalTrips?: number;
  // Weight Sensor Data (Teltonika Simulation)
  vehicleCapacityKg?: number;
  currentLoadKg?: number;
  loadStatus?: 'EMPTY' | 'HALF_LOAD' | 'FULL_LOAD' | 'OVERLOAD';
  // Staff Specific
  token?: string;
  permissions?: StaffPermission[];
  // Auth & Security
  password?: string; // Mock password
  totpSecret?: string;
  isTotpSetup?: boolean;
  magicLink?: string;
  magicLinkExpires?: string;
}

export interface UserActivity {
    id: string;
    userId: string;
    action: string;
    timestamp: string;
    details: string;
    ip: string;
}

export interface SupportTicket {
    id: string;
    userId: string;
    userName: string;
    subject: string;
    status: 'OPEN' | 'RESOLVED' | 'ESCALATED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    createdAt: string;
    messages: ChatMessage[];
}

export interface KnowledgeBaseItem {
    id: string;
    question: string;
    answer: string;
    tags: string[];
}

export interface ChatMessage {
  id: string;
  rideId?: string;
  ticketId?: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  isAi?: boolean;
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
  parcelWeight?: string; // e.g. "5kg"
  parcelWeightValue?: number; // numeric kg
  receiverPhone?: string;
  // Driver specific
  rejectedBy?: string[];
  // Trip Metadata
  startTime?: string;
  endTime?: string;
  estimatedWeightKg?: number;
}

export interface PaymentTransaction {
    id: string;
    type: 'EARNING' | 'WITHDRAWAL' | 'PAYMENT';
    rideId?: string;
    passengerId?: string;
    passengerName?: string;
    driverId?: string;
    driverName?: string;
    amount: number;
    channel: 'PAYSTACK' | 'WALLET' | 'CASH' | 'TRANSFER';
    status: 'SUCCESS' | 'PENDING' | 'FAILED';
    date: string;
    reference: string;
    bankDetails?: string; // For withdrawals
}

export interface DashboardStats {
    totalRevenue: number;
    platformCommission: number;
    totalUsers: number;
    activeUsers: number;
    totalTrips: number;
    liveTrips: number;
    totalDrivers: number;
    totalStaff: number;
    totalRegions: number;
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
    subject?: string;
    body: string;
    variables: string[];
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

export interface LandingPageConfig {
    heroTitle: string;
    heroSubtitle: string;
    heroDescription: string;
    stats: {
        rides: string;
        drivers: string;
        matchTime: string;
        cities: string;
    };
    contactEmail: string;
    contactPhone: string;
}

export interface MobileAppConfig {
    androidUrl: string;
    iosUrl: string;
    version: string;
    releaseNotes: string;
    lastUpdated: string;
}

// New Configs
export interface VehiclePricingConfig {
    base: number;
    perKm: number;
}

export interface LogisticsPricingConfig {
    baseFare: number;
    perKg: number;
    perKm: number;
    interstateMultiplier: number;
}

export interface SystemSettings {
  branding: {
    appName: string;
    logoUrl: string;
    primaryColor: string;
  };
  landingPage: LandingPageConfig;
  mobileApps: MobileAppConfig;
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
    geminiEnabled: boolean;
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
  // New Settings
  pricing: {
      [key in VehicleType]: VehiclePricingConfig;
  } & {
      logistics: LogisticsPricingConfig;
  };
  integrations: {
      ninApiKey: string; // For Verification
      voiceProvider: 'ZEGOCLOUD' | 'AGORA';
      voiceAppId: string;
      voiceAppSign: string;
  };
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface SystemHealth {
  database: {
    status: 'OPTIMAL' | 'DEGRADED' | 'DOWN';
    latency: number;
    activeConnections: number;
  };
  api: {
    uptime: number;
    requestsPerSecond: number;
    avgResponseTime: number;
    errorRate: number;
  };
  realtime: {
    status: 'CONNECTED' | 'DISCONNECTED';
    activeSockets: number;
    messagesPerSecond: number;
  };
  server: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
  };
  services: {
    name: string;
    status: 'OPERATIONAL' | 'ISSUES' | 'DOWN';
    latency: number;
  }[];
}

// Toast System
export interface ToastMessage {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    duration?: number;
}

export interface StaticPageContent {
    title: string;
    content: string;
}
