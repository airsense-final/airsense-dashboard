import React, { useState, useEffect, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { getAlertHistory, getAggregatedAlertHistory, getCompanies, getCurrentUser, markAlertAsRead, markAllAlertsAsRead, listSensors, exportAlertsPDF } from '../services/apiService';
import type { Alert, Company, User } from '../types/types';
import AlertDistributionChart from '../components/widgets/AlertDistributionChart';

const AlertHistoryPage: React.FC = () => {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [sensorMap, setSensorMap] = useState<Record<string, string>>({});

    // Filters
    const [rangePreset, setRangePreset] = useState<'1h' | '24h' | '7d' | '30d' | 'custom'>('24h');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedCompany, setSelectedCompany] = useState('');
    const [sensorFilter, setSensorFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved'>('all');
    const [readFilter, setReadFilter] = useState<'all' | 'read' | 'unread'>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

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

    const loadSensorMap = async () => {
        try {
            const companyName = currentUser?.role === 'superadmin' ? (selectedCompany || undefined) : currentUser?.company_name;
            const sensors = await listSensors(companyName);
            const map: Record<string, string> = {};
            sensors.forEach((s: any) => {
                if (s._id) {
                    map[s._id] = s.sensor_name || s.sensor_id;
                }
            });
            setSensorMap(map);
        } catch (err) {
            console.error('Failed to load sensor map', err);
        }
    };

    const applyPreset = (preset: string) => {
        const end = new Date();
        let start = new Date();

        if (preset === '1h') start.setHours(end.getHours() - 1);
        else if (preset === '24h') start.setHours(end.getHours() - 24);
        else if (preset === '7d') start.setDate(end.getDate() - 7);
        else if (preset === '30d') start.setDate(end.getDate() - 30);
        else return;

        setStartDate(start.toISOString());
        setEndDate(end.toISOString());
    };

    const handleMarkAsRead = async (alertId: string) => {
        try {
            await markAlertAsRead(alertId);
            setAlerts(prev => prev.map(a => a._id === alertId ? { ...a, is_read: true } : a));
        } catch (err) {
            console.error('Failed to mark alert as read', err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllAlertsAsRead(currentUser?.role === 'superadmin' ? selectedCompany : undefined);
            setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
            loadAlerts();
        } catch (err) {
            console.error('Failed to mark all as read', err);
        }
    };

    const handleExportPDF = async () => {
        try {
            setError(null);
            const exportParams: any = { include_anomalies: true };
            if (currentUser?.role === 'superadmin' && selectedCompany) exportParams.target_company_name = selectedCompany;
            if (startDate) exportParams.start_date = startDate;
            if (endDate) exportParams.end_date = endDate;
            if (statusFilter === 'active') exportParams.is_resolved = false;
            else if (statusFilter === 'resolved') exportParams.is_resolved = true;
            await exportAlertsPDF(exportParams);
        } catch (err: any) {
            setError(err.message || 'Failed to export PDF report');
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
            const params = { start_date: startDate, end_date: endDate, is_resolved: isResolved, is_read: isRead, limit: 100 };

            let data: Alert[] = [];
            if (currentUser.role === 'superadmin' && !selectedCompany && companies.length > 0) {
                data = await getAggregatedAlertHistory(companies, params);
            } else {
                const singleParams = { ...params, target_company_name: currentUser.role === 'superadmin' ? selectedCompany : undefined };
                data = await getAlertHistory(singleParams);
            }

            if (sensorFilter) {
                const lowerFilter = sensorFilter.toLowerCase();
                data = data.filter(alert => alert.sensor_id.toLowerCase().includes(lowerFilter) || alert.sensor_type.toLowerCase().includes(lowerFilter));
            }
            
            if (typeFilter !== 'all') {
                data = data.filter(alert => alert.alert_type === typeFilter);
            }

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

    useEffect(() => { loadUserAndCompanies(); }, []);
    useEffect(() => { applyPreset(rangePreset); }, [rangePreset]);
    useEffect(() => { loadAlerts(); loadSensorMap(); }, [startDate, endDate, selectedCompany, sensorFilter, statusFilter, readFilter, typeFilter, currentUser]);

    const stats = useMemo(() => {
        return alerts.reduce((acc, alert) => {
            acc.total++;
            if (alert.is_resolved) acc.resolved++;
            else {
                acc.activeTotal++;
                if (alert.alert_type === 'critical') acc.activeCritical++;
                if (alert.alert_type === 'warning') acc.activeWarning++;
            }
            return acc;
        }, { total: 0, activeTotal: 0, activeCritical: 0, activeWarning: 0, resolved: 0 });
    }, [alerts]);

    return (
        <div className="min-h-screen bg-gray-900 text-white p-3 sm:p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* 1. Header Section */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-1">
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Alert History</h1>
                            <div className="flex gap-2">
                                <button onClick={handleMarkAllRead} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-xs sm:text-sm font-semibold rounded-full text-gray-300 border border-gray-600 transition-colors">Mark All Read</button>
                                <button onClick={handleExportPDF} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-xs sm:text-sm font-semibold rounded-full text-white shadow-lg flex items-center gap-2 transition-all"><svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>PDF Report</button>
                            </div>
                        </div>
                        <p className="text-gray-400 text-xs sm:text-sm">Review past and ongoing sensor alerts</p>
                    </div>

                    <div className="w-full lg:w-auto overflow-x-auto no-scrollbar pb-1">
                        <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700 w-max lg:w-auto">
                            {(['1h', '24h', '7d', '30d', 'custom'] as const).map((preset) => (
                                <button key={preset} onClick={() => { setRangePreset(preset); applyPreset(preset); }} className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-[10px] sm:text-sm font-semibold transition-colors whitespace-nowrap ${rangePreset === preset ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>{preset === 'custom' ? 'Custom' : `Last ${preset}`}</button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 2. Donut Chart - RESTORED TO ORIGINAL POSITION (TOP) */}
                <div className="w-full">
                    <AlertDistributionChart total={stats.total} activeCritical={stats.activeCritical} activeWarning={stats.activeWarning} resolved={stats.resolved} />
                </div>

                {/* 3. Summary Stats Cards - UNDER CHART */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                    <div className="bg-gray-800 p-3 sm:p-4 rounded-xl border border-gray-700 shadow-sm flex items-center justify-between">
                        <div><p className="text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider font-semibold">Active</p><p className="text-lg sm:text-2xl font-bold text-white">{stats.activeTotal}</p></div>
                        <div className="p-2 bg-gray-700/50 rounded-full hidden sm:block"><svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                    </div>
                    <div className="bg-gray-800 p-3 sm:p-4 rounded-xl border border-red-900/30 shadow-sm flex items-center justify-between">
                        <div><p className="text-red-400 text-[10px] sm:text-xs uppercase tracking-wider font-semibold">Critical</p><p className="text-lg sm:text-2xl font-bold text-red-100">{stats.activeCritical}</p></div>
                        <div className="p-2 bg-red-900/20 rounded-full hidden sm:block"><svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
                    </div>
                    <div className="bg-gray-800 p-3 sm:p-4 rounded-xl border border-yellow-900/30 shadow-sm flex items-center justify-between">
                        <div><p className="text-yellow-400 text-[10px] sm:text-xs uppercase tracking-wider font-semibold">Warning</p><p className="text-lg sm:text-2xl font-bold text-yellow-100">{stats.activeWarning}</p></div>
                        <div className="p-2 bg-yellow-900/20 rounded-full hidden sm:block"><svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                    </div>
                    <div className="bg-gray-800 p-3 sm:p-4 rounded-xl border border-green-900/30 shadow-sm flex items-center justify-between">
                        <div><p className="text-green-400 text-[10px] sm:text-xs uppercase tracking-wider font-semibold">Resolved</p><p className="text-lg sm:text-2xl font-bold text-green-100">{stats.resolved}</p></div>
                        <div className="p-2 bg-green-900/20 rounded-full hidden sm:block"><svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                    </div>
                </div>

                {/* 4. Filters Grid - UNDER STATS */}
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-widest ml-1">Start Date</label>
                        <DatePicker
                            selected={startDate ? new Date(startDate) : null}
                            onChange={(date: Date | null) => { setRangePreset('custom'); setStartDate(date ? date.toISOString() : ''); }}
                            showTimeSelect maxDate={endDate ? new Date(endDate) : new Date()} timeFormat="HH:mm" timeIntervals={15} dateFormat="dd-MM-yyyy HH:mm" placeholderText="Start"
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-xs outline-none focus:ring-1 focus:ring-cyan-500"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-widest ml-1">End Date</label>
                        <DatePicker
                            selected={endDate ? new Date(endDate) : null}
                            onChange={(date: Date | null) => { setRangePreset('custom'); setEndDate(date ? date.toISOString() : ''); }}
                            showTimeSelect minDate={startDate ? new Date(startDate) : undefined} maxDate={new Date()} timeFormat="HH:mm" timeIntervals={15} dateFormat="dd-MM-yyyy HH:mm" placeholderText="End"
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-xs outline-none focus:ring-1 focus:ring-cyan-500"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-widest ml-1">Sensor Search</label>
                        <input type="text" placeholder="ID or Type..." value={sensorFilter} onChange={(e) => setSensorFilter(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-xs outline-none focus:ring-1 focus:ring-cyan-500" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-widest ml-1">Severity</label>
                        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-xs outline-none focus:ring-1 focus:ring-cyan-500">
                            <option value="all">All</option>
                            <option value="critical">Critical</option>
                            <option value="warning">Warning</option>
                        </select>
                    </div>
                    {currentUser?.role === 'superadmin' && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-medium text-gray-500 uppercase tracking-widest ml-1">Org</label>
                            <select value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-xs outline-none focus:ring-1 focus:ring-cyan-500">
                                <option value="">All Org</option>
                                {companies.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                    )}
                    <div className="space-y-1">
                        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-widest ml-1">Resolution</label>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-xs outline-none focus:ring-1 focus:ring-cyan-500">
                            <option value="all">All</option>
                            <option value="active">Active</option>
                            <option value="resolved">Resolved</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-widest ml-1">Seen Status</label>
                        <select value={readFilter} onChange={(e) => setReadFilter(e.target.value as any)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-xs outline-none focus:ring-1 focus:ring-cyan-500">
                            <option value="all">All</option>
                            <option value="unread">Unread</option>
                            <option value="read">Read</option>
                        </select>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-xs font-semibold uppercase">
                        {error}
                    </div>
                )}

                {/* 5. Alert List - AT THE BOTTOM */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
                    <div className="hidden md:block overflow-x-auto">
                        <table className="min-w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-700/50 text-gray-300 text-xs font-bold uppercase tracking-wider">
                                    <th className="px-6 py-4">Severity</th>
                                    <th className="px-6 py-4">Time</th>
                                    <th className="px-6 py-4">Sensor</th>
                                    <th className="px-6 py-4">Value</th>
                                    <th className="px-6 py-4">Message</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {loading ? (<tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">Loading alerts...</td></tr>) : alerts.length === 0 ? (<tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">No alerts found.</td></tr>) : (
                                    alerts.map((alert) => (
                                        <tr key={alert._id} className={`border-b border-gray-700 hover:bg-gray-700/50 transition-colors ${!alert.is_read ? 'bg-gray-800/80' : ''}`}>
                                            <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-[10px] font-semibold rounded-full border ${alert.alert_type === 'critical' ? 'bg-red-900/50 text-red-200 border-red-800' : 'bg-amber-900/50 text-amber-200 border-amber-800'}`}>{alert.alert_type.toUpperCase()}</span></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{new Date(alert.timestamp).toLocaleString('tr-TR')}</td>
                                            <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-white">{alert.sensor_type}</div><div className="text-xs text-gray-500 font-mono">{sensorMap[alert.sensor_id] || alert.sensor_id}</div></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm"><span className="text-white font-medium">{alert.value.toFixed(2)}</span> <span className="text-gray-500 text-xs ml-1">{alert.unit}</span></td>
                                            <td className="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">{alert.message}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                {!alert.is_read ? (<button onClick={() => handleMarkAsRead(alert._id)} className="text-cyan-400 hover:text-cyan-300 transition-colors">Mark Read</button>) : (<span className="text-gray-600">Seen</span>)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="md:hidden divide-y divide-gray-700">
                        {loading ? (<div className="p-10 text-center text-gray-400 text-sm">Loading alerts...</div>) : alerts.length === 0 ? (<div className="p-10 text-center text-gray-400 text-sm italic">No alerts found.</div>) : (
                            alerts.map((alert) => (
                                <div key={alert._id} className={`p-4 ${!alert.is_read ? 'bg-cyan-900/10' : ''} relative overflow-hidden`}>
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${alert.alert_type === 'critical' ? 'bg-red-600' : 'bg-amber-500'}`} />
                                    <div className="flex justify-between items-start mb-2"><span className={`text-[10px] font-semibold uppercase tracking-wider ${alert.alert_type === 'critical' ? 'text-red-400' : 'text-amber-400'}`}>{alert.alert_type}</span><span className="text-[10px] text-gray-500 font-mono">{new Date(alert.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span></div>
                                    <div className="mb-2"><div className="text-sm font-semibold text-white">{alert.sensor_type}</div><div className="text-[10px] text-gray-500 font-mono truncate">{sensorMap[alert.sensor_id] || alert.sensor_id}</div></div>
                                    <div className="text-xs text-gray-300 leading-relaxed mb-3">{alert.message}</div>
                                    <div className="flex items-center justify-between pt-2 border-t border-gray-700/50"><div className="flex items-baseline gap-1"><span className="text-white font-medium text-base">{alert.value.toFixed(2)}</span> <span className="text-gray-500 text-[10px] font-medium uppercase">{alert.unit}</span></div>{!alert.is_read ? (<button onClick={() => handleMarkAsRead(alert._id)} className="text-[10px] font-semibold text-cyan-400 border border-cyan-400/30 px-3 py-1.5 rounded bg-cyan-400/5 transition-all active:scale-95">MARK READ</button>) : (<span className="text-[10px] text-gray-600 uppercase font-medium">Seen</span>)}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AlertHistoryPage;
