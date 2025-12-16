
import React, { useState } from 'react';
import { User, UserRole } from './types';
import { login } from './services/mockService';
import { Layout } from './components/Layout';
import AdminDashboard from './pages/admin/AdminDashboard';
import PassengerDashboard from './pages/passenger/PassengerDashboard';
import DriverDashboard from './pages/driver/DriverDashboard';
import LandingPage from './pages/LandingPage';
import { ToastProvider, useToast } from './components/ui/Toast';
import { StaticContent } from './components/StaticContent';

// Inner App Component to use the Toast Hook
const MainApp: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [staticPage, setStaticPage] = useState<string | null>(null);
  const { addToast } = useToast();

  const handleLogin = async (identifier: string, isToken = false) => {
    setLoading(true);
    try {
      const userData = await login(identifier, isToken);
      setUser(userData);
      setCurrentPage('dashboard');
      addToast(`Welcome back, ${userData.name}!`, 'success');
    } catch (e: any) {
      console.error(e);
      addToast(e.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('dashboard');
    addToast('You have been logged out.', 'info');
  };

  // Auth Screen / Landing Page
  if (!user) {
    return (
        <>
            <LandingPage onLogin={handleLogin} loading={loading} onOpenStatic={setStaticPage} />
            {staticPage && <StaticContent page={staticPage} onClose={() => setStaticPage(null)} />}
        </>
    );
  }

  return (
    <Layout user={user} onLogout={handleLogout} onNavigate={setCurrentPage} currentPage={currentPage}>
      {user.role === UserRole.ADMIN && <AdminDashboard view={currentPage} />}
      {user.role === UserRole.PASSENGER && <PassengerDashboard user={user} />}
      {user.role === UserRole.DRIVER && <DriverDashboard user={user} view={currentPage} />}
      {user.role === UserRole.STAFF && <AdminDashboard view={currentPage} />}
    </Layout>
  );
};

const App: React.FC = () => {
    return (
        <ToastProvider>
            <MainApp />
        </ToastProvider>
    )
}

export default App;
