import React, { useState } from 'react';
import type { Sensor } from '../types/types';

interface DeleteSensorsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDelete: (sensorIds: string[]) => Promise<void>;
    sensors: Sensor[];
}

export const DeleteSensorsModal: React.FC<DeleteSensorsModalProps> = ({
    isOpen,
    onClose,
    onDelete,
    sensors
}) => {
    const [selectedSensorIds, setSelectedSensorIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleToggleSensor = (sensorId: string) => {
        const newSelected = new Set(selectedSensorIds);
        if (newSelected.has(sensorId)) {
            newSelected.delete(sensorId);
        } else {
            newSelected.add(sensorId);
        }
        setSelectedSensorIds(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedSensorIds.size === sensors.length) {
            setSelectedSensorIds(new Set());
        } else {
            setSelectedSensorIds(new Set(sensors.map(s => s.sensor_id)));
        }
    };

    const handleDelete = async () => {
        if (selectedSensorIds.size === 0) {
            setError('Please select at least one sensor to delete');
            return;
        }

        setError('');
        setIsLoading(true);
        try {
            await onDelete(Array.from(selectedSensorIds));
            setSelectedSensorIds(new Set());
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to delete sensors');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-96 overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold">Delete Sensors</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-2xl"
                        disabled={isLoading}
                    >
                        ×
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-200">
                        {error}
                    </div>
                )}

                {sensors.length === 0 ? (
                    <p className="text-gray-400">No sensors available to delete</p>
                ) : (
                    <>
                        <div className="mb-4 p-3 bg-gray-700 rounded">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedSensorIds.size === sensors.length}
                                    onChange={handleSelectAll}
                                    disabled={isLoading}
                                    className="mr-3"
                                />
                                <span className="text-sm font-semibold">
                                    Select All ({selectedSensorIds.size}/{sensors.length})
                                </span>
                            </label>
                        </div>

                        <div className="space-y-2 mb-6">
                            {sensors.map(sensor => (
                                <label
                                    key={sensor.sensor_id}
                                    className="flex items-center p-3 bg-gray-700 rounded hover:bg-gray-600 cursor-pointer transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedSensorIds.has(sensor.sensor_id)}
                                        onChange={() => handleToggleSensor(sensor.sensor_id)}
                                        disabled={isLoading}
                                        className="mr-3"
                                    />
                                    <div className="flex-1">
                                        <p className="font-semibold text-white">{sensor.sensor_name}</p>
                                        <p className="text-xs text-gray-400">
                                            {sensor.sensor_id} • {sensor.sensor_type.toUpperCase()}
                                        </p>
                                    </div>
                                </label>
                            ))}
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
                                type="button"
                                onClick={handleDelete}
                                disabled={isLoading || selectedSensorIds.size === 0}
                                className="flex-1 px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed font-semibold"
                            >
                                {isLoading ? 'Deleting...' : `DELETE SELECTED (${selectedSensorIds.size})`}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
