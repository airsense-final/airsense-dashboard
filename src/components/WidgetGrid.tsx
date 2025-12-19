import React from 'react';
import type { Sensor, WebSocketMessage, SensorDataHistory } from '../types/types';
import { StatPanelWidget } from './widgets/StatPanelWidget.tsx';
import { GaugeWidget } from './widgets/GaugeWidget';
import { LineChartWidget } from './widgets/LineChartWidget';

interface WidgetGridProps {
    sensor: Sensor;
    latestData: WebSocketMessage | null;
    dataHistory: SensorDataHistory;
    thresholds: Record<string, number>;
    filterApplied?: boolean;
    startDate?: Date;
    endDate?: Date;
}

// Configuration mapping hardware types to their specific data metrics
const SENSOR_METRICS_CONFIG: Record<string, { metric: string, unit: string, max: number }[]> = {
    dht11: [
        { metric: 'temperature', unit: '°C', max: 50 },
        { metric: 'humidity', unit: '%', max: 100 },
    ],
    mq3: [
        { metric: 'alcohol_level', unit: 'ppm', max: 1000 }, // Alcohol
    ],
    mq4: [
        { metric: 'methane_level', unit: 'ppm', max: 10000 }, // Methane (CNG)
    ],
    mq7: [
        { metric: 'co_level', unit: 'ppm', max: 2000 }, // Carbon Monoxide
    ],
    mq135: [
        { metric: 'air_quality', unit: 'ppm', max: 500 }, // General Air Quality
    ],
    scd40: [
        { metric: 'co2', unit: 'ppm', max: 5000 }, // CO2 typical range
    ],
    mq9: [
        { metric: 'flammable_gas', unit: 'ppm', max: 10000 }, // Flammable gases
    ],
};

export const WidgetGrid: React.FC<WidgetGridProps> = ({ sensor, latestData, dataHistory, thresholds, filterApplied, startDate, endDate }) => {
    const metricsConfig = SENSOR_METRICS_CONFIG[sensor.type] || [];
    const latestSensorData = (latestData?.type === 'new_sensor_data' && latestData.sensor_id === sensor.sensor_id) ? latestData.data : {};

    if (metricsConfig.length === 0) {
        return (
            <div className="text-center py-10 bg-gray-800 rounded-lg">
                <p className="text-gray-400">No metric configuration found for sensor type: {sensor.type}</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {metricsConfig.map(({ metric, unit, max }) => {
                const value = latestSensorData[metric as keyof typeof latestSensorData] as number | undefined;
                const history = dataHistory[metric]?.[sensor.sensor_id] || [];
                const threshold = thresholds[metric];

                const displayName = metric.replace(/_/g, ' ').replace('level', '').trim();

                return (
                    <React.Fragment key={metric}>
                        <StatPanelWidget
                            label={`Current ${displayName}`}
                            value={value ?? 0}
                            unit={unit}
                        />
                        <GaugeWidget
                            title={`${displayName} Level`}
                            value={value ?? 0}
                            max={max}
                            unit={unit}
                            threshold={threshold}
                        />
                        <LineChartWidget
                            title={`${displayName} History`}
                            metric={metric}
                            data={history}
                            threshold={threshold}
                            unit={unit}
                            filterApplied={filterApplied}
                            startDate={startDate}
                            endDate={endDate}
                        />
                    </React.Fragment>
                );
            })}
        </div>
    );
};