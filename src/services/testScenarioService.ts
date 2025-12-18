// Test Scenario Service - Manages automated test scenarios

// Backend API configuration
const API_BASE_URL = 'http://localhost:8000/api/v1';
const POLLING_INTERVAL = 2000; // 2 seconds

export interface SensorData {
  temperature: number;
  humidity: number;
  co2: number;
  methane: number;
  co: number;
  airQuality: number; // NH3, NOx, Benzene, Smoke combination
  flammableGas: number;
  timestamp: Date;
}

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  steps: TestStep[];
  expectedResult: string;
  duration: number; // milliseconds
}

export interface TestStep {
  action: string;
  sensorType: 'temperature' | 'humidity' | 'co2' | 'methane' | 'co' | 'airQuality' | 'flammableGas';
  sensorModel?: string;
  targetValue: number;
  duration: number;
  delay: number;
}

export interface TestResult {
  scenarioId: string;
  scenarioName: string;
  success: boolean;
  startTime: Date;
  endTime: Date;
  steps: StepResult[];
  systemResponse: string[];
}

export interface StepResult {
  stepIndex: number;
  action: string;
  success: boolean;
  actualValue: number;
  expectedValue: number;
  timestamp: Date;
  alertsTriggered: string[];
}

// Predefined test scenarios
export const TEST_SCENARIOS: TestScenario[] = [
  {
    id: 'fire-scenario',
    name: 'Fire Detection Test',
    description: 'Tests fire sensors - increases temperature, decreases air quality, and raises CO levels',
    duration: 10000,
    expectedResult: 'Fire alarm should trigger, system should initiate response',
    steps: [
      { action: 'Increase Temperature', sensorType: 'temperature', sensorModel: 'DHT-11', targetValue: 60, duration: 3000, delay: 0 },
      { action: 'Decrease Air Quality', sensorType: 'airQuality', sensorModel: 'MQ-135', targetValue: 800, duration: 3000, delay: 2000 },
      { action: 'Increase CO', sensorType: 'co', sensorModel: 'MQ-7', targetValue: 100, duration: 2000, delay: 5000 }
    ]
  },
  {
    id: 'temperature-high',
    name: 'High Temperature Test',
    description: 'Tests only temperature increase',
    duration: 8000,
    expectedResult: 'High temperature warning should be received',
    steps: [
      { action: 'Temperature 45°C', sensorType: 'temperature', sensorModel: 'DHT-11', targetValue: 45, duration: 3000, delay: 0 },
      { action: 'Temperature 55°C', sensorType: 'temperature', sensorModel: 'DHT-11', targetValue: 55, duration: 3000, delay: 3000 }
    ]
  },
  {
    id: 'temperature-low',
    name: 'Low Temperature Test',
    description: 'Tests temperature decrease',
    duration: 6000,
    expectedResult: 'Low temperature warning should be received',
    steps: [
      { action: 'Temperature 10°C', sensorType: 'temperature', sensorModel: 'DHT-11', targetValue: 10, duration: 3000, delay: 0 },
      { action: 'Temperature 5°C', sensorType: 'temperature', sensorModel: 'DHT-11', targetValue: 5, duration: 2000, delay: 3000 }
    ]
  },
  {
    id: 'methane-detection',
    name: 'Methane Detection Test',
    description: 'Tests methane gas sensor',
    duration: 6000,
    expectedResult: 'Methane gas alarm should trigger',
    steps: [
      { action: 'Increase Methane Level', sensorType: 'methane', sensorModel: 'MQ-4', targetValue: 1000, duration: 3000, delay: 0 },
      { action: 'Methane Maximum', sensorType: 'methane', sensorModel: 'MQ-4', targetValue: 2000, duration: 2000, delay: 3000 }
    ]
  },
  {
    id: 'co2-high',
    name: 'High CO2 Test',
    description: 'Increases CO2 level',
    duration: 7000,
    expectedResult: 'Ventilation system should activate',
    steps: [
      { action: 'CO2 1500 ppm', sensorType: 'co2', sensorModel: 'SCD-40', targetValue: 1500, duration: 3000, delay: 0 },
      { action: 'CO2 2500 ppm', sensorType: 'co2', sensorModel: 'SCD-40', targetValue: 2500, duration: 3000, delay: 3000 }
    ]
  },
  {
    id: 'flammable-gas',
    name: 'Flammable Gas Test',
    description: 'Tests flammable gas sensor',
    duration: 6000,
    expectedResult: 'Flammable gas alarm should trigger',
    steps: [
      { action: 'Flammable Gas Level 1', sensorType: 'flammableGas', sensorModel: 'MQ-9', targetValue: 500, duration: 3000, delay: 0 },
      { action: 'Flammable Gas Level 2', sensorType: 'flammableGas', sensorModel: 'MQ-9', targetValue: 900, duration: 2000, delay: 3000 }
    ]
  },
  {
    id: 'air-quality',
    name: 'Air Quality Test',
    description: 'Tests air quality sensor (NH3, NOx, Benzene, Smoke)',
    duration: 6000,
    expectedResult: 'Air quality warning should be received',
    steps: [
      { action: 'Decrease Air Quality', sensorType: 'airQuality', sensorModel: 'MQ-135', targetValue: 400, duration: 3000, delay: 0 },
      { action: 'Poor Air Quality', sensorType: 'airQuality', sensorModel: 'MQ-135', targetValue: 700, duration: 2000, delay: 3000 }
    ]
  },
  {
    id: 'humidity-extreme',
    name: 'Extreme Humidity Test',
    description: 'Increases humidity to extreme levels',
    duration: 6000,
    expectedResult: 'Humidity control system should activate',
    steps: [
      { action: 'Humidity 80%', sensorType: 'humidity', sensorModel: 'DHT-11', targetValue: 80, duration: 3000, delay: 0 },
      { action: 'Humidity 95%', sensorType: 'humidity', sensorModel: 'DHT-11', targetValue: 95, duration: 2000, delay: 3000 }
    ]
  },
  {
    id: 'co-leak',
    name: 'CO Leak Test',
    description: 'Tests carbon monoxide sensor in isolation',
    duration: 5000,
    expectedResult: 'CO alarm should sound',
    steps: [
      { action: 'CO Level 1', sensorType: 'co', sensorModel: 'MQ-7', targetValue: 50, duration: 2000, delay: 0 },
      { action: 'CO Level 2', sensorType: 'co', sensorModel: 'MQ-7', targetValue: 100, duration: 2000, delay: 2000 }
    ]
  },
  {
    id: 'multi-sensor-stress',
    name: 'Multi-Sensor Stress Test',
    description: 'Tests all sensors simultaneously',
    duration: 14000,
    expectedResult: 'System should trigger all alarms in correct sequence',
    steps: [
      { action: 'Increase Temperature', sensorType: 'temperature', sensorModel: 'DHT-11', targetValue: 50, duration: 2000, delay: 0 },
      { action: 'Increase CO2', sensorType: 'co2', sensorModel: 'SCD-40', targetValue: 2000, duration: 2000, delay: 2000 },
      { action: 'Decrease Air Quality', sensorType: 'airQuality', sensorModel: 'MQ-135', targetValue: 600, duration: 2000, delay: 4000 },
      { action: 'Add Methane', sensorType: 'methane', sensorModel: 'MQ-4', targetValue: 1500, duration: 2000, delay: 6000 },
      { action: 'Add CO', sensorType: 'co', sensorModel: 'MQ-7', targetValue: 80, duration: 2000, delay: 8000 },
      { action: 'Increase Flammable Gas', sensorType: 'flammableGas', sensorModel: 'MQ-9', targetValue: 800, duration: 2000, delay: 10000 },
      { action: 'Maximum Humidity', sensorType: 'humidity', sensorModel: 'DHT-11', targetValue: 90, duration: 2000, delay: 12000 }
    ]
  }
];

