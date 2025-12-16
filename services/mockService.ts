import { User, UserRole, RideRequest, RideStatus, VehicleType, SystemSettings, TrackerConfig, NotificationTemplate, Announcement, ChatMessage, SystemHealth, SupportTicket, KnowledgeBaseItem, UserActivity } from '../types';
import { VEHICLE_PRICING } from '../constants';

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
  ACTIVITIES: 'naijamove_activities'
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
  landingPage: {
    heroTitle: "The Future of Logistics & Rides",
    heroSubtitle: "Logistics & Rides",
    heroDescription: "Move parcels, people, and cargo with Nigeria's most advanced AI-powered fleet. Real-time tracking for Okada, Keke, and Mini-bus.",
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
    location: { lat: 6.5244, lng: 3.3792 }
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
    ip: '197.210.1.1',
    device: 'Samsung A54',
    isp: 'MTN Nigeria',
    location: { lat: 6.528, lng: 3.385 }
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
    status: 'ACTIVE',
    device: 'Infinix Hot 10',
    ip: '105.112.44.12',
    isp: 'Airtel Nigeria',
    location: { lat: 6.520, lng: 3.370 }
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
    location: { lat: 6.530, lng: 3.390 }
  },
];

const DEFAULT_KB: KnowledgeBaseItem[] = [
    { id: 'kb-1', question: 'How do I fund my wallet?', answer: 'You can fund your wallet via Bank Transfer or Paystack. Go to the Wallet section in the app.', tags: ['wallet', 'payment'] },
    { id: 'kb-2', question: 'What is the base fare for Okada?', answer: 'The base fare for Okada rides is ₦200, plus ₦50 per km.', tags: ['pricing', 'okada'] },
    { id: 'kb-3', question: 'Do you do interstate delivery?', answer: 'Currently, we only support logistics within Lagos and Abuja. Interstate is coming soon.', tags: ['logistics', 'delivery'] }
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

// --- Service Methods ---

export const login = async (identifier: string, isToken = false): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 800)); 
  
  if (isToken) {
    const user = USERS.find(u => u.token === identifier);
    if (!user) throw new Error('Invalid Staff Token');
    logActivity(user.id, 'LOGIN', 'Staff login via token');
    return user;
  }

  const user = USERS.find(u => u.email === identifier);
  if (!user) throw new Error('User not found');
  if (user.status !== 'ACTIVE') throw new Error(`Account is ${user.status}`);

  if (user.ip && SETTINGS.security.blockedIps.includes(user.ip)) {
      throw new Error(`Access Denied: Your IP (${user.ip}) is blocked.`);
  }
  
  logActivity(user.id, 'LOGIN', `Logged in via ${user.device}`);
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

export const getUserActivity = async (userId: string): Promise<UserActivity[]> => {
    return ACTIVITIES.filter(a => a.userId === userId);
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
  logActivity(ride.passengerId, 'BOOK_RIDE', `Booked ${ride.vehicleType} trip`);
  return newRide;
};

export const updateRideStatus = async (rideId: string, status: RideStatus, driverId?: string): Promise<RideRequest> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const rideIndex = RIDES.findIndex(r => r.id === rideId);
  if (rideIndex === -1) throw new Error("Ride not found");
  
  const updatedRide = { ...RIDES[rideIndex], status };
  if (driverId) {
      updatedRide.driverId = driverId;
      logActivity(driverId, 'RIDE_UPDATE', `Updated ride ${rideId} to ${status}`);
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

export const getDashboardStats = async () => {
  await new Promise(resolve => setTimeout(resolve, 600));
  const totalRevenue = RIDES.filter(r => r.status === RideStatus.COMPLETED).reduce((acc, r) => acc + r.price, 0);
  const activeDrivers = USERS.filter(u => u.role === UserRole.DRIVER && u.isOnline).length;
  const completedTrips = RIDES.filter(r => r.status === RideStatus.COMPLETED).length;
  
  return {
    totalRevenue,
    activeDrivers,
    completedTrips,
    platformCommission: totalRevenue * 0.2
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
    return newAnn;
}

// --- Chat & Support Services ---

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

// Support Tickets
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

// Knowledge Base
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

// Simple AI Logic
export const queryAiAgent = async (question: string): Promise<{answer?: string, escalate?: boolean}> => {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Think time
    
    // Simple keyword matching
    const qLower = question.toLowerCase();
    const match = KB.find(k => qLower.includes(k.question.toLowerCase()) || k.tags.some(t => qLower.includes(t)));
    
    if (match) {
        return { answer: match.answer };
    }
    
    return { escalate: true };
};

export const getSystemHealth = async (): Promise<SystemHealth> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
        database: {
            status: Math.random() > 0.95 ? 'DEGRADED' : 'OPTIMAL',
            latency: Math.floor(Math.random() * 20) + 5,
            activeConnections: Math.floor(Math.random() * 100) + 20
        },
        api: {
            uptime: 99.99,
            requestsPerSecond: Math.floor(Math.random() * 500) + 100,
            avgResponseTime: Math.floor(Math.random() * 80) + 20,
            errorRate: Number((Math.random() * 0.5).toFixed(2))
        },
        realtime: {
            status: 'CONNECTED',
            activeSockets: Math.floor(Math.random() * 2000) + 500,
            messagesPerSecond: Math.floor(Math.random() * 300) + 50
        },
        server: {
            cpuUsage: Math.floor(Math.random() * 60) + 10,
            memoryUsage: Math.floor(Math.random() * 70) + 20,
            diskUsage: 45
        },
        services: [
            { name: 'Auth Service', status: 'OPERATIONAL', latency: 12 },
            { name: 'Ride Matching', status: 'OPERATIONAL', latency: 45 },
            { name: 'Payments', status: Math.random() > 0.9 ? 'ISSUES' : 'OPERATIONAL', latency: 120 },
            { name: 'Notifications', status: 'OPERATIONAL', latency: 25 },
            { name: 'Geo-Spatial', status: 'OPERATIONAL', latency: 30 }
        ]
    };
};