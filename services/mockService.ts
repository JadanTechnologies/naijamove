import { User, UserRole, RideRequest, RideStatus, VehicleType, SystemSettings, TrackerConfig, NotificationTemplate, Announcement, ChatMessage, SystemHealth, SupportTicket, KnowledgeBaseItem, UserActivity, DashboardStats, PaymentTransaction, StaffPermission, Coordinates, CronJob } from '../types';
import { CITIES } from '../constants';

// --- Local Storage Helpers ---
const STORAGE_KEYS = {
  SETTINGS: 'naijamove_settings',
  USERS: 'naijamove_users',
  RIDES: 'naijamove_rides',
  TEMPLATES: 'naijamove_templates',
  ANNOUNCEMENTS: 'naijamove_announcements',
  MESSAGES: 'naijamove_messages',
  TICKETS: 'naijamove_tickets',
  KB: 'naijamove_kb',
  ACTIVITIES: 'naijamove_activities',
  TRANSACTIONS: 'naijamove_transactions',
  CRON_JOBS: 'naijamove_cron_jobs'
};

const load = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (e) {
    console.warn(`Failed to load ${key}`, e);
    return defaultValue;
  }
};

const save = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save ${key}`, e);
  }
};

// --- Mock Socket Service (Real-time Simulation) ---
type SocketListener = (data: any) => void;

class MockSocketService {
    private listeners: Record<string, SocketListener[]> = {};
    private interval: any;
    private drivers: Record<string, Coordinates> = {};

    constructor() {
        this.startEmitting();
    }

    private startEmitting() {
        this.interval = setInterval(() => {
            // Update drivers
            const driverUpdates = this.generateDriverUpdates();
            this.emit('DRIVER_LOCATIONS', driverUpdates);
        }, 2000);
    }

    private generateDriverUpdates() {
        // Simulate movement around Sokoto
        const baseLat = 13.0059;
        const baseLng = 5.2476;
        
        const updates = [];
        for(let i=0; i<5; i++) {
            updates.push({
                id: `driver-${i}`,
                lat: baseLat + (Math.random() - 0.5) * 0.05,
                lng: baseLng + (Math.random() - 0.5) * 0.05,
                heading: Math.random() * 360
            });
        }
        return updates;
    }

    public subscribe(event: string, callback: SocketListener) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
        return () => {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        };
    }

    public emit(event: string, data: any) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(data));
        }
    }
}

export const socketService = new MockSocketService();

// --- Initial Mock Data (Defaults) ---

const DEFAULT_SETTINGS: SystemSettings = {
  branding: {
    appName: "NaijaMove",
    logoUrl: "",
    primaryColor: "#10b981"
  },
  landingPage: {
    heroTitle: "The Future of Logistics & Rides",
    heroSubtitle: "Moving Sokoto & Nigeria Forward",
    heroDescription: "Move parcels, people, and cargo with Nigeria's most advanced AI-powered fleet. Real-time tracking for Okada, Keke, and Mini-bus in Sokoto and beyond.",
    stats: {
        rides: "2.5M+",
        drivers: "50k+",
        matchTime: "0.5s",
        cities: "36"
    },
    contactEmail: "support@naijamove.ng",
    contactPhone: "+234 800 NAIJA"
  },
  mobileApps: {
      androidUrl: "https://play.google.com/store/apps/details?id=com.naijamove.app",
      iosUrl: "https://apps.apple.com/ng/app/naijamove",
      version: "2.1.0",
      releaseNotes: "Performance improvements and new dark mode.",
      lastUpdated: new Date().toISOString()
  },
  payments: {
    paystackEnabled: true,
    paystackSecretKey: "sk_test_xxxxxxxxxxxxxxxxxxxx",
    flutterwaveEnabled: false,
    flutterwaveSecretKey: "",
    monnifyEnabled: false,
    manualEnabled: true,
    manualBankDetails: "GTBank - 0123456789 - NaijaMove Ltd"
  },
  communication: {
    emailProvider: 'RESEND',
    emailApiKey: "re_123456789",
    smsProvider: 'TWILIO',
    smsApiKey: "",
    pushProvider: 'ONESIGNAL',
    pushApiKey: ""
  },
  ai: {
    geminiEnabled: true
  },
  trackers: {
      enabled: true,
      integrations: [
          {
              id: 'trk-1',
              provider: 'TELTONIKA',
              name: 'Okada Fleet Tracker',
              enabled: true,
              serverIp: '192.168.1.50',
              port: 5027,
              protocol: 'TCP'
          }
      ]
  },
  maintenanceMode: false,
  security: {
    blockedIps: [],
    blockedCountries: [],
    blockedRegions: [],
    blockedDevices: [],
    blockedOs: [],
    blockedBrowsers: []
  },
  pricing: {
      [VehicleType.OKADA]: { base: 200, perKm: 50 },
      [VehicleType.KEKE]: { base: 300, perKm: 80 },
      [VehicleType.MINIBUS]: { base: 500, perKm: 120 },
      [VehicleType.TRUCK]: { base: 2000, perKm: 500 },
      logistics: { baseFare: 500, perKg: 100, perKm: 50, interstateMultiplier: 1.5 }
  },
  integrations: {
      ninApiKey: "nin_live_xxxxxxxx",
      voiceProvider: 'ZEGOCLOUD',
      voiceAppId: "1234567890",
      voiceAppSign: "abcdef1234567890"
  }
};

const DEFAULT_USERS: User[] = [
  {
    id: 'admin-1',
    name: 'Super Admin',
    email: 'admin@naijamove.ng',
    role: UserRole.ADMIN,
    walletBalance: 5000000,
    avatar: 'https://ui-avatars.com/api/?name=Super+Admin&background=10b981&color=fff',
    status: 'ACTIVE',
    ip: '102.134.1.20',
    device: 'MacBook Pro 16"',
    isp: 'Starlink Nigeria',
    location: { lat: 13.0059, lng: 5.2476 }, // Sokoto
    isTotpSetup: true, // Pre-setup for easier login
    totpSecret: 'ADMINSECRET'
  },
  {
    id: 'staff-1',
    name: 'Support Agent',
    email: 'staff@naijamove.ng',
    role: UserRole.STAFF,
    token: 'STAFF-TOKEN-123',
    password: 'password123',
    isTotpSetup: false, // Needs setup
    walletBalance: 0,
    status: 'ACTIVE',
    ip: '102.134.1.22',
    device: 'Dell Latitude',
    isp: 'MTN',
    location: { lat: 13.0060, lng: 5.2470 },
    permissions: ['SUPPORT', 'VIEW_FINANCE']
  },
  {
    id: 'driver-1',
    name: 'Musa Ibrahim',
    email: 'musa@naijamove.ng',
    role: UserRole.DRIVER,
    vehicleType: VehicleType.OKADA,
    licensePlate: 'SOK-123-AB',
    walletBalance: 15000,
    isOnline: true,
    rating: 4.8,
    totalTrips: 142,
    avatar: 'https://ui-avatars.com/api/?name=Musa+Ibrahim&background=f97316&color=fff',
    status: 'ACTIVE',
    ip: '197.210.1.1',
    device: 'Samsung A54',
    isp: 'MTN Nigeria',
    location: { lat: 13.0100, lng: 5.2500 },
    vehicleCapacityKg: 150,
    currentLoadKg: 0,
    loadStatus: 'EMPTY',
    bankAccount: {
        bankName: "Wema Bank",
        accountNumber: "9923456781",
        accountName: "Musa Ibrahim"
    }
  },
  {
    id: 'driver-2',
    name: 'Chinedu Eze',
    email: 'chinedu@naijamove.ng',
    role: UserRole.DRIVER,
    vehicleType: VehicleType.KEKE,
    licensePlate: 'SOK-555-XY',
    walletBalance: 8200,
    isOnline: true,
    rating: 4.5,
    totalTrips: 89,
    avatar: 'https://ui-avatars.com/api/?name=Chinedu+Eze&background=3b82f6&color=fff',
    status: 'ACTIVE',
    device: 'Infinix Hot 10',
    ip: '105.112.44.12',
    isp: 'Airtel Nigeria',
    location: { lat: 13.0020, lng: 5.2400 },
    vehicleCapacityKg: 400,
    currentLoadKg: 0,
    loadStatus: 'EMPTY'
  },
  {
    id: 'passenger-1',
    name: 'Tola Adebayo',
    email: 'tola@gmail.com',
    role: UserRole.PASSENGER,
    walletBalance: 5000,
    avatar: 'https://ui-avatars.com/api/?name=Tola+Adebayo&background=8b5cf6&color=fff',
    status: 'ACTIVE',
    ip: '102.12.33.1',
    device: 'iPhone 13',
    isp: 'Glo Mobile',
    location: { lat: 13.0080, lng: 5.2450 },
    bankAccount: {
        bankName: "Wema Bank",
        accountNumber: "0234567891",
        accountName: "NaijaMove - Tola Adebayo"
    }
  },
];

const DEFAULT_CRON: CronJob[] = [
    { id: 'job-1', name: 'Auto-Assign Logistics', schedule: 'Every 5 mins', nextRun: new Date(Date.now() + 300000).toISOString(), status: 'IDLE', enabled: true },
    { id: 'job-2', name: 'Cleanup Stale Requests', schedule: 'Hourly', nextRun: new Date(Date.now() + 3600000).toISOString(), status: 'IDLE', enabled: true },
    { id: 'job-3', name: 'Driver Payout Processing', schedule: 'Daily at 00:00', nextRun: new Date().setHours(24,0,0,0).toString(), status: 'IDLE', enabled: false },
];

const DEFAULT_KB: KnowledgeBaseItem[] = [
    { id: 'kb-1', question: 'How do I fund my wallet?', answer: 'You can fund your wallet via Bank Transfer or Paystack. Go to the Wallet section in the app.', tags: ['wallet', 'payment'] },
    { id: 'kb-2', question: 'What is the base fare for Okada?', answer: 'The base fare for Okada rides is ₦200, plus ₦50 per km.', tags: ['pricing', 'okada'] },
    { id: 'kb-3', question: 'Do you do interstate delivery?', answer: 'Currently, we only support logistics within Sokoto. Interstate is coming soon.', tags: ['logistics', 'delivery'] }
];

// --- Initialize State from Storage ---

let SETTINGS = load<SystemSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
let USERS = load<User[]>(STORAGE_KEYS.USERS, DEFAULT_USERS);
let RIDES = load<RideRequest[]>(STORAGE_KEYS.RIDES, []);
let TEMPLATES = load<NotificationTemplate[]>(STORAGE_KEYS.TEMPLATES, []);
let ANNOUNCEMENTS = load<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, []);
let MESSAGES = load<ChatMessage[]>(STORAGE_KEYS.MESSAGES, []);
let TICKETS = load<SupportTicket[]>(STORAGE_KEYS.TICKETS, []);
let KB = load<KnowledgeBaseItem[]>(STORAGE_KEYS.KB, DEFAULT_KB);
let ACTIVITIES = load<UserActivity[]>(STORAGE_KEYS.ACTIVITIES, []);
let TRANSACTIONS = load<PaymentTransaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
let CRON_JOBS = load<CronJob[]>(STORAGE_KEYS.CRON_JOBS, DEFAULT_CRON);

// --- Helper Functions ---

export const speak = (text: string) => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  }
};

const logActivity = (userId: string, action: string, details: string) => {
    const activity: UserActivity = {
        id: `act-${Date.now()}-${Math.random()}`,
        userId,
        action,
        details,
        timestamp: new Date().toISOString(),
        ip: USERS.find(u => u.id === userId)?.ip || 'Unknown'
    };
    ACTIVITIES = [activity, ...ACTIVITIES].slice(0, 1000); // Keep last 1000
    save(STORAGE_KEYS.ACTIVITIES, ACTIVITIES);
};

const generateVirtualAccount = (name: string) => {
    return {
        bankName: "Wema Bank",
        accountNumber: "9" + Math.floor(100000000 + Math.random() * 900000000), // Random 10 digit starting with 9
        accountName: `NaijaMove - ${name}`
    };
};

const getVehicleCapacity = (type: VehicleType) => {
    switch (type) {
        case VehicleType.OKADA: return 150; // kg
        case VehicleType.KEKE: return 400;
        case VehicleType.MINIBUS: return 1000;
        case VehicleType.TRUCK: return 3000;
        default: return 100;
    }
}

// --- Service Methods ---

export const verifyNin = async (nin: string) => {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Mock API delay
    // Mock NIN Verification
    if (nin.length === 11 && !isNaN(Number(nin))) {
        return {
            valid: true,
            data: {
                firstName: "Aminu",
                lastName: "Sadiq",
                dob: "1990-05-12",
                gender: "M",
                photo: "https://ui-avatars.com/api/?name=Aminu+Sadiq&background=0D8ABC&color=fff"
            }
        };
    }
    throw new Error("Invalid NIN. Please check the number.");
};

export const signup = async (data: { name: string, email: string, phone: string, nin: string, role: UserRole, vehicleType?: VehicleType, licensePlate?: string }) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Check existing
    if (USERS.find(u => u.email === data.email || u.nin === data.nin)) {
        throw new Error("User with this Email or NIN already exists.");
    }

    const newUser: User = {
        id: `user-${Date.now()}`,
        name: data.name,
        email: data.email,
        phone: data.phone,
        nin: data.nin,
        role: data.role,
        walletBalance: 0,
        status: 'ACTIVE',
        isNinVerified: true,
        bankAccount: generateVirtualAccount(data.name),
        avatar: `https://ui-avatars.com/api/?name=${data.name.replace(' ', '+')}&background=random`,
        location: { lat: 13.0059, lng: 5.2476 }, // Default Sokoto
        // Driver specific fields
        ...(data.role === UserRole.DRIVER && {
            vehicleType: data.vehicleType || VehicleType.OKADA,
            licensePlate: data.licensePlate || 'PENDING',
            rating: 5.0,
            totalTrips: 0,
            isOnline: true,
            vehicleCapacityKg: getVehicleCapacity(data.vehicleType || VehicleType.OKADA),
            currentLoadKg: 0,
            loadStatus: 'EMPTY'
        })
    };

    USERS = [...USERS, newUser];
    save(STORAGE_KEYS.USERS, USERS);
    logActivity(newUser.id, 'SIGNUP', `New ${data.role} registration via Web`);
    return newUser;
};

