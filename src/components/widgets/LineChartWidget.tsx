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
            <div className="bg-gray-700 p-2 border border-gray-600 rounded">
                <p className="label">{`${new Date(label as number).toLocaleString()}`}</p>
                <p className="intro" style={{ color: payload[0].color }}>{`${payload[0].name} : ${(payload[0].value as number).toFixed(2)} ${unit}`}</p>
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

    const chart = (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart
                data={chartData}
                margin={compact ? { top: 5, right: 10, left: 0, bottom: 0 } : { top: 5, right: 20, left: 40, bottom: 5 }}>

                {!compact && <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />}

                <XAxis
                    dataKey="time"
                    type="number"
                    scale="time"
                    domain={xAxisDomain}
                    stroke="#A0AEC0"
                    tickFormatter={(unixTime) => {
                        // Display time in user's local timezone for better readability
                        return new Date(unixTime).toLocaleString(undefined, {
                            hour: 'numeric',
                            minute: '2-digit',
                        });
                    }}
                    tickCount={compact ? 3 : undefined}
                    tick={compact ? { fontSize: 10 } : undefined}
                    height={compact ? 20 : undefined}
                    allowDataOverflow={!!filterApplied} // Allow zooming in strictly on data if filtered
                />
                <YAxis
                    stroke="#A0AEC0"
                    unit={compact ? undefined : unit}
                    width={compact ? 45 : undefined}
                    tickCount={compact ? 4 : undefined}
                    tick={compact ? { fontSize: 10, dx: -2 } : undefined}
                    tickFormatter={compact ? undefined : (value) => value.toFixed(1)}
                    domain={yAxisDomain}
                />

                {!compact && <Tooltip content={<CustomTooltip unit={unit} />} />}
                {!compact && <Legend />}

                <Line
                    type="monotone"
                    dataKey="value"
                    name={displayName}
                    stroke="#4FD1C5"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    connectNulls={true} // This connects the dots if there are missing timestamps in a sequence
                />

                {threshold !== undefined && !compact && (
                    <ReferenceLine y={threshold} label={{ value: `Threshold`, position: 'insideTopRight', fill: '#F56565' }} stroke="#F56565" strokeDasharray="3 3" />
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