export interface Sensor {
  _id?: string;
  sensor_id: string;
  sensor_name: string;
  sensor_type: string;
  parent_device_id: string;
  company_id: string;
  location?: string;
  created_at?: string;
}

export interface LatestSensorData {
  _id: string;
  timestamp: string;
  value: number;
  status: string;
  metadata: {
    sensor_id: string;
    parent_device: string;
    type: string;
    unit: string;
  };
}

export type UserRole = 'superadmin' | 'companyadmin' | 'manager' | 'viewer';

export interface User {
  username: string;
  _id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  company_id: string;
  company_name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  company_name: string;
}

export interface Company {
  _id: string;
  name: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface SensorCreate {
  sensor_id: string;
  type: 'dht11' | 'mq3' | 'mq4' | 'mq7' | 'mq135' | 'scd40' | 'mq9';
  description: string;
}

export interface SensorData {
  sensor_id: string;
  timestamp: string;
  temperature?: number;
  humidity?: number;
  alcohol_level?: number;
  methane_level?: number;
  co_level?: number;
  air_quality?: number;
  co2?: number;
  flammable_gas?: number;
  [key: string]: any;
}

export interface WebSocketMessage {
  type: 'new_sensor_data' | 'alarm' | 'connection' | 'error';
  data?: SensorData | any;
  sensor_id?: string;
  message?: string;
}

export interface DataPoint {
  timestamp: string;
  value: number;
  alarm?: boolean;
  time?: Date;
}

export type SensorDataHistory = Record<string, Record<string, DataPoint[]>>

export interface ThresholdConfig {
  _id?: string;
  scenario: string;
  sensor_type: string;
  warning_min?: number | null;
  critical_min?: number | null;
  warning_max?: number | null;
  critical_max?: number | null;
  unit?: string | null;
  company_id?: string | null;
  updated_at?: string;
  updated_by?: string;
}

export type ThresholdUpsert = Omit<ThresholdConfig, '_id' | 'updated_at' | 'updated_by'>;

/**
 * Utility to resolve hardware keys from display names.
 */
export const resolveHwKey = (type: string): string => {
  if (!type) return type;
  const t = type.toLowerCase();

  if (t.includes('temp') || t === 'temperature') return 'dht11_temp';
  if (t.includes('hum') || t === 'humidity') return 'dht11_hum';
  if (t.includes('co2') || t === 'scd' || t === 'co2 sensor') return 'scd40';
  if (t.includes('mq4') || t.includes('methane')) return 'mq4';
  if (t.includes('mq7') || t === 'co sensor') return 'mq7';
  if (t.includes('mq3') || t.includes('alcohol')) return 'mq3';
  if (t.includes('mq135') || t.includes('air quality')) return 'mq135';
  if (t.includes('mq9') || t.includes('flammable')) return 'mq9';
  if (t.includes('bh1750') || t.includes('light')) return 'bh1750';

  return type;
};