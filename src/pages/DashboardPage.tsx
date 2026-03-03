import React, { useState, useEffect, useRef } from 'react';
import { getCompanies, getDashboardSummary, getLatestAlerts, listSensors } from '../services/apiService';
import type { Sensor, LatestSensorData, User, Company, DataPoint, Alert } from '../types/types';
import { LineChartWidget } from '../components/widgets/LineChartWidget';
import { RecentAlertsWidget } from '../components/widgets/RecentAlertsWidget';
import { AIHealthStatusWidget } from '../components/widgets/AIHealthStatusWidget';
import { isSensorError, getSensorDisplayValue } from '../utils/sensorUtils';
import { useWebSocket } from '../hooks/useWebSocket'; // WebSocket Hook
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DashboardPageProps {
  currentUser: User | null;
}

// Sortable wrapper for device groups
const SortableDeviceGroup: React.FC<{
  id: string;
  children: React.ReactNode;
}> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Drag Handle for Device Group */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 cursor-move p-2 bg-cyan-600/20 hover:bg-cyan-600/40 rounded transition-colors z-10 border border-cyan-500/30"
        title="Drag to reorder device"
      >
        <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 16 16">
          <path d="M5 3h2v2H5V3zm4 0h2v2H9V3zM5 7h2v2H5V7zm4 0h2v2H9V7zm-4 4h2v2H5v-2zm4 0h2v2H9v-2z"/>
        </svg>
      </div>
      {children}
    </div>
  );
};

// Sortable wrapper for sensor cards
const SortableSensorCard = React.memo<{
  id: string;
  sensor: Sensor;
  latestValue: number | null;
  unit: string;
  isOnline: boolean;
  historyData: DataPoint[];
  companyName?: string;
  isError?: boolean;
  alertStatus?: 'critical' | 'warning' | null;
}>(({ id, sensor, latestValue, unit, isOnline, historyData, companyName, isError, alertStatus }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <SensorCard
        sensor={sensor}
        latestValue={latestValue}
        unit={unit}
        isOnline={isOnline}
        historyData={historyData}
        companyName={companyName}
        isError={isError}
        alertStatus={alertStatus}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
});

