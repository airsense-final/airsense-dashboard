import React, { useState, useEffect, lazy } from 'react';
import { getToken, removeToken, getCurrentUser } from './services/apiService';
import { Header } from './components/layout/Header';
import type { User } from './types/types';

// Lazy load pages for performance optimization
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(module => ({ default: module.DashboardPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(module => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(module => ({ default: module.RegisterPage })));
const TestSimulationPage = lazy(() => import('./pages/TestSimulationPage').then(module => ({ default: module.TestSimulationPage })));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage').then(module => ({ default: module.AdminUsersPage })));
const AdminCompaniesPage = lazy(() => import('./pages/AdminCompaniesPage').then(module => ({ default: module.AdminCompaniesPage })));
const SensorDetailPage = lazy(() => import('./pages/SensorDetailPage').then(module => ({ default: module.SensorDetailPage })));
const SensorManagementPage = lazy(() => import('./pages/SensorManagementPage'));
const ThresholdManagementPage = lazy(() => import('./pages/ThresholdManagementPage'));
const AlertHistoryPage = lazy(() => import('./pages/AlertHistoryPage'));

// Loading fallback component — used by lazy-loaded routes
const _PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="text-cyan-400 light:text-cyan-800 text-xl animate-pulse font-medium">Loading...</div>
  </div>
);
void _PageLoader; // suppress unused warning until Suspense is wired up

function App() {
  const [currentRoute, setCurrentRoute] = useState(window.location.hash || '#/');
  const [isAuthed, setIsAuthed] = useState<boolean>(!!getToken());
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    // Default to dark (true) if no theme is saved
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    if (!isDarkMode) {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

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
      <div className={`min-h-screen bg-gray-900 light:bg-gray-50 flex flex-col items-center justify-center text-white light:text-gray-900 ${!isDarkMode ? 'light-mode' : ''}`}>
        <svg className="animate-spin h-10 w-10 text-cyan-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <div className="text-cyan-400 light:text-cyan-800 text-xl animate-pulse font-bold tracking-tight uppercase">Loading AirSense...</div>
      </div>
    );
  }

  let content: React.ReactNode = null;

  if (currentRoute.includes('login')) {
    return (
      <div className={`min-h-screen bg-gray-900 light:bg-gray-50 ${!isDarkMode ? 'light-mode' : ''}`}>
        <LoginPage onLoginSuccess={handleLoginSuccess} isDarkMode={isDarkMode} />
      </div>
    );
  }

  if (currentRoute.includes('register')) {
    return (
      <div className={`min-h-screen bg-gray-900 light:bg-gray-50 ${!isDarkMode ? 'light-mode' : ''}`}>
        <RegisterPage isDarkMode={isDarkMode} />
      </div>
    );
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
        content = <div className="text-white light:text-gray-900 text-center mt-10">403 - Access Denied</div>;
      } else {
        content = <AdminUsersPage />;
      }
    } else if (currentRoute === '#/admin/companies') {
      // Only superadmin can access companies page
      if (currentUser.role !== 'superadmin') {
        content = <div className="text-white light:text-gray-900 text-center mt-10">403 - Access Denied</div>;
      } else {
        content = <AdminCompaniesPage />;
      }
    } else if (currentRoute === '#/sensors') {
      // Only admins can access sensor management
      if (currentUser.role !== 'superadmin' && currentUser.role !== 'companyadmin') {
        content = <div className="text-white light:text-gray-900 text-center mt-10">403 - Access Denied</div>;
      } else {
        content = <SensorManagementPage />;
      }
    } else if (currentRoute === '#/admin/thresholds') {
      // Only superadmin can access global threshold management
      if (currentUser.role !== 'superadmin') {
        content = <div className="text-white light:text-gray-900 text-center mt-10">403 - Access Denied</div>;
      } else {
        content = <ThresholdManagementPage />;
      }
    } else if (currentRoute === '#/alerts/history') {
      content = <AlertHistoryPage />;
    } else {
      content = <div className="text-white light:text-gray-900 text-center mt-10">404 - Page Not Found</div>;
    }
  } else if (isAuthed) {
    content = <div className="text-white light:text-gray-900 text-center mt-10">Loading user data...</div>;
  } else {
    return null;
  }

  return (
    <div className={`bg-gray-900 light:bg-gray-50 text-white light:text-gray-900 min-h-screen font-sans flex flex-col ${!isDarkMode ? 'light-mode' : ''}`}>
      <Header
        isAuthed={isAuthed}
        onLogout={handleLogout}
        currentUser={currentUser}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />
      <main className="container mx-auto p-3 sm:p-6 flex-1 min-h-[calc(100vh-100px)]">
        {content}
      </main>
    </div>  );
}

export default App;


