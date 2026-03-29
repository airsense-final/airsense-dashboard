import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { WidgetWrapper } from './WidgetWrapper.tsx';

interface GaugeWidgetProps {
    title: string;
    value: number;
    max: number;
    unit: string;
    threshold?: number;
}

export const GaugeWidget: React.FC<GaugeWidgetProps> = ({ title, value, max, unit, threshold }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    const data = [{ name: 'value', value: percentage }];

    const isOverThreshold = threshold !== undefined && value > threshold;
    const fill = isOverThreshold ? '#F56565' : '#4FD1C5';

    return (
        <WidgetWrapper title={title} className="min-h-[300px]">
            <div className="relative w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                        innerRadius="70%"
                        outerRadius="100%"
                        data={data}
                        startAngle={180}
                        endAngle={0}
                        barSize={30}
                    >
                        <PolarAngleAxis
                            type="number"
                            domain={[0, 100]}
                            angleAxisId={0}
                            tick={false}
                        />
                        <RadialBar
                            background
                            dataKey="value"
                            angleAxisId={0}
                            fill={fill}
                            cornerRadius={15}
                        />
                    </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold" style={{ color: fill }}>{value.toFixed(1)}</span>
                    <span className="text-lg text-gray-400 light:text-gray-500">{unit}</span>
                </div>
            </div>
        </WidgetWrapper>
    );
};