const SensorCard = React.memo< {
  sensor: Sensor;
  latestValue: number | null;
  unit: string;
  isOnline: boolean;
  historyData: DataPoint[];
  companyName?: string;
  isError?: boolean;
  alertStatus?: 'critical' | 'warning' | null;
  dragHandleProps?: any;
}>(({ sensor, latestValue, unit, isOnline, historyData, companyName, isError, alertStatus, dragHandleProps }) => {
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
    statusColor = 'border-red-500';
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
      className={`bg-gray-800 rounded-lg shadow-md transition-all duration-200 border ${statusColor} flex flex-col cursor-pointer hover:shadow-lg hover:scale-[1.02] p-3 relative`}
    >
      {/* Drag Handle */}
      {dragHandleProps && (
        <div
          {...dragHandleProps}
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-1 left-1 cursor-move p-1.5 bg-gray-700/50 hover:bg-gray-600 rounded transition-colors z-10 border border-gray-600"
          title="Drag to reorder"
        >
          <svg className="w-3 h-3 text-gray-300" fill="currentColor" viewBox="0 0 16 16">
            <path d="M5 3h2v2H5V3zm4 0h2v2H9V3zM5 7h2v2H5V7zm4 0h2v2H9V7zm-4 4h2v2H5v-2zm4 0h2v2H9v-2z"/>
          </svg>
        </div>
      )}
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate text-sm">{sensor.sensor_name}</h3>
          <p className="text-gray-500 truncate text-xs">{sensor.sensor_id}</p>
        </div>
        <div className={`rounded-full flex-shrink-0 ml-1 ${statusDotColor} w-3 h-3`}></div>
      </div>

      <div className="h-20 mb-2">
        {historyData.length > 0 ? (
          <LineChartWidget
            title=""
            metric="value"
            data={historyData}
            unit={unit}
            compact={true}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-xs">
            No data
          </div>
        )}
      </div>

      <div className="text-center">
        <span className="font-semibold text-lg">
          {getSensorDisplayValue(latestValue, !!isError)}
        </span>
        {!isError && <span className="ml-1 text-gray-400 text-sm">{unit}</span>}
      </div>
    </div>
  );
});

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
  const [allSensors, setAllSensors] = useState<Sensor[]>([]);
  const [sensorOrder, setSensorOrder] = useState<Record<string, string[]>>({});
  const [deviceOrder, setDeviceOrder] = useState<string[]>([]);
  const isFetchingRef = useRef(false);
  
  // DnD sensors for sensor cards
  const dndSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // DnD sensors for device groups
  const deviceDndSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // WebSocket Hook
  const { lastMessage, isConnected } = useWebSocket();

  // Ref to track the latest selected company to prevent race conditions
  const selectedCompanyRef = useRef(selectedCompany);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Handle WebSocket Updates
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'SENSOR_UPDATE') {
      const data = lastMessage.data;
      
      // Filter by company if needed
      if (currentUser?.role === 'superadmin' && selectedCompany && data.company_name !== selectedCompany) {
        return;
      }

      console.log('⚡ WS Update:', data);
      
      // Transform WS data to LatestSensorData format
      const timestamp = data.timestamp || new Date().toISOString();
      
      // Create updates for each sensor value in the payload
      const updates: LatestSensorData[] = [];
      const ignoreKeys = ['timestamp', 'sensor_id', 'device_id', 'status', 'company_name'];

      Object.entries(data.values).forEach(([key, value]) => {
        if (ignoreKeys.includes(key) || typeof value !== 'number') return;

        // Construct Sensor ID (e.g. "Company_mq4_1") matches backend logic
        const uniqueId = data.company_name ? `${data.company_name}_${key}` : `${data.device_id}_${key}`;
        
        updates.push({
          _id: uniqueId, // This might not match DB _id but metadata.sensor_id is key
          timestamp: timestamp,
          value: value as number,
          status: 'active',
          metadata: {
            sensor_id: uniqueId,
            parent_device: data.device_id,
            type: key, // Simplified type derivation
            unit: '' // Unit comes from catalog, hard to get here without map
          }
        });
      });

      // Update State: Merge new updates with existing sensorData
      setSensorData(prevData => {
        const newData = [...prevData];
        updates.forEach(update => {
          const index = newData.findIndex(d => d.metadata.sensor_id === update.metadata.sensor_id);
          if (index !== -1) {
            // Preserve unit and other metadata from existing state
            newData[index] = {
              ...newData[index],
              value: update.value,
              timestamp: update.timestamp,
              status: update.status
            };
          } else {
            // New sensor found via WS (less common, usually loadInitialData handles it)
            newData.push(update);
          }
        });
        return newData;
      });
      
      setLastUpdate(new Date());
    }
  }, [lastMessage, selectedCompany, currentUser]);

  useEffect(() => {
    selectedCompanyRef.current = selectedCompany;

    // Clear data immediately when company changes to prevent ghost data
    if (currentUser?.role === 'superadmin') {
      // Reload full data on company switch
      loadInitialData();
    }
    
    // Only load sensor map, no polling
    loadSensorMap();

  }, [selectedCompany, currentUser]);

  // Auto-refresh sensor history for charts (similar to detail page)
  useEffect(() => {
    // Initial load is handled by loadInitialData

    // Auto-refresh sensor history every 3 seconds for real-time chart updates
    const historyIntervalId = setInterval(() => {
      loadSensorData(); // This loads both latest values and history
    }, 3000);

    return () => {
      clearInterval(historyIntervalId);
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
      setAllSensors(sensors); // Store full sensor list with MongoDB ObjectIDs
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

  // Load sensor order from local storage
  useEffect(() => {
    const stored = localStorage.getItem('sensor_order');
    if (stored) {
      try {
        setSensorOrder(JSON.parse(stored));
      } catch (err) {
        console.error('Failed to parse sensor order from localStorage', err);
      }
    }

    const storedDevices = localStorage.getItem('device_order');
    if (storedDevices) {
      try {
        setDeviceOrder(JSON.parse(storedDevices));
      } catch (err) {
        console.error('Failed to parse device order from localStorage', err);
      }
    }
  }, []);

  // Save sensor order to local storage whenever it changes
  useEffect(() => {
    if (Object.keys(sensorOrder).length > 0) {
      localStorage.setItem('sensor_order', JSON.stringify(sensorOrder));
    }
  }, [sensorOrder]);

  // Save device order to local storage whenever it changes
  useEffect(() => {
    if (deviceOrder.length > 0) {
      localStorage.setItem('device_order', JSON.stringify(deviceOrder));
    }
  }, [deviceOrder]);

  // Handle drag end for sensors
  const handleDragEnd = (event: any, deviceId: string) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setSensorOrder((prev) => {
      const currentOrder = prev[deviceId] || [];
      const oldIndex = currentOrder.indexOf(active.id as string);
      const newIndex = currentOrder.indexOf(over.id as string);

      if (oldIndex === -1 || newIndex === -1) {
        return prev;
      }

      const newOrder = arrayMove(currentOrder, oldIndex, newIndex);

      return {
        ...prev,
        [deviceId]: newOrder,
      };
    });
  };

  // Handle drag end for device groups
  const handleDeviceDragEnd = (event: any) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setDeviceOrder((prev) => {
      const oldIndex = prev.indexOf(active.id as string);
      const newIndex = prev.indexOf(over.id as string);

      if (oldIndex === -1 || newIndex === -1) {
        return prev;
      }

      return arrayMove(prev, oldIndex, newIndex);
    });
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
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-gray-400">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
            {isConnected && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                Live
              </span>
            )}
          </div>
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

      {/* Main Layout: Device Groups with their own widgets */}
      {sensorData.length > 0 ? (
        <div className="space-y-6">
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

            // Get unique sensor data
            const uniqueSensorData = Object.values(
              sensorData.reduce((acc, data) => {
                const sensorId = data.metadata.sensor_id;
                if (!acc[sensorId] || new Date(data.timestamp) > new Date(acc[sensorId].timestamp)) {
                  acc[sensorId] = data;
                }
                return acc;
              }, {} as Record<string, typeof sensorData[0]>)
            );

            // Group sensors by parent_device_id
            const groupedByDevice: Record<string, typeof uniqueSensorData> = {};
            uniqueSensorData.forEach(data => {
              const parentDevice = data.metadata.parent_device || 'Unknown Device';
              if (!groupedByDevice[parentDevice]) {
                groupedByDevice[parentDevice] = [];
              }
              groupedByDevice[parentDevice].push(data);
            });

            // Apply custom order from state or sort by sensor_id
            Object.keys(groupedByDevice).forEach(device => {
              const customOrder = sensorOrder[device];
              if (customOrder && customOrder.length > 0) {
                // Sort by custom order
                groupedByDevice[device].sort((a, b) => {
                  const indexA = customOrder.indexOf(a.metadata.sensor_id);
                  const indexB = customOrder.indexOf(b.metadata.sensor_id);
                  
                  // If both are in custom order, sort by their position
                  if (indexA !== -1 && indexB !== -1) {
                    return indexA - indexB;
                  }
                  // If only A is in custom order, it comes first
                  if (indexA !== -1) return -1;
                  // If only B is in custom order, it comes first
                  if (indexB !== -1) return 1;
                  // If neither is in custom order, sort alphabetically
                  return a.metadata.sensor_id.localeCompare(b.metadata.sensor_id);
                });
              } else {
                // Default alphabetical sort
                groupedByDevice[device].sort((a, b) => 
                  a.metadata.sensor_id.localeCompare(b.metadata.sensor_id)
                );
              }
              
              // Initialize sensor order for this device if not exists
              if (!sensorOrder[device]) {
                const initialOrder = groupedByDevice[device].map(s => s.metadata.sensor_id);
                setSensorOrder(prev => ({ ...prev, [device]: initialOrder }));
              }
            });

            // Initialize device order if not exists
            const deviceKeys = Object.keys(groupedByDevice).sort();
            if (deviceOrder.length === 0) {
              setDeviceOrder(deviceKeys);
            }

            // Sort device groups by custom order
            const sortedDeviceEntries = deviceOrder.length > 0
              ? deviceOrder
                  .filter(deviceId => groupedByDevice[deviceId]) // Only include devices that exist
                  .map(deviceId => [deviceId, groupedByDevice[deviceId]] as [string, typeof uniqueSensorData])
              : Object.entries(groupedByDevice).sort(([deviceA], [deviceB]) => deviceA.localeCompare(deviceB));

            // Render groups with their own widgets wrapped in DndContext for device reordering
            return (
              <DndContext
                sensors={deviceDndSensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDeviceDragEnd}
              >
                <SortableContext
                  items={deviceOrder.length > 0 ? deviceOrder : deviceKeys}
                  strategy={rectSortingStrategy}
                >
                  <div className="space-y-6">
                    {sortedDeviceEntries.map(([parentDevice, sensors]) => {
                // Filter sensor data for this device
                const deviceSensorData = sensorData.filter(
                  d => d.metadata.parent_device === parentDevice
                );

                // Get MongoDB ObjectIDs for this device's sensors
                // Match by sensor_id (readable) from uniqueSensorData to get _id (MongoDB ObjectID) from allSensors
                const sensorIdsReadable = sensors.map(s => s.metadata.sensor_id);
                const deviceSensorIds = allSensors
                  .filter(s => sensorIdsReadable.includes(s.sensor_id))
                  .map(s => s._id)
                  .filter(Boolean); // Remove any undefined values

                console.log('🔍 Device:', parentDevice, 'Sensor ObjectIDs:', deviceSensorIds);

                return (
                  <SortableDeviceGroup key={parentDevice} id={parentDevice}>
                    <div className="bg-gray-800/30 rounded-lg border border-gray-700 p-4">
                    {/* Device Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-cyan-600/20 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">🔌</span>
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-cyan-400">{parentDevice}</h2>
                        <p className="text-xs text-gray-400">{sensors.length} sensor{sensors.length !== 1 ? 's' : ''} connected</p>
                      </div>
                    </div>

                    {/* Layout: Sensors Left + Widgets Right */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                      {/* Sensors Grid */}
                      <div className="lg:col-span-3">
                        <DndContext
                          sensors={dndSensors}
                          collisionDetection={closestCenter}
                          onDragEnd={(event) => handleDragEnd(event, parentDevice)}
                        >
                          <SortableContext
                            items={sensors.map(s => s.metadata.sensor_id)}
                            strategy={rectSortingStrategy}
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3">
                              {sensors.map((data) => {
                                const isError = isSensorError(data.metadata.sensor_id, data.value, sensorValueMap);
                                return (
                                  <SortableSensorCard
                                    key={data.metadata.sensor_id}
                                    id={data.metadata.sensor_id}
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
                              })}
                            </div>
                          </SortableContext>
                        </DndContext>
                      </div>

                      {/* Device-specific Widgets */}
                      <div className="lg:col-span-1 flex flex-col gap-4">
                        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                          <h3 className="text-xs font-semibold text-gray-400 mb-2">🧠 AI Health</h3>
                          <AIHealthStatusWidget 
                            companyName={currentUser?.role === 'superadmin' ? selectedCompany : undefined} 
                            sensorData={deviceSensorData}
                          />
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                          <RecentAlertsWidget 
                            companyName={currentUser?.role === 'superadmin' ? selectedCompany : undefined}
                            sensorIdsForDevice={deviceSensorIds as string[]}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  </SortableDeviceGroup>
                );
              })}
                  </div>
                </SortableContext>
              </DndContext>
            );
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