import React, { useState, useEffect } from 'react';
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

export const TestSimulationPage: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<TestScenario | null>(null);
  const [sensorData, setSensorData] = useState<SensorData>(testScenarioService.getCurrentSensorData());
  const [lastResult, setLastResult] = useState<TestResult | null>(null);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [autoRunEnabled, setAutoRunEnabled] = useState(false);
  const [autoRunIndex, setAutoRunIndex] = useState(0);

  useEffect(() => {
    // Sensor verisi değişikliklerini dinle
    const unsubscribeSensor = testScenarioService.subscribe((data) => {
      setSensorData(data);
    });

    // Alert'leri dinle
    const unsubscribeAlerts = testScenarioService.subscribeToAlerts((alert) => {
      setAlerts(prev => [...prev, alert]);
    });

    return () => {
      unsubscribeSensor();
      unsubscribeAlerts();
    };
  }, []);

  // Otomatik test çalıştırma
  useEffect(() => {
    if (autoRunEnabled && !isRunning && autoRunIndex < TEST_SCENARIOS.length) {
      const timer = setTimeout(() => {
        handleRunScenario(TEST_SCENARIOS[autoRunIndex]);
      }, 2000); // 2 saniye bekle

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
      console.error('Test hatası:', error);
      setAlerts(prev => [...prev, `❌ Test hatası: ${error}`]);
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
    testScenarioService.resetSensors();
    setAlerts([]);
    setLastResult(null);
    setSensorData(testScenarioService.getCurrentSensorData());
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
    <div className="space-y-6">
      <AlertBanner alerts={alerts} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center space-x-3">
            <svg className="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            <span>Test Simulation</span>
          </h1>
          <p className="text-gray-400">
            Monitor system response with automated test scenarios
          </p>
        </div>
        <div className="flex space-x-3">
          {autoRunEnabled ? (
            <button
              onClick={handleStopAutoRun}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>Stop Auto Test</span>
            </button>
          ) : (
            <button
              onClick={handleStartAutoRun}
              disabled={isRunning}
              className={`px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all ${
                isRunning
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              <span>Run All Tests</span>
            </button>
          )}
          {isRunning && (
            <button
              onClick={handleStopTest}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
              <span>Stop</span>
            </button>
          )}
          <button
            onClick={handleResetSensors}
            disabled={isRunning}
            className={`px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all ${
              isRunning
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Reset</span>
          </button>
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
          <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>Live Sensor Data</span>
        </h2>
        <LiveSensorDisplay sensorData={sensorData} />
      </div>

      {/* Test Results */}
      {lastResult && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
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
    </div>
  );
};
