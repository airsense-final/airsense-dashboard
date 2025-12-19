import React, { useState } from 'react';
import type { Sensor, WebSocketMessage, SensorDataHistory, SensorCreate } from '../types/types';
// import { AddSensorModal } from '../components/AddSensorModal.tsx';
// import { DeleteSensorsModal } from '../components/DeleteSensorsModal';
import { LineChartWidget } from '../components/widgets/LineChartWidget';

interface DashboardPageProps {
    sensors: Sensor[];
    latestData: Record<string, WebSocketMessage | null>;
    onSensorSelect: (sensor: Sensor) => void;
    globalAlarmState: Record<string, boolean>;
    dataHistory: SensorDataHistory;
    onAddSensor: (sensorData: SensorCreate) => Promise<void>;
    onDeleteSensors: (sensorIds: string[]) => Promise<void>;
}

const SENSOR_PRIMARY_METRIC: Record<string, { metric: string, unit: string }> = {
    dht11: { metric: 'temperature', unit: '°C' },
    mq3: { metric: 'alcohol_level', unit: 'ppm' },
    mq4: { metric: 'methane_level', unit: 'ppm' },
    mq7: { metric: 'co_level', unit: 'ppm' },
    mq135: { metric: 'air_quality', unit: 'ppm' },
    scd40: { metric: 'co2', unit: 'ppm' },
    mq9: { metric: 'flammable_gas', unit: 'ppm' },
};

const SensorCard: React.FC<{
    sensor: Sensor;
    latestData: WebSocketMessage | null;
    isAlarming: boolean;
    onSelect: () => void;
    history: SensorDataHistory;
}> = ({ sensor, latestData, isAlarming, onSelect, history }) => {

    const primaryMetricInfo = SENSOR_PRIMARY_METRIC[sensor.type];
    const latestValue = primaryMetricInfo && latestData?.type === 'new_sensor_data' && latestData.data ? (latestData.data as Record<string, number>)[primaryMetricInfo.metric] : undefined;
    const chartHistory = primaryMetricInfo ? history[primaryMetricInfo.metric]?.[sensor.sensor_id] || [] : [];

    const statusColor = isAlarming ? 'border-red-500' : 'border-gray-700 hover:border-cyan-400';
    const statusDotColor = isAlarming ? 'bg-red-500' : (latestData ? 'bg-green-500' : 'bg-gray-500');

    return (
        <div
            onClick={onSelect}
            className={`bg-gray-800 rounded-lg p-4 shadow-lg cursor-pointer transition-all duration-200 border-2 ${statusColor} flex flex-col`}
        >
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-bold truncate">{sensor.description || sensor.sensor_id}</h3>
                    <p className="text-sm text-gray-400 capitalize">{sensor.type.toUpperCase()}</p>
                </div>
                <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${statusDotColor} ${isAlarming ? 'animate-pulse' : ''}`}></div>
            </div>

            <div className="mt-4 h-24 flex-grow">
                {latestData && primaryMetricInfo ? (
                    <LineChartWidget
                        title=""
                        metric={primaryMetricInfo.metric}
                        data={chartHistory}
                        unit={primaryMetricInfo.unit}
                        compact={true}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        No recent data
                    </div>
                )}
            </div>

            {primaryMetricInfo && (
                <div className="mt-4 text-center">
                    <span className="text-3xl font-semibold">
                        {latestValue !== undefined ? latestValue.toFixed(1) : '--'}
                    </span>
                    <span className="text-md ml-1 text-gray-400">{primaryMetricInfo.unit}</span>
                </div>
            )}
        </div>
    );
};


export const DashboardPage: React.FC<DashboardPageProps> = ({
    sensors,
    latestData,
    onSensorSelect,
    globalAlarmState,
    dataHistory,
    onAddSensor,
    onDeleteSensors
}) => {
    // const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    // const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    return (
        <div>
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h2 className="text-3xl font-bold">Dashboard Overview</h2>
                {/* <div className="flex gap-3">
                    <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="px-5 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                    >
                        🗑️ Delete Sensors
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-5 py-2.5 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors"
                    >
                        + Add Sensor
                    </button>
                </div> */}
            </div>

            {sensors.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {sensors.map(sensor => (
                        <SensorCard
                            key={sensor.sensor_id}
                            sensor={sensor}
                            latestData={latestData[sensor.sensor_id] || null}
                            isAlarming={globalAlarmState[sensor.sensor_id] || false}
                            onSelect={() => onSensorSelect(sensor)}
                            history={dataHistory}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-800/50 rounded-lg">
                    <h3 className="text-xl text-gray-400">No sensors have been added yet.</h3>
                    <p className="text-gray-500 mt-2">Click "Add Sensor" to get started.</p>
                </div>
            )}

            {/* <AddSensorModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSave={onAddSensor}
            />

            <DeleteSensorsModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onDelete={onDeleteSensors}
                sensors={sensors}
            /> */}
        </div>
    );
};