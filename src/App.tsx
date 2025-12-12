import React, { useState, useEffect } from 'react';
import { getToken, removeToken, getCurrentUser } from './services/apiService';
import { Header } from './components/layout/Header';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { TestSimulationPage } from './pages/TestSimulationPage';
import type { User } from './types/types';

function App() {
  const [currentRoute, setCurrentRoute] = useState(window.location.hash || '#/');
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
      const checkAuth = async () => {
          const token = getToken();
          if (token) {
              try {
                  const userData = await getCurrentUser();
                  setUser(userData);
              } catch (e) {
                  console.error("Token invalid or expired", e);
                  removeToken();
                  setUser(null);
              }
          }
          setAuthLoading(false);
      };

      checkAuth();

      const handleUnauthorized = () => {
          setUser(null);
          window.location.hash = '#/login';
      };
      window.addEventListener('auth:unauthorized', handleUnauthorized);
      return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  useEffect(() => {
    const checkAuthAndRoute = () => {
      const hash = window.location.hash || '#/';

      if (authLoading) return;

      if (!user && !hash.includes('login') && !hash.includes('register')) {
         window.location.hash = '#/login';
         return;
      }

      if (user && (hash.includes('login') || hash.includes('register'))) {
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
  }, [user, authLoading]);

  const handleLoginSuccess = (userData: User) => {
      setUser(userData);
  };

  const handleLogout = () => {
      removeToken();
      setUser(null);
  };

  if (authLoading) {
      return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>;
  }

  let content;

  if (currentRoute.includes('login')) {
      return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  } 
  else if (currentRoute.includes('register')) {
      return <RegisterPage />;
  } 
  else if (user) {
      if (currentRoute === '#/' || currentRoute === '') {
          content = <DashboardPage />;
      } 
      else if (currentRoute === '#/test-simulation') {
          content = <TestSimulationPage />;
      } 
      else {
          content = <div className="text-white text-center mt-10">404 - Page Not Found</div>;
      }
  } else {
      return null;
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      <Header user={user} onLogout={handleLogout} />
      <main className="container mx-auto p-6">
        {content}
      </main>
    </div>
  );
}

export default App;