// Admin Recruit Driver
export const recruitDriver = async (adminId: string, data: { name: string, email: string, phone: string, vehicleType: VehicleType, licensePlate: string }) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (USERS.find(u => u.email === data.email)) {
        throw new Error("Email already registered.");
    }

    const newUser: User = {
        id: `driver-${Date.now()}`,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: UserRole.DRIVER,
        vehicleType: data.vehicleType,
        licensePlate: data.licensePlate,
        walletBalance: 0,
        status: 'ACTIVE',
        isNinVerified: true, // Admin verified
        rating: 5.0,
        totalTrips: 0,
        isOnline: false,
        vehicleCapacityKg: getVehicleCapacity(data.vehicleType),
        currentLoadKg: 0,
        loadStatus: 'EMPTY',
        bankAccount: generateVirtualAccount(data.name),
        avatar: `https://ui-avatars.com/api/?name=${data.name.replace(' ', '+')}&background=random`,
        location: { lat: 13.0059, lng: 5.2476 }
    };

    USERS = [...USERS, newUser];
    save(STORAGE_KEYS.USERS, USERS);
    logActivity(adminId, 'RECRUIT_DRIVER', `Recruited driver ${data.name} (${data.vehicleType})`);
    return newUser;
};

// New: Create Staff with Credentials and Magic Link
export const createStaffUser = async (adminId: string, data: { name: string, email: string, password: string, permissions: StaffPermission[] }) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (USERS.find(u => u.email === data.email)) throw new Error("Email exists");

    const magicToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    
    const newUser: User = {
        id: `staff-${Date.now()}`,
        name: data.name,
        email: data.email,
        role: UserRole.STAFF,
        password: data.password, // In real app, hash this
        permissions: data.permissions,
        walletBalance: 0,
        status: 'ACTIVE',
        isTotpSetup: false, // Forces setup on first login
        magicLink: `https://naijamove.ng/auth/setup?token=${magicToken}`,
        magicLinkExpires: new Date(Date.now() + 86400000).toISOString(), // 24 hours
        avatar: `https://ui-avatars.com/api/?name=${data.name}&background=6366f1&color=fff`,
    };

    USERS = [...USERS, newUser];
    save(STORAGE_KEYS.USERS, USERS);
    logActivity(adminId, 'CREATE_STAFF', `Created staff ${data.name} with permissions`);
    return newUser;
}