class TestScenarioService {
  private currentScenario: TestScenario | null = null;
  private isRunning = false;
  private currentResults: TestResult | null = null;
  private abortController: AbortController | null = null;

  // Real-time sensor data from backend
  private sensorData: SensorData = {
    temperature: 25,
    humidity: 50,
    co2: 400,
    methane: 0,
    co: 0,
    airQuality: 100, // 0-1000 range, higher value = worse quality
    flammableGas: 0,
    timestamp: new Date()
  };

  private listeners: Array<(data: SensorData) => void> = [];
  private alertListeners: Array<(alert: string) => void> = [];
  private pollingInterval: number | null = null;
  private isTestMode = false; // Flag to distinguish between real data and test scenarios

  // Listen to sensor data changes
  subscribe(callback: (data: SensorData) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  // Alert listeners
  subscribeToAlerts(callback: (alert: string) => void): () => void {
    this.alertListeners.push(callback);
    return () => {
      this.alertListeners = this.alertListeners.filter(l => l !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback({ ...this.sensorData }));
  }

  // Fetch real-time sensor data from backend
  private async fetchSensorData(): Promise<void> {
    try {
      console.log(`[${new Date().toLocaleTimeString()}] Fetching sensor data from: ${API_BASE_URL}/sensors/latest`);
      
      const response = await fetch(`${API_BASE_URL}/sensors/latest`);
      if (!response.ok) {
        console.error('❌ Failed to fetch sensor data:', response.status, response.statusText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ [Sensor Data Received]', data);
      
      // Only update if not in test mode (running a scenario)
      if (!this.isTestMode) {
        // Backend returns an array of sensor documents
        // We need to map each sensor by its sensor_id to our interface
        const sensorMap: Record<string, number> = {};
        
        if (Array.isArray(data)) {
          data.forEach((doc: any) => {
            if (doc.metadata && doc.metadata.sensor_id) {
              const sensorId = doc.metadata.sensor_id;
              const value = doc.value || 0;
              
              // Map hardware sensor IDs to semantic names
              if (sensorId.includes('dht11_temp')) {
                sensorMap.temperature = value;
              } else if (sensorId.includes('dht11_hum')) {
                sensorMap.humidity = value;
              } else if (sensorId.includes('scd40')) {
                sensorMap.co2 = value;
              } else if (sensorId.includes('mq4')) {
                sensorMap.methane = value;
              } else if (sensorId.includes('mq7')) {
                sensorMap.co = value;
              } else if (sensorId.includes('mq135')) {
                sensorMap.airQuality = value;
              } else if (sensorId.includes('mq9')) {
                sensorMap.flammableGas = value;
              }
            }
          });
        }
        
        this.sensorData = {
          temperature: sensorMap.temperature || 0,
          humidity: sensorMap.humidity || 0,
          co2: sensorMap.co2 || 400,
          methane: sensorMap.methane || 0,
          co: sensorMap.co || 0,
          airQuality: sensorMap.airQuality || 0,
          flammableGas: sensorMap.flammableGas || 0,
          timestamp: new Date()
        };
        
        console.log('✅ [Sensor Data Updated]', this.sensorData);
        this.notifyListeners();
        
        // Check thresholds for real data
        Object.keys(this.sensorData).forEach(key => {
          if (key !== 'timestamp') {
            const alerts = this.checkThresholds(key, this.sensorData[key as keyof SensorData] as number);
            alerts.forEach(alert => this.triggerAlert(alert));
          }
        });
      } else {
        console.log('[Test Mode Active] Skipping real sensor data update');
      }
    } catch (error) {
      console.error('❌ Error fetching sensor data:', error);
      console.error('Make sure backend is running at:', API_BASE_URL);
    }
  }

  // Start polling for real-time data
  startPolling(): void {
    if (this.pollingInterval !== null) {
      console.log('⚠️ Polling already active');
      return; // Already polling
    }
    
    console.log('🚀 Starting real-time sensor polling...');
    console.log(`📡 Polling interval: ${POLLING_INTERVAL}ms`);
    console.log(`🔗 Backend URL: ${API_BASE_URL}`);
    
    // Fetch immediately
    this.fetchSensorData();
    
    // Then poll at intervals
    this.pollingInterval = window.setInterval(() => {
      this.fetchSensorData();
    }, POLLING_INTERVAL);
  }

  // Stop polling
  stopPolling(): void {
    if (this.pollingInterval !== null) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private triggerAlert(message: string) {
    this.alertListeners.forEach(callback => callback(message));
  }

  // Check sensor value and trigger alert
  private checkThresholds(sensorType: string, value: number) {
    const alerts: string[] = [];

    switch (sensorType) {
      case 'temperature':
        if (value > 50) alerts.push(`CRITICAL: High temperature! ${value}°C`);
        else if (value > 35) alerts.push(`WARNING: Temperature increased: ${value}°C`);
        else if (value < 10) alerts.push(`WARNING: Low temperature: ${value}°C`);
        break;
      case 'co2':
        if (value > 2000) alerts.push(`CRITICAL: High CO2! ${value} ppm`);
        else if (value > 1000) alerts.push(`WARNING: CO2 level increased: ${value} ppm`);
        break;
      case 'methane':
        if (value > 1500) alerts.push(`CRITICAL: High Methane! ${value} ppm`);
        else if (value > 1000) alerts.push(`WARNING: Methane detected: ${value} ppm`);
        break;
      case 'co':
        if (value > 70) alerts.push(`CRITICAL: Dangerous CO level! ${value} ppm`);
        else if (value > 35) alerts.push(`WARNING: High CO level: ${value} ppm`);
        break;
      case 'airQuality':
        if (value > 600) alerts.push(`CRITICAL: Very poor air quality! Level: ${value}`);
        else if (value > 400) alerts.push(`WARNING: Poor air quality: ${value}`);
        break;
      case 'flammableGas':
        if (value > 700) alerts.push(`CRITICAL: High flammable gas! Level: ${value}`);
        else if (value > 400) alerts.push(`WARNING: Flammable gas detected: ${value}`);
        break;
      case 'humidity':
        if (value > 80) alerts.push(`WARNING: High humidity: ${value}%`);
        else if (value < 30) alerts.push(`WARNING: Low humidity: ${value}%`);
        break;
    }

    return alerts;
  }

  // Execute a test step (for test scenarios only)
  private async executeStep(step: TestStep): Promise<StepResult> {
    const startValue = this.sensorData[step.sensorType];
    const targetValue = step.targetValue;
    const steps = 20; // Animation steps
    const stepDuration = step.duration / steps;

    return new Promise((resolve) => {
      let currentStep = 0;
      const alerts: string[] = [];

      const interval = setInterval(() => {
        if (this.abortController?.signal.aborted) {
          clearInterval(interval);
          resolve({
            stepIndex: 0,
            action: step.action,
            success: false,
            actualValue: this.sensorData[step.sensorType],
            expectedValue: targetValue,
            timestamp: new Date(),
            alertsTriggered: alerts
          });
          return;
        }

        currentStep++;
        const progress = currentStep / steps;
        const currentValue = startValue + (targetValue - startValue) * progress;

        this.sensorData[step.sensorType] = Math.round(currentValue * 10) / 10;
        this.sensorData.timestamp = new Date();
        this.notifyListeners();

        // Check thresholds
        const newAlerts = this.checkThresholds(step.sensorType, this.sensorData[step.sensorType]);
        newAlerts.forEach(alert => {
          if (!alerts.includes(alert)) {
            alerts.push(alert);
            this.triggerAlert(alert);
          }
        });

        if (currentStep >= steps) {
          clearInterval(interval);
          resolve({
            stepIndex: 0,
            action: step.action,
            success: true,
            actualValue: this.sensorData[step.sensorType],
            expectedValue: targetValue,
            timestamp: new Date(),
            alertsTriggered: alerts
          });
        }
      }, stepDuration);
    });
  }

  // Run test scenario
  async runScenario(scenario: TestScenario): Promise<TestResult> {
    if (this.isRunning) {
      throw new Error('A test is already running!');
    }

    this.isRunning = true;
    this.isTestMode = true; // Enable test mode to prevent real data updates
    this.currentScenario = scenario;
    this.abortController = new AbortController();

    const result: TestResult = {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      success: true,
      startTime: new Date(),
      endTime: new Date(),
      steps: [],
      systemResponse: []
    };

    try {
      for (let i = 0; i < scenario.steps.length; i++) {
        const step = scenario.steps[i];

        // Add delay
        if (step.delay > 0) {
          await this.delay(step.delay);
        }

        // Execute step
        const stepResult = await this.executeStep(step);
        stepResult.stepIndex = i + 1;
        result.steps.push(stepResult);

        if (!stepResult.success) {
          result.success = false;
          break;
        }

        result.systemResponse.push(...stepResult.alertsTriggered);
      }

      result.endTime = new Date();
      this.currentResults = result;
    } catch (error) {
      result.success = false;
      result.systemResponse.push(`Error: ${error}`);
    } finally {
      this.isRunning = false;
      this.isTestMode = false;
      this.currentScenario = null;
      this.abortController = null;
    }

    return result;
  }

  // Stop test
  stopTest() {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.isRunning = false;
    this.isTestMode = false;
    this.currentScenario = null;
  }

  // Reset sensors (fetch fresh data from backend)
  async resetSensors() {
    this.isTestMode = false;
    await this.fetchSensorData();
  }

  // Get current sensor data
  getCurrentSensorData(): SensorData {
    return { ...this.sensorData };
  }

  // Test status
  getIsRunning(): boolean {
    return this.isRunning;
  }

  getCurrentScenario(): TestScenario | null {
    return this.currentScenario;
  }

  getLastResults(): TestResult | null {
    return this.currentResults;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const testScenarioService = new TestScenarioService();
