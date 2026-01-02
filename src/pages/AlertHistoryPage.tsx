
import React, { useState, useEffect, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { getAlertHistory, getAggregatedAlertHistory, getCompanies, getCurrentUser, markAlertAsRead, markAllAlertsAsRead } from '../services/apiService';
import type { Alert, Company, User } from '../types/types';

const AlertHistoryPage: React.FC = () => {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [companies, setCompanies] = useState<Company[]>([]);

    // Filters
    const [rangePreset, setRangePreset] = useState<'1h' | '24h' | '7d' | '30d' | 'custom'>('24h');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedCompany, setSelectedCompany] = useState('');
    const [sensorFilter, setSensorFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved'>('all');
    const [readFilter, setReadFilter] = useState<'all' | 'read' | 'unread'>('all');

    const loadUserAndCompanies = async () => {
        try {
            const user = await getCurrentUser();
            setCurrentUser(user);
            if (user.role === 'superadmin') {
                const companiesData = await getCompanies();
                setCompanies(companiesData);
            }
        } catch (err) {
            console.error('Failed to load user info', err);
        }
    };

    const applyPreset = (preset: string) => {
        const end = new Date();
        let start = new Date();

        if (preset === '1h') {
            start.setHours(end.getHours() - 1);
        } else if (preset === '24h') {
            start.setHours(end.getHours() - 24);
        } else if (preset === '7d') {
            start.setDate(end.getDate() - 7);
        } else if (preset === '30d') {
            start.setDate(end.getDate() - 30);
        } else {
            // custom, do nothing to dates unless they are empty
            return;
        }

        setStartDate(start.toISOString());
        setEndDate(end.toISOString());
    };

    const handleMarkAsRead = async (alertId: string) => {
        try {
            await markAlertAsRead(alertId);
            // Optimistic update
            setAlerts(prev => prev.map(a => a._id === alertId ? { ...a, is_read: true } : a));
        } catch (err) {
            console.error('Failed to mark alert as read', err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllAlertsAsRead(currentUser?.role === 'superadmin' ? selectedCompany : undefined);
            // Optimistic update
            setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
            // Optionally reload to be sure
            loadAlerts();
        } catch (err) {
            console.error('Failed to mark all as read', err);
        }
    };

    const loadAlerts = async () => {
        if (!currentUser) return;

        setLoading(true);

        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            setError('Start Date cannot be after End Date.');
            setAlerts([]);
            setLoading(false);
            return;
        }

        try {
            const isResolved = statusFilter === 'all' ? undefined : (statusFilter === 'resolved');
            const isRead = readFilter === 'all' ? undefined : (readFilter === 'read');

            const params = {
                start_date: startDate,
                end_date: endDate,
                // sensor_id: sensorFilter, 
                is_resolved: isResolved,
                is_read: isRead,
                limit: 100
            };

            let data: Alert[] = [];

            // Special handling for Super Admin with "All Companies" selected
            if (currentUser.role === 'superadmin' && !selectedCompany && companies.length > 0) {
                data = await getAggregatedAlertHistory(companies, params);
            } else {
                // Standard fetch
                const singleParams = {
                    ...params,
                    target_company_name: currentUser.role === 'superadmin' ? selectedCompany : undefined,
                };
                data = await getAlertHistory(singleParams);
            }

            // Client-side Fuzzy Search (Sensor ID or Type)
            if (sensorFilter) {
                const lowerFilter = sensorFilter.toLowerCase();
                data = data.filter(alert =>
                    alert.sensor_id.toLowerCase().includes(lowerFilter) ||
                    alert.sensor_type.toLowerCase().includes(lowerFilter)
                );
            }

            // Sort by timestamp descending (newest first)
            data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            setAlerts(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to load alert history');
            setAlerts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUserAndCompanies();
    }, []);

    useEffect(() => {
        applyPreset(rangePreset);
    }, [rangePreset]);

    useEffect(() => {
        // Debounce or just load on effective changes
        loadAlerts();
    }, [startDate, endDate, selectedCompany, sensorFilter, statusFilter, readFilter, currentUser]);

    // Auto-refresh every 30 seconds (Resets timer on filter change)
    useEffect(() => {
        const intervalId = setInterval(() => {
            if (rangePreset !== 'custom') {
                applyPreset(rangePreset); // This updates start/end date, which triggers loadAlerts via dependency
            } else {
                loadAlerts(); // Just reload for fixed custom range
            }
        }, 30000);
        return () => clearInterval(intervalId);
    }, [rangePreset, startDate, endDate, selectedCompany, sensorFilter, statusFilter, readFilter, currentUser]);

    const stats = useMemo(() => {
        return alerts.reduce((acc, alert) => {
            acc.total++;
            if (alert.is_resolved) {
                acc.resolved++;
            } else {
                acc.activeTotal++;
                if (alert.alert_type === 'critical') acc.activeCritical++;
                if (alert.alert_type === 'warning') acc.activeWarning++;
            }
            return acc;
        }, { total: 0, activeTotal: 0, activeCritical: 0, activeWarning: 0, resolved: 0 });
    }, [alerts]);

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div>
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-bold">Alert History</h1>
                            <button
                                onClick={handleMarkAllRead}
                                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-xs font-medium rounded-full text-gray-300 transition-colors border border-gray-600"
                            >
                                Mark All Read
                            </button>
                        </div>
                        <p className="text-gray-400 mt-1">Review past and ongoing sensor alerts</p>
                    </div>

                    {/* Presets */}
                    <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
                        {(['1h', '24h', '7d', '30d', 'custom'] as const).map((preset) => (
                            <button
                                key={preset}
                                onClick={() => {
                                    setRangePreset(preset);
                                    applyPreset(preset);
                                }}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${rangePreset === preset
                                    ? 'bg-cyan-600 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                    }`}
                            >
                                {preset === 'custom' ? 'Custom Range' : `Last ${preset}`}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Active Alerts</p>
                            <p className="text-2xl font-bold text-white">{stats.activeTotal} <span className="text-sm text-gray-500 font-normal">/ {stats.total}</span></p>
                        </div>
                        <div className="p-3 bg-gray-700/50 rounded-full">
                            <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>

                    <div className="bg-gray-800 p-4 rounded-lg border border-red-900/50 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-red-400 text-sm">Active Critical</p>
                            <p className="text-2xl font-bold text-red-100">{stats.activeCritical}</p>
                        </div>
                        <div className="p-3 bg-red-900/20 rounded-full">
                            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                    </div>

                    <div className="bg-gray-800 p-4 rounded-lg border border-yellow-900/50 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-yellow-400 text-sm">Active Warning</p>
                            <p className="text-2xl font-bold text-yellow-100">{stats.activeWarning}</p>
                        </div>
                        <div className="p-3 bg-yellow-900/20 rounded-full">
                            <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>

                    <div className="bg-gray-800 p-4 rounded-lg border border-green-900/50 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-green-400 text-sm">Resolved</p>
                            <p className="text-2xl font-bold text-green-100">{stats.resolved}</p>
                        </div>
                        <div className="p-3 bg-green-900/20 rounded-full">
                            <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Filters Bar */}
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-12 gap-4">
                    {/* Date Inputs */}
                    <div className="space-y-1 xl:col-span-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase">Start Date</label>
                        <DatePicker
                            selected={startDate ? new Date(startDate) : null}
                            onChange={(date: Date | null) => {
                                setRangePreset('custom');
                                setStartDate(date ? date.toISOString() : '');
                            }}
                            showTimeSelect
                            maxDate={endDate ? new Date(endDate) : new Date()}
                            filterTime={(date) => date.getTime() <= new Date().getTime()}
                            timeFormat="HH:mm"
                            timeIntervals={15}
                            dateFormat="dd-MM-yyyy HH:mm"
                            placeholderText="Select start date"
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                    </div>
                    <div className="space-y-1 xl:col-span-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase">End Date</label>
                        <DatePicker
                            selected={endDate ? new Date(endDate) : null}
                            onChange={(date: Date | null) => {
                                setRangePreset('custom');
                                setEndDate(date ? date.toISOString() : '');
                            }}
                            showTimeSelect
                            minDate={startDate ? new Date(startDate) : undefined}
                            maxDate={new Date()}
                            filterTime={(date) => date.getTime() <= new Date().getTime()}
                            timeFormat="HH:mm"
                            timeIntervals={15}
                            dateFormat="dd-MM-yyyy HH:mm"
                            placeholderText="Select end date"
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                    </div>

                    {/* Sensor Filter */}
                    <div className={`space-y-1 ${currentUser?.role !== 'superadmin' ? 'xl:col-span-4' : 'xl:col-span-2'}`}>
                        <label className="text-xs font-semibold text-gray-400 uppercase">Sensor ID</label>
                        <input
                            type="text"
                            placeholder="e.g. MQ3"
                            value={sensorFilter}
                            onChange={(e) => setSensorFilter(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                    </div>

                    {/* Company (Superadmin) */}
                    {currentUser?.role === 'superadmin' && (
                        <div className="space-y-1 xl:col-span-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase">Company</label>
                            <select
                                value={selectedCompany}
                                onChange={(e) => setSelectedCompany(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value="">All Companies</option>
                                {companies.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                    )}

                    {/* Status Filter */}
                    <div className="space-y-1 xl:col-span-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            <option value="all">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="resolved">Resolved</option>
                        </select>
                    </div>

                    {/* Read Status Filter */}
                    <div className="space-y-1 xl:col-span-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase">Read Status</label>
                        <select
                            value={readFilter}
                            onChange={(e) => setReadFilter(e.target.value as any)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            <option value="all">All</option>
                            <option value="unread">Unread Only</option>
                            <option value="read">Read Only</option>
                        </select>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Data Table */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left">
                            <thead className="bg-gray-700/50 text-gray-300 text-xs font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Severity</th>
                                    <th className="px-6 py-4">Time</th>
                                    <th className="px-6 py-4">Sensor</th>
                                    <th className="px-6 py-4">Value</th>
                                    <th className="px-6 py-4">Message</th>
                                    <th className="px-6 py-4">Status</th>
                                    {currentUser?.role === 'superadmin' && <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Company</th>}
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-10 text-center text-gray-400">Loading alerts...</td>
                                    </tr>
                                ) : alerts.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-10 text-center text-gray-400">No alerts found matching current filters.</td>
                                    </tr>
                                ) : (
                                    alerts.map((alert) => (
                                        <tr key={alert._id} className={`border-b border-gray-700 hover:bg-gray-700/50 transition-colors ${!alert.is_read ? 'bg-gray-800/80' : ''}`}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                    ${alert.alert_type === 'critical' ? 'bg-red-900/50 text-red-200 border border-red-800' :
                                                        alert.alert_type === 'warning' ? 'bg-amber-900/50 text-amber-200 border border-amber-800' :
                                                            'bg-blue-900/50 text-blue-200 border border-blue-800'}`}>
                                                    {alert.alert_type.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${!alert.is_read ? 'text-white font-semibold' : 'text-gray-300'}`}>
                                                {new Date(alert.timestamp.endsWith('Z') ? alert.timestamp : alert.timestamp + 'Z').toLocaleString('tr-TR')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className={`text-sm font-medium ${!alert.is_read ? 'text-white' : 'text-white'}`}>{alert.sensor_type}</div>
                                                <div className="text-xs text-gray-500">{alert.sensor_id}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className={`text-sm ${!alert.is_read ? 'text-white font-medium' : 'text-gray-300'}`}>
                                                    {alert.value.toFixed(2)} <span className="text-gray-500 text-xs">{alert.unit}</span>
                                                </div>
                                                <div className="text-xs text-gray-500">vs {alert.threshold_value}</div>
                                            </td>
                                            <td className={`px-6 py-4 text-sm ${!alert.is_read ? 'text-white font-medium' : 'text-gray-300'}`}>
                                                {alert.message}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {alert.is_resolved ? (
                                                    <span className="flex items-center text-green-400 text-sm">
                                                        <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Resolved
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center text-red-400 text-sm animate-pulse">
                                                        <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        Active
                                                    </span>
                                                )}
                                            </td>
                                            {currentUser?.role === 'superadmin' && (
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200 font-medium">
                                                    {alert.company_name}
                                                </td>
                                            )}
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                {!alert.is_read ? (
                                                    <button
                                                        onClick={() => handleMarkAsRead(alert._id)}
                                                        className="text-cyan-400 hover:text-cyan-300 bg-cyan-900/20 hover:bg-cyan-900/40 px-3 py-1 rounded border border-cyan-800/50 transition-colors"
                                                    >
                                                        Mark as Read
                                                    </button>
                                                ) : (
                                                    <span className="text-blue-400 flex items-center justify-center gap-1">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Read
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AlertHistoryPage;
