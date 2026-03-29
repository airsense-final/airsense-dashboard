import React from 'react';

interface StatPanelWidgetProps {
    label: string;
    value: string | number;
    unit?: string;
    icon?: React.ReactNode;
    color?: string;
}

export const StatPanelWidget: React.FC<StatPanelWidgetProps> = ({
    label,
    value,
    unit = '',
    icon,
    color = 'text-cyan-400 light:text-cyan-800'
}) => {
    return (
        <div className="bg-gray-800 light:bg-white rounded-lg p-4 shadow-lg">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm text-gray-400 light:text-gray-500 mb-1">{label}</p>
                    <p className={`text-2xl font-bold ${color}`}>
                        {value} {unit && <span className="text-sm ml-1">{unit}</span>}
                    </p>
                </div>
                {icon && (
                    <div className={`text-3xl ${color} opacity-50`}>
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
};
