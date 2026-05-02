import React, { useState, useEffect, useRef } from 'react';
import { getCompanies, getDashboardSummary, getLatestAlerts, listSensors } from '../services/apiService';
import type { Sensor, LatestSensorData, User, Company, DataPoint, Alert, UsageStats } from '../types/types';
import { LineChartWidget } from '../components/widgets/LineChartWidget';
import { RecentAlertsWidget } from '../components/widgets/RecentAlertsWidget';
import { AIHealthStatusWidget } from '../components/widgets/AIHealthStatusWidget';
import { isSensorError, getSensorDisplayValue } from '../utils/sensorUtils';
import { useWebSocket } from '../hooks/useWebSocket';
import DigitalTwinButton from '../components/DigitalTwinButton';
import { SubscriptionUsageWidget } from '../components/widgets/SubscriptionUsageWidget';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
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
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 cursor-move p-2 bg-cyan-600 light:bg-cyan-800/20 hover:bg-cyan-600 light:bg-cyan-800/40 rounded transition-colors z-10 border border-cyan-500 light:border-cyan-700/30"
        title="Drag to reorder device"
      >
        <svg aria-hidden="true" className="w-4 h-4 text-cyan-400 light:text-cyan-800" fill="currentColor" viewBox="0 0 16 16">
          <path d="M5 3h2v2H5V3zm4 0h2v2H9V3zM5 7h2v2H5V7zm4 0h2v2H9V7zm-4 4h2v2H5v-2zm4 0h2v2H9v-2z"/>
        </svg>
      </div>
      {children}
    </div>
  );
};

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
  let statusColor = 'border-gray-700 hover:border-cyan-400 light:border-cyan-600';
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
    statusColor = 'border-red-500 light:border-red-700';
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
      className={`bg-gray-800 rounded-lg shadow-md transition-all duration-200 border ${statusColor} flex flex-col cursor-pointer hover:shadow-lg hover:scale-[1.02] p-2 sm:p-3 relative h-full light:bg-white`}
    >
      {dragHandleProps && (
        <div
          {...dragHandleProps}
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-1 left-1 cursor-move p-1 bg-gray-700/50 light:bg-gray-200/50 hover:bg-gray-600 light:hover:bg-gray-300 rounded transition-colors z-10 border border-gray-600 light:border-gray-300 hidden sm:block"
          title="Drag to reorder"
        >
          <svg aria-hidden="true" className="w-3 h-3 text-gray-300 light:text-gray-700 light:text-gray-600" fill="currentColor" viewBox="0 0 16 16">
            <path d="M5 3h2v2H5V3zm4 0h2v2H9V3zM5 7h2v2H5V7zm4 0h2v2H9V7zm-4 4h2v2H5v-2zm4 0h2v2H9v-2z"/>
          </svg>
        </div>
      )}
      <div className="flex justify-between items-start mb-1 sm:mb-2">
        <div className="flex-1 min-w-0 pr-1 sm:pr-2">
          <h3 className="font-semibold truncate text-[10px] sm:text-sm">{sensor.sensor_name}</h3>
          <p className="text-gray-500 truncate text-[8px] sm:text-[10px]">{sensor.sensor_id}</p>
        </div>
        <div className={`rounded-full flex-shrink-0 ${statusDotColor} w-2 h-2 sm:w-2.5 sm:h-2.5 mt-1`}></div>
      </div>

      <div className="h-10 sm:h-16 mb-1 sm:mb-2">
        {historyData.length > 0 ? (
          <LineChartWidget
            title=""
            metric="value"
            data={historyData}
            unit={unit}
            compact={true}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-[8px] sm:text-[10px]">
            No data
          </div>
        )}
      </div>

      <div className="mt-auto text-center">
        <span className="font-bold text-base sm:text-lg md:text-xl">
          {getSensorDisplayValue(latestValue, !!isError)}
        </span>
        {!isError && <span className="ml-0.5 text-gray-400 light:text-gray-500 text-[8px] sm:text-xs">{unit}</span>}
      </div>
    </div>
  );
});

