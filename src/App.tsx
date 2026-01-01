import React, { useState, useEffect } from 'react';
import { getToken, removeToken, getCurrentUser } from './services/apiService';
import { Header } from './components/layout/Header';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { TestSimulationPage } from './pages/TestSimulationPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminCompaniesPage } from './pages/AdminCompaniesPage';
import { SensorDetailPage } from './pages/SensorDetailPage';
import SensorManagementPage from './pages/SensorManagementPage';
import ThresholdManagementPage from './pages/ThresholdManagementPage';
import AlertHistoryPage from './pages/AlertHistoryPage';
import type { User } from './types/types';

function App() {
  const [currentRoute, setCurrentRoute] = useState(window.location.hash || '#/');
  const [isAuthed, setIsAuthed] = useState<boolean>(!!getToken());
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const token = getToken();
      setIsAuthed(!!token);

      if (token) {
        try {
          const user = await getCurrentUser();
          setCurrentUser(user);
        } catch (err) {
          console.error('Failed to load user:', err);
          removeToken();
          setIsAuthed(false);
          setCurrentUser(null);
        }
      }

      setAuthLoading(false);
    };

    loadUser();

    // If apiFetch gets 401, it dispatches auth:unauthorized
    const handleUnauthorized = () => {
      removeToken();
      setIsAuthed(false);
      setCurrentUser(null);
      window.location.hash = '#/login';
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  useEffect(() => {
    const checkAuthAndRoute = () => {
      const hash = window.location.hash || '#/';

      if (authLoading) return;

      // Guard: if not logged in, block protected routes
      if (!isAuthed && !hash.includes('login') && !hash.includes('register')) {
        window.location.hash = '#/login';
        return;
      }

      // Guard: if logged in, prevent navigating to login/register
      if (isAuthed && (hash.includes('login') || hash.includes('register'))) {
        window.location.hash = '#/';
        return;
      }

      setCurrentRoute(hash);
    };

    checkAuthAndRoute();
    window.addEventListener('hashchange', checkAuthAndRoute);

    return () => {
      window.removeEventListener('hashchange', checkAuthAndRoute);
    };
  }, [isAuthed, authLoading]);

  // CHANGE: Login success means "token is stored in localStorage" (apiService.setToken)
  const handleLoginSuccess = async () => {
    setIsAuthed(true);

    // Load user data after login
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch (err) {
      console.error('Failed to load user after login:', err);
    }

    window.location.hash = '#/'; // Redirect after login
  };

  const handleLogout = () => {
    removeToken();
    setIsAuthed(false);
    setCurrentUser(null);
    window.location.hash = '#/login';
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  let content: React.ReactNode = null;

  if (currentRoute.includes('login')) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (currentRoute.includes('register')) {
    return <RegisterPage />;
  }

  if (isAuthed && currentUser) {
    if (currentRoute === '#/' || currentRoute === '') {
      content = <DashboardPage currentUser={currentUser} />;
    } else if (currentRoute === '#/test-simulation') {
      content = <TestSimulationPage currentUser={currentUser} />;
    } else if (currentRoute.startsWith('#/sensor/')) {
      // Extract sensor details from hash
      const searchParams = new URLSearchParams(window.location.hash.split('?')[1]);
      const sensorId = searchParams.get('id') || '';
      const sensorName = searchParams.get('name') || '';
      const sensorType = searchParams.get('type') || '';
      const unit = searchParams.get('unit') || '';
      const company = searchParams.get('company');
      const companyName = currentUser.role === 'superadmin' && company ? company : undefined;

      content = (
        <SensorDetailPage
          sensorId={sensorId}
          sensorName={sensorName}
          sensorType={sensorType}
          unit={unit}
          companyName={companyName}
        />
      );
    } else if (currentRoute === '#/admin/users') {
      // Viewer can't access users page
      if (currentUser.role === 'viewer') {
        content = <div className="text-white text-center mt-10">403 - Access Denied</div>;
      } else {
        content = <AdminUsersPage />;
      }
    } else if (currentRoute === '#/admin/companies') {
      // Only superadmin can access companies page
      if (currentUser.role !== 'superadmin') {
        content = <div className="text-white text-center mt-10">403 - Access Denied</div>;
      } else {
        content = <AdminCompaniesPage />;
      }
    } else if (currentRoute === '#/sensors') {
      // Only admins can access sensor management
      if (currentUser.role !== 'superadmin' && currentUser.role !== 'companyadmin') {
        content = <div className="text-white text-center mt-10">403 - Access Denied</div>;
      } else {
        content = <SensorManagementPage />;
      }
    } else if (currentRoute === '#/admin/thresholds') {
      // Only superadmin can access global threshold management
      if (currentUser.role !== 'superadmin') {
        content = <div className="text-white text-center mt-10">403 - Access Denied</div>;
      } else {
        content = <ThresholdManagementPage />;
      }
    } else if (currentRoute === '#/alerts/history') {
      content = <AlertHistoryPage />;
    } else {
      content = <div className="text-white text-center mt-10">404 - Page Not Found</div>;
    }
  } else if (isAuthed) {
    content = <div className="text-white text-center mt-10">Loading user data...</div>;
  } else {
    return null;
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      <Header isAuthed={isAuthed} onLogout={handleLogout} currentUser={currentUser} />
      <main className="container mx-auto p-6">{content}</main>
    </div>
  );
}

export default App;
