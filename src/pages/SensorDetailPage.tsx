import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getSensorHistory, listThresholds, getCurrentUser, listSensors, updateSensor, getLatestSensorData, getAlertHistory, markAlertAsRead } from '../services/apiService';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { DataPoint, ThresholdConfig, Alert } from '../types/types';
import { resolveHwKey } from '../types/types';
import { ThresholdModal } from '../components/ThresholdModal';
import type { ValueType, NameType, Payload } from 'recharts/types/component/DefaultTooltipContent';
import { isSensorError, getSensorDisplayValue } from '../utils/sensorUtils';

const FilterIcon = () => (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
    </svg>
);

const DownloadIcon = () => (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

const LiveIcon = () => (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const dateToDateTimeLocalString = (date: Date | null): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

interface SensorDetailPageProps {
    sensorId: string;
    sensorName: string;
    sensorType: string;
    unit: string;
    companyName?: string;
    companyId?: string;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: Payload<ValueType, NameType>[];
    label?: string | number;
    unit: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, unit }) => {
    if (active && payload && payload.length) {
        // Find the main value payload
        const valuePayload = payload.find(p => p.dataKey === 'value') || payload[0];
        const data = valuePayload.payload; // Access the original data point
        
        const hasMinMax = data.min !== undefined && data.max !== undefined && (data.min !== data.value || data.max !== data.value);

        return (
            <div className="bg-gray-700 p-3 border border-gray-600 rounded shadow-lg">
                <p className="text-gray-300 text-sm mb-1">{`${new Date(label as number).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`}</p>
                <p className="font-semibold" style={{ color: valuePayload.color }}>
                    {`${valuePayload.name}: ${(valuePayload.value as number).toFixed(4)} ${unit}`}
                </p>
                {hasMinMax && (
                    <div className="text-xs mt-1 text-gray-400">
                        <p>Range: {data.min.toFixed(4)} - {data.max.toFixed(4)} {unit}</p>
                    </div>
                )}
            </div>
        );
    }
    return null;
};

export const SensorDetailPage: React.FC<SensorDetailPageProps> = ({
    sensorId,
    sensorName,
    sensorType,
    unit,
    companyName,
}) => {
    const [historyData, setHistoryData] = useState<DataPoint[]>([]);
    const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showThresholdModal, setShowThresholdModal] = useState(false);
    const [thresholds, setThresholds] = useState<ThresholdConfig | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [sensorMetadata, setSensorMetadata] = useState<any>(null);
    const [scenario, setScenario] = useState('indoor_small');
    const [latestContext, setLatestContext] = useState<Record<string, number>>({});
    
    // Time Filter States
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [filterApplied, setFilterApplied] = useState(false);
    const [activeQuickFilter, setActiveQuickFilter] = useState<number | null>(null);
    const currentValue = historyData.length > 0 ? historyData[historyData.length - 1].value : null;
    const isError = currentValue !== null ? isSensorError(sensorId, currentValue, latestContext) : false;

    // Ref to hold the actual functional sensor_id (in case the URL ID is a Mongo ID)
    const effectiveSensorIdRef = React.useRef(sensorId); // Default to prop

    // Use fetched metadata preferred, fallback to props
    const displayTitle = sensorMetadata?.sensor_name || sensorName;
    const displayType = sensorMetadata?.sensor_type === 'Temperature' ? 'DHT11 Temperature' :
        (sensorMetadata?.sensor_name || sensorType);

    // Robust hardware key resolution:
    // 1. Try resolving from metadata or prop type
    // 2. If that fails (returns simple unit/name), try resolving from sensorId (which usually contains keys like mq3, dht11)
    let displayHwKey = resolveHwKey(sensorMetadata?.sensor_type || sensorType);
    const validKeys = ['dht11_temp', 'dht11_hum', 'scd40', 'mq4', 'mq7', 'mq3', 'mq135', 'mq9', 'bh1750'];

    if (!validKeys.includes(displayHwKey)) {
        const fromId = resolveHwKey(sensorId);
        if (validKeys.includes(fromId)) {
            displayHwKey = fromId;
        }
    }

    const filterAppliedRef = useRef(false);
    useEffect(() => {
        filterAppliedRef.current = filterApplied;
    }, [filterApplied]);

    useEffect(() => {
        effectiveSensorIdRef.current = sensorId; // Reset on prop change
        loadData();

        // Auto-refresh sensor history every 3 seconds ONLY if no filter applied
        const sensorIntervalId = setInterval(() => {
            if (!filterAppliedRef.current) {
                loadSensorHistory();
            }
        }, 3000);

        // Auto-refresh active alerts every 30 seconds
        const alertIntervalId = setInterval(() => loadActiveAlerts(), 30000);

        return () => {
            clearInterval(sensorIntervalId);
            clearInterval(alertIntervalId);
        };
    }, [sensorId, companyName]);

    const loadData = async () => {
        setLoading(true);
        // Fetch metadata first as it's needed for thresholds
        const metadata = await loadSensorMetadata();

        let currentScenario = scenario;
        if (metadata?.scenario) {
            currentScenario = metadata.scenario;
            setScenario(currentScenario);
        }

        await Promise.all([loadSensorHistory(), loadActiveAlerts(), loadThresholds(metadata, currentScenario), loadUser(), loadLatestContext()]);
        setLoading(false);
    };

    const loadActiveAlerts = async () => {
        try {
            const targetId = effectiveSensorIdRef.current || sensorId;
            const alerts = await getAlertHistory({
                sensor_id: targetId,
                is_resolved: false,
                target_company_name: companyName
            });
            // Client-side deduping if necessary, but API should handle it. Only show unresolved.
            setActiveAlerts(alerts);
        } catch (err) {
            console.error('Failed to load active alerts', err);
        }
    };

    const handleMarkAsRead = async (alertId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card clicks if any
        try {
            await markAlertAsRead(alertId);
            // Optimistic update
            setActiveAlerts(prev => prev.map(a => a._id === alertId ? { ...a, is_read: true } : a));
        } catch (err) {
            console.error('Failed to mark alert as read', err);
        }
    };

    const loadLatestContext = async () => {
        try {
            const data = await getLatestSensorData(companyName);
            const map: Record<string, number> = {};
            data.forEach((d: any) => map[d.metadata.sensor_id] = d.value);
            setLatestContext(map);
        } catch (err) {
            console.error('Failed to load latest context', err);
        }
    };

    const loadSensorMetadata = async () => {
        try {
            // Backend does not support GET /sensors/{id} (405 error), 
            // so we list all sensors and find the one we need.
            const allSensors = await listSensors(companyName); // Pass companyName to optimize if possible, or empty

            // Try to find by functional ID first, then by Mongo _id
            const meta = allSensors.find((s: any) => s.sensor_id === sensorId || s._id === sensorId);

            if (meta) {
                setSensorMetadata(meta);
                effectiveSensorIdRef.current = meta.sensor_id; // Capture functional ID
                return meta;
            }
            console.warn('Sensor not found in list:', sensorId);
            return null;
        } catch (err) {
            console.error('Failed to load sensor metadata', err);
            return null;
        }
    };

    const loadUser = async () => {
        try {
            const user = await getCurrentUser();
            setCurrentUser(user);
        } catch (err) {
            console.error('Failed to load user', err);
        }
    };


    const loadThresholds = async (metadata?: any, overrideScenario?: string) => {
        try {
            const currentScenario = overrideScenario || scenario;
            const configs = await listThresholds(currentScenario);
            const hwKey = resolveHwKey(metadata?.sensor_type || sensorMetadata?.sensor_type || sensorType);

            // Find effective threshold (specific to THIS company or global)
            const matches = configs.filter(c => c.sensor_type === hwKey);

            // Priority:
            // 1. Threshold for the sensor's company
            // 2. Global threshold (company_id is null/undefined)
            // Note: For superadmins viewing other companies, we must use the sensor's company_id, 
            // not the currentUser's company_id.
            const sensorCompanyId = metadata?.company_id || sensorMetadata?.company_id;
            const custom = matches.find(c => c.company_id === sensorCompanyId);
            const global = matches.find(c => !c.company_id);

            setThresholds(custom || global || null);
        } catch (err) {
            console.error('Failed to load thresholds for graph', err);
        }
    };

    const loadSensorHistory = async (overrideStart?: Date | null, overrideEnd?: Date | null) => {
        try {
            // Use the authoritative functional ID if resolved, otherwise the prop
            const targetId = effectiveSensorIdRef.current || sensorId;
            const sTime = overrideStart !== undefined ? overrideStart : startDate;
            const eTime = overrideEnd !== undefined ? overrideEnd : endDate;
            
            const history = await getSensorHistory(
                'sensor_id', 
                targetId, 
                (sTime || eTime) ? 500 : 100, // Safely fetch more data for ranges
                companyName,
                sTime ? sTime.toISOString() : undefined,
                eTime ? eTime.toISOString() : undefined
            );

            const transformedData: DataPoint[] = history.map((item: any) => {
                const utcTimestamp = item.timestamp.endsWith('Z') ? item.timestamp : item.timestamp + 'Z';
                return {
                    timestamp: item.timestamp,
                    value: item.value,
                    min: item.min !== undefined ? item.min : item.value,
                    max: item.max !== undefined ? item.max : item.value,
                    alarm: false,
                    time: new Date(utcTimestamp),
                };
            });

            setHistoryData(transformedData);
            setError(null);
        } catch (err) {
            console.error('Failed to load sensor history:', err);
            setError(err instanceof Error ? err.message : 'Failed to load sensor data');
        } finally {
            setLoading(false);
        }
    };


    const handleQuickFilter = (minutes: number) => {
        const end = new Date();
        const start = new Date(end.getTime() - minutes * 60 * 1000);
        setEndDate(end);
        setStartDate(start);
        setActiveQuickFilter(minutes);
        setFilterApplied(true);
        loadSensorHistory(start, end);
        setIsFilterPanelOpen(false);
    };

    const handleApplyCustomFilter = () => {
        if (startDate || endDate) {
            setActiveQuickFilter(null);
            setFilterApplied(true);
            loadSensorHistory(startDate, endDate);
        }
        setIsFilterPanelOpen(false);
    };

    const handleClearFilter = () => {
        setStartDate(null);
        setEndDate(null);
        setFilterApplied(false);
        setActiveQuickFilter(null);
        setIsFilterPanelOpen(false);
        loadSensorHistory(null, null);
    };

    const handleDownloadData = () => {
        if (historyData.length === 0) {
            alert("No data available to download.");
            return;
        }
        const jsonString = JSON.stringify(historyData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sensor_data_${sensorId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const startDateString = useMemo(() => dateToDateTimeLocalString(startDate), [startDate]);
    const endDateString = useMemo(() => dateToDateTimeLocalString(endDate), [endDate]);

    const handleScenarioChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newScenario = e.target.value;
        setScenario(newScenario);

        try {
            // Prepare full payload to satisfy PUT requirement
            // We use 'null' for missing thresholds, not 0, to denote 'no threshold'
            const fullUpdatePayload = {
                ...sensorMetadata,
                scenario: newScenario,
                custom_threshold_warning_max: sensorMetadata?.custom_threshold_warning_max ?? null,
                custom_threshold_critical_max: sensorMetadata?.custom_threshold_critical_max ?? null,
                custom_threshold_warning_min: sensorMetadata?.custom_threshold_warning_min ?? null,
                custom_threshold_critical_min: sensorMetadata?.custom_threshold_critical_min ?? null,
            };

            // Clean up internal fields that shouldn't be sent back
            delete fullUpdatePayload._id;
            delete fullUpdatePayload.created_at;

            await updateSensor(sensorId, fullUpdatePayload);

            // Reload thresholds for the new scenario
            await loadThresholds(sensorMetadata, newScenario);
        } catch (err) {
            console.error('Failed to update sensor scenario', err);
        }
    };

    const handleBackToDashboard = () => {
        window.location.hash = '#/';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-xl">Loading sensor data...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <button
                onClick={handleBackToDashboard}
                className="mb-6 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
                <span>←</span> Back to Dashboard
            </button>

            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">{displayTitle}</h1>
                        <p className="text-gray-400 mb-1">Sensor ID: {sensorId}</p>
                        <p className="text-gray-400">Type: {displayType}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2 mb-2 flex-wrap justify-end">
                            <button
                                onClick={() => setIsFilterPanelOpen(prev => !prev)}
                                className={`px-3 py-1.5 font-semibold rounded-lg transition-colors flex items-center justify-center text-sm ${filterApplied ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'}`}
                            >
                                <FilterIcon />
                                <span>{filterApplied ? 'Filter Active' : 'Time Range'}</span>
                            </button>
                            {filterApplied && (
                                <button
                                    onClick={handleClearFilter}
                                    className="px-3 py-1.5 font-semibold rounded-lg bg-green-600 hover:bg-green-700 text-white flex items-center justify-center text-sm"
                                >
                                    <LiveIcon />
                                    <span>Live</span>
                                </button>
                            )}
                            <button
                                onClick={handleDownloadData}
                                className="px-3 py-1.5 bg-gray-700 text-gray-200 font-semibold rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center text-sm"
                            >
                                <DownloadIcon />
                                <span>Download</span>
                            </button>
                        </div>
                        <div className={`text-3xl font-semibold ${isError ? 'text-red-500 animate-pulse' : ''}`}>
                            {getSensorDisplayValue(currentValue, isError)}
                            {!isError && <span className="text-md ml-1 text-gray-400">{unit}</span>}
                        </div>
                        {currentUser?.role !== 'viewer' && (
                            <button
                                onClick={() => setShowThresholdModal(true)}
                                className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-600/50 rounded-lg text-sm transition-all duration-200 flex items-center gap-2"
                            >
                                ⚙️ Configure Threshold
                            </button>
                        )}
                    </div>
                </div>


                {/* Filter Panel */}
                <div className={`bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 mb-6 border border-gray-700 overflow-hidden transition-all duration-300 ease-in-out ${isFilterPanelOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 !p-0 !mb-0'}`}>
                    <h4 className="text-lg font-semibold text-gray-200 mb-4">Filter by Time Range</h4>
                    <div className="mb-4">
                        <p className="text-sm text-gray-400 mb-2">Quick Ranges</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                                { label: 'Last 15m', minutes: 15 },
                                { label: 'Last 1h', minutes: 60 },
                                { label: 'Last 6h', minutes: 360 },
                                { label: 'Last 24h', minutes: 1440 },
                            ].map(({ label, minutes }) => (
                                <button key={minutes} onClick={() => handleQuickFilter(minutes)} className={`w-full text-center px-3 py-2 text-sm rounded-md transition-colors ${activeQuickFilter === minutes ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'}`}>
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div>
                        <p className="text-sm text-gray-400 mb-2">Custom Range</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="startDate" className="block mb-1 text-xs font-medium text-gray-300">Start Time</label>
                                <input
                                    type="datetime-local"
                                    id="startDate"
                                    value={startDateString}
                                    onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                                    className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5"
                                    style={{colorScheme: 'dark'}}
                                />
                            </div>
                            <div>
                                <label htmlFor="endDate" className="block mb-1 text-xs font-medium text-gray-300">End Time</label>
                                <input
                                    type="datetime-local"
                                    id="endDate"
                                    value={endDateString}
                                    onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                                    className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5"
                                    style={{colorScheme: 'dark'}}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-700 flex justify-end gap-3">
                        <button
                            onClick={handleClearFilter}
                            className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Clear Filter
                        </button>
                        <button
                            onClick={handleApplyCustomFilter}
                            className="px-4 py-2 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors"
                        >
                            Apply Custom Filter
                        </button>
                    </div>
                </div>

                {filterApplied && (
                    <div className="bg-gray-800 border border-blue-500/50 rounded-lg p-3 mb-6 text-sm">
                        <p className="font-semibold text-blue-300">
                            Filter Active <span className="ml-2 text-yellow-400">(Live updates paused)</span>
                        </p>
                        <p className="text-gray-400 mt-1">
                            Showing data from <span className="font-medium text-gray-300">{startDate ? startDate.toLocaleString() : 'the beginning'}</span> to <span className="font-medium text-gray-300">{endDate ? endDate.toLocaleString() : 'now'}</span>.
                        </p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <div className="bg-gray-800 rounded-lg p-6 shadow-lg min-h-[600px]">

                    {/* Active Alerts Banner */}
                    {activeAlerts.length > 0 && (
                        <div className="mb-4 space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                            {activeAlerts.map(alert => (
                                <div
                                    key={alert._id}
                                    className={`p-4 rounded-lg border grid grid-cols-[auto_1fr_auto] gap-4 items-center ${alert.alert_type === 'critical'
                                        ? 'bg-red-900/20 border-red-500/30 text-red-200'
                                        : 'bg-amber-900/20 border-amber-500/30 text-amber-200'
                                        }`}
                                >
                                    <span className={`text-2xl ${alert.alert_type === 'critical' ? 'animate-pulse' : ''}`}>
                                        {alert.alert_type === 'critical' ? '🚨' : '⚠️'}
                                    </span>

                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-sm uppercase tracking-wide">
                                                {alert.alert_type} ALERT
                                            </span>
                                            {alert.is_read && (
                                                <span className="text-[10px] bg-gray-700/80 px-1.5 py-0.5 rounded text-gray-300 uppercase tracking-wider">
                                                    Read
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm font-medium opacity-90">{alert.message}</div>
                                        <div className="text-xs opacity-60 mt-1 font-mono">
                                            {new Date(alert.timestamp.endsWith('Z') ? alert.timestamp : alert.timestamp + 'Z').toLocaleString()}
                                        </div>
                                    </div>

                                    {!alert.is_read ? (
                                        <button
                                            onClick={(e) => handleMarkAsRead(alert._id, e)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-95 whitespace-nowrap ${alert.alert_type === 'critical'
                                                ? 'bg-red-600 hover:bg-red-500 text-white'
                                                : 'bg-amber-600 hover:bg-amber-500 text-white'
                                                }`}
                                        >
                                            Mark as Read
                                        </button>
                                    ) : (
                                        <div className="w-[88px]"></div> // Spacer to keep layout consistent if needed, or just nothing
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {historyData.length > 0 ? (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-cyan-400">{sensorName} - {filterApplied ? 'Historical Data' : 'Real-Time Data'}</h2>
                                {currentUser?.role !== 'viewer' && (
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-gray-400">Environment:</span>
                                        <select
                                            value={scenario}
                                            onChange={handleScenarioChange}
                                            className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white"
                                        >
                                            <option value="indoor_small">Indoor Small</option>
                                            <option value="indoor_large">Indoor Large</option>
                                            <option value="outdoor">Outdoor</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div style={{ width: '100%', height: '520px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart
                                        data={historyData.map((point: DataPoint) => ({
                                            time: point.time ? point.time.getTime() : new Date(point.timestamp).getTime(),
                                            value: point.value,
                                            minMax: [point.min !== undefined ? point.min : point.value, point.max !== undefined ? point.max : point.value],
                                            min: point.min,
                                            max: point.max
                                        }))}
                                        margin={{ top: 5, right: 30, left: 70, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                                        <XAxis
                                            dataKey="time"
                                            type="number"
                                            scale="time"
                                            domain={['dataMin', 'dataMax']}
                                            stroke="#A0AEC0"
                                            tickFormatter={(unixTime) => new Date(unixTime).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                        />
                                        <YAxis
                                            stroke="#A0AEC0"
                                            width={90}
                                            label={{ value: unit, angle: -90, position: 'left', fill: '#A0AEC0', offset: 10 }}
                                            tickFormatter={(value) => value.toFixed(4)}
                                            domain={['auto', 'auto']}
                                        />
                                        <Tooltip content={<CustomTooltip unit={unit} />} />
                                        <Legend />

                                        {/* Threshold Reference Lines */}
                                        {thresholds?.warning_min != null && (
                                            <ReferenceLine y={thresholds.warning_min} stroke="#ECC94B" strokeDasharray="5 5" label={{ value: 'Warn Min', position: 'right', fill: '#ECC94B', fontSize: 10 }} />
                                        )}
                                        {thresholds?.warning_max != null && (
                                            <ReferenceLine y={thresholds.warning_max} stroke="#ECC94B" strokeDasharray="5 5" label={{ value: 'Warn Max', position: 'right', fill: '#ECC94B', fontSize: 10 }} />
                                        )}
                                        {thresholds?.critical_min != null && (
                                            <ReferenceLine y={thresholds.critical_min} stroke="#F56565" strokeDasharray="3 3" label={{ value: 'Crit Min', position: 'right', fill: '#F56565', fontSize: 10 }} />
                                        )}
                                        {thresholds?.critical_max != null && (
                                            <ReferenceLine y={thresholds.critical_max} stroke="#F56565" strokeDasharray="3 3" label={{ value: 'Crit Max', position: 'right', fill: '#F56565', fontSize: 10 }} />
                                        )}
                                        
                                        {/* Area for min/max range */}
                                        <Area 
                                            type="monotone" 
                                            dataKey="minMax" 
                                            fill="#4FD1C5" 
                                            fillOpacity={0.15} 
                                            stroke="none" 
                                            name="Range (Min-Max)"
                                            isAnimationActive={false}
                                        />
                                        
                                        {/* Main average line */}
                                        <Line
                                            type="monotone"
                                            dataKey="value"
                                            name={`${sensorName} (Avg)`}
                                            stroke="#4FD1C5"
                                            strokeWidth={3}
                                            dot={false}
                                            isAnimationActive={false}
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500 text-lg">
                            No data available for this sensor
                        </div>
                    )}
                </div>
            </div>

            <ThresholdModal
                isOpen={showThresholdModal}
                onClose={() => setShowThresholdModal(false)}
                sensorId={sensorId}
                sensorName={displayTitle}
                sensorType={displayHwKey}
                companyId={sensorMetadata?.company_id || currentUser?.company_id || undefined}
                scenario={scenario}
                onSuccess={() => loadThresholds()}
            />
        </div>
    );
};
