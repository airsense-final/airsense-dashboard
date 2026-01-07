import React, { useState, useEffect, useRef } from 'react';
import { getCompanies, getDashboardSummary, getLatestAlerts, listSensors } from '../services/apiService';
import type { Sensor, LatestSensorData, User, Company, DataPoint, Alert } from '../types/types';
import { LineChartWidget } from '../components/widgets/LineChartWidget';
import { RecentAlertsWidget } from '../components/widgets/RecentAlertsWidget';
import { AIHealthStatusWidget } from '../components/widgets/AIHealthStatusWidget'; // Yeni Import
import { isSensorError, getSensorDisplayValue } from '../utils/sensorUtils';

interface DashboardPageProps {
  currentUser: User | null;
}

const SensorCard: React.FC<{
  sensor: Sensor;
  latestValue: number | null;
  unit: string;
  isOnline: boolean;
  historyData: DataPoint[];
  companyName?: string;
  isError?: boolean;
  alertStatus?: 'critical' | 'warning' | null;
}> = ({ sensor, latestValue, unit, isOnline, historyData, companyName, isError, alertStatus }) => {
  let statusColor = 'border-gray-700 hover:border-cyan-400';
  let statusDotColor = 'bg-gray-500';

  if (isError) {
    statusColor = 'border-red-600 animate-pulse';
    statusDotColor = 'bg-red-600';
  } else if (alertStatus === 'critical') {
    statusColor = 'border-red-600 animate-pulse';
    statusDotColor = 'bg-red-600';
  } else if (alertStatus === 'warning') {
    statusColor = 'border-yellow-500 animate-pulse';
    statusDotColor = 'bg-yellow-500';
  } else if (isOnline) {
    statusDotColor = 'bg-green-500';
  } else {
    statusColor = 'border-red-500'; // Offline but no alert/error? Default offline styling
    statusDotColor = 'bg-red-500';
  }

  const handleClick = () => {
    const params = new URLSearchParams({
      id: sensor.sensor_id,
      name: sensor.sensor_name,
      type: sensor.sensor_type,
      unit: unit,
    });

    if (companyName) {
      params.append('company', companyName);
    }

    window.location.hash = `#/sensor/?${params.toString()}`;
  };

  return (
    <div
      onClick={handleClick}
      className={`bg-gray-800 rounded-lg p-4 shadow-lg transition-all duration-200 border-2 ${statusColor} flex flex-col cursor-pointer hover:shadow-xl hover:scale-105`}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold truncate">{sensor.sensor_name}</h3>
          <p className="text-sm text-gray-400">{sensor.sensor_type}</p>
          <p className="text-xs text-gray-500 mt-1">{sensor.sensor_id}</p>
        </div>
        <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${statusDotColor}`}></div>
      </div>

      <div className="mt-4 h-28">
        {historyData.length > 0 ? (
          <LineChartWidget
            title=""
            metric="value"
            data={historyData}
            unit={unit}
            compact={true}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            No history
          </div>
        )}
      </div>

      <div className="mt-4 text-center">
        <span className="text-3xl font-semibold">
          {getSensorDisplayValue(latestValue, !!isError)}
        </span>
        {!isError && <span className="text-md ml-1 text-gray-400">{unit}</span>}
      </div>

      {sensor.location && sensor.location !== 'Unknown' && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          📍 {sensor.location}
        </div>
      )}
    </div>
  );
};

export const DashboardPage: React.FC<DashboardPageProps> = ({ currentUser }) => {
  const [sensorData, setSensorData] = useState<LatestSensorData[]>([]);
  const [sensorHistory, setSensorHistory] = useState<Record<string, DataPoint[]>>({});
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>(localStorage.getItem('dashboard_selected_company') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [sensorIdMap, setSensorIdMap] = useState<Record<string, string>>({});
  const isFetchingRef = useRef(false);

  // Ref to track the latest selected company to prevent race conditions
  const selectedCompanyRef = useRef(selectedCompany);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    selectedCompanyRef.current = selectedCompany;

    // Clear data immediately when company changes to prevent ghost data
    if (currentUser?.role === 'superadmin') {
      setSensorData([]);
      setSensorHistory({});
    }

    let isMounted = true;
    let timeoutId: number;
    let alertTimeoutId: number;

    const continuousLoad = async () => {
      if (!isMounted) return;

      if (selectedCompany || currentUser?.role !== 'superadmin') {
        await loadSensorData();
        if (isMounted) {
          timeoutId = setTimeout(continuousLoad, 2000);
        }
      }
    };

    const continuousAlertLoad = async () => {
      if (!isMounted) return;
      if (selectedCompany || currentUser?.role !== 'superadmin') {
        await loadAlerts();
        if (isMounted) {
          alertTimeoutId = setTimeout(continuousAlertLoad, 3000);
        }
      }
    };

    loadSensorMap();
    continuousLoad();
    continuousAlertLoad();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (alertTimeoutId) clearTimeout(alertTimeoutId);
    };
  }, [selectedCompany, currentUser]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (currentUser?.role === 'superadmin') {
        const companiesData = await getCompanies();
        setCompanies(companiesData);

        // Check if the stored/current company is valid (exists in the fetched list)
        const isValidSelection = selectedCompany && companiesData.some(c => c.name === selectedCompany);

        if (!isValidSelection && companiesData.length > 0) {
          const defaultCompany = companiesData[0].name;
          setSelectedCompany(defaultCompany);
          localStorage.setItem('dashboard_selected_company', defaultCompany);
        }
      }

      await Promise.all([loadSensorData(), loadAlerts()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadSensorMap = async () => {
    const currentCompany = selectedCompanyRef.current;
    const companyName = currentUser?.role === 'superadmin' ? currentCompany : undefined;
    try {
      const sensors = await listSensors(companyName);
      const map: Record<string, string> = {};
      sensors.forEach((s: any) => {
        if (s._id && s.sensor_id) {
          map[s._id] = s.sensor_id;
        }
      });
      setSensorIdMap(map);
    } catch (err) {
      console.error('Failed to load sensor map', err);
    }
  };

  const loadSensorData = async () => {
    if (isFetchingRef.current) return; // Skip if already loading

    const currentCompany = selectedCompanyRef.current;

    try {
      isFetchingRef.current = true;
      const companyName = currentUser?.role === 'superadmin' ? currentCompany : undefined;

      // OPTIMIZED: Fetch only sensor summary here (2s loop)
      const summaryData = await getDashboardSummary(companyName);
      console.log('Dashboard Summary loaded:', { company: companyName, count: summaryData?.length });

      // Race condition check: If company changed while fetching, discard result
      if (currentUser?.role === 'superadmin' && selectedCompanyRef.current !== currentCompany) {
        return;
      }

      // Transform to match existing state structure
      const latestDataFormatted: LatestSensorData[] = summaryData.map(item => ({
        _id: item.sensor_id,
        timestamp: item.latest_timestamp || new Date().toISOString(),
        value: item.latest_value ?? 0,
        status: item.status,
        metadata: {
          sensor_id: item.sensor_id,
          parent_device: "ESP32",
          type: item.sensor_name, // Dashboard displays metadata.type as name
          unit: item.unit
        }
      }));

      const historyMap: Record<string, DataPoint[]> = {};
      summaryData.forEach(item => {
        historyMap[item.sensor_id] = item.history.map(h => {
          const ts = h.timestamp.endsWith('Z') ? h.timestamp : h.timestamp + 'Z';
          return {
            timestamp: h.timestamp,
            value: h.value,
            alarm: false,
            time: new Date(ts)
          };
        });
      });

      // Batch state updates
      setSensorData(latestDataFormatted); // Triggers re-render for sensors
      setSensorHistory(historyMap);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Failed to load sensor data:', err);
    } finally {
      isFetchingRef.current = false;
    }
  };

  const loadAlerts = async () => {
    const currentCompany = selectedCompanyRef.current;
    const companyName = currentUser?.role === 'superadmin' ? currentCompany : undefined;
    try {
      const alertsData = await getLatestAlerts(companyName, false);
      setActiveAlerts(alertsData); // Triggers re-render for alerts
    } catch (err) {
      console.error('Failed to auto-refresh alerts', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold">Dashboard Overview</h2>
          <p className="text-sm text-gray-400 mt-1">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>

        {currentUser?.role === 'superadmin' && companies.length > 0 && (
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-300">Company:</label>
            <select
              value={selectedCompany}
              onChange={(e) => {
                const newValue = e.target.value;
                setSelectedCompany(newValue);
                localStorage.setItem('dashboard_selected_company', newValue);
              }}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {companies.map((company) => (
                <option key={company._id} value={company.name}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Widgets Area: AI Health & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12 min-h-[20rem]">
        <div className="lg:col-span-1 flex flex-col">
            <AIHealthStatusWidget 
              companyName={currentUser?.role === 'superadmin' ? selectedCompany : undefined} 
              sensorData={sensorData} 
            />
        </div>
        <div className="lg:col-span-2 flex flex-col">
            <RecentAlertsWidget companyName={currentUser?.role === 'superadmin' ? selectedCompany : undefined} />
        </div>
      </div>

      {sensorData.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {(() => {
            // Create context map for error checking
            const sensorValueMap: Record<string, number> = {};
            sensorData.forEach(d => {
              sensorValueMap[d.metadata.sensor_id] = d.value;
            });

            // Create alert status map
            const alertStatusMap: Record<string, 'critical' | 'warning'> = {};
            // Refined Logic (Pre-computation for correctness):
            // 1. Group active alerts by sensor (mapped ID)
            const alertsBySensor: Record<string, Alert[]> = {};
            activeAlerts.forEach(alert => {
              if (!alert.is_resolved) {
                const readableId = sensorIdMap[alert.sensor_id] || alert.sensor_id;
                if (!alertsBySensor[readableId]) alertsBySensor[readableId] = [];
                alertsBySensor[readableId].push(alert);
              }
            });

            // 2. For each sensor, find the latest alert and set status
            Object.keys(alertsBySensor).forEach(sensorId => {
              const sortedAlerts = alertsBySensor[sensorId].sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
              );

              if (sortedAlerts.length > 0) {
                const latest = sortedAlerts[0];
                if (latest.alert_type === 'critical') {
                  alertStatusMap[sensorId] = 'critical';
                } else if (latest.alert_type === 'warning') {
                  alertStatusMap[sensorId] = 'warning';
                }
              }
            });

            return Object.values(
              sensorData.reduce((acc, data) => {
                // Keep only the latest data for each sensor_id
                const sensorId = data.metadata.sensor_id;
                if (!acc[sensorId] || new Date(data.timestamp) > new Date(acc[sensorId].timestamp)) {
                  acc[sensorId] = data;
                }
                return acc;
              }, {} as Record<string, typeof sensorData[0]>)
            )
              .sort((a, b) => a.metadata.sensor_id.localeCompare(b.metadata.sensor_id))
              .map((data) => {
                const isError = isSensorError(data.metadata.sensor_id, data.value, sensorValueMap);
                return (
                  <SensorCard
                    key={data.metadata.sensor_id}
                    sensor={{
                      _id: data._id,
                      sensor_id: data.metadata.sensor_id,
                      sensor_name: data.metadata.type,
                      sensor_type: data.metadata.unit,
                      parent_device_id: data.metadata.parent_device,
                      company_id: '',
                    }}
                    latestValue={data.value}
                    unit={data.metadata.unit}
                    isOnline={data.status === 'active'}
                    historyData={sensorHistory[data.metadata.sensor_id] || []}
                    companyName={currentUser?.role === 'superadmin' ? selectedCompany : undefined}
                    isError={isError}
                    alertStatus={alertStatusMap[data.metadata.sensor_id]}
                  />
                );
              })
          })()}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-800/50 rounded-lg">
          <h3 className="text-xl text-gray-400">No sensor data available</h3>
          <p className="text-gray-500 mt-2">
            {currentUser?.role === 'superadmin' && !selectedCompany
              ? 'Select a company to view sensors'
              : 'Waiting for sensors to send data...'}
          </p>
        </div>
      )}
    </div>
  );
};