import React from 'react';
import type { TestScenario } from '../../services/testScenarioService';

interface ScenarioCardProps {
  scenario: TestScenario;
  onRun: (scenario: TestScenario) => void;
  isRunning: boolean;
  isCurrentlyRunning: boolean;
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({
  scenario,
  onRun,
  isRunning,
  isCurrentlyRunning
}) => {
  const getScenarioIcon = (id: string) => {
    switch (id) {
      case 'fire-scenario':
        return <svg aria-hidden="true" className="w-10 h-10 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2c-1.5 3-4 4-6 6-1 1-2 2.5-2 4.5C4 16.5 7.5 20 12 20s8-3.5 8-7.5c0-2-1-3.5-2-4.5-2-2-4.5-3-6-6zm0 16c-2.5 0-4.5-2-4.5-4.5 0-1 .5-2 1.5-3 1-1 2-1.5 3-3 1 1.5 2 2 3 3 1 1 1.5 2 1.5 3C16.5 16 14.5 18 12 18z" /></svg>;
      case 'temperature-high':
        return <svg aria-hidden="true" className="w-10 h-10 text-orange-500" fill="currentColor" viewBox="0 0 24 24"><path d="M15 13V5c0-1.66-1.34-3-3-3S9 3.34 9 5v8c-1.21.91-2 2.37-2 4 0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.63-.79-3.09-2-4zm-4-8c0-.55.45-1 1-1s1 .45 1 1v3h-2V5zm1 15c-1.66 0-3-1.34-3-3 0-1.04.53-1.96 1.34-2.5l.66-.5V5h2v8.5l.66.5c.81.54 1.34 1.46 1.34 2.5 0 1.66-1.34 3-3 3z" /></svg>;
      case 'temperature-low':
        return <svg aria-hidden="true" className="w-10 h-10 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M22 11h-4.17l3.24-3.24-1.41-1.42L15 11h-2V9l4.66-4.66-1.42-1.41L13 6.17V2h-2v4.17L7.76 2.93 6.34 4.34 11 9v2H9L4.34 6.34 2.93 7.76 6.17 11H2v2h4.17l-3.24 3.24 1.41 1.42L9 13h2v2l-4.66 4.66 1.42 1.41L11 17.83V22h2v-4.17l3.24 3.24 1.42-1.41L13 15v-2h2l4.66 4.66 1.41-1.42L17.83 13H22v-2z" /></svg>;
      case 'methane-detection':
        return <svg aria-hidden="true" className="w-10 h-10 text-purple-500" fill="currentColor" viewBox="0 0 24 24"><path d="M7 2v2h1v14c0 2.21 1.79 4 4 4s4-1.79 4-4V4h1V2H7zm2 2h6v3h-2V5h-2v2H9V4zm6 14c0 1.1-.9 2-2 2s-2-.9-2-2v-3h4v3z" /><circle cx="12" cy="10" r="1.5" fill="currentColor" /><circle cx="9" cy="12" r="1" fill="currentColor" /><circle cx="15" cy="13" r="1" fill="currentColor" /></svg>;
      case 'co2-high':
        return <svg aria-hidden="true" className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4c-1.48 0-2.85.43-4.01 1.17l1.46 1.46C10.21 6.23 11.08 6 12 6c3.04 0 5.5 2.46 5.5 5.5v.5H19c1.66 0 3 1.34 3 3s-1.34 3-3 3H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3H6c-1.1 0-2-.9-2-2s.9-2 2-2h13.35z" /><text x="7" y="16" fontSize="6" fill="white" fontWeight="bold">CO₂</text></svg>;
      case 'humidity-extreme':
        return <svg aria-hidden="true" className="w-10 h-10 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66c3.12 3.12 3.12 8.19 0 11.31C15.54 21.78 13.77 22.5 12 22.5s-3.54-.72-5.66-2.83c-3.12-3.12-3.12-8.19 0-11.31L12 2.69m0 2.83L7.76 9.76c-2.34 2.34-2.34 6.14 0 8.49 2.34 2.34 6.14 2.34 8.49 0 2.34-2.34 2.34-6.14 0-8.49L12 5.52z" /><path d="M16.5 4c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5S15 6.33 15 5.5 15.67 4 16.5 4zm3 2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z" opacity=".6" /></svg>;
      case 'co-leak':
        return <svg aria-hidden="true" className="w-10 h-10 text-red-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.85.63-3.55 1.69-4.9l1.43 1.43C6.45 9.46 6 10.67 6 12c0 3.31 2.69 6 6 6 1.33 0 2.54-.45 3.53-1.21l1.43 1.43C15.55 19.37 13.85 20 12 20zm6.31-3.1l-1.43-1.43C17.55 14.54 18 13.33 18 12c0-3.31-2.69-6-6-6-1.33 0-2.54.45-3.53 1.21L6.9 5.79C8.45 4.63 10.15 4 12 4c4.41 0 8 3.59 8 8 0 1.85-.63 3.55-1.69 4.9z" /><circle cx="9" cy="10" r="1.5" /><circle cx="15" cy="10" r="1.5" /><path d="M9 14h6c0 1.66-1.34 3-3 3s-3-1.34-3-3z" /></svg>;
      case 'flammable-gas':
        return <svg aria-hidden="true" className="w-10 h-10 text-orange-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L8 6h3v4H8l-4 5 4 5h3v-4h3l4-5-4-5h-3V6h3l-4-5zm0 3.83L13.17 6H11v4h2.83L16 12.5l-2.17 2.5H11v-4H8.83L7 8.83 8.83 6H11V4.83z" /><circle cx="12" cy="12.5" r="2" fill="#ff6b35" /></svg>;
      case 'air-quality':
        return <svg aria-hidden="true" className="w-10 h-10 text-teal-500" fill="currentColor" viewBox="0 0 24 24"><path d="M14.5 17c0 1.65-1.35 3-3 3s-3-1.35-3-3h2c0 .55.45 1 1 1s1-.45 1-1-.45-1-1-1H2v-2h9.5c1.65 0 3 1.35 3 3zM19 6.5C19 4.57 17.43 3 15.5 3S12 4.57 12 6.5h2c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S16.33 8 15.5 8H2v2h13.5c1.93 0 3.5-1.57 3.5-3.5zm-.5 4.5H2v2h16.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5v2c1.93 0 3.5-1.57 3.5-3.5S20.43 11 18.5 11z" /><circle cx="5" cy="6.5" r="1" opacity=".5" /><circle cx="8" cy="14" r="1" opacity=".5" /><circle cx="7" cy="18" r="1" opacity=".5" /></svg>;
      case 'multi-sensor-stress':
        return <svg aria-hidden="true" className="w-10 h-10 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /><path d="M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" opacity=".3" /><circle cx="12" cy="8" r="1.5" /><circle cx="8" cy="12" r="1.5" /><circle cx="12" cy="16" r="1.5" /><circle cx="16" cy="12" r="1.5" /></svg>;
      case 'alcohol-detection':
        return <svg aria-hidden="true" className="w-10 h-10 text-purple-600" fill="currentColor" viewBox="0 0 24 24"><path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
      default:
        return <svg aria-hidden="true" className="w-10 h-10 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>;
    }
  };

  return (
    <div
      className={`bg-gray-800 rounded-lg p-6 border-2 transition-all duration-300 ${isCurrentlyRunning
          ? 'border-cyan-400 shadow-lg shadow-cyan-400/50 animate-pulse'
          : 'border-gray-700 hover:border-gray-600'
        }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">{getScenarioIcon(scenario.id)}</div>
          <div>
            <h3 className="text-xl font-bold text-white">{scenario.name}</h3>
            <p className="text-gray-400 text-sm mt-1">{scenario.description}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="text-sm text-gray-300">
          <span className="font-semibold">Steps:</span> {scenario.steps.length}
        </div>
        <div className="text-sm text-gray-300">
          <span className="font-semibold">Duration:</span> ~{(scenario.duration / 1000).toFixed(0)} seconds
        </div>
        <div className="text-sm text-gray-300">
          <span className="font-semibold">Expected Result:</span>
          <p className="text-cyan-300 mt-1">{scenario.expectedResult}</p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <p className="text-xs text-gray-400 font-semibold">Test Steps:</p>
        <ul className="space-y-1">
          {scenario.steps.map((step, idx) => (
            <li key={idx} className="text-xs text-gray-400 flex items-start">
              <span className="text-cyan-400 mr-2">•</span>
              <div className="flex-1">
                <div>{step.action} ({step.targetValue})</div>
                {step.sensorModel && (
                  <div className="text-gray-500 text-xs mt-0.5">{step.sensorModel}</div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={() => onRun(scenario)}
        disabled={isRunning}
        className={`w-full py-2 px-4 rounded-lg font-semibold transition-all duration-200 ${isRunning
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : isCurrentlyRunning
              ? 'bg-cyan-500 text-white animate-pulse'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white'
          }`}
      >
        {isCurrentlyRunning ? '▶ Running...' : '▶ Start Test'}
      </button>
    </div>
  );
};
