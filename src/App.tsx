import React, { useState, useEffect } from 'react';
import { getToken, removeToken } from './services/apiService';
import { Header } from './components/layout/Header';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { TestSimulationPage } from './pages/TestSimulationPage';

function App() {
  const [currentRoute, setCurrentRoute] = useState(window.location.hash || '#/');
  const [isAuthed, setIsAuthed] = useState<boolean>(!!getToken());
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // CHANGE: Auth is token-based
    setIsAuthed(!!getToken());
    setAuthLoading(false);

    // If apiFetch gets 401, it dispatches auth:unauthorized
    const handleUnauthorized = () => {
      removeToken();
      setIsAuthed(false);
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
  const handleLoginSuccess = () => {
    setIsAuthed(true);
    window.location.hash = '#/'; // Redirect after login
  };

  const handleLogout = () => {
    removeToken();
    setIsAuthed(false);
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

  if (isAuthed) {
    if (currentRoute === '#/' || currentRoute === '') {
      content = <DashboardPage />;
    } else if (currentRoute === '#/test-simulation') {
      content = <TestSimulationPage />;
    } else {
      content = <div className="text-white text-center mt-10">404 - Page Not Found</div>;
    }
  } else {
    return null;
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      {/* NOTE: Backend doesn't provide user profile right now, so user is unknown. */}
      <Header isAuthed={isAuthed} onLogout={handleLogout} />
      <main className="container mx-auto p-6">{content}</main>
    </div>
  );
}

export default App;