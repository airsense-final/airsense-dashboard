import React, { useState, useEffect } from 'react';
import {
    listThresholds,
    saveThreshold,
    deleteThreshold,
    getCompanies
} from '../services/apiService';
import type {
    ThresholdConfig,
    ThresholdUpsert,
    Company
} from '../types/types';

const ThresholdManagementPage: React.FC = () => {
    const [thresholds, setThresholds] = useState<ThresholdConfig[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Filter states
    const [scenarioFilter, setScenarioFilter] = useState('');
    const [companyFilter, setCompanyFilter] = useState('');
    const [sensorFilter, setSensorFilter] = useState('');

    // Modal states for Add/Edit
    const [showModal, setShowModal] = useState(false);
    const [editingThreshold, setEditingThreshold] = useState<ThresholdConfig | null>(null);

    // Form states
    const [formScenario, setFormScenario] = useState('indoor_small');
    const [formSensorType, setFormSensorType] = useState('dht11_temp');
    const [formCompanyId, setFormCompanyId] = useState<string | null>(null);
    const [warningMin, setWarningMin] = useState('');
    const [criticalMin, setCriticalMin] = useState('');
    const [warningMax, setWarningMax] = useState('');
    const [criticalMax, setCriticalMax] = useState('');
    const [unit, setUnit] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    const sensorTypes = [
        { id: 'dht11_temp', name: 'DHT11 Temperature' },
        { id: 'dht11_hum', name: 'DHT11 Humidity' },
        { id: 'scd40', name: 'SCD40 CO2' },
        { id: 'mq3', name: 'MQ3 Alcohol' },
        { id: 'mq4', name: 'MQ4 Methane' },
        { id: 'mq7', name: 'MQ7 CO' },
        { id: 'mq9', name: 'MQ9 Flammable Gas' },
        { id: 'mq135', name: 'MQ135 Air Quality' },
    ];

    const scenarios = [
        { id: 'indoor_small', name: 'Indoor Small' },
        { id: 'indoor_large', name: 'Indoor Large' },
        { id: 'outdoor', name: 'Outdoor' },
    ];

    const getSensorUnit = (sensorType: string): string => {
        const unitMap: Record<string, string> = {
            'dht11_temp': '°C',
            'dht11_hum': '%',
            'scd40': 'ppm',
            'mq4': 'ppm',
            'mq7': 'ppm',
            'mq3': 'mg/L',
            'mq135': 'ppm',
            'mq9': 'ppm'
        };
        return unitMap[sensorType] || '';
    };

    useEffect(() => {
        loadData();
    }, []);

    // Auto-fill unit when sensor type changes in "Add New" mode
    useEffect(() => {
        if (!editingThreshold && showModal) {
            setUnit(getSensorUnit(formSensorType));
        }
    }, [formSensorType, editingThreshold, showModal]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [thresholdData, companyData] = await Promise.all([
                listThresholds(),
                getCompanies()
            ]);
            setThresholds(thresholdData);
            setCompanies(companyData);
        } catch (err: any) {
            setError(err?.message || 'Failed to load thresholds');
        } finally {
            setLoading(false);
        }
    };

    const openModal = (threshold: ThresholdConfig | null = null) => {
        if (threshold) {
            setEditingThreshold(threshold);
            setFormScenario(threshold.scenario);
            setFormSensorType(threshold.sensor_type);
            setFormCompanyId(threshold.company_id || null);
            setWarningMin(threshold.warning_min != null ? String(threshold.warning_min) : '');
            setCriticalMin(threshold.critical_min != null ? String(threshold.critical_min) : '');
            setWarningMax(threshold.warning_max != null ? String(threshold.warning_max) : '');
            setCriticalMax(threshold.critical_max != null ? String(threshold.critical_max) : '');
            setUnit(threshold.unit || '');
        } else {
            setEditingThreshold(null);
            setFormScenario('indoor_small');
            setFormSensorType('dht11_temp');
            // Professional touch: Pre-select the company if the user is filtering by one
            setFormCompanyId(companyFilter !== 'global' && companyFilter !== '' ? companyFilter : null);
            setWarningMin('');
            setCriticalMin('');
            setWarningMax('');
            setCriticalMax('');
            setUnit(getSensorUnit('dht11_temp'));
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingThreshold(null);
        setError(null);
        setSuccess(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        setError(null);

        const data: ThresholdUpsert = {
            scenario: formScenario,
            sensor_type: formSensorType,
            company_id: formCompanyId || null,
            warning_min: warningMin !== '' ? Number(warningMin) : null,
            critical_min: criticalMin !== '' ? Number(criticalMin) : null,
            warning_max: warningMax !== '' ? Number(warningMax) : null,
            critical_max: criticalMax !== '' ? Number(criticalMax) : null,
            unit: unit || null,
        };

        try {
            await saveThreshold(data);
            setSuccess('Threshold saved successfully');
            loadData();
            setTimeout(closeModal, 1500);
        } catch (err: any) {
            setError(err?.message || 'Failed to save threshold');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this threshold configuration?')) return;
        try {
            setLoading(true);
            await deleteThreshold(id);
            setSuccess('Threshold deleted');
            loadData();
        } catch (err: any) {
            setError(err?.message || 'Failed to delete threshold');
        } finally {
            setLoading(false);
        }
    };

    const filteredThresholds = thresholds.filter(t => {
        const matchesScenario = scenarioFilter === '' || t.scenario === scenarioFilter;
        const matchesCompany = companyFilter === '' ||
            (companyFilter === 'global' ? !t.company_id : t.company_id === companyFilter);
        const matchesSensor = sensorFilter === '' || t.sensor_type === sensorFilter;
        return matchesScenario && matchesCompany && matchesSensor;
    });

    return (
        <div className="space-y-4 sm:space-y-6 p-3 sm:p-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-800/20 p-4 rounded-2xl border border-gray-700/30 backdrop-blur-sm">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white light:text-gray-900 tracking-tight">Threshold Management</h2>
                    <p className="text-gray-400 light:text-gray-700 text-xs sm:text-sm mt-1 font-medium">System baseline configurations & overrides</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="w-full sm:w-auto bg-cyan-600 light:bg-cyan-800 hover:bg-cyan-700 text-white px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all shadow-lg shadow-cyan-900/20 active:scale-95"
                >
                    + Add New Threshold
                </button>
            </div>

            {/* Filters - Stack on mobile, Premium on Desktop */}
            <div className="bg-gray-800/40 backdrop-blur-md p-4 rounded-2xl border border-gray-700/50 shadow-xl grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Scenario Scope</label>
                    <select
                        value={scenarioFilter}
                        onChange={(e) => setScenarioFilter(e.target.value)}
                        className="w-full bg-gray-900 light:bg-gray-50 border border-gray-700 light:border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-white light:text-gray-900 outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all appearance-none cursor-pointer"
                    >
                        <option value="">ALL SCENARIOS</option>
                        {scenarios.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Target Organization</label>
                    <select
                        value={companyFilter}
                        onChange={(e) => setCompanyFilter(e.target.value)}
                        className="w-full bg-gray-900 light:bg-gray-50 border border-gray-700 light:border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-white light:text-gray-900 outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all appearance-none cursor-pointer"
                    >
                        <option value="">ALL TARGETS</option>
                        <option value="global">GLOBAL BASELINE</option>
                        {companies.map(c => <option key={c._id} value={c._id}>{c.name.toUpperCase()}</option>)}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Sensor Category</label>
                    <select
                        value={sensorFilter}
                        onChange={(e) => setSensorFilter(e.target.value)}
                        className="w-full bg-gray-900 light:bg-gray-50 border border-gray-700 light:border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-white light:text-gray-900 outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all appearance-none cursor-pointer"
                    >
                        <option value="">ALL SENSORS</option>
                        {sensorTypes.map(st => <option key={st.id} value={st.id}>{st.name.toUpperCase()}</option>)}
                    </select>
                </div>
            </div>

            {error && !showModal && (
                <div className="bg-red-900/40 border border-red-500 light:border-red-700 text-red-200 px-4 py-3 rounded-lg flex items-center justify-between">
                    <span>{error}</span>
                    <button aria-label="Close error message" onClick={() => setError(null)}>✕</button>
                </div>
                )}

                {success && (
                <div className="bg-green-900/40 border border-green-500 light:border-green-700 text-green-200 light:text-green-900 px-4 py-3 rounded-lg flex items-center justify-between">
                    <span>{success}</span>
                    <button aria-label="Close success message" onClick={() => setSuccess(null)}>✕</button>
                </div>
                )}

            {/* Table / Card List */}
            <div className="bg-gray-800 light:bg-white rounded-xl border border-gray-700 light:border-gray-200 overflow-hidden shadow-xl">
                {/* Desktop Table - ORIGINAL */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-700/50 light:bg-gray-200/50 text-gray-300 light:text-gray-700 light:text-gray-600 text-xs font-bold uppercase tracking-wider">
                                <th className="px-6 py-4">Scenario</th>
                                <th className="px-6 py-4">Sensor Type</th>
                                <th className="px-6 py-4">Target (Company)</th>
                                <th className="px-6 py-4">Ranges</th>
                                <th className="px-6 py-4">Unit</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700 light:divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">Loading configurations...</td>
                                </tr>
                            ) : filteredThresholds.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">No threshold configurations found matching filters.</td>
                                </tr>
                            ) : (
                                filteredThresholds.map((t) => (
                                    <tr key={t._id} className="hover:bg-gray-700/30 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="capitalize">{t.scenario.replace('_', ' ')}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-cyan-400 light:text-cyan-800 font-mono text-sm">
                                            {t.sensor_type}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {!t.company_id ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 light:bg-blue-100 light:text-blue-900 text-xs font-bold border border-blue-500/30 light:border-blue-300">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                                                    System Baseline
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 light:bg-amber-100 light:text-amber-900 text-xs font-bold border border-amber-500 light:border-amber-700/30">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                                    {companies.find(c => c._id === t.company_id)?.name || 'Unknown Company'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap space-y-1">
                                            <div className="flex gap-2 text-xs">
                                                <span className="text-gray-400 light:text-gray-500 w-16">Warning:</span>
                                                <span className="text-amber-400 light:text-amber-800 font-semibold">{t.warning_min ?? '—'} to {t.warning_max ?? '—'}</span>
                                            </div>
                                            <div className="flex gap-2 text-xs">
                                                <span className="text-gray-400 light:text-gray-500 w-16">Critical:</span>
                                                <span className="text-red-400 light:text-red-800 font-semibold">{t.critical_min ?? '—'} to {t.critical_max ?? '—'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-300 light:text-gray-700 light:text-gray-600 font-semibold">
                                            {t.unit || '—'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right font-bold">
                                            <div className="flex justify-end gap-3 transition-opacity">
                                                <button
                                                    onClick={() => openModal(t)}
                                                    className="text-cyan-400 light:text-cyan-800 hover:text-cyan-300 light:hover:text-cyan-600"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => t._id && handleDelete(t._id)}
                                                    className="text-red-400 light:text-red-800 hover:text-red-300 light:hover:text-red-600"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card List - NEW */}
                <div className="md:hidden divide-y divide-gray-700 light:divide-gray-200">
                    {loading ? (
                        <div className="p-10 text-center text-gray-400 light:text-gray-500 text-sm">Loading...</div>
                    ) : filteredThresholds.length === 0 ? (
                        <div className="p-10 text-center text-gray-400 light:text-gray-500 text-sm italic">No configurations found.</div>
                    ) : (
                        filteredThresholds.map((t) => (
                            <div key={t._id} className="p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-sm font-bold text-white light:text-gray-900 uppercase tracking-tight">{t.scenario.replace('_', ' ')}</div>
                                        <div className="text-[10px] text-cyan-400 light:text-cyan-800 font-mono mt-0.5">{t.sensor_type}</div>
                                    </div>
                                    <div className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-gray-700 light:border-gray-200">
                                        {t.unit || 'NO UNIT'}
                                    </div>
                                </div>
                                
                                <div className="bg-gray-900/50 light:bg-gray-100/50 p-2 rounded border border-gray-700/50 space-y-1">
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-amber-500 font-bold uppercase">Warning:</span>
                                        <span className="text-gray-300 light:text-gray-700 light:text-gray-600 font-mono">{t.warning_min ?? '—'} ↔ {t.warning_max ?? '—'}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-red-500 font-bold uppercase">Critical:</span>
                                        <span className="text-gray-300 light:text-gray-700 light:text-gray-600 font-mono">{t.critical_min ?? '—'} ↔ {t.critical_max ?? '—'}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                    {!t.company_id ? (
                                        <span className="text-[9px] font-bold text-blue-400 light:text-blue-900 uppercase tracking-widest bg-blue-400/10 light:bg-blue-100 px-2 py-0.5 rounded">SYSTEM BASELINE</span>
                                    ) : (
                                        <span className="text-[9px] font-bold text-amber-400 light:text-amber-800 uppercase tracking-widest bg-amber-400/10 px-2 py-0.5 rounded truncate max-w-[150px]">
                                            {companies.find(c => c._id === t.company_id)?.name || 'ORG'}
                                        </span>
                                    )}
                                    <div className="flex gap-2">
                                        <button onClick={() => openModal(t)} className="p-2 bg-gray-700 light:bg-gray-100 text-white light:text-gray-900 rounded">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </button>
                                        <button onClick={() => t._id && handleDelete(t._id)} className="p-2 bg-red-900/20 text-red-500 border border-red-900/30 rounded">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
                    <div className="bg-gray-800 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-700 light:border-gray-200 flex justify-between items-center bg-gray-700/30">
                            <h3 className="text-xl font-bold text-white light:text-gray-900">
                                {editingThreshold ? 'Edit Threshold' : 'Create New Threshold'}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 light:text-gray-500 hover:text-white light:hover:text-gray-900 transition h-8 w-8 rounded-full hover:bg-gray-700 light:hover:bg-gray-200 flex items-center justify-center"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            {error && (
                                <div className="bg-red-900/40 border border-red-500 light:border-red-700 text-red-200 px-3 py-2 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="bg-green-900/40 border border-green-500 light:border-green-700 text-green-200 light:text-green-900 px-3 py-2 rounded-lg text-sm">
                                    {success}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 light:text-gray-500 uppercase mb-1">Scenario</label>
                                    <select
                                        value={formScenario}
                                        onChange={(e) => setFormScenario(e.target.value)}
                                        required
                                        disabled={!!editingThreshold}
                                        className={`w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white ${editingThreshold ? 'opacity-60 cursor-not-allowed' : ''} light:bg-gray-100 light:text-gray-900 light:border-gray-300`}
                                    >
                                        {scenarios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 light:text-gray-500 uppercase mb-1">Sensor Type</label>
                                    <select
                                        value={formSensorType}
                                        onChange={(e) => setFormSensorType(e.target.value)}
                                        required
                                        disabled={!!editingThreshold}
                                        className={`w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white ${editingThreshold ? 'opacity-60 cursor-not-allowed' : ''} light:bg-gray-100 light:text-gray-900 light:border-gray-300`}
                                    >
                                        {sensorTypes.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-400 light:text-gray-500 uppercase mb-1">Target (Company)</label>
                                <select
                                    value={formCompanyId || ''}
                                    onChange={(e) => setFormCompanyId(e.target.value || null)}
                                    disabled={!!editingThreshold}
                                    className={`w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white ${editingThreshold ? 'opacity-60 cursor-not-allowed' : ''} light:bg-gray-100 light:text-gray-900 light:border-gray-300`}
                                >
                                    <option value="">System Baseline (Global Default)</option>
                                    {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-amber-400 light:text-amber-800/80 uppercase mb-1">Warning Min</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={warningMin}
                                        onChange={(e) => setWarningMin(e.target.value)}
                                        className="w-full bg-gray-700 light:bg-gray-100 border border-gray-600 light:border-gray-300 rounded-lg px-3 py-2 text-white light:text-gray-900"
                                        placeholder="Optional"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-amber-400 light:text-amber-800/80 uppercase mb-1">Warning Max</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={warningMax}
                                        onChange={(e) => setWarningMax(e.target.value)}
                                        className="w-full bg-gray-700 light:bg-gray-100 border border-gray-600 light:border-gray-300 rounded-lg px-3 py-2 text-white light:text-gray-900"
                                        placeholder="Optional"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-red-400 light:text-red-800/80 uppercase mb-1">Critical Min</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={criticalMin}
                                        onChange={(e) => setCriticalMin(e.target.value)}
                                        className="w-full bg-gray-700 light:bg-gray-100 border border-gray-600 light:border-gray-300 rounded-lg px-3 py-2 text-white light:text-gray-900"
                                        placeholder="Optional"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-red-400 light:text-red-800/80 uppercase mb-1">Critical Max</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={criticalMax}
                                        onChange={(e) => setCriticalMax(e.target.value)}
                                        className="w-full bg-gray-700 light:bg-gray-100 border border-gray-600 light:border-gray-300 rounded-lg px-3 py-2 text-white light:text-gray-900"
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-400 light:text-gray-500 uppercase mb-1">Unit</label>
                                <input
                                    type="text"
                                    value={unit}
                                    onChange={(e) => setUnit(e.target.value)}
                                    className="w-full bg-gray-700 light:bg-gray-100 border border-gray-600 light:border-gray-300 rounded-lg px-3 py-2 text-white light:text-gray-900"
                                    placeholder="e.g. °C, %, ppm"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700 light:border-gray-200">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 border border-gray-600 light:border-gray-300 text-gray-300 light:text-gray-700 light:text-gray-600 rounded-lg hover:bg-gray-700 light:hover:bg-gray-200 transition font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white light:text-white rounded-lg font-bold transition disabled:opacity-50 flex items-center gap-2"
                                >
                                    {formLoading ? 'Saving...' : 'Save Configuration'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ThresholdManagementPage;
