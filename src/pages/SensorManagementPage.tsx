import React, { useState, useEffect } from 'react';
import { listSensors, createSensor, updateSensor, deleteSensor, getCompanies, getCurrentUser } from '../services/apiService';

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

  // Form states
  const [formData, setFormData] = useState({
    sensor_id: '',
    sensor_name: '',
    sensor_type: '',
    location: 'Unknown',
    company_name: '',
    parent_device_id: ''
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
    if (formData.sensor_type && formData.company_name && formData.parent_device_id && showCreateModal) {
      // Find the sensor type key
      const sensorType = sensorTypes.find(s => s.type === formData.sensor_type);
      if (!sensorType) return;

      const generatedId = `${formData.company_name}_${formData.parent_device_id}_${sensorType.key}`;
      setFormData(prev => ({ ...prev, sensor_id: generatedId }));
    }
  }, [formData.sensor_type, formData.company_name, formData.parent_device_id, showCreateModal, sensors]);

  useEffect(() => {
    loadData();
  }, [selectedCompany]);

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await createSensor(formData);
      setShowCreateModal(false);
      setFormData({ sensor_id: '', sensor_name: '', sensor_type: '', location: 'Unknown', company_name: '', parent_device_id: '' });
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create sensor');
    }
  };

  const openCreateModal = () => {
    // Auto-fill company name for company admin
    const companyName = currentUser?.role === 'companyadmin' ? currentUser.company_name : '';
    setFormData({ sensor_id: '', sensor_name: '', sensor_type: '', location: 'Unknown', company_name: companyName, parent_device_id: '' });
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
      company_name: '',
      parent_device_id: sensor.parent_device_id || ''
    });
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 light:bg-gray-50">
        <div className="text-xl text-white light:text-gray-900">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 light:bg-gray-50 text-white light:text-gray-900 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Sensor Management</h1>
            <p className="text-gray-400 light:text-gray-500 text-xs sm:text-sm mt-1">
              Manage sensors for {currentUser?.role === 'superadmin' ? 'all companies' : currentUser?.company_name}
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="w-full sm:w-auto bg-cyan-600 light:bg-cyan-800 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition text-xs sm:text-sm font-medium"
          >
            + Add Sensor
          </button>
        </div>

        {/* Company Filter (Super Admin Only) */}
        {currentUser?.role === 'superadmin' && (
          <div className="mb-6 bg-gray-800/40 backdrop-blur-md p-4 rounded-2xl border border-gray-700/50 shadow-xl flex flex-col sm:flex-row sm:items-center gap-4">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Organization Filter</label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="flex-1 max-w-md px-4 py-2.5 bg-gray-900 light:bg-gray-50 border border-gray-700 light:border-gray-200 rounded-xl text-white light:text-gray-900 text-xs font-bold outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all appearance-none cursor-pointer"
            >
              <option value="">ALL COMPANIES</option>
              {companies.map((company) => (
                <option key={company._id} value={company.name}>
                  {company.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-900/50 light:bg-red-100 border border-red-500 light:border-red-700 text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-gray-800 light:bg-white rounded-lg overflow-hidden border border-gray-700 light:border-gray-200 shadow-lg">
          {/* Desktop Table View - ORIGINAL */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-700 light:bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 light:text-gray-700 light:text-gray-600 uppercase">Sensor ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 light:text-gray-700 light:text-gray-600 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 light:text-gray-700 light:text-gray-600 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 light:text-gray-700 light:text-gray-600 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 light:text-gray-700 light:text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700 light:divide-gray-200">
                {sensors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-400 light:text-gray-500">
                      No sensors found. Click "Add Sensor" to create one.
                    </td>
                  </tr>
                ) : (
                  sensors.map((sensor) => (
                    <tr key={sensor._id} className="hover:bg-gray-700/50">
                      <td className="px-6 py-4 text-sm font-mono">{sensor.sensor_id}</td>
                      <td className="px-6 py-4 text-sm">{sensor.sensor_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-300 light:text-gray-700 light:text-gray-600">{sensor.sensor_type}</td>
                      <td className="px-6 py-4 text-sm text-gray-300 light:text-gray-700 light:text-gray-600">{sensor.location}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                        <div className="flex gap-3">
                          <button
                            onClick={() => openEditModal(sensor)}
                            className="text-cyan-400 light:text-cyan-800 hover:text-cyan-300 light:hover:text-cyan-600 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(sensor.sensor_id)}
                            className="text-red-400 light:text-red-800 hover:text-red-300 light:hover:text-red-600 transition-colors"
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

          {/* Mobile Card View - NEW */}
          <div className="md:hidden divide-y divide-gray-700 light:divide-gray-200">
            {sensors.length === 0 ? (
              <div className="p-10 text-center text-gray-400 light:text-gray-500 text-sm italic">No sensors found.</div>
            ) : (
              sensors.map((sensor) => (
                <div key={sensor._id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-bold text-white light:text-gray-900 tracking-tight">{sensor.sensor_name}</div>
                      <div className="text-[10px] text-gray-500 font-mono mt-0.5">{sensor.sensor_id}</div>
                    </div>
                    <span className="px-2 py-0.5 bg-cyan-500 light:bg-cyan-700/10 text-cyan-400 light:text-cyan-800 border border-cyan-500 light:border-cyan-700/20 rounded text-[9px] font-black uppercase">
                      {sensor.sensor_type}
                    </span>
                  </div>
                  <div className="text-[10px] font-medium text-gray-400 light:text-gray-500 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-gray-600 light:bg-gray-200 rounded-full"></span>
                    {sensor.location}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => openEditModal(sensor)} className="flex-1 py-2 bg-gray-700 light:bg-gray-100 hover:bg-gray-600 light:hover:bg-gray-300 text-white light:text-gray-900 rounded-lg text-[10px] font-bold transition-all">EDIT</button>
                    <button onClick={() => handleDelete(sensor.sensor_id)} className="flex-1 py-2 bg-red-900/20 border border-red-900/30 text-red-400 light:text-red-800 rounded-lg text-[10px] font-bold">DELETE</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 light:bg-white rounded-lg p-6 max-w-2xl w-full">
              <h2 className="text-2xl font-bold mb-4">Create New Sensor</h2>
              <form onSubmit={handleCreate}>
                {currentUser?.role === 'superadmin' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Company</label>
                    <select
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 light:bg-gray-100 border border-gray-600 light:border-gray-300 rounded-lg text-white light:text-gray-900"
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
                    className="w-full px-3 py-2 bg-gray-700 light:bg-gray-100 border border-gray-600 light:border-gray-300 rounded-lg text-gray-400 light:text-gray-500 cursor-not-allowed"
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
                    className="w-full px-3 py-2 bg-gray-700 light:bg-gray-100 border border-gray-600 light:border-gray-300 rounded-lg text-gray-400 light:text-gray-500 cursor-not-allowed"
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
                    className="w-full px-3 py-2 bg-gray-700 light:bg-gray-100 border border-gray-600 light:border-gray-300 rounded-lg text-white light:text-gray-900"
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
                    className="w-full px-3 py-2 bg-gray-700 light:bg-gray-100 border border-gray-600 light:border-gray-300 rounded-lg text-white light:text-gray-900"
                    placeholder="e.g., Production Floor A"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Parent Device ID *</label>
                  <input
                    type="text"
                    value={formData.parent_device_id}
                    onChange={(e) => setFormData({ ...formData, parent_device_id: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 light:bg-gray-100 border border-gray-600 light:border-gray-300 rounded-lg text-white light:text-gray-900"
                    placeholder="e.g., ESP32_AirSense"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-600 light:border-gray-300 rounded-lg hover:bg-gray-700 light:hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-cyan-600 light:bg-cyan-800 text-white rounded-lg hover:bg-cyan-700"
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
            <div className="bg-gray-800 light:bg-white rounded-lg p-6 max-w-2xl w-full">
              <h2 className="text-2xl font-bold mb-4">Edit Sensor</h2>
              <form onSubmit={handleUpdate}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Sensor ID (Read-only)</label>
                  <input
                    type="text"
                    value={formData.sensor_id}
                    className="w-full px-3 py-2 bg-gray-700 light:bg-gray-100 border border-gray-600 light:border-gray-300 rounded-lg text-gray-400 light:text-gray-500"
                    disabled
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Sensor Name</label>
                  <input
                    type="text"
                    value={formData.sensor_name}
                    onChange={(e) => setFormData({ ...formData, sensor_name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 light:bg-gray-100 border border-gray-600 light:border-gray-300 rounded-lg text-white light:text-gray-900"
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
                    className="w-full px-3 py-2 bg-gray-700 light:bg-gray-100 border border-gray-600 light:border-gray-300 rounded-lg text-white light:text-gray-900"
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
                    className="w-full px-3 py-2 bg-gray-700 light:bg-gray-100 border border-gray-600 light:border-gray-300 rounded-lg text-white light:text-gray-900"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedSensor(null);
                    }}
                    className="px-4 py-2 border border-gray-600 light:border-gray-300 rounded-lg hover:bg-gray-700 light:hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-cyan-600 light:bg-cyan-800 text-white rounded-lg hover:bg-cyan-700"
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