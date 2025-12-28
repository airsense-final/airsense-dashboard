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