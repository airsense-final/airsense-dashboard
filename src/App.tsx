import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { DashboardPage } from './pages/DashboardPage';
import { TestSimulationPage } from './pages/TestSimulationPage';

function App() {
  const [currentRoute, setCurrentRoute] = useState(window.location.hash || '#/');

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentRoute(window.location.hash || '#/');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  let content;
  
  if (currentRoute === '#/' || currentRoute === '') {
      content = <DashboardPage />;
  } else if (currentRoute === '#/test-simulation') {
      content = <TestSimulationPage />;
  } else {
      content = <div className="text-white text-center mt-10">404 - Page Not Found</div>;
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      <Header />
      <main className="container mx-auto p-6">
        {content}
      </main>
    </div>
  );
}

export default App;