export const login = async (identifier: string, isToken = false): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 800)); 
  
  if (SETTINGS.maintenanceMode) {
      if (identifier !== 'admin@naijamove.ng' && !isToken) {
          throw new Error("System is currently under maintenance. Please try again later.");
      }
  }

  // Magic Link / Token Login (Bypasses password/totp)
  if (isToken) {
    const user = USERS.find(u => u.token === identifier);
    if (!user) throw new Error('Invalid Staff Token');
    logActivity(user.id, 'LOGIN', 'Staff login via token');
    return user;
  }

  const user = USERS.find(u => u.email === identifier);
  if (!user) throw new Error('User not found');
  
  if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
      throw new Error(`Account Suspended: ${user.suspensionReason || 'Violation of terms.'}`);
  }
  
  // Basic password check (Mock)
  // In a real app, you'd check password hash here.
  // For the demo, we assume if password field exists, it matches.
  
  if (user.role === UserRole.STAFF || user.role === UserRole.ADMIN) {
      // 2FA Check Signal - Returning a specific error to trigger UI flow
      if (!user.isTotpSetup) {
          throw new Error("TOTP_SETUP_REQUIRED"); // Signal for frontend to show Setup QR
      }
      // Assuming frontend sends password, we'd verify it. 
      // Then verify TOTP token.
      // For this mock, we'll let the frontend handle the flow steps.
  }

  if (user.status !== 'ACTIVE') throw new Error(`Account is ${user.status}`);

  if (user.ip && SETTINGS.security.blockedIps.includes(user.ip)) {
      throw new Error(`Access Denied: Your IP (${user.ip}) is blocked.`);
  }
  
  logActivity(user.id, 'LOGIN', `Logged in via ${user.device || 'Web'}`);
  return user;
};

