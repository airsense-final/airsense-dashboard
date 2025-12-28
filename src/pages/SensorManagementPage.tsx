import React, { useState, useEffect } from 'react';
import { listSensors, createSensor, updateSensor, deleteSensor, getCompanies, getCurrentUser, listThresholds, saveThreshold, deleteThreshold } from '../services/apiService';
import type { ThresholdConfig } from '../types/types';

const SensorManagementPage: React.FC = () => {
  const [sensors, setSensors] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState<any>(null);
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [thresholdSensor, setThresholdSensor] = useState<any>(null);
  const [thresholdScenario, setThresholdScenario] = useState('indoor_small');
  const [thresholdCompanyId, setThresholdCompanyId] = useState<string | null>(null);
  const [effectiveThreshold, setEffectiveThreshold] = useState<ThresholdConfig | null>(null);
  const [globalThreshold, setGlobalThreshold] = useState<ThresholdConfig | null>(null);
  const [thresholdLoading, setThresholdLoading] = useState(false);
  const [thresholdError, setThresholdError] = useState<string | null>(null);
  const [thresholdSuccess, setThresholdSuccess] = useState<string | null>(null);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [warningMin, setWarningMin] = useState('');
  const [criticalMin, setCriticalMin] = useState('');
  const [warningMax, setWarningMax] = useState('');
  const [criticalMax, setCriticalMax] = useState('');
  const [thresholdUnit, setThresholdUnit] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    sensor_id: '',
    sensor_name: '',
    sensor_type: '',
    location: 'Unknown',
    company_name: ''
  });

  const sensorTypes = [
    { key: 'dht11_temp', name: 'DHT11 Temperature', type: 'Temperature' },
    { key: 'dht11_hum', name: 'DHT11 Humidity', type: 'Humidity' },
    { key: 'scd40', name: 'SCD-40 CO2', type: 'CO2 Sensor' },
    { key: 'mq4', name: 'MQ-4 Methane', type: 'Methane Sensor' },
    { key: 'mq7', name: 'MQ-7 CO Sensor', type: 'CO Sensor' },
    { key: 'mq3', name: 'MQ-3 Alcohol', type: 'Alcohol Sensor' },
    { key: 'mq135', name: 'MQ-135 Air Quality', type: 'Air Quality' },
    { key: 'mq9', name: 'MQ-9 Carbon Monoxide', type: 'Flammable Gas Sensor' },
    { key: 'bh1750', name: 'BH1750 Light', type: 'Light Sensor' }
  ];

  // Auto-generate sensor_id when sensor type and company are selected
  useEffect(() => {
    if (formData.sensor_type && formData.company_name && showCreateModal) {
      // Find the sensor type key
      const sensorType = sensorTypes.find(s => s.type === formData.sensor_type);
      if (!sensorType) return;

      // Find existing sensors of this type for this company
      const pattern = `${formData.company_name}_${sensorType.key}_`;
      const existingSensors = sensors.filter(s =>
        s.sensor_id.startsWith(pattern)
      );

      // Find the highest index
      let maxIndex = 0;
      existingSensors.forEach(s => {
        const parts = s.sensor_id.split('_');
        const lastPart = parts[parts.length - 1];
        const index = parseInt(lastPart);
        if (!isNaN(index) && index > maxIndex) {
          maxIndex = index;
        }
      });

      const nextIndex = maxIndex + 1;
      const generatedId = `${formData.company_name}_${sensorType.key}_${nextIndex}`;
      setFormData(prev => ({ ...prev, sensor_id: generatedId }));
    }
  }, [formData.sensor_type, formData.company_name, showCreateModal, sensors]);

  useEffect(() => {
    loadData();
  }, [selectedCompany]);

  useEffect(() => {
    const resetFields = () => {
      setEffectiveThreshold(null);
      setGlobalThreshold(null);
      setWarningMin('');
      setCriticalMin('');
      setWarningMax('');
      setCriticalMax('');
      setThresholdUnit('');
      setThresholdLoading(false);
      setThresholdSuccess(null);
      setThresholdError(null);
      setIsCustomizing(false);
    };

    const loadThreshold = async () => {
      if (!showThresholdModal || !thresholdSensor) {
        resetFields();
        return;
      }

      const scenarioKey = thresholdScenario.trim();
      if (!scenarioKey) {
        resetFields();
        return;
      }

      try {
        setThresholdLoading(true);
        setThresholdError(null);

        const configs = await listThresholds(scenarioKey);
        const hwKey = getHardwareKey(thresholdSensor.sensor_type);

        // 1. Identify Global Default (company_id is null/undefined)
        const globalMatch = configs.find(config =>
          config.sensor_type === hwKey &&
          (config.company_id === null || config.company_id === undefined)
        );

        // 2. Identify Company-Specific Override
        let localMatch = null;
        if (thresholdCompanyId) {
          localMatch = configs.find(config =>
            config.sensor_type === hwKey &&
            config.company_id === thresholdCompanyId
          );
        }

        setGlobalThreshold(globalMatch || null);
        setEffectiveThreshold(localMatch || globalMatch || null);

        // ALWAYS initialize input fields with Global values first, 
        // because we start in "Global Threshold Values" mode (isCustomizing = false)
        if (globalMatch) {
          setThresholdUnit(globalMatch.unit ?? getSensorUnit(thresholdSensor.sensor_type));
          setWarningMin(globalMatch.warning_min != null ? String(globalMatch.warning_min) : '');
          setCriticalMin(globalMatch.critical_min != null ? String(globalMatch.critical_min) : '');
          setWarningMax(globalMatch.warning_max != null ? String(globalMatch.warning_max) : '');
          setCriticalMax(globalMatch.critical_max != null ? String(globalMatch.critical_max) : '');
        } else {
          setWarningMin('');
          setCriticalMin('');
          setWarningMax('');
          setCriticalMax('');
          setThresholdUnit(getSensorUnit(thresholdSensor.sensor_type));
        }
      } catch (err: any) {
        setThresholdError(err?.message || 'Failed to load thresholds');
      } finally {
        setThresholdLoading(false);
      }
    };

    loadThreshold();
  }, [showThresholdModal, thresholdSensor, thresholdScenario, thresholdCompanyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load current user
      const user = await getCurrentUser();
      setCurrentUser(user);

      // Load companies if superadmin
      if (user.role === 'superadmin') {
        const companiesData = await getCompanies();
        setCompanies(companiesData);
      }

      // Load sensors
      const sensorsData = await listSensors(selectedCompany || undefined);
      setSensors(sensorsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

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

  const getHardwareKey = (sensorType: string): string => {
    const typeMap: Record<string, string> = {
      'Temperature': 'dht11_temp',
      'Humidity': 'dht11_hum',
      'CO2 Sensor': 'scd40',
      'Methane Sensor': 'mq4',
      'CO Sensor': 'mq7',
      'Alcohol Sensor': 'mq3',
      'Air Quality': 'mq135',
      'Flammable Gas Sensor': 'mq9',
    };
    return typeMap[sensorType] || sensorType;
  };

  const openThresholdModal = async (sensor: any) => {

    setThresholdSensor(sensor);
    setThresholdScenario('indoor_small');
    // Lock the context to the sensor's company directly, no more dynamic switching here
    setThresholdCompanyId(sensor.company_id || null);
    setThresholdError(null);
    setThresholdSuccess(null);
    setEffectiveThreshold(null);
    setGlobalThreshold(null);
    setIsCustomizing(false);  // Default to "Use Global Defaults" mode
    setShowThresholdModal(true);

    // Try to fetch unit from any existing threshold config
    try {
      const hwKey = getHardwareKey(sensor.sensor_type);
      // Check all scenarios to find any threshold with unit info
      const scenarios = ['indoor_small', 'indoor_large', 'outdoor'];
      let foundUnit = '';

      for (const scenario of scenarios) {
        const configs = await listThresholds(scenario);
        const match = configs.find(cfg => cfg.sensor_type === hwKey);
        if (match?.unit) {
          foundUnit = match.unit;
          break;
        }
      }

      setThresholdUnit(foundUnit || getSensorUnit(sensor.sensor_type));
    } catch (err) {
      // Fallback to hardcoded if API fails
      setThresholdUnit(getSensorUnit(sensor.sensor_type));
    }
  };

  const closeThresholdModal = () => {
    setShowThresholdModal(false);
    setThresholdSensor(null);
    setThresholdError(null);
    setThresholdSuccess(null);
    setEffectiveThreshold(null);
    setGlobalThreshold(null);
    setIsCustomizing(false);
  };

  const handleSaveThreshold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thresholdSensor || !effectiveThreshold || !isCustomizing) return;

    const scenarioKey = thresholdScenario.trim();
    if (!scenarioKey) {
      setThresholdError('Scenario is required');
      return;
    }

    // Customizing mode: validate and save custom values
    const parseValue = (value: string) => {
      if (!value.trim()) return null;
      const parsed = Number(value);
      return Number.isNaN(parsed) ? NaN : parsed;
    };

    const parsedWarningMin = parseValue(warningMin);
    if (Number.isNaN(parsedWarningMin)) {
      setThresholdError('warning_min must be a number');
      return;
    }

    const parsedCriticalMin = parseValue(criticalMin);
    if (Number.isNaN(parsedCriticalMin)) {
      setThresholdError('critical_min must be a number');
      return;
    }

    const parsedWarningMax = parseValue(warningMax);
    if (Number.isNaN(parsedWarningMax)) {
      setThresholdError('warning_max must be a number');
      return;
    }

    const parsedCriticalMax = parseValue(criticalMax);
    if (Number.isNaN(parsedCriticalMax)) {
      setThresholdError('critical_max must be a number');
      return;
    }

    // Redundancy check: If company-specific values match global exactly, don't save
    if (thresholdCompanyId && globalThreshold) {
      const isRedundant =
        parsedWarningMin === globalThreshold.warning_min &&
        parsedCriticalMin === globalThreshold.critical_min &&
        parsedWarningMax === globalThreshold.warning_max &&
        parsedCriticalMax === globalThreshold.critical_max &&
        (thresholdUnit || getSensorUnit(thresholdSensor.sensor_type)) === (globalThreshold.unit || getSensorUnit(thresholdSensor.sensor_type));

      if (isRedundant) {
        setThresholdError('These values match Global Defaults. A separate customization is not needed.');
        return;
      }
    }

    // For SuperAdmin: can edit global (null company_id)
    // For CompanyAdmin: must have a company_id
    if (!thresholdCompanyId && currentUser?.role !== 'superadmin') {
      setThresholdError('Only Super Admins can modify Global Defaults.');
      return;
    }

    const payload = {
      sensor_type: getHardwareKey(thresholdSensor.sensor_type),
      scenario: scenarioKey,
      warning_min: parsedWarningMin,
      critical_min: parsedCriticalMin,
      warning_max: parsedWarningMax,
      critical_max: parsedCriticalMax,
      unit: thresholdUnit || undefined,
      company_id: thresholdCompanyId || undefined, // Allow null/undefined for Global (Super Admin)
    };

    try {
      setThresholdLoading(true);
      setThresholdError(null);
      setThresholdSuccess(null);
      const saved = await saveThreshold(payload);
      setEffectiveThreshold(saved);
      // NOTE: globalThreshold is NOT updated here, preserving original defaults display
      setThresholdSuccess('Custom values saved successfully.');
      // Keep customize mode active so user can continue editing
    } catch (err: any) {
      setThresholdError(err?.message || 'Failed to save threshold');
    } finally {
      setThresholdLoading(false);
    }
  };

  const handleSetGlobalDefaults = async () => {
    // Revert to global defaults by deleting company-specific override
    if (!thresholdSensor || !thresholdCompanyId) return;

    // Only delete if there's actually a company-specific override (where company_id matches)
    if (!effectiveThreshold || effectiveThreshold.company_id !== thresholdCompanyId) {
      setThresholdSuccess('Already using global defaults.');
      return;
    }

    const confirmed = window.confirm('Are you sure you want to use Global Defaults? This will delete your custom configuration for this scenario.');
    if (!confirmed) return;

    try {
      setThresholdLoading(true);
      setThresholdError(null);
      if (!effectiveThreshold?._id) throw new Error('Threshold configuration is missing an ID');
      await deleteThreshold(effectiveThreshold._id);

      // Update local state: effectiveThreshold becomes globalThreshold
      setEffectiveThreshold(globalThreshold);

      // Reset input fields to global values
      if (globalThreshold) {
        setWarningMin(globalThreshold.warning_min != null ? String(globalThreshold.warning_min) : '');
        setCriticalMin(globalThreshold.critical_min != null ? String(globalThreshold.critical_min) : '');
        setWarningMax(globalThreshold.warning_max != null ? String(globalThreshold.warning_max) : '');
        setCriticalMax(globalThreshold.critical_max != null ? String(globalThreshold.critical_max) : '');
      } else {
        setWarningMin('');
        setCriticalMin('');
        setWarningMax('');
        setCriticalMax('');
      }

      setThresholdSuccess('Reverted to Global Defaults successfully.');
    } catch (err: any) {
      setThresholdError(err?.message || 'Failed to revert to global defaults');
    } finally {
      setThresholdLoading(false);
    }
  };

  const handleDeleteThreshold = async () => {
    if (!effectiveThreshold?._id) return;

    const isGlobalDelete = !thresholdCompanyId;
    const message = isGlobalDelete
      ? 'WARNING: You are about to delete a GLOBAL threshold configuration. This will affect all companies using defaults. Proceed?'
      : 'Delete your custom threshold settings and revert to system defaults?';

    const confirmed = window.confirm(message);
    if (!confirmed) return;

    try {
      setThresholdLoading(true);
      setThresholdError(null);
      await deleteThreshold(effectiveThreshold._id);

      if (isGlobalDelete) {
        // Super Admin deleted the Global Baseline
        setGlobalThreshold(null);
        setEffectiveThreshold(null);
        setWarningMin('');
        setCriticalMin('');
        setWarningMax('');
        setCriticalMax('');
        setThresholdUnit(getSensorUnit(thresholdSensor.sensor_type));
        setThresholdSuccess('Global threshold configuration deleted successfully.');
      } else {
        // Company customization deleted, revert to global
        setEffectiveThreshold(globalThreshold);
        if (globalThreshold) {
          setWarningMin(globalThreshold.warning_min != null ? String(globalThreshold.warning_min) : '');
          setCriticalMin(globalThreshold.critical_min != null ? String(globalThreshold.critical_min) : '');
          setWarningMax(globalThreshold.warning_max != null ? String(globalThreshold.warning_max) : '');
          setCriticalMax(globalThreshold.critical_max != null ? String(globalThreshold.critical_max) : '');
          setThresholdUnit(globalThreshold.unit ?? getSensorUnit(thresholdSensor.sensor_type));
        } else {
          setWarningMin('');
          setCriticalMin('');
          setWarningMax('');
          setCriticalMax('');
          setThresholdUnit(getSensorUnit(thresholdSensor.sensor_type));
        }
        setThresholdSuccess('Customization deleted. Reverted to global defaults.');
      }

      setIsCustomizing(false); // Reset to Global view mode
    } catch (err: any) {
      setThresholdError(err?.message || 'Failed to delete threshold');
    } finally {
      setThresholdLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await createSensor(formData);
      setShowCreateModal(false);
      setFormData({ sensor_id: '', sensor_name: '', sensor_type: '', location: 'Unknown', company_name: '' });
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create sensor');
    }
  };

  const openCreateModal = () => {
    // Auto-fill company name for company admin
    const companyName = currentUser?.role === 'companyadmin' ? currentUser.company_name : '';
    setFormData({ sensor_id: '', sensor_name: '', sensor_type: '', location: 'Unknown', company_name: companyName });
    setShowCreateModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSensor) return;

    try {
      setError(null);
      const { sensor_name, sensor_type, location } = formData;
      await updateSensor(selectedSensor.sensor_id, { sensor_name, sensor_type, location });
      setShowEditModal(false);
      setSelectedSensor(null);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update sensor');
    }
  };

  const handleDelete = async (sensorId: string) => {
    if (!window.confirm('Are you sure you want to delete this sensor?')) return;

    try {
      setError(null);
      await deleteSensor(sensorId);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete sensor');
    }
  };

  const openEditModal = (sensor: any) => {
    setSelectedSensor(sensor);
    setFormData({
      sensor_id: sensor.sensor_id,
      sensor_name: sensor.sensor_name,
      sensor_type: sensor.sensor_type,
      location: sensor.location || 'Unknown',
      company_name: ''
    });
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-xl text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Sensor Management</h1>
            <p className="text-gray-400 mt-1">
              Manage sensors for {currentUser?.role === 'superadmin' ? 'all companies' : currentUser?.company_name}
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition"
          >
            + Add Sensor
          </button>
        </div>

        {/* Company Filter (Super Admin Only) */}
        {currentUser?.role === 'superadmin' && (
          <div className="mb-6 bg-gray-800 p-4 rounded-lg">
            <label className="block text-sm font-medium mb-2">Filter by Company</label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full max-w-md px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="">All Companies</option>
              {companies.map((company) => (
                <option key={company._id} value={company.name}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Sensors Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Sensor ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {sensors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-400">
                    No sensors found. Click "Add Sensor" to create one.
                  </td>
                </tr>
              ) : (
                sensors.map((sensor) => (
                  <tr key={sensor._id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm font-mono">{sensor.sensor_id}</td>
                    <td className="px-6 py-4 text-sm">{sensor.sensor_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{sensor.sensor_type}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{sensor.location}</td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button
                        onClick={() => openEditModal(sensor)}
                        className="text-cyan-400 hover:text-cyan-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openThresholdModal(sensor)}
                        className="text-yellow-400 hover:text-yellow-300"
                      >
                        Thresholds
                      </button>
                      <button
                        onClick={() => handleDelete(sensor.sensor_id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Threshold Modal */}
        {showThresholdModal && thresholdSensor && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-xl w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Edit Thresholds</h2>
                <button onClick={closeThresholdModal} className="text-gray-300 hover:text-white">✕</button>
              </div>

              <div className="mb-4 text-sm text-gray-300">
                <div><span className="font-semibold">Sensor:</span> {thresholdSensor.sensor_name} ({thresholdSensor.sensor_type})</div>
                <div className="font-mono text-gray-400">ID: {thresholdSensor.sensor_id}</div>

                <div className="mt-3">
                  {effectiveThreshold?.company_id === thresholdCompanyId ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-semibold shadow-sm">
                      <span className="text-sm">⚙️</span> You are currently using: Customized Configuration
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/50 text-blue-300 text-xs font-semibold shadow-sm">
                      <span className="text-sm">🔒</span> You are currently using: Global System Defaults
                    </div>
                  )}
                </div>
              </div>

              {thresholdError && (
                <div className="mb-3 bg-red-900/50 border border-red-500 text-red-200 px-3 py-2 rounded">
                  {thresholdError}
                </div>
              )}

              {thresholdSuccess && (
                <div className="mb-3 bg-green-900/40 border border-green-500 text-green-200 px-3 py-2 rounded">
                  {thresholdSuccess}
                </div>
              )}

              <form onSubmit={handleSaveThreshold} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Scenario *</label>
                  <select
                    value={thresholdScenario}
                    onChange={(e) => setThresholdScenario(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  >
                    <option value="indoor_small">Indoor Small</option>
                    <option value="indoor_large">Indoor Large</option>
                    <option value="outdoor">Outdoor</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Choose the environment scenario for this sensor's thresholds.</p>
                </div>

                {effectiveThreshold && currentUser?.role !== 'viewer' && (
                  <>
                    {/* Mode Selection Buttons */}
                    <div className="flex gap-3 mb-4">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomizing(false);
                          // Revert input fields to Global values
                          if (globalThreshold) {
                            setWarningMin(globalThreshold.warning_min != null ? String(globalThreshold.warning_min) : '');
                            setCriticalMin(globalThreshold.critical_min != null ? String(globalThreshold.critical_min) : '');
                            setWarningMax(globalThreshold.warning_max != null ? String(globalThreshold.warning_max) : '');
                            setCriticalMax(globalThreshold.critical_max != null ? String(globalThreshold.critical_max) : '');
                          } else {
                            setWarningMin('');
                            setCriticalMin('');
                            setWarningMax('');
                            setCriticalMax('');
                          }
                        }}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${!isCustomizing
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                      >
                        View Baseline
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomizing(true);
                          // Pre-fill with effective values (current custom or global if none)
                          if (effectiveThreshold) {
                            setWarningMin(effectiveThreshold.warning_min != null ? String(effectiveThreshold.warning_min) : '');
                            setCriticalMin(effectiveThreshold.critical_min != null ? String(effectiveThreshold.critical_min) : '');
                            setWarningMax(effectiveThreshold.warning_max != null ? String(effectiveThreshold.warning_max) : '');
                            setCriticalMax(effectiveThreshold.critical_max != null ? String(effectiveThreshold.critical_max) : '');
                          }
                        }}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${isCustomizing
                          ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                      >
                        {!thresholdCompanyId
                          ? 'Edit Global Defaults'
                          : `Customize for ${companies.find(c => c._id === thresholdCompanyId)?.name || 'Company'}`}
                      </button>
                    </div>

                    {/* Global Default Values Box - Always Visible */}
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mb-4">
                      <p className="text-sm font-semibold text-blue-300 mb-2">📊 Global Default Values:</p>
                      {globalThreshold ? (
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                          <div>Warning Min: <span className="text-amber-400 font-semibold">{globalThreshold.warning_min ?? '—'}</span></div>
                          <div>Critical Min: <span className="text-red-400 font-semibold">{globalThreshold.critical_min ?? '—'}</span></div>
                          <div>Warning Max: <span className="text-amber-400 font-semibold">{globalThreshold.warning_max ?? '—'}</span></div>
                          <div>Critical Max: <span className="text-red-400 font-semibold">{globalThreshold.critical_max ?? '—'}</span></div>
                          {globalThreshold.unit && <div className="col-span-2">Unit: <span className="text-cyan-400 font-semibold">{globalThreshold.unit}</span></div>}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 italic">No global defaults defined for this scenario.</p>
                      )}
                    </div>

                    {/* Customization Mode Banner */}
                    {isCustomizing && (
                      <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3 mb-4">
                        <p className="text-sm font-semibold text-amber-300">⚙️ Customization Mode</p>
                        <p className="text-xs text-amber-200 mt-1">Edit the fields below to customize threshold values for this scenario.</p>
                      </div>
                    )}
                  </>
                )}


                <div>
                  <label className="block text-sm font-medium mb-1">Unit</label>
                  <input
                    type="text"
                    value={thresholdUnit}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
                    placeholder="Auto-detected from sensor type"
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">Unit is automatically set based on sensor type.</p>
                </div>

                {/* Threshold Input Fields - Always Visible */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Warning Min
                      {globalThreshold?.warning_min != null && isCustomizing && <span className="text-amber-400 text-xs ml-2">(RECOMMENDED: {globalThreshold.warning_min})</span>}
                    </label>
                    <input
                      type="number"
                      value={warningMin}
                      onChange={(e) => setWarningMin(e.target.value)}
                      disabled={!isCustomizing}
                      className={`w-full px-3 py-2 rounded-lg ${isCustomizing
                        ? 'bg-gray-700 border border-gray-600 text-white'
                        : 'bg-gray-800 border border-gray-700 text-gray-400 cursor-not-allowed'
                        }`}
                      placeholder="Optional"
                      step="any"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Critical Min
                      {globalThreshold?.critical_min != null && isCustomizing && <span className="text-red-400 text-xs ml-2">(RECOMMENDED: {globalThreshold.critical_min})</span>}
                    </label>
                    <input
                      type="number"
                      value={criticalMin}
                      onChange={(e) => setCriticalMin(e.target.value)}
                      disabled={!isCustomizing}
                      className={`w-full px-3 py-2 rounded-lg ${isCustomizing
                        ? 'bg-gray-700 border border-gray-600 text-white'
                        : 'bg-gray-800 border border-gray-700 text-gray-400 cursor-not-allowed'
                        }`}
                      placeholder="Optional"
                      step="any"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Warning Max
                      {globalThreshold?.warning_max != null && isCustomizing && <span className="text-amber-400 text-xs ml-2">(RECOMMENDED: {globalThreshold.warning_max})</span>}
                    </label>
                    <input
                      type="number"
                      value={warningMax}
                      onChange={(e) => setWarningMax(e.target.value)}
                      disabled={!isCustomizing}
                      className={`w-full px-3 py-2 rounded-lg ${isCustomizing
                        ? 'bg-gray-700 border border-gray-600 text-white'
                        : 'bg-gray-800 border border-gray-700 text-gray-400 cursor-not-allowed'
                        }`}
                      placeholder="Optional"
                      step="any"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Critical Max
                      {globalThreshold?.critical_max != null && isCustomizing && <span className="text-red-400 text-xs ml-2">(RECOMMENDED: {globalThreshold.critical_max})</span>}
                    </label>
                    <input
                      type="number"
                      value={criticalMax}
                      onChange={(e) => setCriticalMax(e.target.value)}
                      disabled={!isCustomizing}
                      className={`w-full px-3 py-2 rounded-lg ${isCustomizing
                        ? 'bg-gray-700 border border-gray-600 text-white'
                        : 'bg-gray-800 border border-gray-700 text-gray-400 cursor-not-allowed'
                        }`}
                      placeholder="Optional"
                      step="any"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  {currentUser?.role !== 'viewer' && effectiveThreshold?._id && isCustomizing && !!thresholdCompanyId ? (
                    <button
                      type="button"
                      onClick={handleDeleteThreshold}
                      className="text-red-400 hover:text-red-300 font-medium transition"
                      disabled={thresholdLoading}
                    >
                      Delete
                    </button>
                  ) : <span />}

                  <div className="space-x-3">
                    <button
                      type="button"
                      onClick={closeThresholdModal}
                      className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 transition"
                    >
                      {currentUser?.role === 'viewer' ? 'Close' : 'Cancel'}
                    </button>
                    {currentUser?.role !== 'viewer' && !isCustomizing && !!thresholdCompanyId && (
                      <button
                        type="button"
                        onClick={handleSetGlobalDefaults}
                        disabled={thresholdLoading || !effectiveThreshold || effectiveThreshold.company_id !== thresholdCompanyId}
                        className={`px-4 py-2 rounded-lg text-white font-medium transition ${thresholdLoading || !effectiveThreshold || effectiveThreshold.company_id !== thresholdCompanyId
                          ? 'bg-gray-600 cursor-not-allowed hidden'
                          : 'bg-cyan-600 hover:bg-cyan-700'
                          }`}
                      >
                        {thresholdLoading ? 'Processing...' : 'Use Global Thresholds'}
                      </button>
                    )}
                    {currentUser?.role !== 'viewer' && isCustomizing && (
                      <button
                        type="submit"
                        disabled={thresholdLoading}
                        className={`px-6 py-2 rounded-lg text-white font-medium transition ${thresholdLoading
                          ? 'bg-emerald-800 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-900/20'
                          }`}
                      >
                        {thresholdLoading ? 'Saving...' : (!thresholdCompanyId ? 'Save Global Defaults' : 'Use Customized Thresholds')}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
              <h2 className="text-2xl font-bold mb-4">Create New Sensor</h2>
              <form onSubmit={handleCreate}>
                {currentUser?.role === 'superadmin' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Company</label>
                    <select
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    >
                      <option value="">Select Company</option>
                      {companies.map((company) => (
                        <option key={company._id} value={company.name}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Sensor ID (Auto-generated)</label>
                  <input
                    type="text"
                    value={formData.sensor_id}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
                    placeholder="Select sensor type and company first"
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: CompanyName_SensorType_Index</p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Sensor Name (Auto-generated)</label>
                  <input
                    type="text"
                    value={formData.sensor_name}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
                    placeholder="Will be auto-filled based on sensor type"
                    readOnly
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Sensor Type *</label>
                  <select
                    value={formData.sensor_type}
                    onChange={(e) => {
                      const selectedType = e.target.value;
                      const sensor = sensorTypes.find(s => s.type === selectedType);
                      setFormData({
                        ...formData,
                        sensor_type: selectedType,
                        sensor_name: sensor ? sensor.name : ''
                      });
                    }}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    required
                  >
                    <option value="">Select Type</option>
                    {sensorTypes.map((sensor) => (
                      <option key={sensor.key} value={sensor.type}>{sensor.type}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="e.g., Production Floor A"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
                  >
                    Create Sensor
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedSensor && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
              <h2 className="text-2xl font-bold mb-4">Edit Sensor</h2>
              <form onSubmit={handleUpdate}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Sensor ID (Read-only)</label>
                  <input
                    type="text"
                    value={formData.sensor_id}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-400"
                    disabled
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Sensor Name</label>
                  <input
                    type="text"
                    value={formData.sensor_name}
                    onChange={(e) => setFormData({ ...formData, sensor_name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Sensor Type</label>
                  <select
                    value={formData.sensor_type}
                    onChange={(e) => {
                      const selectedType = e.target.value;
                      const sensor = sensorTypes.find(s => s.type === selectedType);
                      setFormData({
                        ...formData,
                        sensor_type: selectedType,
                        sensor_name: sensor ? sensor.name : formData.sensor_name
                      });
                    }}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  >
                    {sensorTypes.map((sensor) => (
                      <option key={sensor.key} value={sensor.type}>{sensor.type}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedSensor(null);
                    }}
                    className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
                  >
                    Update Sensor
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SensorManagementPage;