import React, { useState, useEffect } from 'react';
import { getLatestAlerts, listSensors } from '../../services/apiService';
import type { Alert } from '../../types/types';

interface RecentAlertsWidgetProps {
    companyName?: string;
    parentDeviceId?: string; // Optional filter for specific device
    sensorIdsForDevice?: string[]; // Sensor IDs that belong to this device
}

export const RecentAlertsWidget: React.FC<RecentAlertsWidgetProps> = ({ companyName, parentDeviceId: _parentDeviceId, sensorIdsForDevice }) => {
    void _parentDeviceId; // reserved for future use
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [sensorMap, setSensorMap] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchSensors = async () => {
            try {
                const sensors = await listSensors(companyName);
                const map: Record<string, string> = {};
                sensors.forEach((s: any) => {
                    if (s._id) {
                        map[s._id] = s.sensor_name || s.sensor_id;
                    }
                    // Also map by sensor_id since alerts might use sensor_id instead of _id
                    if (s.sensor_id) {
                        map[s.sensor_id] = s.sensor_name || s.sensor_id;
                    }
                });
                setSensorMap(map);
            } catch (err) {
                console.error('Failed to load sensors for map', err);
            }
        };

        const fetchAlerts = async () => {
            try {
                // Fetch only active alerts (is_resolved=false)
                let data = await getLatestAlerts(companyName, false);
                
                console.log('🔔 All alerts:', data.length);
                
                // Filter by sensor IDs if provided (more reliable than parent_device_id lookup)
                if (sensorIdsForDevice && sensorIdsForDevice.length > 0) {
                    console.log('🔍 Filtering for sensor IDs:', sensorIdsForDevice);
                    console.log('📋 Alert sensor IDs:', data.map(a => a.sensor_id));
                    
                    const sensorIdSet = new Set(sensorIdsForDevice);
                    data = data.filter(alert => sensorIdSet.has(alert.sensor_id));
                    
                    console.log('✅ Filtered alerts:', data.length);
                }
                
                setAlerts(data);
            } catch (err) {
                console.error('Failed to load recent alerts', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSensors();
        fetchAlerts();
        const intervalId = setInterval(fetchAlerts, 30000); // Poll every 30s
        return () => clearInterval(intervalId);
    }, [companyName, sensorIdsForDevice]);

    const handleViewHistory = () => {
        window.location.hash = '#/alerts/history';
    };

    if (loading) {
        return <div className="animate-pulse bg-gray-800/50 light:bg-gray-200/50 rounded-xl h-full min-h-[250px] w-full"></div>;
    }

    return (
        <div className="h-full flex flex-col min-h-[250px]">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-white light:text-gray-900 flex items-center gap-1">
                    <span className="text-red-500 text-sm">🔔</span> Active Alerts
                </h3>
                {alerts.length > 0 && (
                    <span className="bg-red-900/50 light:bg-red-100 text-red-200 text-[10px] px-1.5 py-0.5 rounded-full border border-red-500 light:border-red-700/30 font-mono">
                        {alerts.length}
                    </span>
                )}
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar max-h-64">
                {alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-20 text-gray-500">
                        <span className="text-xl mb-1">✅</span>
                        <p className="text-[10px]">No alerts</p>
                    </div>
                ) : (
                    alerts.slice(0, 5).map(alert => (
                        <div
                            key={alert._id}
                            className={`p-2 rounded-lg border-l-2 text-xs relative group transition-all ${
                                alert.sensor_type === 'ml_system'
                                    ? 'bg-purple-900/20 light:bg-purple-100 border-purple-500 light:border-purple-700' 
                                    : alert.alert_type === 'critical'
                                        ? 'bg-red-900/20 border-red-500 light:border-red-700'
                                        : 'bg-amber-900/20 light:bg-amber-100 border-amber-500 light:border-amber-700'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`font-bold flex items-center gap-1 text-[10px] ${
                                    alert.sensor_type === 'ml_system' 
                                        ? 'text-purple-400 light:text-purple-800' 
                                        : alert.alert_type === 'critical' 
                                            ? 'text-red-400 light:text-red-800' 
                                            : 'text-amber-400 light:text-amber-800'
                                    }`}>
                                    {alert.sensor_type === 'ml_system' && <span>🧠</span>}
                                    {alert.sensor_type === 'ml_system' ? 'AI' : alert.alert_type.toUpperCase()}
                                </span>
                                <span className="text-gray-500 text-[9px]">
                                    {new Date(alert.timestamp.endsWith('Z') ? alert.timestamp : alert.timestamp + 'Z').toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <div className="font-medium text-gray-200 light:text-gray-800 mb-0.5 text-[10px] truncate">
                                {alert.sensor_type === 'ml_system' ? 'System' : (sensorMap[alert.sensor_id] || alert.sensor_type)}
                            </div>
                            <p className="text-gray-400 light:text-gray-500 text-[9px] line-clamp-1" title={alert.message}>
                                {alert.message}
                            </p>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-2 pt-2 border-t border-gray-700 light:border-gray-200 text-center">
                <button
                    onClick={handleViewHistory}
                    className="text-[10px] text-cyan-400 light:text-cyan-800 hover:text-cyan-300 font-medium hover:underline flex items-center justify-center gap-1 w-full"
                >
                    View All <span>→</span>
                </button>
            </div>
        </div>
    );
};