// TOTP Helpers (Mock)
export const setupTotp = async (userId: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const idx = USERS.findIndex(u => u.id === userId);
    if(idx === -1) throw new Error("User not found");
    
    const secret = "NAIJAMOVE" + Math.random().toString(36).substring(2).toUpperCase();
    USERS[idx].totpSecret = secret;
    USERS[idx].isTotpSetup = true;
    save(STORAGE_KEYS.USERS, USERS);
    return { secret, qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${secret}` };
}

export const verifyTotpToken = async (userId: string, token: string) => {
    // Mock check: token length 6 and numeric
    if (token.length === 6 && !isNaN(Number(token))) {
        return true;
    }
    throw new Error("Invalid Token");
}

export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const idx = USERS.findIndex(u => u.id === userId);
    if (idx !== -1) {
        USERS[idx] = { ...USERS[idx], ...updates };
        save(STORAGE_KEYS.USERS, USERS);
        return USERS[idx];
    }
    throw new Error("User not found");
};

export const updateStaffPermissions = async (userId: string, permissions: StaffPermission[]) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const idx = USERS.findIndex(u => u.id === userId);
    if(idx !== -1 && USERS[idx].role === UserRole.STAFF) {
        USERS[idx].permissions = permissions;
        save(STORAGE_KEYS.USERS, USERS);
        return USERS[idx];
    }
    throw new Error("User not found or not staff");
};

export const getSystemSettings = async (): Promise<SystemSettings> => {
  return { ...SETTINGS };
};

export const updateSystemSettings = async (newSettings: SystemSettings): Promise<SystemSettings> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  SETTINGS = newSettings;
  save(STORAGE_KEYS.SETTINGS, SETTINGS);
  speak("System settings updated.");
  return SETTINGS;
};

export const getAllUsers = async (): Promise<User[]> => {
    return [...USERS];
};

export const getUserActivity = async (userId: string): Promise<UserActivity[]> => {
    return ACTIVITIES.filter(a => a.userId === userId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const updateUserStatus = async (userId: string, status: 'ACTIVE' | 'BANNED' | 'SUSPENDED') => {
    const idx = USERS.findIndex(u => u.id === userId);
    if(idx !== -1) {
        USERS[idx] = { ...USERS[idx], status };
        save(STORAGE_KEYS.USERS, USERS);
        logActivity('admin-1', 'USER_MOD', `Changed status of ${userId} to ${status}`);
    }
};

export const getActiveRides = async (role: UserRole, userId: string): Promise<RideRequest[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  if (role === UserRole.ADMIN || role === UserRole.STAFF) return RIDES;
  if (role === UserRole.DRIVER) {
    // Return all rides for this driver (including past ones) + Pending ones they can see
    return RIDES.filter(r => 
        (r.status === RideStatus.PENDING && !r.rejectedBy?.includes(userId)) || 
        r.driverId === userId
    );
  }
  return RIDES.filter(r => r.passengerId === userId);
};

export const getOnlineDrivers = async (): Promise<User[]> => {
    return USERS.filter(u => u.role === UserRole.DRIVER && u.isOnline && u.status === 'ACTIVE');
};

export const manualAssignDriver = async (rideId: string, driverId: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const rideIdx = RIDES.findIndex(r => r.id === rideId);
    if(rideIdx === -1) throw new Error("Ride not found");
    
    // Check if driver is available
    const driver = USERS.find(u => u.id === driverId);
    if(!driver || !driver.isOnline) throw new Error("Driver not available");

    RIDES[rideIdx].driverId = driverId;
    RIDES[rideIdx].status = RideStatus.ACCEPTED;
    
    save(STORAGE_KEYS.RIDES, RIDES);
    logActivity('admin-1', 'MANUAL_ASSIGN', `Assigned driver ${driver.name} to ride ${rideId}`);
    return RIDES[rideIdx];
};

export const createRide = async (ride: Omit<RideRequest, 'id' | 'status' | 'createdAt'>): Promise<RideRequest> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // AI Fraud Detection Check
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
  const recentCancelled = RIDES.filter(r => 
      r.passengerId === ride.passengerId && 
      r.status === RideStatus.CANCELLED && 
      r.createdAt > oneHourAgo
  ).length;

  if (recentCancelled >= 3) {
      // Auto Suspend
      const userIdx = USERS.findIndex(u => u.id === ride.passengerId);
      if(userIdx !== -1) {
          USERS[userIdx].status = 'SUSPENDED';
          USERS[userIdx].suspensionReason = "AI Detection: Suspicious booking activity detected (multiple rapid cancellations).";
          save(STORAGE_KEYS.USERS, USERS);
      }
      throw new Error("Account Suspended: Suspicious booking activity detected.");
  }

  // Debit check
  const user = USERS.find(u => u.id === ride.passengerId);
  if (!user) throw new Error("User not found");
  
  // Calculate Weight Logic (Simulated)
  let weight = 0;
  if (ride.type === 'RIDE') {
      weight = 75; // 1 passenger
  } else {
      weight = ride.parcelWeight ? parseInt(ride.parcelWeight) : 10;
  }

  const newRide: RideRequest = {
    ...ride,
    id: `ride-${Date.now()}`,
    status: RideStatus.PENDING,
    createdAt: new Date().toISOString(),
    estimatedWeightKg: weight
  };
  RIDES = [newRide, ...RIDES];
  save(STORAGE_KEYS.RIDES, RIDES);
  logActivity(ride.passengerId, 'BOOK_RIDE', `Booked ${ride.vehicleType} trip. Cost: ${ride.price}. Weight: ${weight}kg`);
  return newRide;
};

export const updateRideStatus = async (rideId: string, status: RideStatus, driverId?: string): Promise<RideRequest> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const rideIndex = RIDES.findIndex(r => r.id === rideId);
  if (rideIndex === -1) throw new Error("Ride not found");
  
  const ride = RIDES[rideIndex];
  let updatedRide = { ...ride, status };
  
  if (driverId) {
      updatedRide.driverId = driverId;
      logActivity(driverId, 'RIDE_UPDATE', `Updated ride ${rideId} to ${status}`);
      
      // Update Driver Load Status
      const driverIdx = USERS.findIndex(u => u.id === driverId);
      if (driverIdx !== -1 && USERS[driverIdx].role === UserRole.DRIVER) {
          if (status === RideStatus.ACCEPTED || status === RideStatus.IN_PROGRESS) {
              USERS[driverIdx].currentLoadKg = (USERS[driverIdx].currentLoadKg || 0) + (ride.estimatedWeightKg || 75);
              
              // Load Calculation
              const capacity = USERS[driverIdx].vehicleCapacityKg || 150;
              const current = USERS[driverIdx].currentLoadKg || 0;
              if (current > capacity) USERS[driverIdx].loadStatus = 'OVERLOAD';
              else if (current > capacity / 2) USERS[driverIdx].loadStatus = 'FULL_LOAD';
              else USERS[driverIdx].loadStatus = 'HALF_LOAD';
          } else if (status === RideStatus.COMPLETED || status === RideStatus.CANCELLED) {
              USERS[driverIdx].currentLoadKg = 0;
              USERS[driverIdx].loadStatus = 'EMPTY';
          }
          save(STORAGE_KEYS.USERS, USERS);
      }
  }
  
  // Handle Wallet Debit on Completion
  if (status === RideStatus.COMPLETED) {
      const passengerIdx = USERS.findIndex(u => u.id === ride.passengerId);
      if (passengerIdx !== -1) {
          USERS[passengerIdx].walletBalance -= ride.price;
      }
      const driverIdx = USERS.findIndex(u => u.id === (driverId || ride.driverId));
      if (driverIdx !== -1) {
          USERS[driverIdx].walletBalance += (ride.price * 0.8); // 80% to driver
      }
      updatedRide.endTime = new Date().toISOString();
      save(STORAGE_KEYS.USERS, USERS);
  }
  
  RIDES[rideIndex] = updatedRide;
  save(STORAGE_KEYS.RIDES, RIDES);
  return updatedRide;
};

export const rejectRide = async (rideId: string, driverId: string) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const ride = RIDES.find(r => r.id === rideId);
    if(ride) {
        if(!ride.rejectedBy) ride.rejectedBy = [];
        if(!ride.rejectedBy.includes(driverId)) {
            ride.rejectedBy.push(driverId);
            save(STORAGE_KEYS.RIDES, RIDES);
        }
    }
}

// Updated Withdraw Funds with persistence
export const withdrawFunds = async (userId: string, amount: number) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    const userIdx = USERS.findIndex(u => u.id === userId);
    if(userIdx === -1) throw new Error("User not found");
    const user = USERS[userIdx];
    
    if(user.walletBalance < amount) {
        throw new Error("Insufficient funds");
    }

    // Create withdrawal transaction record
    const transaction: PaymentTransaction = {
        id: `txn-${Date.now()}`,
        type: 'WITHDRAWAL',
        driverId: user.id,
        driverName: user.name,
        amount: amount,
        channel: 'TRANSFER',
        status: 'PENDING',
        date: new Date().toISOString(),
        reference: `WD-${Math.random().toString(36).substring(7).toUpperCase()}`,
        bankDetails: user.bankAccount ? `${user.bankAccount.bankName} - ${user.bankAccount.accountNumber}` : 'N/A'
    };

    // Deduct balance immediately
    USERS[userIdx].walletBalance -= amount;
    
    // Save state
    TRANSACTIONS = [transaction, ...TRANSACTIONS];
    save(STORAGE_KEYS.TRANSACTIONS, TRANSACTIONS);
    save(STORAGE_KEYS.USERS, USERS);
    
    logActivity(userId, 'WITHDRAWAL_REQ', `Requested withdrawal of ${amount}. Ref: ${transaction.reference}`);
    return transaction;
};

// Helper to fetch transactions for a specific user
export const getUserTransactions = async (userId: string): Promise<PaymentTransaction[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Get earning transactions from RIDES
    const earningTxns: PaymentTransaction[] = RIDES
        .filter(r => r.driverId === userId && r.status === RideStatus.COMPLETED)
        .map(r => ({
            id: `earn-${r.id}`,
            type: 'EARNING',
            rideId: r.id,
            amount: r.price * 0.8, // 80% share
            channel: 'WALLET',
            status: 'SUCCESS',
            date: r.endTime || r.createdAt,
            reference: `ERN-${r.id.split('-')[1]}`,
            passengerName: USERS.find(u => u.id === r.passengerId)?.name || 'Passenger'
        }));

    // Get withdrawal transactions from persisted TRANSACTIONS
    const withdrawalTxns = TRANSACTIONS.filter(t => t.driverId === userId || t.passengerId === userId);

    // Combine and sort
    return [...earningTxns, ...withdrawalTxns].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getDashboardStats = async (): Promise<DashboardStats> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  const totalRevenue = RIDES.filter(r => r.status === RideStatus.COMPLETED).reduce((acc, r) => acc + r.price, 0);
  
  return {
    totalRevenue,
    platformCommission: totalRevenue * 0.2,
    totalUsers: USERS.length,
    activeUsers: USERS.filter(u => u.status === 'ACTIVE').length,
    totalTrips: RIDES.length,
    liveTrips: RIDES.filter(r => r.status === RideStatus.IN_PROGRESS).length,
    totalDrivers: USERS.filter(u => u.role === UserRole.DRIVER).length,
    totalStaff: USERS.filter(u => u.role === UserRole.STAFF).length,
    totalRegions: CITIES.length
  };
};

export const getTransactions = async (): Promise<PaymentTransaction[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock ride transactions
    const rideTxns: PaymentTransaction[] = RIDES.map((ride) => {
        const passenger = USERS.find(u => u.id === ride.passengerId);
        const driver = USERS.find(u => u.id === ride.driverId);
        const channel: 'PAYSTACK' | 'WALLET' = parseInt(ride.id.split('-')[1]) % 2 === 0 ? 'PAYSTACK' : 'WALLET';
        
        return {
            id: `TXN-${ride.id.split('-')[1]}`,
            type: 'PAYMENT',
            rideId: ride.id,
            passengerId: ride.passengerId,
            passengerName: passenger?.name || 'Unknown',
            driverId: ride.driverId,
            driverName: driver?.name || 'Not Assigned',
            amount: ride.price,
            channel: channel,
            status: (ride.status === RideStatus.COMPLETED ? 'SUCCESS' : ride.status === RideStatus.CANCELLED ? 'FAILED' : 'PENDING') as 'SUCCESS' | 'FAILED' | 'PENDING',
            date: ride.createdAt,
            reference: `REF-${Math.random().toString(36).substring(7).toUpperCase()}`
        };
    });

    // Combine with persistent withdrawals
    return [...rideTxns, ...TRANSACTIONS].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const calculateFare = (vehicleType: VehicleType, distanceKm: number): number => {
  // Use settings pricing
  const pricing = SETTINGS.pricing[vehicleType];
  return Math.ceil(pricing.base + (pricing.perKm * distanceKm));
};

// ... (Rest of message/template/health logic remains same, mostly getters/setters)
export const getTemplates = async () => [...TEMPLATES];
export const saveTemplate = async (template: NotificationTemplate) => {
    const idx = TEMPLATES.findIndex(t => t.id === template.id);
    if(idx !== -1) TEMPLATES[idx] = template;
    else TEMPLATES.push({...template, id: `tpl-${Date.now()}`});
    save(STORAGE_KEYS.TEMPLATES, TEMPLATES);
    return template;
}
export const deleteTemplate = async (id: string) => {
    TEMPLATES = TEMPLATES.filter(t => t.id !== id);
    save(STORAGE_KEYS.TEMPLATES, TEMPLATES);
}
export const getAnnouncements = async () => [...ANNOUNCEMENTS];
export const createAnnouncement = async (announcement: Omit<Announcement, 'id' | 'createdAt' | 'status'>) => {
    const newAnn: Announcement = {
        ...announcement,
        id: `ann-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'SENT',
        sentAt: new Date().toISOString()
    };
    ANNOUNCEMENTS = [newAnn, ...ANNOUNCEMENTS];
    save(STORAGE_KEYS.ANNOUNCEMENTS, ANNOUNCEMENTS);
    return newAnn;
}

