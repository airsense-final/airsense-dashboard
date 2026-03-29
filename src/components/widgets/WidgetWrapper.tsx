import React from 'react';

interface WidgetWrapperProps {
    title: string;
    children: React.ReactNode;
    className?: string;
}

export const WidgetWrapper: React.FC<WidgetWrapperProps> = ({ title, children, className = '' }) => {
    return (
        <div className={`bg-gray-800 rounded-lg p-4 shadow-lg ${className} light:bg-white`}>
            <h3 className="text-lg font-semibold mb-3 text-gray-200 light:text-gray-800">{title}</h3>
            <div className="w-full h-full">
                {children}
            </div>
        </div>
    );
};
