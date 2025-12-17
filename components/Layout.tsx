
import React, { useState, useEffect } from 'react';
import { User, UserRole, NotificationItem } from '../types';
import { APP_NAME } from '../constants';
import { Menu, X, LogOut, LayoutDashboard, Car, Package, Settings, CreditCard, User as UserIcon, Users, Activity, ChevronLeft, ChevronRight, Headphones, Wallet, Zap, Bell, Wifi, WifiOff, Clock, FileBarChart } from 'lucide-react';
import { getSystemSettings, getNotifications, markNotificationRead } from '../services/mockService';
import { SupportWidget } from './SupportWidget';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, onNavigate, currentPage }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [appName, setAppName] = useState(APP_NAME);
  
  // Header States
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    getSystemSettings().then(s => setAppName(s.branding.appName));
    
    // Clock Interval
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Network Listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Notifications Poll
    const notifInterval = setInterval(async () => {
        const notifs = await getNotifications();
        const unreadCount = notifs.filter(n => !n.isRead).length;
        
        // Play sound if new unread exists compared to previous state
        if (unreadCount > notifications.filter(n => !n.isRead).length) {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play().catch(() => {}); // catch autoplay policy errors
        }
        setNotifications(notifs);
    }, 5000);

    return () => {
        clearInterval(timer);
        clearInterval(notifInterval);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, [notifications.length]);

  const hasPermission = (permission: string) => {
      if (user.role === UserRole.ADMIN) return true;
      if (user.role === UserRole.STAFF && user.permissions?.includes(permission as any)) return true;
      return false;
  };

  const renderNavLinks = () => {
    const commonClasses = `flex items-center gap-3 px-3 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors cursor-pointer w-full text-left ${isCollapsed ? 'justify-center' : ''}`;
    const activeClasses = "bg-emerald-600 text-white shadow-md";

    const LinkItem = ({ icon: Icon, label, page, permission }: any) => {
        if (permission && !hasPermission(permission)) return null;
        return (
            <button 
                onClick={() => {
                    onNavigate(page);
                    setIsSidebarOpen(false);
                }} 
                className={`${commonClasses} ${currentPage === page ? activeClasses : ''}`}
                title={isCollapsed ? label : ''}
            >
                <Icon size={20} className="min-w-[20px]" />
                {!isCollapsed && <span className="truncate">{label}</span>}
            </button>
        );
    };

    if (user.role === UserRole.ADMIN || user.role === UserRole.STAFF) {
      return (
        <>
          <LinkItem icon={LayoutDashboard} label="Overview" page="dashboard" />
          <LinkItem icon={Users} label="User Management" page="users" permission="MANAGE_USERS" />
          <LinkItem icon={Car} label="Active Trips" page="trips" permission="MANAGE_RIDES" />
          <LinkItem icon={Package} label="Logistics" page="logistics" permission="MANAGE_RIDES" />
          <LinkItem icon={CreditCard} label="Finance" page="finance" permission="VIEW_FINANCE" />
          <LinkItem icon={FileBarChart} label="Reports" page="reports" permission="VIEW_REPORTS" />
          <LinkItem icon={Headphones} label="Support Center" page="support" permission="SUPPORT" />
          <LinkItem icon={Zap} label="Automation" page="automation" permission="MANAGE_SETTINGS" />
          <LinkItem icon={Activity} label="System Health" page="health" permission="MANAGE_SETTINGS" />
          <LinkItem icon={Settings} label="System Config" page="settings" permission="MANAGE_SETTINGS" />
        </>
      );
    }
    
    if (user.role === UserRole.DRIVER) {
      return (
        <>
          <LinkItem icon={LayoutDashboard} label="Dashboard" page="dashboard" />
          <LinkItem icon={Car} label="My Trips" page="trips" />
          <LinkItem icon={Wallet} label="Earnings & Wallet" page="wallet" />
          <LinkItem icon={UserIcon} label="My Profile" page="profile" />
          <LinkItem icon={Headphones} label="Support" page="support" />
        </>
      );
    }

    return (
      <>
        <LinkItem icon={Car} label="Book a Ride" page="dashboard" />
        <LinkItem icon={Package} label="Send Package" page="logistics" />
      </>
    );
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-30 bg-gray-900 text-white transform transition-all duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}>
        <div className={`flex items-center h-16 bg-gray-950 border-b border-gray-800 ${isCollapsed ? 'justify-center px-0' : 'justify-between px-6'}`}>
          {!isCollapsed && (
             <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-8 h-8 bg-white rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden p-1">
                    <img src="https://cdn-icons-png.flaticon.com/512/2972/2972185.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <span className="font-bold text-lg tracking-tight truncate">{appName}</span>
             </div>
          )}
          {isCollapsed && (
             <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center overflow-hidden p-1">
                 <img src="https://cdn-icons-png.flaticon.com/512/2972/2972185.png" alt="Logo" className="w-full h-full object-contain" />
             </div>
          )}
          
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-400">
            <X size={24} />
          </button>
        </div>

        <nav className="flex flex-col gap-2 p-3 mt-4">
          {renderNavLinks()}
        </nav>

        <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex absolute top-[70px] -right-3 w-6 h-6 bg-emerald-600 rounded-full items-center justify-center text-white shadow-md hover:bg-emerald-700 transition-colors z-50"
        >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className={`absolute bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-800 ${isCollapsed ? 'p-2' : 'p-4'}`}>
          <div className={`flex items-center gap-3 mb-4 ${isCollapsed ? 'justify-center' : ''}`}>
            <img src={user.avatar} alt="User" className="w-8 h-8 rounded-full border border-gray-700" />
            {!isCollapsed && (
                <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate capitalize">{user.role.toLowerCase()}</p>
                </div>
            )}
          </div>
          <button 
            onClick={onLogout}
            className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-gray-800 rounded-md transition-colors ${isCollapsed ? 'justify-center' : ''}`}
            title="Sign Out"
          >
            <LogOut size={16} />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200 shadow-sm z-10">
          <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                <Menu size={24} />
              </button>
              
              {/* Digital Clock */}
              <div className="hidden sm:flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                  <Clock size={16} className="text-gray-500" />
                  <span className="font-mono text-sm font-medium text-gray-700">
                      {currentTime.toLocaleTimeString()}
                  </span>
              </div>
          </div>
          
          <div className="flex items-center gap-4 ml-auto">
             {/* Internet Indicator */}
             <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                 {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                 <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
             </div>

             {/* Notifications */}
             <div className="relative">
                 <button 
                    onClick={() => setShowNotifs(!showNotifs)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-full relative transition-colors"
                 >
                     <Bell size={20} />
                     {unreadCount > 0 && (
                         <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                     )}
                 </button>
                 {showNotifs && (
                     <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                         <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
                             <h4 className="font-bold text-sm text-gray-700">Notifications</h4>
                             <button onClick={() => setShowNotifs(false)} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
                         </div>
                         <div className="max-h-80 overflow-y-auto">
                             {notifications.length === 0 ? (
                                 <div className="p-6 text-center text-gray-500 text-xs">No notifications.</div>
                             ) : (
                                 notifications.map(n => (
                                     <div 
                                        key={n.id} 
                                        onClick={() => markNotificationRead(n.id)}
                                        className={`p-3 border-b hover:bg-gray-50 cursor-pointer transition-colors ${n.isRead ? 'opacity-60' : 'bg-blue-50/50'}`}
                                     >
                                         <p className="text-sm font-bold text-gray-800">{n.title}</p>
                                         <p className="text-xs text-gray-600 mt-1">{n.message}</p>
                                         <p className="text-[10px] text-gray-400 mt-2 text-right">{new Date(n.createdAt).toLocaleTimeString()}</p>
                                     </div>
                                 ))
                             )}
                         </div>
                     </div>
                 )}
             </div>

             {user.role === UserRole.DRIVER && (
               <div className="flex items-center gap-3">
                 <span className={`px-3 py-1 text-xs font-bold rounded-full ${user.isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'}`}>
                   {user.isOnline ? 'ONLINE' : 'OFFLINE'}
                 </span>
               </div>
             )}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 bg-gray-50 scroll-smooth relative">
          {children}
          {user.role !== UserRole.ADMIN && user.role !== UserRole.STAFF && currentPage !== 'support' && (
              <SupportWidget user={user} />
          )}
        </main>
      </div>
    </div>
  );
};
