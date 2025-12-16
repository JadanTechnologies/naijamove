import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { APP_NAME } from '../constants';
import { Menu, X, LogOut, LayoutDashboard, Car, Package, Settings, CreditCard, User as UserIcon, Users, Activity, ChevronLeft, ChevronRight, Headphones, Wallet } from 'lucide-react';
import { getSystemSettings } from '../services/mockService';
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
  const [isCollapsed, setIsCollapsed] = useState(false); // Collapsed state for desktop
  const [appName, setAppName] = useState(APP_NAME);

  React.useEffect(() => {
    getSystemSettings().then(s => setAppName(s.branding.appName));
  }, []);

  const renderNavLinks = () => {
    const commonClasses = `flex items-center gap-3 px-3 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors cursor-pointer w-full text-left ${isCollapsed ? 'justify-center' : ''}`;
    const activeClasses = "bg-emerald-600 text-white shadow-md";

    const LinkItem = ({ icon: Icon, label, page }: any) => (
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

    if (user.role === UserRole.ADMIN) {
      return (
        <>
          <LinkItem icon={LayoutDashboard} label="Overview" page="dashboard" />
          <LinkItem icon={Users} label="User Management" page="users" />
          <LinkItem icon={Car} label="Active Trips" page="trips" />
          <LinkItem icon={Package} label="Logistics" page="logistics" />
          <LinkItem icon={CreditCard} label="Finance" page="finance" />
          <LinkItem icon={Headphones} label="Support Center" page="support" />
          <LinkItem icon={Activity} label="System Health" page="health" />
          <LinkItem icon={Settings} label="System Config" page="settings" />
        </>
      );
    }
    
    if (user.role === UserRole.DRIVER) {
      return (
        <>
          <LinkItem icon={LayoutDashboard} label="Dashboard" page="dashboard" />
          <LinkItem icon={Car} label="My Trips" page="trips" />
          <LinkItem icon={Wallet} label="Earnings & Wallet" page="wallet" />
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

        {/* Collapse Toggle for Desktop */}
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
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-md"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-4 ml-auto">
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
          {/* Support Widget for Non-Admins */}
          {user.role !== UserRole.ADMIN && user.role !== UserRole.STAFF && currentPage !== 'support' && (
              <SupportWidget user={user} />
          )}
        </main>
      </div>
    </div>
  );
};