export const getRideMessages = async (rideId: string) => {
    return MESSAGES.filter(m => m.rideId === rideId).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export const sendMessage = async (rideId: string, senderId: string, senderName: string, content: string) => {
    const msg: ChatMessage = {
        id: `msg-${Date.now()}`,
        rideId,
        senderId,
        senderName,
        content,
        timestamp: new Date().toISOString(),
        isRead: false
    };
    MESSAGES = [...MESSAGES, msg];
    save(STORAGE_KEYS.MESSAGES, MESSAGES);
    return msg;
}

export const getSupportTickets = async () => [...TICKETS];

export const createSupportTicket = async (userId: string, userName: string, subject: string, initialMessage: string) => {
    const ticket: SupportTicket = {
        id: `TKT-${Date.now()}`,
        userId,
        userName,
        subject,
        status: 'OPEN',
        priority: 'MEDIUM',
        createdAt: new Date().toISOString(),
        messages: [{
            id: `msg-${Date.now()}`,
            senderId: userId,
            senderName: userName,
            content: initialMessage,
            timestamp: new Date().toISOString(),
            isRead: false
        }]
    };
    TICKETS = [ticket, ...TICKETS];
    save(STORAGE_KEYS.TICKETS, TICKETS);
    return ticket;
};

export const addTicketMessage = async (ticketId: string, senderId: string, senderName: string, content: string, isAi = false) => {
    const ticketIdx = TICKETS.findIndex(t => t.id === ticketId);
    if(ticketIdx !== -1) {
        const msg: ChatMessage = {
            id: `msg-${Date.now()}`,
            senderId,
            senderName,
            content,
            timestamp: new Date().toISOString(),
            isRead: false,
            isAi
        };
        TICKETS[ticketIdx].messages.push(msg);
        save(STORAGE_KEYS.TICKETS, TICKETS);
        return msg;
    }
};

export const getKnowledgeBase = async () => [...KB];

export const saveKBItem = async (item: KnowledgeBaseItem) => {
    const idx = KB.findIndex(k => k.id === item.id);
    if(idx !== -1) KB[idx] = item;
    else KB.push({...item, id: `kb-${Date.now()}`});
    save(STORAGE_KEYS.KB, KB);
};

export const deleteKBItem = async (id: string) => {
    KB = KB.filter(k => k.id !== id);
    save(STORAGE_KEYS.KB, KB);
};

export const queryAiAgent = async (question: string): Promise<{answer?: string, escalate?: boolean}> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const qLower = question.toLowerCase();
    const match = KB.find(k => qLower.includes(k.question.toLowerCase()) || k.tags.some(t => qLower.includes(t)));
    if (match) return { answer: match.answer };
    return { escalate: true };
};

