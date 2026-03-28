import React, { useState, useEffect } from 'react';
import { getLatestSensorData, getCompanies, getLatestAlerts } from '../services/apiService';
import type { User, Company, Alert } from '../types/types';
import {
  testScenarioService,
  TEST_SCENARIOS,
  type TestScenario,
  type TestResult,
  type SensorData,
} from '../services/testScenarioService';
import { ScenarioCard } from '../components/simulation/ScenarioCard';
import { LiveSensorDisplay } from '../components/simulation/LiveSensorDisplay';
import { TestResultsDisplay } from '../components/simulation/TestResultsDisplay';
import { AlertBanner } from '../components/simulation/AlertBanner';

interface TestSimulationPageProps {
  currentUser: User | null;
}

export const TestSimulationPage: React.FC<TestSimulationPageProps> = ({ currentUser }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<TestScenario | null>(null);
  const [sensorData, setSensorData] = useState<SensorData>(testScenarioService.getCurrentSensorData());
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>(localStorage.getItem('simulation_selected_company') || '');
  const [lastResult, setLastResult] = useState<TestResult | null>(null);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [autoRunEnabled, setAutoRunEnabled] = useState(false);
  const [autoRunIndex, setAutoRunIndex] = useState(0);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    loadInitialData();

    // Listen for test scenario sensor data updates
    const unsubscribeSensor = testScenarioService.subscribe((testData) => {
      // When test is running, use test data
      setSensorData(testData);
      setLastUpdate(new Date());
    });

    // Listen for alerts
    const unsubscribeAlerts = testScenarioService.subscribeToAlerts((alert) => {
      setAlerts(prev => [...prev, alert]);
    });

    return () => {
      unsubscribeSensor();
      unsubscribeAlerts();
    };
  }, [currentUser?.role]);

  useEffect(() => {
    // Only load real sensor data when no test is running
    if (!isRunning && (selectedCompany || currentUser?.role !== 'superadmin')) {
      loadRealSensorData();
      const interval = setInterval(() => {
        if (!isRunning) {
          loadRealSensorData();
          loadActiveAlerts();
        }
      }, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [selectedCompany, currentUser?.role, isRunning]);

  const loadInitialData = async () => {
    try {
      if (currentUser?.role === 'superadmin') {
        const companiesData = await getCompanies();
        setCompanies(companiesData);
        if (!selectedCompany && companiesData.length > 0) {
          const firstCompany = companiesData[0].name;
          setSelectedCompany(firstCompany);
          localStorage.setItem('simulation_selected_company', firstCompany);
        }
      }
      await loadRealSensorData();
      await loadActiveAlerts();
    } catch (err) {
      console.error('Failed to load initial data:', err);
      setBackendStatus('error');
    }
  };

  const loadRealSensorData = async () => {
    try {
      const companyName = currentUser?.role === 'superadmin' ? selectedCompany : undefined;
      const data = await getLatestSensorData(companyName);

      // Convert real sensor data to SensorData format for display
      // Map sensor_id patterns to expected SensorData keys
      const convertedData: SensorData = {
        temperature: 0,
        humidity: 0,
        co2: 0,
        methane: 0,
        co: 0,
        airQuality: 0,
        flammableGas: 0,
        alcohol: 0,
        timestamp: new Date()
      };
      data.forEach((sensor) => {
        const sensorId = sensor.metadata.sensor_id.toLowerCase();

        // Extract sensor type from sensor_id (format: device_sensor_number)
        if (sensorId.includes('dht11_temp')) {
          convertedData.temperature = sensor.value;
        } else if (sensorId.includes('dht11_hum')) {
          convertedData.humidity = sensor.value;
        } else if (sensorId.includes('scd40') || sensorId.includes('co2')) {
          convertedData.co2 = sensor.value;
        } else if (sensorId.includes('mq4')) {
          convertedData.methane = sensor.value;
        } else if (sensorId.includes('mq7')) {
          convertedData.co = sensor.value;
        } else if (sensorId.includes('mq135')) {
          convertedData.airQuality = sensor.value;
        } else if (sensorId.includes('mq9')) {
          convertedData.flammableGas = sensor.value;
        } else if (sensorId.includes('mq3')) {
          convertedData.alcohol = sensor.value;
        }
      });
      setSensorData(convertedData);
      setLastUpdate(new Date());
      setBackendStatus('connected');
    } catch (err) {
      console.error('Failed to load sensor data:', err);
      setBackendStatus('error');
    }
  };

  const loadActiveAlerts = async () => {
    try {
      const companyName = currentUser?.role === 'superadmin' ? selectedCompany : undefined;
      // Fetch only active alerts (is_resolved=false)
      const data = await getLatestAlerts(companyName, false);
      setActiveAlerts(data);
    } catch (err) {
      console.error('Failed to load active alerts:', err);
    }
  };

  // Auto-run effect
  useEffect(() => {
    if (autoRunEnabled && !isRunning && autoRunIndex < TEST_SCENARIOS.length) {
      const timer = setTimeout(() => {
        handleRunScenario(TEST_SCENARIOS[autoRunIndex]);
      }, 2000); // 2 second delay before starting next test

      return () => clearTimeout(timer);
    } else if (autoRunEnabled && autoRunIndex >= TEST_SCENARIOS.length) {
      setAutoRunEnabled(false);
      setAutoRunIndex(0);
    }
  }, [autoRunEnabled, isRunning, autoRunIndex]);

  const handleRunScenario = async (scenario: TestScenario) => {
    if (isRunning) return;

    setIsRunning(true);
    setCurrentScenario(scenario);
    setAlerts([]);

    try {
      const result = await testScenarioService.runScenario(scenario);
      setLastResult(result);

      if (autoRunEnabled) {
        setAutoRunIndex(prev => prev + 1);
      }
    } catch (error) {
      console.error('Test error:', error);
      setAlerts(prev => [...prev, `❌ Test error: ${error}`]);
    } finally {
      setIsRunning(false);
      setCurrentScenario(null);
    }
  };

  const handleStopTest = () => {
    testScenarioService.stopTest();
    setIsRunning(false);
    setCurrentScenario(null);
    setAutoRunEnabled(false);
  };

  const handleResetSensors = () => {
    setAlerts([]);
    setLastResult(null);
    // Reset test service to initial values
    testScenarioService.resetSensors();
    // Also reload real sensor data
    loadRealSensorData();
  };

  const handleStartAutoRun = () => {
    setAutoRunEnabled(true);
    setAutoRunIndex(0);
    setAlerts([]);
  };

  const handleStopAutoRun = () => {
    setAutoRunEnabled(false);
    setAutoRunIndex(0);
    handleStopTest();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Fixed Responsive Layout */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 flex items-center space-x-3">
            <svg aria-hidden="true" className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            <span>Test Simulation</span>
            {backendStatus === 'connected' && (
              <span className="text-[10px] sm:text-xs bg-green-500 text-white px-2 py-0.5 sm:py-1 rounded-full flex items-center space-x-1">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse"></span>
                <span>Live</span>
              </span>
            )}
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm">
            Monitor system response with automated test scenarios
            {lastUpdate && (
              <span className="text-[10px] sm:text-xs text-gray-500 ml-2 hidden sm:inline">
                Last update: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>

        {/* Company Selector & Controls - Mobile optimized */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {currentUser?.role === 'superadmin' && companies.length > 0 && (
            <div className="flex items-center gap-2 bg-gray-800 p-1.5 px-3 rounded-lg border border-gray-700">
              <label className="text-xs font-medium text-gray-400">Org:</label>
              <select
                value={selectedCompany}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedCompany(val);
                  localStorage.setItem('simulation_selected_company', val);
                }}
                className="bg-transparent text-white text-xs sm:text-sm focus:outline-none cursor-pointer"
              >
                {companies.map((company) => (
                  <option key={company._id} value={company.name} className="bg-gray-800">{company.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2">
            {autoRunEnabled ? (
              <button
                onClick={handleStopAutoRun}
                className="flex-1 sm:flex-none whitespace-nowrap bg-red-600 hover:bg-red-700 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-base font-semibold flex items-center justify-center space-x-2 transition-all shadow-lg shadow-red-900/20"
              >
                <svg aria-hidden="true" className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>Stop</span>
              </button>
            ) : (
              <button
                onClick={handleStartAutoRun}
                disabled={isRunning}
                className={`flex-1 sm:flex-none whitespace-nowrap px-3 sm:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-base font-semibold flex items-center justify-center space-x-2 transition-all ${isRunning
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-900/20'
                  }`}
              >
                <svg aria-hidden="true" className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                <span>Run All</span>
              </button>
            )}
            
            {isRunning && (
              <button
                onClick={handleStopTest}
                className="whitespace-nowrap bg-red-600 hover:bg-red-700 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-base font-semibold transition-all"
              >
                Stop
              </button>
            )}
            <button
              onClick={handleResetSensors}
              disabled={isRunning}
              className={`flex-1 sm:flex-none whitespace-nowrap px-3 sm:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-base font-semibold flex items-center justify-center space-x-2 transition-all ${isRunning
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
            >
              <svg aria-hidden="true" className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Indicator */}
      {(isRunning || autoRunEnabled) && (
        <div className="bg-cyan-900/30 border-2 border-cyan-500 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
              <div>
                <div className="text-cyan-300 font-semibold">
                  {autoRunEnabled
                    ? `Auto Test Running (${autoRunIndex + 1}/${TEST_SCENARIOS.length})`
                    : 'Test Running'}
                </div>
                {currentScenario && (
                  <div className="text-gray-400 text-sm">{currentScenario.name}</div>
                )}
              </div>
            </div>
            {autoRunEnabled && (
              <div className="text-cyan-400 text-sm">
                Next test will start in 2 seconds...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Live Sensor Data */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
          <svg aria-hidden="true" className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>Live Sensor Data</span>
        </h2>
        <LiveSensorDisplay sensorData={sensorData} activeAlerts={activeAlerts} />
      </div>

      {/* Test Results */}
      {lastResult && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <svg aria-hidden="true" className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Latest Test Result</span>
          </h2>
          <TestResultsDisplay result={lastResult} />
        </div>
      )}

      {/* Test Scenarios */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
          <svg aria-hidden="true" className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>Test Scenarios</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TEST_SCENARIOS.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              onRun={handleRunScenario}
              isRunning={isRunning}
              isCurrentlyRunning={currentScenario?.id === scenario.id}
            />
          ))}
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-3 flex items-center space-x-2">
          <svg aria-hidden="true" className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>How to Use?</span>
        </h3>
        <ul className="space-y-2 text-gray-400">
          <li className="flex items-start">
            <span className="text-cyan-400 mr-2">1.</span>
            <span>Select one of the test scenarios above and click "Start Test" button</span>
          </li>
          <li className="flex items-start">
            <span className="text-cyan-400 mr-2">2.</span>
            <span>Observe live sensor data and system responses</span>
          </li>
          <li className="flex items-start">
            <span className="text-cyan-400 mr-2">3.</span>
            <span>Review the results once the test is completed</span>
          </li>
          <li className="flex items-start">
            <span className="text-cyan-400 mr-2">4.</span>
            <span>Use "Run All Tests" to automatically run all scenarios sequentially</span>
          </li>
          <li className="flex items-start">
            <span className="text-cyan-400 mr-2">5.</span>
            <span>Click "Reset" button to return sensors to initial values</span>
          </li>
        </ul>
      </div>

      {/* Alert Toast Notifications - Rendered at bottom for proper z-index */}
      <AlertBanner alerts={alerts} />
    </div>
  );
};
