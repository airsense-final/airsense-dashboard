import React from 'react';

export const Header: React.FC = () => {
    return (
        <header className="bg-gray-800/50 backdrop-blur-sm sticky top-0 z-20 p-4 shadow-md flex justify-between items-center border-b border-gray-700">
            <div className="flex items-center space-x-6">
                <a href="#/" className="text-2xl font-bold text-cyan-400 hover:text-cyan-300 transition-colors">
                    <h1>AirSense Dashboard</h1>
                </a>
            </div>
            
            {}
            <div></div> 
        </header>
    );
};