export const getSystemHealth = async (): Promise<SystemHealth> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
        database: { status: 'OPTIMAL', latency: 15, activeConnections: 85 },
        api: { uptime: 99.99, requestsPerSecond: 320, avgResponseTime: 45, errorRate: 0.02 },
        realtime: { status: 'CONNECTED', activeSockets: 1200, messagesPerSecond: 150 },
        server: { cpuUsage: 45, memoryUsage: 60, diskUsage: 45 },
        services: [
            { name: 'Auth Service', status: 'OPERATIONAL', latency: 12 },
            { name: 'Ride Matching', status: 'OPERATIONAL', latency: 45 },
            { name: 'Payments', status: 'OPERATIONAL', latency: 120 },
            { name: 'Notifications', status: 'OPERATIONAL', latency: 25 },
            { name: 'Geo-Spatial', status: 'OPERATIONAL', latency: 30 }
        ]
    };
};

// --- Cron Jobs Service ---
export const getCronJobs = async () => CRON_JOBS;

export const toggleCronJob = async (id: string) => {
    const idx = CRON_JOBS.findIndex(j => j.id === id);
    if(idx !== -1) {
        CRON_JOBS[idx].enabled = !CRON_JOBS[idx].enabled;
        save(STORAGE_KEYS.CRON_JOBS, CRON_JOBS);
        return CRON_JOBS[idx];
    }
};

