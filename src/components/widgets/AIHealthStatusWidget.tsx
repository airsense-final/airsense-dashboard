import React, { useState, useEffect } from 'react';
import { getLatestAlerts } from '../../services/apiService';
import type { Alert, LatestSensorData } from '../../types/types';

interface AIHealthStatusWidgetProps {
    companyName?: string;
    sensorData?: LatestSensorData[]; // Sensör verilerini al
}

export const AIHealthStatusWidget: React.FC<AIHealthStatusWidgetProps> = ({ companyName, sensorData = [] }) => {
    const [status, setStatus] = useState<'NORMAL' | 'ANOMALY'>('NORMAL');
    const [lastAnomaly, setLastAnomaly] = useState<Alert | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAIStatus = async () => {
            try {
                // Fetch only active alerts (is_resolved=false)
                const alerts = await getLatestAlerts(companyName, false);
                
                // Check if any alert comes from the ML System
                // Backend saves it as alert_type='critical' but sensor_type='ml_system'
                const anomaly = alerts.find(a => a.sensor_type === 'ml_system');
                
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
        const interval = setInterval(checkAIStatus, 10000); // Check every 10 seconds
        return () => clearInterval(interval);
    }, [companyName]);

    // --- SMART SUGGESTION LOGIC ---
    const generateSmartSuggestions = () => {
        const suggestions: string[] = [];

        // Analyze sensor data
        const temp = sensorData.find(s => s.metadata.type.includes('Temp') || s.metadata.sensor_id.includes('dht11_temp'));
        const co2 = sensorData.find(s => s.metadata.type.includes('CO2') || s.metadata.sensor_id.includes('scd40'));
        const gas = sensorData.find(s => s.metadata.type.includes('Methane') || s.metadata.sensor_id.includes('mq4'));
        const smoke = sensorData.find(s => s.metadata.type.includes('MQ-135') || s.metadata.sensor_id.includes('mq135'));
        
        // Malfunction Check (-999)
        const malfunction = sensorData.some(s => s.value === -999);

        if (malfunction) {
            suggestions.push("⚠️ Sensor malfunction detected. Inspect wiring.");
            suggestions.push("Check power supply unit (PSU) stability.");
            return suggestions; // Stop here if critical hardware failure
        }

        if (status === 'ANOMALY') {
            // Fire Risk
            if (temp && temp.value > 50) {
                suggestions.push("🔥 CRITICAL: High Temp! Check fire suppression systems.");
                suggestions.push("Evacuate personnel if necessary.");
            }
            // Gas Leak
            if (gas && gas.value > 200) {
                suggestions.push("⛽ GAS LEAK RISK: Close main gas valves immediately.");
                suggestions.push("Do not use electrical switches.");
            }
            // Smoke
            if (smoke && smoke.value > 50) {
                suggestions.push("💨 Smoke detected. Inspect area for combustion.");
            }
            // Poor Air Quality
            if (co2 && co2.value > 1500) {
                suggestions.push("🪟 Poor Air Quality. Activate ventilation/HVAC.");
            }
            
            // Generic Anomaly
            if (suggestions.length === 0) {
                suggestions.push("Unknown anomaly pattern detected.");
                suggestions.push("Perform full system diagnostic.");
                suggestions.push("Check raw sensor logs for noise.");
            }
        } else {
            // NORMAL STATE SUGGESTIONS
            if (co2 && co2.value > 1000) {
                suggestions.push("Air quality is moderate. Consider slight ventilation.");
            } else if (temp && temp.value > 28) {
                suggestions.push("Temperature is slightly high. Check AC settings.");
            } else {
                suggestions.push("System running optimally.");
                suggestions.push("Next scheduled maintenance: 7 days.");
            }
        }

        return suggestions;
    };

    const suggestions = generateSmartSuggestions();

    if (loading) {
        return <div className="animate-pulse bg-gray-800 rounded-lg h-32"></div>;
    }

    return (
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700 h-full relative overflow-hidden flex flex-col">
            {/* Background Effect */}
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full filter blur-3xl opacity-20 -mr-10 -mt-10 transition-colors duration-500 ${
                status === 'ANOMALY' ? 'bg-purple-500' : 'bg-green-500'
            }`}></div>

            <div className="relative z-10 flex-1 flex flex-col">
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

                <div className="mt-4 flex-1 flex flex-col justify-between">
                    {status === 'ANOMALY' ? (
                        <div>
                            <p className="text-gray-400 text-sm mb-3">The AI model has detected unusual patterns.</p>
                            
                            {/* Anomaly Detail Card */}
                            <div className="bg-purple-900/20 p-3 rounded border border-purple-500/30 mb-3">
                                <div className="text-xs text-purple-400 uppercase font-bold mb-1">Anomaly Detail</div>
                                <div className="text-white text-sm font-medium">{lastAnomaly?.message}</div>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-xs text-gray-500">Score: {lastAnomaly?.value.toFixed(4)}</span>
                                    <span className="text-xs text-gray-500">
                                        {lastAnomaly && new Date(lastAnomaly.timestamp.endsWith('Z') ? lastAnomaly.timestamp : lastAnomaly.timestamp + 'Z').toLocaleTimeString()}
                                    </span>
                                </div>
                            </div>

                            {/* Smart Suggestions */}
                            <div className="bg-gray-700/50 p-3 rounded border border-gray-600">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-yellow-400 text-lg">💡</span>
                                    <span className="text-sm font-bold text-gray-200">AI Action Plan</span>
                                </div>
                                <ul className="text-xs text-gray-300 space-y-1 list-none">
                                    {suggestions.map((s, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <span className="mt-0.5 text-yellow-500/80">➤</span>
                                            <span>{s}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <p className="text-gray-400 text-sm mb-4">Isolation Forest model is monitoring all 8 sensors in real-time. No anomalies detected.</p>
                            
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-2 flex-1 bg-gray-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 w-full animate-pulse"></div>
                                </div>
                                <span className="text-xs text-green-400 font-mono">MONITORING</span>
                            </div>

                            {/* Normal State Suggestion */}
                            <div className="bg-gray-700/30 p-3 rounded border border-gray-700/50">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-cyan-400 text-sm">ℹ️</span>
                                    <span className="text-xs font-bold text-gray-300">AI Insight</span>
                                </div>
                                <ul className="text-xs text-gray-400 space-y-1">
                                     {suggestions.map((s, idx) => (
                                        <li key={idx}>{s}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};