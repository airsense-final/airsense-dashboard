import React, { useState, useEffect } from 'react';
import { getSensorHistory, listThresholds, getCurrentUser, listSensors, updateSensor, getLatestSensorData } from '../services/apiService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { DataPoint, ThresholdConfig } from '../types/types';
import { resolveHwKey } from '../types/types';
import { ThresholdModal } from '../components/ThresholdModal';
import type { ValueType, NameType, Payload } from 'recharts/types/component/DefaultTooltipContent';
import { isSensorError, getSensorDisplayValue } from '../utils/sensorUtils';

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
        return (
            <div className="bg-gray-700 p-3 border border-gray-600 rounded shadow-lg">
                <p className="text-gray-300 text-sm mb-1">{`${new Date(label as number).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`}</p>
                <p className="font-semibold" style={{ color: payload[0].color }}>
                    {`${payload[0].name}: ${(payload[0].value as number).toFixed(4)} ${unit}`}
                </p>
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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showThresholdModal, setShowThresholdModal] = useState(false);
    const [thresholds, setThresholds] = useState<ThresholdConfig | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [sensorMetadata, setSensorMetadata] = useState<any>(null);
    const [scenario, setScenario] = useState('indoor_small');
    const [latestContext, setLatestContext] = useState<Record<string, number>>({});
    const currentValue = historyData.length > 0 ? historyData[historyData.length - 1].value : null;
    const isError = currentValue !== null ? isSensorError(sensorId, currentValue, latestContext) : false;

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

    useEffect(() => {
        loadData();

        // Auto-refresh history every 3 seconds
        const intervalId = setInterval(loadSensorHistory, 3000);
        return () => clearInterval(intervalId);
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

        await Promise.all([loadSensorHistory(), loadThresholds(metadata, currentScenario), loadUser(), loadLatestContext()]);
        setLoading(false);
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
            const meta = allSensors.find((s: any) => s.sensor_id === sensorId);

            if (meta) {
                setSensorMetadata(meta);
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

    const loadSensorHistory = async () => {
        try {
            const history = await getSensorHistory('sensor_id', sensorId, 100, companyName);

            const transformedData: DataPoint[] = history.map((item: any) => {
                const utcTimestamp = item.timestamp.endsWith('Z') ? item.timestamp : item.timestamp + 'Z';
                return {
                    timestamp: item.timestamp,
                    value: item.value,
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


                {error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <div className="bg-gray-800 rounded-lg p-6 shadow-lg" style={{ height: '600px' }}>
                    {historyData.length > 0 ? (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-cyan-400">{sensorName} - Real-Time Data</h2>
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
                                    <LineChart
                                        data={historyData.map((point: DataPoint) => ({
                                            time: point.time ? point.time.getTime() : new Date(point.timestamp).getTime(),
                                            value: point.value,
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
                                            tickFormatter={(unixTime) => new Date(unixTime).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                                        />
                                        <YAxis
                                            stroke="#A0AEC0"
                                            width={90}
                                            label={{ value: unit, angle: -90, position: 'left', fill: '#A0AEC0', offset: 10 }}
                                            tickFormatter={(value) => value.toFixed(4)}
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
                                        <Line
                                            type="monotone"
                                            dataKey="value"
                                            name={sensorName}
                                            stroke="#4FD1C5"
                                            strokeWidth={3}
                                            dot={false}
                                            isAnimationActive={false}
                                        />
                                    </LineChart>
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
