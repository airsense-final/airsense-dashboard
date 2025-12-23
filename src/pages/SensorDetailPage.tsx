import React, { useState, useEffect } from 'react';
import { getSensorHistory } from '../services/apiService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { DataPoint } from '../types/types';
import type { ValueType, NameType, Payload } from 'recharts/types/component/DefaultTooltipContent';

interface SensorDetailPageProps {
    sensorId: string;
    sensorName: string;
    sensorType: string;
    unit: string;
    companyName?: string;
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
                <p className="text-gray-300 text-sm mb-1">{`${new Date(label as number).toLocaleString()}`}</p>
                <p className="font-semibold" style={{ color: payload[0].color }}>
                    {`${payload[0].name}: ${(payload[0].value as number).toFixed(2)} ${unit}`}
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

    useEffect(() => {
        loadSensorHistory();

        // Auto-refresh every 3 seconds
        const intervalId = setInterval(loadSensorHistory, 3000);
        return () => clearInterval(intervalId);
    }, [sensorId, companyName]);

    const loadSensorHistory = async () => {
        try {
            const history = await getSensorHistory('sensor_id', sensorId, 100, companyName);

            const transformedData: DataPoint[] = history.map((item: any) => ({
                timestamp: item.timestamp,
                value: item.value,
                alarm: false,
                time: new Date(item.timestamp),
            }));

            console.log('Loaded sensor history:', transformedData.length, 'points');
            setHistoryData(transformedData);
            setError(null);
        } catch (err) {
            console.error('Failed to load sensor history:', err);
            setError(err instanceof Error ? err.message : 'Failed to load sensor data');
        } finally {
            setLoading(false);
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
                <h1 className="text-3xl font-bold mb-2">{sensorName}</h1>
                <p className="text-gray-400 mb-1">Sensor ID: {sensorId}</p>
                <p className="text-gray-400 mb-6">Type: {sensorType}</p>

                {error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <div className="bg-gray-800 rounded-lg p-6 shadow-lg" style={{ height: '600px' }}>
                    {historyData.length > 0 ? (
                        <>
                            <h2 className="text-xl font-semibold mb-4">{sensorName} - Real-Time Data</h2>
                            <div style={{ width: '100%', height: '520px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={historyData.map(point => ({
                                            time: point.time ? point.time.getTime() : new Date(point.timestamp).getTime(),
                                            value: point.value,
                                        }))}
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                                        <XAxis
                                            dataKey="time"
                                            type="number"
                                            scale="time"
                                            domain={['dataMin', 'dataMax']}
                                            stroke="#A0AEC0"
                                            tickFormatter={(unixTime) => {
                                                return new Date(unixTime).toLocaleString(undefined, {
                                                    hour: 'numeric',
                                                    minute: '2-digit',
                                                });
                                            }}
                                        />
                                        <YAxis
                                            stroke="#A0AEC0"
                                            label={{ value: unit, angle: -90, position: 'insideLeft', fill: '#A0AEC0' }}
                                            tickFormatter={(value) => value.toFixed(1)}
                                        />
                                        <Tooltip content={<CustomTooltip unit={unit} />} />
                                        <Legend />
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
        </div>
    );
};
