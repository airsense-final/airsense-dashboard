import React, { useState, useEffect } from 'react';
import { getLatestAlerts } from '../../services/apiService';
import type { Alert } from '../../types/types';

interface AIHealthStatusWidgetProps {
    companyName?: string;
}

export const AIHealthStatusWidget: React.FC<AIHealthStatusWidgetProps> = ({ companyName }) => {
    const [status, setStatus] = useState<'NORMAL' | 'ANOMALY'>('NORMAL');
    const [lastAnomaly, setLastAnomaly] = useState<Alert | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAIStatus = async () => {
            try {
                // Son aktif alarmları çek
                const alerts = await getLatestAlerts(companyName, false);
                
                // İçinde ml_anomaly var mı?
                const anomaly = alerts.find(a => a.alert_type === 'ml_anomaly');
                
                if (anomaly) {
                    setStatus('ANOMALY');
                    setLastAnomaly(anomaly);
                } else {
                    setStatus('NORMAL');
                    setLastAnomaly(null);
                }
            } catch (err) {
                console.error('Failed to check AI status', err);
            } finally {
                setLoading(false);
            }
        };

        checkAIStatus();
        const interval = setInterval(checkAIStatus, 10000); // 10 saniyede bir kontrol
        return () => clearInterval(interval);
    }, [companyName]);

    if (loading) {
        return <div className="animate-pulse bg-gray-800 rounded-lg h-32"></div>;
    }

    return (
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700 h-full relative overflow-hidden">
            {/* Arka plan efekti */}
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full filter blur-3xl opacity-20 -mr-10 -mt-10 transition-colors duration-500 ${
                status === 'ANOMALY' ? 'bg-purple-500' : 'bg-green-500'
            }`}></div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span>🧠</span> AI System Health
                    </h3>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        status === 'ANOMALY' 
                            ? 'bg-purple-900/50 text-purple-200 border-purple-500' 
                            : 'bg-green-900/50 text-green-200 border-green-500'
                    }`}>
                        {status === 'ANOMALY' ? 'ANOMALY DETECTED' : 'SYSTEM OPTIMAL'}
                    </div>
                </div>

                <div className="mt-4">
                    {status === 'ANOMALY' ? (
                        <div>
                            <p className="text-gray-400 text-sm">The AI model has detected unusual patterns.</p>
                            <div className="mt-3 bg-purple-900/20 p-3 rounded border border-purple-500/30">
                                <div className="text-xs text-purple-400 uppercase font-bold mb-1">Anomaly Detail</div>
                                <div className="text-white text-sm font-medium">{lastAnomaly?.message}</div>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-xs text-gray-500">Score: {lastAnomaly?.value.toFixed(4)}</span>
                                    <span className="text-xs text-gray-500">
                                        {lastAnomaly && new Date(lastAnomaly.timestamp.endsWith('Z') ? lastAnomaly.timestamp : lastAnomaly.timestamp + 'Z').toLocaleTimeString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <p className="text-gray-400 text-sm">Isolation Forest model is monitoring all 8 sensors in real-time. No anomalies detected.</p>
                            <div className="mt-4 flex items-center gap-3">
                                <div className="h-2 flex-1 bg-gray-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 w-full animate-pulse"></div>
                                </div>
                                <span className="text-xs text-green-400 font-mono">MONITORING</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
