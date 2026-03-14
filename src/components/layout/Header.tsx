import React, { useState } from 'react';
import type { User } from '../../types/types';
import { ChangePasswordModal } from '../ChangePasswordModal';

interface HeaderProps {
    isAuthed: boolean;
    onLogout: () => void;
    currentUser: User | null;
}

export const Header: React.FC<HeaderProps> = ({ isAuthed, onLogout, currentUser }) => {
    const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    if (!isAuthed || !currentUser) return null;

    const NavLinks = () => (
        <>
            <a
                href="#/"
                className="text-gray-300 hover:text-cyan-400 transition-colors px-3 py-2 rounded-lg hover:bg-gray-700/50 block md:inline-block"
                onClick={() => setIsMenuOpen(false)}
            >
                Dashboard
            </a>
            <a
                href="#/test-simulation"
                className="text-gray-300 hover:text-cyan-400 transition-colors px-3 py-2 rounded-lg hover:bg-gray-700/50 flex items-center space-x-2"
                onClick={() => setIsMenuOpen(false)}
            >
                <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                <span>Test Simulation</span>
            </a>

            {currentUser.role !== 'viewer' && (
                <a
                    href="#/admin/users"
                    className="text-gray-300 hover:text-cyan-400 transition-colors px-3 py-2 rounded-lg hover:bg-gray-700/50 flex items-center space-x-2"
                    onClick={() => setIsMenuOpen(false)}
                >
                    <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>Users</span>
                </a>
            )}
            {currentUser.role === 'superadmin' && (
                <a
                    href="#/admin/companies"
                    className="text-gray-300 hover:text-cyan-400 transition-colors px-3 py-2 rounded-lg hover:bg-gray-700/50 flex items-center space-x-2"
                    onClick={() => setIsMenuOpen(false)}
                >
                    <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>Companies</span>
                </a>
            )}
            {currentUser.role === 'superadmin' && (
                <a
                    href="#/admin/thresholds"
                    className="text-gray-300 hover:text-cyan-400 transition-colors px-3 py-2 rounded-lg hover:bg-gray-700/50 flex items-center space-x-2"
                    onClick={() => setIsMenuOpen(false)}
                >
                    <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    <span>Thresholds</span>
                </a>
            )}
            {(currentUser.role === 'superadmin' || currentUser.role === 'companyadmin') && (
                <a
                    href="#/sensors"
                    className="text-gray-300 hover:text-cyan-400 transition-colors px-3 py-2 rounded-lg hover:bg-gray-700/50 flex items-center space-x-2"
                    onClick={() => setIsMenuOpen(false)}
                >
                    <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                    <span>Sensors</span>
                </a>
            )}
            <a
                href="#/alerts/history"
                className="text-gray-300 hover:text-cyan-400 transition-colors px-3 py-2 rounded-lg hover:bg-gray-700/50 flex items-center space-x-2"
                onClick={() => setIsMenuOpen(false)}
            >
                <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span>Alerts</span>
            </a>
        </>
    );

    return (
        <header className="bg-gray-800/80 backdrop-blur-md sticky top-0 z-50 shadow-lg border-b border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Brand & Desktop Nav */}
                    <div className="flex items-center space-x-4 lg:space-x-8">
                        <a href="#/" className="flex-shrink-0 flex items-center space-x-2 group">
                            <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-cyan-500/20">
                                <span className="text-white font-bold text-xl">A</span>
                            </div>
                            <span className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors hidden sm:block">AirSense</span>
                        </a>
                        
                        {/* Desktop Navigation */}
                        <nav className="hidden xl:flex space-x-1">
                            <NavLinks />
                        </nav>
                    </div>

                    {/* Right side: User Profile & Actions */}
                    <div className="flex items-center space-x-2 md:space-x-4">
                        {/* User Profile - Compact on mobile */}
                        <div className="hidden sm:flex items-center space-x-3 px-3 py-1.5 bg-gray-700/50 rounded-lg border border-gray-600">
                            <div className="flex items-center justify-center w-8 h-8 bg-cyan-500/20 rounded-full border border-cyan-500/50">
                                <svg aria-hidden="true" className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <div className="text-right leading-tight">
                                <div className="text-xs font-semibold text-white truncate max-w-[100px]">{currentUser.username}</div>
                                <div className="text-[10px] text-gray-400 capitalize">{currentUser.role}</div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-1">
                            <button
                                onClick={() => setIsChangePasswordModalOpen(true)}
                                className="text-gray-400 hover:text-cyan-400 p-2 hover:bg-cyan-500/10 rounded-lg transition-all"
                                title="Change Password"
                            >
                                <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                            </button>

                            <button
                                onClick={onLogout}
                                className="text-gray-400 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-all"
                                title="Logout"
                            >
                                <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>

                            {/* Mobile menu button */}
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="xl:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg focus:outline-none"
                            >
                                <span className="sr-only">Open main menu</span>
                                {isMenuOpen ? (
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                ) : (
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Menu */}
            {isMenuOpen && (
                <div className="xl:hidden bg-gray-800 border-t border-gray-700 py-4 px-4 space-y-2 shadow-2xl animate-in slide-in-from-top duration-200">
                    {/* User profile inside mobile menu */}
                    <div className="flex sm:hidden items-center space-x-3 p-3 bg-gray-900/50 rounded-lg mb-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-cyan-500/20 rounded-full border border-cyan-500">
                            <svg aria-hidden="true" className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div>
                            <div className="font-semibold text-white">{currentUser.username}</div>
                            <div className="text-xs text-gray-400 capitalize">{currentUser.role}</div>
                        </div>
                    </div>
                    
                    <nav className="flex flex-col space-y-1">
                        <NavLinks />
                    </nav>
                </div>
            )}

            <ChangePasswordModal
                isOpen={isChangePasswordModalOpen}
                onClose={() => setIsChangePasswordModalOpen(false)}
            />
        </header>
    );
};