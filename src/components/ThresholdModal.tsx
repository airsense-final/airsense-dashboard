import React, { useState, useEffect } from 'react';
import { listThresholds, saveThreshold } from '../services/apiService';
import { resolveHwKey } from '../types/types';

interface ThresholdModalProps {
    isOpen: boolean;
    onClose: () => void;
    sensorId: string;
    sensorName: string;
    sensorType: string;
    companyId?: string;
    scenario: string; // From parent
    onSuccess?: () => void;
}

export const ThresholdModal: React.FC<ThresholdModalProps> = ({
    isOpen,
    onClose,
    sensorId,
    sensorName,
    sensorType,
    companyId,
    scenario,
    onSuccess,
}) => {
    // State
    const [activeTab, setActiveTab] = useState<'active' | 'configure'>('configure');

    // Form State
    const [warningMin, setWarningMin] = useState('');
    const [criticalMin, setCriticalMin] = useState('');
    const [warningMax, setWarningMax] = useState('');
    const [criticalMax, setCriticalMax] = useState('');
    const [unit, setUnit] = useState('');

    // Data State
    const [loading, setLoading] = useState(false);
    const [activeThreshold, setActiveThreshold] = useState<any>(null);
    const [globalThreshold, setGlobalThreshold] = useState<any>(null);
    const [companyThreshold, setCompanyThreshold] = useState<any>(null);

    const getSensorUnit = (sensorType: string): string => {
        const unitMap: Record<string, string> = {
            'dht11_temp': '°C',
            'dht11_hum': '%',
            'scd40': 'ppm',
            'mq4': 'ppm',
            'mq7': 'ppm',
            'mq3': 'mg/L',
            'mq135': 'ppm',
            'mq9': 'ppm',
            'Temperature': '°C',
            'Humidity': '%',
            'CO2 Sensor': 'ppm',
            'Methane Sensor': 'ppm',
            'CO Sensor': 'ppm',
            'Alcohol Sensor': 'mg/L',
            'Air Quality': 'ppm',
            'Flammable Gas Sensor': 'ppm',
        };
        return unitMap[sensorType] || '';
    };

    useEffect(() => {
        if (!isOpen) return;
        setUnit(getSensorUnit(sensorType));
        loadThresholds();
    }, [isOpen, scenario, sensorType, companyId]);

    const loadThresholds = async () => {
        try {
            setLoading(true);
            const configs = await listThresholds(scenario);
            const hwKey = resolveHwKey(sensorType);

            const global = configs.find(config =>
                config.sensor_type === hwKey &&
                !config.company_id
            );
            setGlobalThreshold(global || null);

            let custom = null;
            if (companyId) {
                custom = configs.find(config =>
                    config.sensor_type === hwKey &&
                    config.company_id === companyId
                );
            }
            setCompanyThreshold(custom || null);

            const effective = custom || global;
            setActiveThreshold(effective || null);

            if (effective) {
                setWarningMin(effective.warning_min != null ? String(effective.warning_min) : '');
                setCriticalMin(effective.critical_min != null ? String(effective.critical_min) : '');
                setWarningMax(effective.warning_max != null ? String(effective.warning_max) : '');
                setCriticalMax(effective.critical_max != null ? String(effective.critical_max) : '');
                setUnit(effective.unit || getSensorUnit(sensorType));
            } else {
                setWarningMin('');
                setCriticalMin('');
                setWarningMax('');
                setCriticalMax('');
                setUnit(getSensorUnit(sensorType));
            }
        } catch (err) {
            console.error('Failed to load thresholds:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const payload = {
                sensor_type: resolveHwKey(sensorType),
                scenario: scenario,
                warning_min: warningMin ? Number(warningMin) : null,
                critical_min: criticalMin ? Number(criticalMin) : null,
                warning_max: warningMax ? Number(warningMax) : null,
                critical_max: criticalMax ? Number(criticalMax) : null,
                unit: unit || undefined,
                company_id: companyId || undefined,
            };

            await saveThreshold(payload);
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error('Failed to save threshold:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-[#1f2937] rounded-lg p-6 max-w-2xl w-full border border-gray-700 light:border-gray-200 shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white light:text-gray-900">Edit Thresholds</h2>
                    <button onClick={onClose} className="text-gray-400 light:text-gray-500 hover:text-white light:hover:text-gray-900 transition-colors">
                        <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="mb-6">
                    <p className="text-sm text-gray-400 light:text-gray-500">Sensor: <span className="text-gray-200 light:text-gray-800">{sensorName}</span> <span className="text-gray-500">({sensorType})</span></p>
                    <p className="text-xs text-gray-500 font-mono mt-1">ID: {sensorId}</p>
                </div>

                {/* Tabs */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`py-2 px-4 rounded-md font-medium text-sm transition-all duration-200 ${activeTab === 'active'
                            ? 'bg-[#374151] text-white border border-gray-500'
                            : 'bg-[#1F2937] text-gray-400 hover:bg-[#374151] border border-gray-700'
                            } light:text-gray-900 light:text-gray-500 light:border-gray-200`}
                    >
                        Active Values
                    </button>
                    <button
                        onClick={() => setActiveTab('configure')}
                        className={`py-2 px-4 rounded-md font-medium text-sm transition-all duration-200 ${activeTab === 'configure'
                            ? 'bg-[#D97706] text-white border border-[#D97706]'
                            : 'bg-[#1F2937] text-gray-400 hover:bg-[#374151] border border-gray-700'
                            } light:text-gray-900 light:text-gray-500 light:border-gray-200`}
                    >
                        Configure Threshold
                    </button>
                </div>

                {/* Content Area */}
                <div className="min-h-[300px]">
                    {activeTab === 'active' ? (
                        <div className="flex flex-col items-center justify-center h-[300px] text-center border border-dashed border-gray-700 light:border-gray-200 rounded-lg bg-gray-800/30">
                            {!activeThreshold ? (
                                <div className="space-y-4">
                                    <p className="text-gray-400 light:text-gray-500">No active values found.</p>
                                    <button
                                        onClick={() => setActiveTab('configure')}
                                        className="text-cyan-400 light:text-cyan-800 hover:text-cyan-300 font-medium underline text-sm"
                                    >
                                        Configure now
                                    </button>
                                </div>
                            ) : (
                                <div className="w-full p-6 space-y-6">
                                    <div className={`p-4 rounded-lg border flex items-center gap-4 ${companyThreshold
                                        ? 'bg-purple-900/20 light:bg-purple-100 border-purple-500 light:border-purple-700/30'
                                        : 'bg-blue-900/20 border-blue-500/30'
                                        }`}>
                                        <div className="text-2xl">{companyThreshold ? '🏢' : '🌐'}</div>
                                        <div className="text-left">
                                            <h3 className={`font-semibold text-sm ${companyThreshold ? 'text-purple-300' : 'text-blue-300'
                                                }`}>
                                                {companyThreshold ? 'Company Specific' : 'Global Default'}
                                            </h3>
                                            <p className="text-xs text-gray-400 light:text-gray-500">
                                                Active currently.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 light:border-gray-200">
                                            <h4 className="text-amber-400 light:text-amber-800 text-xs font-bold uppercase tracking-wider mb-2">Warning Range</h4>
                                            <div className="text-sm text-gray-300 light:text-gray-700 light:text-gray-600 space-y-1">
                                                <div className="flex justify-between"><span>Min:</span> <span className="text-white light:text-gray-900 font-mono">{activeThreshold.warning_min ?? '--'}</span></div>
                                                <div className="flex justify-between"><span>Max:</span> <span className="text-white light:text-gray-900 font-mono">{activeThreshold.warning_max ?? '--'}</span></div>
                                            </div>
                                        </div>
                                        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 light:border-gray-200">
                                            <h4 className="text-red-400 light:text-red-800 text-xs font-bold uppercase tracking-wider mb-2">Critical Range</h4>
                                            <div className="text-sm text-gray-300 light:text-gray-700 light:text-gray-600 space-y-1">
                                                <div className="flex justify-between"><span>Min:</span> <span className="text-white light:text-gray-900 font-mono">{activeThreshold.critical_min ?? '--'}</span></div>
                                                <div className="flex justify-between"><span>Max:</span> <span className="text-white light:text-gray-900 font-mono">{activeThreshold.critical_max ?? '--'}</span></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            {/* Global Values Info Box */}
                            <div className="bg-[#1e3a8a]/20 border border-blue-500/30 rounded-lg p-5 mb-6">
                                <h4 className="text-blue-400 text-base font-bold mb-4 flex items-center gap-2">
                                    <span className="text-xl">📊</span> Global Default Values:
                                </h4>
                                {globalThreshold ? (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-300 light:text-gray-700 light:text-gray-600">Warning Min:</span>
                                                <span className="text-amber-400 light:text-amber-800 font-bold text-base">{globalThreshold.warning_min ?? '-'}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-300 light:text-gray-700 light:text-gray-600">Critical Min:</span>
                                                <span className="text-red-400 light:text-red-800 font-bold text-base">{globalThreshold.critical_min ?? '-'}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-300 light:text-gray-700 light:text-gray-600">Warning Max:</span>
                                                <span className="text-amber-400 light:text-amber-800 font-bold text-base">{globalThreshold.warning_max ?? '-'}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-300 light:text-gray-700 light:text-gray-600">Critical Max:</span>
                                                <span className="text-red-400 light:text-red-800 font-bold text-base">{globalThreshold.critical_max ?? '-'}</span>
                                            </div>
                                        </div>
                                        <div className="pt-2 mt-2 border-t border-blue-500/20 flex items-center gap-2">
                                            <span className="text-gray-400 light:text-gray-500 text-sm">Unit:</span>
                                            <span className="text-cyan-400 light:text-cyan-800 font-bold">{globalThreshold.unit || getSensorUnit(sensorType) || '-'}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 light:text-gray-500 italic">No global defaults defined for this scenario.</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 light:text-gray-500 mb-1 uppercase">Warning Range</label>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Warning Min</label>
                                                <input
                                                    type="number"
                                                    value={warningMin}
                                                    onChange={(e) => setWarningMin(e.target.value)}
                                                    className="w-full bg-[#374151] border border-gray-600 light:border-gray-300 rounded-md px-3 py-2 text-white light:text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none placeholder-gray-500 text-sm"
                                                    placeholder="Optional"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Warning Max</label>
                                                <input
                                                    type="number"
                                                    value={warningMax}
                                                    onChange={(e) => setWarningMax(e.target.value)}
                                                    className="w-full bg-[#374151] border border-gray-600 light:border-gray-300 rounded-md px-3 py-2 text-white light:text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none placeholder-gray-500 text-sm"
                                                    placeholder="Optional"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 light:text-gray-500 mb-1 uppercase">Critical Range</label>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Critical Min</label>
                                                <input
                                                    type="number"
                                                    value={criticalMin}
                                                    onChange={(e) => setCriticalMin(e.target.value)}
                                                    className="w-full bg-[#374151] border border-gray-600 light:border-gray-300 rounded-md px-3 py-2 text-white light:text-gray-900 focus:ring-1 focus:ring-red-500 outline-none placeholder-gray-500 text-sm"
                                                    placeholder="Optional"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Critical Max</label>
                                                <input
                                                    type="number"
                                                    value={criticalMax}
                                                    onChange={(e) => setCriticalMax(e.target.value)}
                                                    className="w-full bg-[#374151] border border-gray-600 light:border-gray-300 rounded-md px-3 py-2 text-white light:text-gray-900 focus:ring-1 focus:ring-red-500 outline-none placeholder-gray-500 text-sm"
                                                    placeholder="Optional"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700 light:border-gray-200">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 border border-gray-600 light:border-gray-300 rounded-md hover:bg-gray-700 light:hover:bg-gray-200 text-sm font-medium transition-colors text-gray-300 light:text-gray-700 light:text-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md text-sm font-medium transition-all shadow-lg disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : 'Apply'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
