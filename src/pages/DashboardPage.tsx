import React from 'react';

export const DashboardPage: React.FC = () => {
    return (
        <div className="text-center py-20">
            <div className="bg-gray-800 p-10 rounded-lg inline-block shadow-lg border border-gray-700">
                <h2 className="text-3xl font-bold text-white mb-4">Dashboard Overview</h2>
                <p className="text-gray-400">Sensor data will appear here.</p>
                <div className="mt-6">
                    <span className="text-cyan-500 animate-pulse">Waiting for data...</span>
                </div>
            </div>
        </div>
    );
};