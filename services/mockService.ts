import { User, UserRole, RideRequest, RideStatus, VehicleType, SystemSettings, TrackerConfig, NotificationTemplate, Announcement } from '../types';
import { VEHICLE_PRICING } from '../constants';

// --- Local Storage Helpers ---
const STORAGE_KEYS = {
  SETTINGS: 'naijamove_settings',
  USERS: 'naijamove_users',
  RIDES: 'naijamove_rides',
  TEMPLATES: 'naijamove_templates',
  ANNOUNCEMENTS: 'naijamove_announcements'
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

// --- Initial Mock Data (Defaults) ---

const DEFAULT_SETTINGS: SystemSettings = {
  branding: {
    appName: "NaijaMove",
    logoUrl: "",
    primaryColor: "#10b981"
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
    blockedCountries: []
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
    status: 'ACTIVE'
  },
  {
    id: 'staff-1',
    name: 'Support Staff',
    email: 'support@naijamove.ng',
    role: UserRole.STAFF,
    token: 'STAFF-TOKEN-123',
    walletBalance: 0,
    status: 'ACTIVE',
    permissions: ['view_users', 'manage_rides']
  },
  {
    id: 'driver-1',
    name: 'Musa Ibrahim',
    email: 'musa@naijamove.ng',
    role: UserRole.DRIVER,
    vehicleType: VehicleType.OKADA,
    walletBalance: 15000,
    isOnline: true,
    rating: 4.8,
    totalTrips: 142,
    avatar: 'https://ui-avatars.com/api/?name=Musa+Ibrahim&background=f97316&color=fff',
    status: 'ACTIVE',
    ip: '197.210.1.1'
  },
  {
    id: 'driver-2',
    name: 'Chinedu Eze',
    email: 'chinedu@naijamove.ng',
    role: UserRole.DRIVER,
    vehicleType: VehicleType.KEKE,
    walletBalance: 8200,
    isOnline: true,
    rating: 4.5,
    totalTrips: 89,
    avatar: 'https://ui-avatars.com/api/?name=Chinedu+Eze&background=3b82f6&color=fff',
    status: 'ACTIVE'
  },
  {
    id: 'passenger-1',
    name: 'Tola Adebayo',
    email: 'tola@gmail.com',
    role: UserRole.PASSENGER,
    walletBalance: 5000,
    avatar: 'https://ui-avatars.com/api/?name=Tola+Adebayo&background=8b5cf6&color=fff',
    status: 'ACTIVE',
    ip: '102.12.33.1'
  },
];

const DEFAULT_RIDES: RideRequest[] = [
  {
    id: 'ride-101',
    passengerId: 'passenger-1',
    driverId: 'driver-1',
    type: 'RIDE',
    vehicleType: VehicleType.OKADA,
    pickupAddress: 'Ikeja City Mall, Lagos',
    dropoffAddress: 'Maryland Mall, Lagos',
    price: 850,
    status: RideStatus.COMPLETED,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    distanceKm: 5.2,
  },
  {
    id: 'ride-102',
    passengerId: 'passenger-1',
    type: 'LOGISTICS',
    vehicleType: VehicleType.OKADA,
    pickupAddress: 'Computer Village, Ikeja',
    dropoffAddress: 'Victoria Island, Lagos',
    price: 2500,
    status: RideStatus.PENDING,
    createdAt: new Date().toISOString(),
    distanceKm: 18.5,
    parcelDescription: 'MacBook Charger',
    parcelWeight: '0.5kg',
    receiverPhone: '08012345678',
  },
];

const DEFAULT_TEMPLATES: NotificationTemplate[] = [
    {
        id: 'tpl-1',
        name: 'Welcome Email',
        type: 'EMAIL',
        subject: 'Welcome to NaijaMove, {{name}}!',
        body: 'Hi {{name}},\n\nWelcome to Nigeria\'s fastest logistics platform.',
        variables: ['{{name}}']
    }
];

// --- Initialize State from Storage ---

let SETTINGS = load<SystemSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
let USERS = load<User[]>(STORAGE_KEYS.USERS, DEFAULT_USERS);
let RIDES = load<RideRequest[]>(STORAGE_KEYS.RIDES, DEFAULT_RIDES);
let TEMPLATES = load<NotificationTemplate[]>(STORAGE_KEYS.TEMPLATES, DEFAULT_TEMPLATES);
let ANNOUNCEMENTS = load<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, []);

// --- Helper Functions ---

// Text-to-Speech Helper
export const speak = (text: string) => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  }
};

// --- Service Methods ---

export const login = async (identifier: string, isToken = false): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulate latency
  
  if (isToken) {
    const user = USERS.find(u => u.token === identifier);
    if (!user) throw new Error('Invalid Staff Token');
    return user;
  }

  const user = USERS.find(u => u.email === identifier);
  if (!user) throw new Error('User not found');
  if (user.status !== 'ACTIVE') throw new Error(`Account is ${user.status}`);
  
  return user;
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

export const updateUserStatus = async (userId: string, status: 'ACTIVE' | 'BANNED' | 'SUSPENDED') => {
    const idx = USERS.findIndex(u => u.id === userId);
    if(idx !== -1) {
        USERS[idx] = { ...USERS[idx], status };
        save(STORAGE_KEYS.USERS, USERS);
    }
};

export const getActiveRides = async (role: UserRole, userId: string): Promise<RideRequest[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  if (role === UserRole.ADMIN || role === UserRole.STAFF) return RIDES;
  if (role === UserRole.DRIVER) {
    // Return rides that are Pending AND NOT rejected by this driver
    // OR rides that are already accepted by this driver
    return RIDES.filter(r => 
        (r.status === RideStatus.PENDING && !r.rejectedBy?.includes(userId)) || 
        r.driverId === userId
    );
  }
  return RIDES.filter(r => r.passengerId === userId);
};

export const createRide = async (ride: Omit<RideRequest, 'id' | 'status' | 'createdAt'>): Promise<RideRequest> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  const newRide: RideRequest = {
    ...ride,
    id: `ride-${Date.now()}`,
    status: RideStatus.PENDING,
    createdAt: new Date().toISOString(),
  };
  RIDES = [newRide, ...RIDES];
  save(STORAGE_KEYS.RIDES, RIDES);
  return newRide;
};

export const updateRideStatus = async (rideId: string, status: RideStatus, driverId?: string): Promise<RideRequest> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const rideIndex = RIDES.findIndex(r => r.id === rideId);
  if (rideIndex === -1) throw new Error("Ride not found");
  
  const updatedRide = { ...RIDES[rideIndex], status };
  if (driverId) updatedRide.driverId = driverId;
  
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

export const getDashboardStats = async () => {
  await new Promise(resolve => setTimeout(resolve, 600));
  const totalRevenue = RIDES.filter(r => r.status === RideStatus.COMPLETED).reduce((acc, r) => acc + r.price, 0);
  const activeDrivers = USERS.filter(u => u.role === UserRole.DRIVER && u.isOnline).length;
  const completedTrips = RIDES.filter(r => r.status === RideStatus.COMPLETED).length;
  
  return {
    totalRevenue,
    activeDrivers,
    completedTrips,
    platformCommission: totalRevenue * 0.2 // 20% commission
  };
};

export const calculateFare = (vehicleType: VehicleType, distanceKm: number): number => {
  const pricing = VEHICLE_PRICING[vehicleType];
  return Math.ceil(pricing.base + (pricing.perKm * distanceKm));
};

// --- Template & Announcement Services ---

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
    speak("Announcement broadcasted successfully.");
    return newAnn;
}