export const runCronJob = async (id: string) => {
    const idx = CRON_JOBS.findIndex(j => j.id === id);
    if(idx !== -1) {
        CRON_JOBS[idx].status = 'RUNNING';
        save(STORAGE_KEYS.CRON_JOBS, CRON_JOBS);
        
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate work
        
        CRON_JOBS[idx].status = 'IDLE';
        CRON_JOBS[idx].lastRun = new Date().toISOString();
        // Update next run (mock)
        const next = new Date(Date.now() + 300000); // +5 mins
        CRON_JOBS[idx].nextRun = next.toISOString();
        
        save(STORAGE_KEYS.CRON_JOBS, CRON_JOBS);
        return CRON_JOBS[idx];
    }
};

export const triggerSOS = async (userId: string, location: Coordinates) => {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network
    
    // Log for Admin
    logActivity(userId, 'SOS_ALERT', `CRITICAL: SOS Triggered at ${location.lat}, ${location.lng}`);
    
    // Create Ticket
    const ticket: SupportTicket = {
        id: `SOS-${Date.now()}`,
        userId,
        userName: USERS.find(u => u.id === userId)?.name || 'Unknown Driver',
        subject: 'URGENT: SOS DISTRESS SIGNAL',
        status: 'ESCALATED',
        priority: 'HIGH',
        createdAt: new Date().toISOString(),
        messages: [{
            id: `msg-${Date.now()}`,
            senderId: userId,
            senderName: 'System',
            content: `Emergency distress signal received. Location: https://maps.google.com/?q=${location.lat},${location.lng}`,
            timestamp: new Date().toISOString(),
            isRead: false
        }]
    };
    TICKETS = [ticket, ...TICKETS];
    save(STORAGE_KEYS.TICKETS, TICKETS);
    
    return true;
};
