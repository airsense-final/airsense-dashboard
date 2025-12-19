import React, { useState } from 'react';
import type { SensorCreate } from '../types/types';

interface AddSensorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (sensorData: SensorCreate) => Promise<void>;
}

export const AddSensorModal: React.FC<AddSensorModalProps> = ({ isOpen, onClose, onSave }) => {
    const [sensorId, setSensorId] = useState('');
    const [type, setType] = useState<'dht11' | 'mq3' | 'mq4' | 'mq7' | 'mq135' | 'scd40' | 'mq9'>('dht11');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!sensorId.trim() || !description.trim()) {
            setError('All fields are required');
            return;
        }

        setIsLoading(true);
        try {
            await onSave({
                sensor_id: sensorId.trim(),
                type,
                description: description.trim()
            });

            // Reset form
            setSensorId('');
            setType('dht11');
            setDescription('');
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to add sensor');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold">Add New Sensor</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-2xl"
                        disabled={isLoading}
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-200">
                            {error}
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">
                            Sensor ID
                        </label>
                        <input
                            type="text"
                            value={sensorId}
                            onChange={(e) => setSensorId(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500"
                            placeholder="e.g., SENSOR001"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">
                            Sensor Type
                        </label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as any)}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500"
                            disabled={isLoading}
                        >
                            <option value="dht11">DHT11 (Temperature/Humidity)</option>
                            <option value="mq3">MQ3 (Alcohol)</option>
                            <option value="mq4">MQ4 (Methane)</option>
                            <option value="mq7">MQ7 (Carbon Monoxide)</option>
                            <option value="mq135">MQ135 (Air Quality)</option>
                            <option value="scd40">SCD40 (CO2)</option>
                            <option value="mq9">MQ9 (Flammable Gas)</option>
                        </select>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">
                            Description
                        </label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500"
                            placeholder="e.g., Living Room Sensor"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Adding...' : 'Add Sensor'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
