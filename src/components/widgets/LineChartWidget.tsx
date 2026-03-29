import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { ValueType, NameType, Payload } from 'recharts/types/component/DefaultTooltipContent';
import { WidgetWrapper } from './WidgetWrapper.tsx';
import type { DataPoint } from '../../types/types';

interface LineChartWidgetProps {
    title: string;
    metric: string;
    data: DataPoint[];
    threshold?: number;
    unit: string;
    compact?: boolean;
    filterApplied?: boolean;
    startDate?: Date;
    endDate?: Date;
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
            <div className="bg-gray-700 light:bg-gray-100 p-2 border border-gray-600 light:border-gray-300 rounded">
                <p className="label">{`${new Date(label as number).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`}</p>
                <p className="intro" style={{ color: payload[0].color }}>{`${payload[0].name} : ${(payload[0].value as number).toFixed(4)} ${unit}`}</p>
            </div>
        );
    }
    return null;
};

export const LineChartWidget: React.FC<LineChartWidgetProps> = ({ title, metric, data, threshold, unit, compact = false, filterApplied, startDate, endDate }) => {
    const chartData = useMemo(() => {
        if (!data) return [];
        return data.map(point => ({
            ...point,
            time: point.time ? point.time.getTime() : new Date(point.timestamp).getTime(),
        }));
    }, [data]);

    const xAxisDomain = useMemo((): [number | string, number | string] => {
        // If a filter is applied, we try to respect the user's selected range.
        if (filterApplied) {
            // Ensure we have valid timestamps. If startDate is missing, we use dataMin.
            const domainStart = (startDate && !isNaN(startDate.getTime())) ? startDate.getTime() : 'dataMin';
            const domainEnd = (endDate && !isNaN(endDate.getTime())) ? endDate.getTime() : 'dataMax';
            return [domainStart, domainEnd];
        }

        // Default behavior: domain is determined by the data itself.
        return ['dataMin', 'dataMax'];
    }, [filterApplied, startDate, endDate]);

    const yAxisDomain = useMemo((): [number | string, number | string] => {
        if (!data || data.length < 1) return [0, 'auto'];

        const values = data.map(p => p.value);
        const min = Math.min(...values);
        const max = Math.max(...values);

        if (min === max) {
            // Handle case with a single data point or all same values
            return [Math.max(0, min - 1), max + 1];
        }

        const range = max - min;
        const buffer = range * 0.1; // Using a 10% buffer for better spacing

        const domainMin = Math.max(0, min - buffer);
        const domainMax = max + buffer;

        return [domainMin, domainMax];
    }, [data]);

    const displayName = typeof metric === 'string' ? metric.replace(/_/g, ' ') : 'Value';

    const isLight = document.body.classList.contains('light-mode');
    const chartColor = isLight ? "#155e75" : "#22d3ee"; // Matching text-cyan-800 and text-cyan-400
    const gridColor = isLight ? "#e5e7eb" : "#4A5568"; // Gray-200 and Gray-700
    const axisColor = isLight ? "#4b5563" : "#A0AEC0"; // Gray-600 and Gray-400

    const chart = (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart
                data={chartData}
                margin={compact ? { top: 5, right: 10, left: 0, bottom: 0 } : { top: 5, right: 20, left: 40, bottom: 5 }}>

                {!compact && <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />}

                <XAxis
                    dataKey="time"
                    type="number"
                    scale="time"
                    domain={xAxisDomain}
                    stroke={axisColor}
                    tickFormatter={(unixTime) => new Date(unixTime).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                    tickCount={compact ? 3 : undefined}
                    tick={compact ? { fontSize: 9 } : { fontSize: 10, fontWeight: 'bold' }}
                    height={compact ? 18 : undefined}
                    allowDataOverflow={!!filterApplied} // Allow zooming in strictly on data if filtered
                />
                <YAxis
                    stroke={axisColor}
                    unit={compact ? undefined : unit}
                    width={compact ? 70 : undefined}
                    tickCount={compact ? 3 : undefined}
                    tick={compact ? { fontSize: 9, dx: -2 } : { fontSize: 10, fontWeight: 'bold' }}
                    tickFormatter={(value) => value.toFixed(compact ? 2 : 4)}
                    domain={yAxisDomain}
                />

                {!compact && <Tooltip content={<CustomTooltip unit={unit} />} />}
                {!compact && <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />}

                <Line
                    type="monotone"
                    dataKey="value"
                    name={displayName}
                    stroke={chartColor}
                    strokeWidth={compact ? 2 : 3}
                    dot={false}
                    isAnimationActive={false}
                    connectNulls={true} // This connects the dots if there are missing timestamps in a sequence
                />

                {threshold !== undefined && !compact && (
                    <ReferenceLine y={threshold} label={{ value: `Threshold`, position: 'insideTopRight', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} stroke="#ef4444" strokeDasharray="3 3" />
                )}
            </LineChart>
        </ResponsiveContainer>
    );

    if (compact) {
        if (!chartData || chartData.length === 0) {
            return (
                <div className="flex items-center justify-center h-full text-gray-500">
                    Waiting for data...
                </div>
            );
        }
        return chart;
    }

    let content;
    if (!chartData || chartData.length === 0) {
        content = (
            <div className="flex items-center justify-center h-full text-gray-500">
                {filterApplied ? 'No data found in this range' : 'Waiting for data...'}
            </div>
        );
    } else {
        content = (
            <div className="w-full h-full flex flex-col">
                <div className="flex-grow">
                    {chart}
                </div>
            </div>
        );
    }

    return (
        <WidgetWrapper title={title} className="col-span-1 md:col-span-2 min-h-[300px]">
            {content}
        </WidgetWrapper>
    );
};