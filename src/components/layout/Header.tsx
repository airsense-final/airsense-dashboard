import React, { useState } from 'react';
import type { User } from '../../types/types';
import { ChangePasswordModal } from '../ChangePasswordModal';

interface HeaderProps {
    isAuthed: boolean;
    onLogout: () => void;
    currentUser: User | null;
    isDarkMode: boolean;
    toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isAuthed, onLogout, currentUser, isDarkMode, toggleTheme }) => {
    const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    if (!isAuthed || !currentUser) return null;

    const NavLinks = () => (
        <>
            <a
                href="#/"
                className="text-gray-300 light:text-gray-700 hover:text-cyan-400 light:text-cyan-800 light:hover:text-cyan-700 transition-colors px-3 py-2 rounded-lg hover:bg-gray-700/50 light:hover:bg-gray-200/50 block md:inline-block"
                onClick={() => setIsMenuOpen(false)}
            >
                Dashboard
            </a>
            
            {/* SUBSCRIPTION CHECK: Show Digital Twin/Simulation only for Enterprise */}
            {currentUser.company_tier === 'enterprise' && (
                <a
                    href="#/test-simulation"
                    className="text-gray-300 light:text-gray-700 hover:text-cyan-400 light:text-cyan-800 light:hover:text-cyan-700 transition-colors px-3 py-2 rounded-lg hover:bg-gray-700/50 light:hover:bg-gray-200/50 flex items-center space-x-2"
                    onClick={() => setIsMenuOpen(false)}
                >
                    <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                    <span>Simulation</span>
                </a>
            )}

            {currentUser.role !== 'viewer' && (
                <a
                    href="#/admin/users"
                    className="text-gray-300 light:text-gray-700 hover:text-cyan-400 light:text-cyan-800 light:hover:text-cyan-700 transition-colors px-3 py-2 rounded-lg hover:bg-gray-700/50 light:hover:bg-gray-200/50 flex items-center space-x-2"
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
                    className="text-gray-300 light:text-gray-700 hover:text-cyan-400 light:text-cyan-800 light:hover:text-cyan-700 transition-colors px-3 py-2 rounded-lg hover:bg-gray-700/50 light:hover:bg-gray-200/50 flex items-center space-x-2"
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
                    className="text-gray-300 light:text-gray-700 hover:text-cyan-400 light:text-cyan-800 light:hover:text-cyan-700 transition-colors px-3 py-2 rounded-lg hover:bg-gray-700/50 light:hover:bg-gray-200/50 flex items-center space-x-2"
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
                    className="text-gray-300 light:text-gray-700 hover:text-cyan-400 light:text-cyan-800 light:hover:text-cyan-700 transition-colors px-3 py-2 rounded-lg hover:bg-gray-700/50 light:hover:bg-gray-200/50 flex items-center space-x-2"
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
                className="text-gray-300 light:text-gray-700 hover:text-cyan-400 light:text-cyan-800 light:hover:text-cyan-700 transition-colors px-3 py-2 rounded-lg hover:bg-gray-700/50 light:hover:bg-gray-200/50 flex items-center space-x-2"
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
        <header className="bg-gray-800/80 light:bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-lg border-b border-gray-700 light:border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Brand & Desktop Nav */}
                    <div className="flex items-center space-x-4 lg:space-x-8">
                        <a href="#/" className="flex-shrink-0 flex items-center space-x-2 group">
                            <img src="assets/images/AirSense%20Logo%20logo.png" alt="AirSense Logo" className="w-10 h-8 md:w-14 md:h-12" />
                            <div className="hidden md:flex items-baseline space-x-1">
                                <img src="assets/images/AirSense%20Logo%20yaz%C4%B1.png" alt="AirSense" className="h-6 w-auto" />
                                {currentUser.company_tier === 'mid' && (
                                    <span className="text-xs font-light text-cyan-400 light:text-cyan-600 italic tracking-wide">Pro</span>
                                )}
                                {currentUser.company_tier === 'enterprise' && (
                                    <span className="text-xs font-light text-emerald-400 light:text-emerald-600 uppercase tracking-widest bg-emerald-500/10 light:bg-emerald-100 px-1.5 py-0.5 rounded ml-1">Business</span>
                                )}
                            </div>
                        </a>
                        
                        {/* Desktop Navigation */}
                        <nav className="hidden xl:flex items-center space-x-1">
                            <NavLinks />
                        </nav>
                    </div>

                    {/* Right side: User Profile & Actions */}
                    <div className="flex items-center space-x-2 md:space-x-4">
                        {/* Theme Toggle - iPhone style switch */}
                        <div className="flex items-center pr-1 sm:pr-2">
                            <button
                                onClick={toggleTheme}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none shadow-inner ${
                                    isDarkMode ? 'bg-cyan-600 light:bg-cyan-800' : 'bg-gray-300'
                                }`}
                                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                            >
                                <span className="sr-only">Toggle theme</span>
                                <div
                                    className={`flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-lg ring-0 transition-all duration-300 transform ${
                                        isDarkMode ? 'translate-x-5' : 'translate-x-1'
                                    }`}
                                >
                                    {isDarkMode ? (
                                        <svg className="h-3.5 w-3.5 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                                        </svg>
                                    ) : (
                                        <svg className="h-3.5 w-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </div>
                            </button>
                        </div>

                        {/* User Profile - Compact on mobile */}
                        <div className="hidden sm:flex items-center space-x-3 px-3 py-1.5 bg-gray-700/50 light:bg-gray-100/50 rounded-lg border border-gray-600 light:border-gray-200">
                            <div className="flex items-center justify-center w-8 h-8 bg-gray-800 light:bg-cyan-600/10 rounded-full border border-gray-600 light:border-cyan-600/30">
                                <svg aria-hidden="true" className="w-5 h-5 text-gray-400 light:text-cyan-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <div className="text-right leading-tight">
                                <div className="text-xs font-semibold text-white light:text-gray-900 truncate max-w-[100px]">{currentUser.username}</div>
                                <div className="text-[10px] text-gray-400 light:text-gray-600 capitalize">{currentUser.role}</div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-1">
                            <button
                                onClick={() => setIsChangePasswordModalOpen(true)}
                                className="text-gray-400 light:text-gray-600 hover:text-cyan-400 light:text-cyan-800 light:hover:text-cyan-700 p-2 hover:bg-cyan-500 light:bg-cyan-700/10 light:hover:bg-cyan-600 light:bg-cyan-800/10 rounded-lg transition-all"
                                title="Change Password"
                            >
                                <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                            </button>

                            <button
                                onClick={onLogout}
                                className="text-gray-400 light:text-gray-600 hover:text-red-400 light:text-red-800 light:hover:text-red-700 p-2 hover:bg-red-500/10 light:hover:bg-red-600/10 rounded-lg transition-all"
                                title="Logout"
                            >
                                <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>

                            {/* Mobile menu button */}
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="xl:hidden p-2 text-gray-400 light:text-gray-600 hover:text-white light:hover:text-gray-900 hover:bg-gray-700 light:hover:bg-gray-200 rounded-lg focus:outline-none"
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
                <div className="xl:hidden bg-gray-800 light:bg-white border-t border-gray-700 light:border-gray-200 py-4 px-4 space-y-2 shadow-2xl animate-in slide-in-from-top duration-200">
                    {/* User profile inside mobile menu */}
                    <div className="flex sm:hidden items-center space-x-3 p-3 bg-gray-900/50 light:bg-gray-100/50 rounded-lg mb-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-cyan-500 light:bg-cyan-700/20 rounded-full border border-cyan-500 light:border-cyan-700">
                            <svg aria-hidden="true" className="w-6 h-6 text-cyan-400 light:text-cyan-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div>
                            <div className="font-semibold text-white light:text-gray-900">{currentUser.username}</div>
                            <div className="text-xs text-gray-400 light:text-gray-600 capitalize">{currentUser.role}</div>
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
