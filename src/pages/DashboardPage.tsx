import React, { useState, useEffect, useRef } from 'react';
import { getLatestSensorData, getSensorHistory, getCompanies, getDashboardSummary } from '../services/apiService';
import type { Sensor, LatestSensorData, User, Company, DataPoint, SensorDashboardView } from '../types/types';
import { LineChartWidget } from '../components/widgets/LineChartWidget';

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
}> = ({ sensor, latestValue, unit, isOnline, historyData, companyName }) => {
  const statusColor = isOnline ? 'border-gray-700 hover:border-cyan-400' : 'border-red-500';
  const statusDotColor = isOnline ? 'bg-green-500' : 'bg-gray-500';

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
          {latestValue !== null ? latestValue.toFixed(4) : '--'}
        </span>
        <span className="text-md ml-1 text-gray-400">{unit}</span>
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
  const [isLoadingData, setIsLoadingData] = useState(false);

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

    const continuousLoad = async () => {
      if (!isMounted) return;

      if (selectedCompany || currentUser?.role !== 'superadmin') {
        await loadSensorData();
        if (isMounted) {
          timeoutId = setTimeout(continuousLoad, 2000);
        }
      }
    };

    continuousLoad();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [selectedCompany]);

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

      await loadSensorData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadSensorData = async () => {
    if (isLoadingData) return; // Skip if already loading

    const currentCompany = selectedCompanyRef.current;

    try {
      setIsLoadingData(true);
      const companyName = currentUser?.role === 'superadmin' ? currentCompany : undefined;
      
      // OPTIMIZED: Fetch everything in one go
      const summaryData = await getDashboardSummary(companyName);

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
      setSensorData(latestDataFormatted);
      setSensorHistory(historyMap);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Failed to load sensor data:', err);
    } finally {
      setIsLoadingData(false);
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

      {sensorData.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Object.values(
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
            .map((data) => (
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
              />
            ))}
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