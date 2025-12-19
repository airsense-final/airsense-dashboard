import React, { useState, useEffect } from 'react';
import { getToken, removeToken, getCurrentUser } from './services/apiService';
import { Header } from './components/layout/Header';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { TestSimulationPage } from './pages/TestSimulationPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminCompaniesPage } from './pages/AdminCompaniesPage';
import type { User, Sensor, WebSocketMessage, SensorDataHistory, SensorCreate } from './types/types';

function App() {
  const [currentRoute, setCurrentRoute] = useState(window.location.hash || '#/');
  const [isAuthed, setIsAuthed] = useState<boolean>(!!getToken());
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Load test sensors from localStorage
  const getInitialSensors = (): Sensor[] => {
    const stored = localStorage.getItem('airsense_sensors');
    if (stored) {
      return JSON.parse(stored);
    }
    return [
      { sensor_id: 'SENSOR001', type: 'dht11', description: 'Temperature', id: 1 },
      { sensor_id: 'SENSOR002', type: 'mq135', description: 'Air Quality', id: 2 },
      { sensor_id: 'SENSOR003', type: 'mq7', description: 'CO', id: 3 },
      { sensor_id: 'SENSOR004', type: 'scd40', description: 'CO2', id: 4 },
      { sensor_id: 'SENSOR005', type: 'mq4', description: 'Methane', id: 5 },
      { sensor_id: 'SENSOR006', type: 'mq9', description: 'Flammable Gas', id: 6 },
    ];
  };

  const [sensors, setSensorsState] = useState<Sensor[]>(getInitialSensors());

  // Save sensors to localStorage
  const setSensors = (newSensors: Sensor[] | ((prev: Sensor[]) => Sensor[])) => {
    setSensorsState(prev => {
      const updated = typeof newSensors === 'function' ? newSensors(prev) : newSensors;
      localStorage.setItem('airsense_sensors', JSON.stringify(updated));
      return updated;
    });
  };

  // Test data
  const generateTestData = () => {
    const now = Date.now();
    const data: SensorDataHistory = {
      temperature: {
        'SENSOR001': Array.from({ length: 24 }, (_, i) => ({
          timestamp: new Date(now - (23 - i) * 3600000).toISOString(),
          value: 22 + Math.random() * 5,
          alarm: false,
        })),
      },
      humidity: {
        'SENSOR001': Array.from({ length: 24 }, (_, i) => ({
          timestamp: new Date(now - (23 - i) * 3600000).toISOString(),
          value: 45 + Math.random() * 20,
          alarm: false,
        })),
      },
      air_quality: {
        'SENSOR002': Array.from({ length: 24 }, (_, i) => ({
          timestamp: new Date(now - (23 - i) * 3600000).toISOString(),
          value: 300 + Math.random() * 200,
          alarm: false,
        })),
      },
      co_level: {
        'SENSOR003': Array.from({ length: 24 }, (_, i) => ({
          timestamp: new Date(now - (23 - i) * 3600000).toISOString(),
          value: 2 + Math.random() * 8,
          alarm: false,
        })),
      },
      co2: {
        'SENSOR004': Array.from({ length: 24 }, (_, i) => ({
          timestamp: new Date(now - (23 - i) * 3600000).toISOString(),
          value: 400 + Math.random() * 200,
          alarm: false,
        })),
      },
      methane_level: {
        'SENSOR005': Array.from({ length: 24 }, (_, i) => ({
          timestamp: new Date(now - (23 - i) * 3600000).toISOString(),
          value: 150 + Math.random() * 150,
          alarm: false,
        })),
      },
      flammable_gas: {
        'SENSOR006': Array.from({ length: 24 }, (_, i) => ({
          timestamp: new Date(now - (23 - i) * 3600000).toISOString(),
          value: 0 + Math.random() * 10,
          alarm: false,
        })),
      },
    };
    return data;
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [latestData] = useState<Record<string, WebSocketMessage | null>>({
    'SENSOR001': { type: 'new_sensor_data', data: { temperature: 23, humidity: 55 }, sensor_id: 'SENSOR001' },
    'SENSOR002': { type: 'new_sensor_data', data: { air_quality: 350 }, sensor_id: 'SENSOR002' },
    'SENSOR003': { type: 'new_sensor_data', data: { co_level: 5 }, sensor_id: 'SENSOR003' },
    'SENSOR004': { type: 'new_sensor_data', data: { co2: 420 }, sensor_id: 'SENSOR004' },
    'SENSOR005': { type: 'new_sensor_data', data: { methane_level: 212.3 }, sensor_id: 'SENSOR005' },
    'SENSOR006': { type: 'new_sensor_data', data: { flammable_gas: 0.8 }, sensor_id: 'SENSOR006' },
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [globalAlarmState] = useState<Record<string, boolean>>({});
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [dataHistory] = useState<SensorDataHistory>(generateTestData());
  // eslint-disable-next-line @typescript-eslint/no-unused-vars

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

  const handleSensorSelect = (sensor: Sensor) => {
    window.location.hash = `#/sensor/${sensor.sensor_id}`;
  };

  const handleAddSensor = async (sensorData: SensorCreate): Promise<void> => {
    // TODO: API calls will be implemented
    console.log('Adding sensor:', sensorData);
    // Temporarily add to local state
    const newSensor: Sensor = {
      id: Date.now(),
      ...sensorData
    };
    setSensors(prev => [...prev, newSensor]);
  };

  const handleDeleteSensors = async (sensorIds: string[]): Promise<void> => {
    setSensors(prev => prev.filter(sensor => !sensorIds.includes(sensor.sensor_id)));
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
      content = <DashboardPage
        sensors={sensors}
        latestData={latestData}
        onSensorSelect={handleSensorSelect}
        globalAlarmState={globalAlarmState}
        dataHistory={dataHistory}
        onAddSensor={handleAddSensor}
        onDeleteSensors={handleDeleteSensors}
      />;
    } else if (currentRoute === '#/test-simulation') {
      content = <TestSimulationPage />;
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
    } else if (currentRoute.startsWith('#/sensor/')) {
      // Extract sensor ID from URL
      const sensorId = currentRoute.split('#/sensor/')[1];
      const selectedSensor = sensors.find(s => s.sensor_id === sensorId);
      if (selectedSensor) {
        // TODO: Implement SensorDetailPage once ready
        content = (
          <div className="text-white">
            <button
              onClick={() => window.location.hash = '#/'}
              className="mb-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
            >
              ← Back to Dashboard
            </button>
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">{selectedSensor.description}</h2>
              <p className="text-gray-400">Sensor ID: {selectedSensor.sensor_id}</p>
              <p className="text-gray-400">Type: {selectedSensor.type.toUpperCase()}</p>
              <p className="text-gray-500 mt-4">Detail page coming soon...</p>
            </div>
          </div>
        );
      } else {
        content = <div className="text-white text-center mt-10">Sensor not found</div>;
      }
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
