import React from 'react';
import type { SensorData } from '../../services/testScenarioService';

interface LiveSensorDisplayProps {
  sensorData: SensorData;
}

export const LiveSensorDisplay: React.FC<LiveSensorDisplayProps> = ({ sensorData }) => {
  const getSensorStatus = (type: string, value: number) => {
    switch (type) {
      case 'temperature':
        if (value > 50) return { color: 'text-red-400', bg: 'bg-red-900/30', status: 'CRITICAL' };
        if (value > 35) return { color: 'text-orange-400', bg: 'bg-orange-900/30', status: 'HIGH' };
        if (value < 10) return { color: 'text-blue-400', bg: 'bg-blue-900/30', status: 'LOW' };
        return { color: 'text-green-400', bg: 'bg-green-900/30', status: 'NORMAL' };
      case 'co2':
        if (value > 2000) return { color: 'text-red-400', bg: 'bg-red-900/30', status: 'CRITICAL' };
        if (value > 1000) return { color: 'text-orange-400', bg: 'bg-orange-900/30', status: 'HIGH' };
        return { color: 'text-green-400', bg: 'bg-green-900/30', status: 'NORMAL' };
      case 'methane':
        if (value > 1500) return { color: 'text-red-400', bg: 'bg-red-900/30', status: 'CRITICAL' };
        if (value > 1000) return { color: 'text-orange-400', bg: 'bg-orange-900/30', status: 'DETECTED' };
        return { color: 'text-green-400', bg: 'bg-green-900/30', status: 'NORMAL' };
      case 'co':
        if (value > 70) return { color: 'text-red-400', bg: 'bg-red-900/30', status: 'CRITICAL' };
        if (value > 35) return { color: 'text-orange-400', bg: 'bg-orange-900/30', status: 'HIGH' };
        return { color: 'text-green-400', bg: 'bg-green-900/30', status: 'NORMAL' };
      case 'airQuality':
        if (value > 600) return { color: 'text-red-400', bg: 'bg-red-900/30', status: 'POOR' };
        if (value > 400) return { color: 'text-orange-400', bg: 'bg-orange-900/30', status: 'MODERATE' };
        return { color: 'text-green-400', bg: 'bg-green-900/30', status: 'GOOD' };
      case 'flammableGas':
        if (value > 700) return { color: 'text-red-400', bg: 'bg-red-900/30', status: 'CRITICAL' };
        if (value > 400) return { color: 'text-orange-400', bg: 'bg-orange-900/30', status: 'DETECTED' };
        return { color: 'text-green-400', bg: 'bg-green-900/30', status: 'NORMAL' };
      case 'humidity':
        if (value > 80 || value < 30) return { color: 'text-orange-400', bg: 'bg-orange-900/30', status: 'WARNING' };
        return { color: 'text-green-400', bg: 'bg-green-900/30', status: 'NORMAL' };
      default:
        return { color: 'text-gray-400', bg: 'bg-gray-900/30', status: 'UNKNOWN' };
    }
  };

  const sensors = [
    {
      type: 'temperature',
      label: 'Temperature',
      model: 'DHT-11',
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
      value: sensorData.temperature ?? 0,
      unit: '°C',
    },
    {
      type: 'humidity',
      label: 'Humidity',
      model: 'DHT-11',
      icon: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 3.636a1 1 0 010 1.414 7 7 0 000 9.9 1 1 0 11-1.414 1.414 9 9 0 010-12.728 1 1 0 011.414 0zm9.9 0a1 1 0 011.414 0 9 9 0 010 12.728 1 1 0 11-1.414-1.414 7 7 0 000-9.9 1 1 0 010-1.414zM7.879 6.464a1 1 0 010 1.414 3 3 0 000 4.243 1 1 0 11-1.415 1.414 5 5 0 010-7.07 1 1 0 011.415 0zm4.242 0a1 1 0 011.415 0 5 5 0 010 7.072 1 1 0 01-1.415-1.415 3 3 0 000-4.242 1 1 0 010-1.415zM10 9a1 1 0 011 1v.01a1 1 0 11-2 0V10a1 1 0 011-1z" clipRule="evenodd" /></svg>,
      value: sensorData.humidity ?? 0,
      unit: '%',
    },
    {
      type: 'co2',
      label: 'CO2',
      model: 'SCD-40',
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>,
      value: sensorData.co2 ?? 0,
      unit: 'ppm',
    },
    {
      type: 'methane',
      label: 'Methane',
      model: 'MQ-4',
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
      value: sensorData.methane ?? 0,
      unit: 'ppm',
    },
    {
      type: 'co',
      label: 'CO',
      model: 'MQ-7',
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
      value: sensorData.co ?? 0,
      unit: 'ppm',
    },
    {
      type: 'airQuality',
      label: 'Air Quality',
      model: 'MQ-135',
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>,
      value: sensorData.airQuality ?? 0,
      unit: '',
    },
    {
      type: 'flammableGas',
      label: 'Flammable Gas',
      model: 'MQ-9',
      icon: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" /></svg>,
      value: sensorData.flammableGas ?? 0,
      unit: '',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {sensors.map((sensor) => {
        const status = getSensorStatus(sensor.type, sensor.value);
        return (
          <div
            key={sensor.type}
            className={`${status.bg} border-2 ${status.color.replace('text-', 'border-')} rounded-lg p-4 transition-all duration-300`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={status.color}>{sensor.icon}</div>
              <span className={`text-xs font-bold ${status.color}`}>{status.status}</span>
            </div>
            <div className="text-gray-400 text-sm mb-1">{sensor.label}</div>
            <div className="text-gray-500 text-xs mb-2">{sensor.model}</div>
            <div className="flex items-baseline space-x-1">
              <span className={`text-2xl font-bold ${status.color}`}>
                {sensor.value.toFixed(1)}
              </span>
              <span className="text-sm text-gray-500">{sensor.unit}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
