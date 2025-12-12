import React from 'react';
import type { User } from '../../types/types';

interface HeaderProps {
    user: User | null;
    onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
    return (
        <header className="bg-gray-800/50 backdrop-blur-sm sticky top-0 z-20 p-4 shadow-md flex justify-between items-center border-b border-gray-700">
            <div className="flex items-center space-x-6">
                <a href="#/" className="text-2xl font-bold text-cyan-400 hover:text-cyan-300 transition-colors">
                    <h1>AirSense Dashboard</h1>
                </a>
                
                {/* Navigation links only visible to authenticated users */}
                {user && (
                    <nav className="flex space-x-4">
                        <a 
                            href="#/" 
                            className="text-gray-300 hover:text-cyan-400 transition-colors px-3 py-2 rounded-lg hover:bg-gray-700/50"
                        >
                            Dashboard
                        </a>
                        <a 
                            href="#/test-simulation" 
                            className="text-gray-300 hover:text-cyan-400 transition-colors px-3 py-2 rounded-lg hover:bg-gray-700/50 flex items-center space-x-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                            </svg>
                            <span>Test Simulation</span>
                        </a>
                    </nav>
                )}
            </div>
            
            {/* User Profile and Logout */}
            <div className="flex items-center space-x-4">
                {user && (
                    <>
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-medium text-white">{user.full_name}</div>
                            <div className="text-xs text-gray-400 uppercase">{user.role}</div>
                        </div>
                        <button 
                            onClick={onLogout}
                            className="text-gray-400 hover:text-red-400 transition-colors"
                            title="Logout"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </>
                )}
            </div>
        </header>
    );
};