import React, { useState } from 'react';
import { User, UserRole } from './types';
import { login } from './services/mockService';
import { Layout } from './components/Layout';
import AdminDashboard from './pages/admin/AdminDashboard';
import PassengerDashboard from './pages/passenger/PassengerDashboard';
import DriverDashboard from './pages/driver/DriverDashboard';
import LandingPage from './pages/LandingPage';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleLogin = async (identifier: string, isToken = false) => {
    setLoading(true);
    try {
      const userData = await login(identifier, isToken);
      setUser(userData);
      setCurrentPage('dashboard');
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('dashboard');
  };

  // Auth Screen / Landing Page
  if (!user) {
    return <LandingPage onLogin={handleLogin} loading={loading} />;
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

export default App;