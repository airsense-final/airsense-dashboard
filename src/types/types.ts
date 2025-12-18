export interface Sensor {
  id?: number;
  sensor_id: string;
  type: 'dht11' | 'mq3' | 'mq4' | 'mq7' | 'mq135';
  description: string;
}

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'viewer';

export interface User {
  username: string;
  _id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  company_id: string;
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