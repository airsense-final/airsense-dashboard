import React from 'react';
import type { TestResult } from '../../services/testScenarioService';

interface TestResultsDisplayProps {
  result: TestResult | null;
}

export const TestResultsDisplay: React.FC<TestResultsDisplayProps> = ({ result }) => {
  if (!result) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <p className="text-gray-400 text-center">No test results yet</p>
      </div>
    );
  }

  const duration = result.endTime.getTime() - result.startTime.getTime();

  return (
    <div className="bg-gray-800 rounded-lg p-6 border-2 border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">Test Results</h3>
        <span
          className={`px-4 py-2 rounded-full font-bold flex items-center space-x-2 ${
            result.success
              ? 'bg-green-500/20 text-green-400 border border-green-500'
              : 'bg-red-500/20 text-red-400 border border-red-500'
          }`}
        >
          {result.success ? (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>SUCCESS</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>FAILED</span>
            </>
          )}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900/50 rounded p-4">
          <div className="text-gray-400 text-sm mb-1">Scenario</div>
          <div className="text-white font-semibold">{result.scenarioName}</div>
        </div>
        <div className="bg-gray-900/50 rounded p-4">
          <div className="text-gray-400 text-sm mb-1">Duration</div>
          <div className="text-cyan-400 font-semibold">{(duration / 1000).toFixed(1)}s</div>
        </div>
        <div className="bg-gray-900/50 rounded p-4">
          <div className="text-gray-400 text-sm mb-1">Completed Steps</div>
          <div className="text-cyan-400 font-semibold">{result.steps.length}</div>
        </div>
      </div>

      {/* Test Steps */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-white mb-3">Test Steps</h4>
        <div className="space-y-2">
          {result.steps.map((step, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border ${
                step.success
                  ? 'bg-green-900/20 border-green-500/30'
                  : 'bg-red-900/20 border-red-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {step.success ? (
                    <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  <div>
                    <div className="text-white font-medium">
                      Step {step.stepIndex}: {step.action}
                    </div>
                    <div className="text-sm text-gray-400">
                      Target: {step.expectedValue} | Actual: {step.actualValue.toFixed(1)}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {step.timestamp.toLocaleTimeString()}
                </div>
              </div>
              {step.alertsTriggered.length > 0 && (
                <div className="mt-2 pl-8">
                  <div className="text-xs text-gray-400 mb-1">Triggered Alerts:</div>
                  {step.alertsTriggered.map((alert, alertIdx) => (
                    <div key={alertIdx} className="text-sm text-orange-400">
                      {alert}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* System Response */}
      {result.systemResponse.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-white mb-3">System Response</h4>
          <div className="bg-gray-900/50 rounded-lg p-4 max-h-48 overflow-y-auto">
            {result.systemResponse.map((response, idx) => (
              <div key={idx} className="text-sm text-gray-300 mb-1 flex items-start">
                <span className="text-cyan-400 mr-2">•</span>
                <span>{response}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
