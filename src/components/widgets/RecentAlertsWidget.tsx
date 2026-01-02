import React, { useState, useEffect } from 'react';
import { getLatestAlerts } from '../../services/apiService';
import type { Alert } from '../../types/types';

interface RecentAlertsWidgetProps {
    companyName?: string;
}

export const RecentAlertsWidget: React.FC<RecentAlertsWidgetProps> = ({ companyName }) => {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                // Fetch only active alerts (is_resolved=false)
                const data = await getLatestAlerts(companyName, false);
                setAlerts(data);
            } catch (err) {
                console.error('Failed to load recent alerts', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAlerts();
        const intervalId = setInterval(fetchAlerts, 30000); // Poll every 30s
        return () => clearInterval(intervalId);
    }, [companyName]);

    const handleViewHistory = () => {
        window.location.hash = '#/alerts/history';
    };

    if (loading) {
        return <div className="animate-pulse bg-gray-800 rounded-lg h-64"></div>;
    }

    return (
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="text-red-500">🔔</span> Recent Active Alerts
                </h3>
                {alerts.length > 0 && (
                    <span className="bg-red-900/50 text-red-200 text-xs px-2 py-1 rounded-full border border-red-500/30 font-mono">
                        {alerts.length} Active
                    </span>
                )}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                        <span className="text-3xl mb-2">✅</span>
                        <p className="text-sm">No active alerts</p>
                    </div>
                ) : (
                    alerts.map(alert => (
                        <div
                            key={alert._id}
                            className={`p-3 rounded-lg border-l-4 text-sm relative group transition-all ${alert.alert_type === 'critical'
                                ? 'bg-red-900/20 border-red-500'
                                : 'bg-amber-900/20 border-amber-500'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`font-bold ${alert.alert_type === 'critical' ? 'text-red-400' : 'text-amber-400'
                                    }`}>
                                    {alert.alert_type.toUpperCase()}
                                </span>
                                <span className="text-gray-500 text-xs">
                                    {new Date(alert.timestamp.endsWith('Z') ? alert.timestamp : alert.timestamp + 'Z').toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <div className="font-medium text-gray-200 mb-1">
                                {alert.sensor_type} ({alert.value.toFixed(2)} {alert.unit})
                            </div>
                            <p className="text-gray-400 text-xs line-clamp-2" title={alert.message}>
                                {alert.message}
                            </p>
                            <div className="mt-2 text-xs text-gray-500 flex justify-between items-center">
                                <span>{alert.company_name}</span>
                                {/* Optional: Link to sensor detail */}
                                <a href={`#/sensor/?id=${alert.sensor_id}&name=${encodeURIComponent(alert.sensor_type)}&type=${encodeURIComponent(alert.sensor_type)}&unit=${encodeURIComponent(alert.unit)}&company=${encodeURIComponent(alert.company_name)}`} className="text-cyan-400 hover:underline">
                                    View Sensor →
                                </a>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-700 text-center">
                <button
                    onClick={handleViewHistory}
                    className="text-sm text-cyan-400 hover:text-cyan-300 font-medium hover:underline flex items-center justify-center gap-1 w-full"
                >
                    View Alert History <span>→</span>
                </button>
            </div>
        </div>
    );
};