export const DashboardPage: React.FC<DashboardPageProps> = ({ currentUser }) => {
  const [sensorData, setSensorData] = useState<LatestSensorData[]>([]);
  const [sensorHistory, setSensorHistory] = useState<Record<string, DataPoint[]>>({});
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
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
  
  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const deviceDndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  
  const { lastMessage, isConnected } = useWebSocket();
  const selectedCompanyRef = useRef(selectedCompany);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (lastMessage && lastMessage.type === 'SENSOR_UPDATE') {
      const data = lastMessage.data;
      if (currentUser?.role === 'superadmin' && selectedCompany && data.company_name !== selectedCompany) {
        return;
      }

      const timestamp = data.timestamp || new Date().toISOString();
      const updates: LatestSensorData[] = [];
      const ignoreKeys = ['timestamp', 'sensor_id', 'device_id', 'status', 'company_name'];

      Object.entries(data.values).forEach(([key, value]) => {
        if (ignoreKeys.includes(key) || typeof value !== 'number') return;
        
        // Strip trailing hardware index (e.g., _1) to match DB logic
        const parts = key.split('_');
        const baseKey = (parts.length > 1 && !isNaN(parseInt(parts[parts.length - 1]))) 
          ? parts.slice(0, -1).join('_') 
          : key;

        const uniqueId = data.company_name ? `${data.company_name}_${data.device_id}_${baseKey}` : `${data.device_id}_${baseKey}`;
        
        updates.push({
          _id: uniqueId,
          timestamp: timestamp,
          value: value as number,
          status: 'active',
          metadata: {
            sensor_id: uniqueId,
            parent_device: data.device_id,
            type: baseKey,
            unit: ''
          }
        });
      });

      setSensorData(prevData => {
        const newData = [...prevData];
        updates.forEach(update => {
          const index = newData.findIndex(d => d.metadata.sensor_id === update.metadata.sensor_id);
          if (index !== -1) {
            newData[index] = {
              ...newData[index],
              value: update.value,
              timestamp: update.timestamp,
              status: update.status
            };
          } else {
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
    if (currentUser?.role === 'superadmin') {
      loadInitialData();
    }
    loadSensorMap();
  }, [selectedCompany, currentUser]);

  useEffect(() => {
    const historyIntervalId = setInterval(() => {
      loadSensorData();
    }, 3000);
    return () => clearInterval(historyIntervalId);
  }, [selectedCompany, currentUser]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (currentUser?.role === 'superadmin') {
        const companiesData = await getCompanies();
        setCompanies(companiesData);
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
      setAllSensors(sensors);
    } catch (err) {
      console.error('Failed to load sensor map', err);
    }
  };

  const loadSensorData = async () => {
    if (isFetchingRef.current) return;
    
    // Prevent 401 errors when polling after token expiration
    const token = localStorage.getItem('iot_dashboard_access_token');
    if (!token) return;

    const currentCompany = selectedCompanyRef.current;

    try {
      isFetchingRef.current = true;
      const companyName = currentUser?.role === 'superadmin' ? currentCompany : undefined;
      const response = await getDashboardSummary(companyName);
      
      const summaryData = response.summary;
      setUsageStats(response.usage_stats);

      if (currentUser?.role === 'superadmin' && selectedCompanyRef.current !== currentCompany) {
        return;
      }

      const latestDataFormatted: LatestSensorData[] = summaryData.map((item: any) => ({
        _id: item.sensor_id,
        timestamp: item.latest_timestamp || new Date().toISOString(),
        value: item.latest_value ?? 0,
        status: item.status,
        metadata: {
          sensor_id: item.sensor_id,
          parent_device: item.parent_device_id || "Unknown Device",
          type: item.sensor_name,
          unit: item.unit
        }
      }));

      const historyMap: Record<string, DataPoint[]> = {};
      summaryData.forEach((item: any) => {
        historyMap[item.sensor_id] = item.history.map((h: any) => {
          const ts = h.timestamp.endsWith('Z') ? h.timestamp : h.timestamp + 'Z';
          return {
            timestamp: h.timestamp,
            value: h.value,
            alarm: false,
            time: new Date(ts)
          };
        });
      });

      setSensorData(latestDataFormatted);
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
      setActiveAlerts(alertsData);
    } catch (err) {
      console.error('Failed to auto-refresh alerts', err);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('sensor_order');
    if (stored) try { setSensorOrder(JSON.parse(stored)); } catch { /* ignore error */ }
    const storedDevices = localStorage.getItem('device_order');
    if (storedDevices) try { setDeviceOrder(JSON.parse(storedDevices)); } catch { /* ignore error */ }
  }, []);

  useEffect(() => {
    if (Object.keys(sensorOrder).length > 0) localStorage.setItem('sensor_order', JSON.stringify(sensorOrder));
  }, [sensorOrder]);

  useEffect(() => {
    if (deviceOrder.length > 0) localStorage.setItem('device_order', JSON.stringify(deviceOrder));
  }, [deviceOrder]);

  useEffect(() => {
    if (sensorData.length === 0) return;
    const uniqueMap: Record<string, typeof sensorData[0]> = {};
    sensorData.forEach(d => {
      const sid = d.metadata.sensor_id;
      if (!uniqueMap[sid] || new Date(d.timestamp) > new Date(uniqueMap[sid].timestamp)) uniqueMap[sid] = d;
    });
    const uniqueSensorData = Object.values(uniqueMap);
    const groupedByDevice: Record<string, typeof uniqueSensorData> = {};
    uniqueSensorData.forEach(data => {
      const parentDevice = data.metadata.parent_device || 'Unknown Device';
      if (!groupedByDevice[parentDevice]) groupedByDevice[parentDevice] = [];
      groupedByDevice[parentDevice].push(data);
    });
    const deviceKeys = Object.keys(groupedByDevice).sort();
    setDeviceOrder(prev => {
      const matching = prev.filter(id => groupedByDevice[id]);
      if (prev.length === 0 || matching.length === 0) return deviceKeys;
      if (matching.length < deviceKeys.length) {
        const newDevices = deviceKeys.filter(dk => !prev.includes(dk));
        return [...matching, ...newDevices];
      }
      return prev;
    });
    setSensorOrder(prev => {
      const next = { ...prev };
      let changed = false;
      Object.keys(groupedByDevice).forEach(device => {
        if (!next[device]) {
          next[device] = groupedByDevice[device].map(s => s.metadata.sensor_id);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [sensorData]);

  const handleDragEnd = (event: any, deviceId: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSensorOrder((prev) => {
      const currentOrder = prev[deviceId] || [];
      const oldIndex = currentOrder.indexOf(active.id as string);
      const newIndex = currentOrder.indexOf(over.id as string);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return { ...prev, [deviceId]: arrayMove(currentOrder, oldIndex, newIndex) };
    });
  };

  const handleDeviceDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setDeviceOrder((prev) => {
      const oldIndex = prev.indexOf(active.id as string);
      const newIndex = prev.indexOf(over.id as string);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 light:bg-gray-50 text-white light:text-gray-900 p-4 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-cyan-500 light:border-cyan-700 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-lg text-cyan-400 light:text-cyan-800 font-medium">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-1 sm:px-2 md:px-4 py-2 sm:py-4 md:py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8 bg-gray-800/20 p-4 rounded-2xl border border-gray-700/30 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white light:text-gray-900 tracking-tight">Dashboard</h2>
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-gray-500 light:text-gray-600 uppercase tracking-wider">Last Update:</span>
                <p className="text-[10px] sm:text-xs font-mono text-cyan-400/90 light:text-cyan-800 font-bold">
                  {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              </div>
              {isConnected && (
                <span className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-semibold text-green-400 light:text-green-800 bg-green-400/5 px-2 py-0.5 rounded-full border border-green-400/10">
                  <span className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></span>
                  Live
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            
            
            {/* NEW: Usage Widget */}
            {currentUser && usageStats && (
              (() => {
                const activeCompany = companies.find(c => c.name === selectedCompany) || companies.find(c => c._id === currentUser.company_id);
                const displayTier = currentUser.role === 'superadmin' && activeCompany ? activeCompany.tier || 'starter' : currentUser.company_tier || 'starter';
                const maxU = displayTier === 'enterprise' ? 50 : displayTier === 'mid' ? 25 : 10;
                const maxD = displayTier === 'enterprise' ? 100 : displayTier === 'mid' ? 10 : 1;
                
                return (
                  <div className="w-32 sm:w-48 lg:w-64 flex-shrink-0">
                    <SubscriptionUsageWidget 
                      currentUsers={usageStats.user_count}
                      maxUsers={maxU}
                      currentDevices={usageStats.device_count}
                      maxDevices={maxD}
                      tier={displayTier}
                    />
                  </div>
                );
              })()
            )}
          </div>
        </div>

        {currentUser?.role === 'superadmin' && companies.length > 0 && (
          <div className="w-full sm:w-auto flex items-center gap-3 bg-gray-900/50 light:bg-gray-100/50 p-2 pl-4 rounded-xl border border-gray-700 light:border-gray-200 shadow-lg">
            <label className="text-[10px] sm:text-xs font-semibold text-gray-400 light:text-gray-500 uppercase tracking-wider">Organization</label>
            <select
              value={selectedCompany}
              onChange={(e) => {
                const newValue = e.target.value;
                setSelectedCompany(newValue);
                localStorage.setItem('dashboard_selected_company', newValue);
              }}
              className="flex-1 sm:flex-none px-4 py-2 bg-gray-800 light:bg-white text-white light:text-gray-900 border border-gray-700 light:border-gray-200 rounded-lg focus:ring-1 focus:ring-cyan-500/50 text-xs sm:text-sm font-medium appearance-none cursor-pointer hover:bg-gray-750 transition-colors outline-none"
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
        <div className="bg-red-900/20 border border-red-500 light:border-red-700/50 text-red-200 px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
          <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* NEW: Subscription Limit Banner */}
      {currentUser && usageStats && (
        (() => {
          const activeCompany = companies.find(c => c.name === selectedCompany) || companies.find(c => c._id === currentUser.company_id);
          const displayTier = currentUser.role === 'superadmin' && activeCompany ? activeCompany.tier || 'starter' : currentUser.company_tier || 'starter';
          
          if (displayTier === 'enterprise') return null;

          const maxU = displayTier === 'mid' ? 25 : 10;
          const maxD = displayTier === 'mid' ? 10 : 1;
          const isLimitReached = usageStats.user_count >= maxU || usageStats.device_count >= maxD;
          
          if (!isLimitReached) return null;

          return (
            <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-2xl mb-8 flex items-center justify-between group animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-500 animate-pulse">
                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-orange-400">Subscription Limit Reached</h4>
                  <p className="text-xs text-orange-400/70">You have reached the maximum allowed {usageStats.device_count >= maxD ? 'devices' : 'users'} for your <b>{displayTier}</b> plan.</p>
                </div>
              </div>
              <a href="mailto:airsense.notification@gmail.com" className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black rounded-lg transition-all active:scale-95 shadow-lg shadow-orange-900/20 uppercase tracking-tighter">
                Upgrade Plan
              </a>
            </div>
          );
        })()
      )}

      {sensorData.length > 0 ? (
        <div className="space-y-8">
          {(() => {
            const sensorValueMap: Record<string, number> = {};
            sensorData.forEach(d => { sensorValueMap[d.metadata.sensor_id] = d.value; });

            const alertStatusMap: Record<string, 'critical' | 'warning'> = {};
            const alertsBySensor: Record<string, Alert[]> = {};
            activeAlerts.forEach(alert => {
              if (!alert.is_resolved) {
                const readableId = sensorIdMap[alert.sensor_id] || alert.sensor_id;
                if (!alertsBySensor[readableId]) alertsBySensor[readableId] = [];
                alertsBySensor[readableId].push(alert);
              }
            });

            Object.keys(alertsBySensor).forEach(sensorId => {
              const sortedAlerts = alertsBySensor[sensorId].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
              if (sortedAlerts.length > 0) {
                const latest = sortedAlerts[0];
                alertStatusMap[sensorId] = latest.alert_type === 'critical' ? 'critical' : 'warning';
              }
            });

            const uniqueSensorData = Object.values(sensorData.reduce((acc, data) => {
              const sensorId = data.metadata.sensor_id;
              if (!acc[sensorId] || new Date(data.timestamp) > new Date(acc[sensorId].timestamp)) acc[sensorId] = data;
              return acc;
            }, {} as Record<string, typeof sensorData[0]>));

            const groupedByDevice: Record<string, typeof uniqueSensorData> = {};
            uniqueSensorData.forEach(data => {
              const parentDevice = data.metadata.parent_device || 'Unknown Device';
              if (!groupedByDevice[parentDevice]) groupedByDevice[parentDevice] = [];
              groupedByDevice[parentDevice].push(data);
            });

            Object.keys(groupedByDevice).forEach(device => {
              const customOrder = sensorOrder[device];
              if (customOrder && customOrder.length > 0) {
                groupedByDevice[device].sort((a, b) => {
                  const indexA = customOrder.indexOf(a.metadata.sensor_id);
                  const indexB = customOrder.indexOf(b.metadata.sensor_id);
                  if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                  if (indexA !== -1) return -1;
                  if (indexB !== -1) return 1;
                  return a.metadata.sensor_id.localeCompare(b.metadata.sensor_id);
                });
              } else {
                groupedByDevice[device].sort((a, b) => a.metadata.sensor_id.localeCompare(b.metadata.sensor_id));
              }
            });

            const deviceKeys = Object.keys(groupedByDevice).sort();
            const matchingDevices = deviceOrder.filter(deviceId => groupedByDevice[deviceId]);
            const effectiveDeviceOrder = matchingDevices.length > 0 ? deviceOrder.filter(id => groupedByDevice[id]) : deviceKeys;
            const sortedDeviceEntries = effectiveDeviceOrder.length > 0
              ? effectiveDeviceOrder.map(deviceId => [deviceId, groupedByDevice[deviceId]] as [string, typeof uniqueSensorData])
              : Object.entries(groupedByDevice).sort(([deviceA], [deviceB]) => deviceA.localeCompare(deviceB));

            return (
              <DndContext sensors={deviceDndSensors} collisionDetection={closestCenter} onDragEnd={handleDeviceDragEnd}>
                <SortableContext items={effectiveDeviceOrder.length > 0 ? effectiveDeviceOrder : deviceKeys} strategy={rectSortingStrategy}>
                  <div className="space-y-6 sm:space-y-10">
                    {sortedDeviceEntries.map(([parentDevice, sensors]) => {
                      const deviceSensorData = sensorData.filter(d => d.metadata.parent_device === parentDevice);
                      const sensorIdsReadable = sensors.map(s => s.metadata.sensor_id);
                      const deviceSensorIds = allSensors.filter(s => sensorIdsReadable.includes(s.sensor_id)).map(s => s._id).filter((id): id is string => Boolean(id));

                      return (
                        <SortableDeviceGroup key={parentDevice} id={parentDevice}>
                          <div className="bg-gray-800/20 rounded-2xl border border-gray-700/50 p-3 sm:p-4 md:p-6 shadow-xl backdrop-blur-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
                              <div className="flex items-center gap-3 sm:gap-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cyan-500 light:bg-cyan-700/10 rounded-xl flex items-center justify-center border border-cyan-500 light:border-cyan-700/20 shadow-inner">
                                  <span className="text-xl sm:text-2xl">🔌</span>
                                </div>
                                <div>
                                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-white light:text-gray-900 tracking-tight">{parentDevice}</h2>
                                  <p className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-cyan-400 light:text-cyan-800 uppercase tracking-widest">{sensors.length} sensor{sensors.length !== 1 ? 's' : ''} active</p>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col xl:flex-row gap-4 sm:gap-6">
                              <div className="flex-grow">
                                <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={(event: DragEndEvent) => handleDragEnd(event, parentDevice)}>
                                  <SortableContext items={sensors.map(s => s.metadata.sensor_id)} strategy={rectSortingStrategy}>
                                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
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

                              <div className="w-full xl:w-80 flex flex-col sm:flex-row xl:flex-col gap-4">
                                <div className="flex-1 bg-gray-900/50 light:bg-gray-100/50 rounded-xl p-4 border border-gray-700/50">
                                  <div className="flex items-center gap-2 mb-4">
                                    <div className="w-1.5 h-1.5 bg-cyan-500 light:bg-cyan-700 rounded-full"></div>
                                    <h3 className="text-[10px] font-bold text-gray-400 light:text-gray-500 uppercase tracking-widest">AI Status</h3>
                                  </div>
                                  <AIHealthStatusWidget 
                                    companyName={currentUser?.role === 'superadmin' ? selectedCompany : undefined} 
                                    sensorData={deviceSensorData}
                                  />
                                </div>
                                <div className="flex-1 bg-gray-900/50 light:bg-gray-100/50 rounded-xl p-4 border border-gray-700/50">
                                  <div className="flex items-center gap-2 mb-4">
                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                    <h3 className="text-[10px] font-bold text-gray-400 light:text-gray-500 uppercase tracking-widest">Recent Alerts</h3>
                                  </div>
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
        <div className="text-center py-24 bg-gray-800/20 rounded-3xl border border-gray-700/50 border-dashed">
          <div className="w-20 h-20 bg-gray-800 light:bg-white rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white light:text-gray-900">No sensor data</h3>
          <p className="text-gray-500 mt-2 max-w-xs mx-auto text-sm font-medium">
            {currentUser?.role === 'superadmin' && !selectedCompany
              ? 'Please select a company to monitor live air quality data.'
              : 'Waiting for devices to connect and transmit sensor readings...'}
          </p>
        </div>
      )}
      {/* SABİT DIGITAL TWIN BUTONU (FLOATING) */}
      <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 hover:scale-105 transition-transform duration-300 shadow-2xl shadow-cyan-500/20 rounded-full">
        <DigitalTwinButton 
          role={currentUser?.role}
          company={currentUser?.company_name || selectedCompany}
          tier={(() => {
            const activeCompany = companies.find(c => c.name === selectedCompany) || companies.find(c => c._id === currentUser?.company_id);
            return currentUser?.role === 'superadmin' && activeCompany ? activeCompany.tier || 'starter' : currentUser?.company_tier || 'starter';
          })()}
        />
      </div>
      
    </div>
  );
};
