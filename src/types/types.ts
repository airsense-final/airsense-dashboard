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