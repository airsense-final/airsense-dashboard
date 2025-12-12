export interface Sensor {
  id?: number;
  sensor_id: string;
  type: 'dht11' | 'mq3' | 'mq4' | 'mq7' | 'mq135';
  description: string;
}

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'viewer';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  institution_id?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  institution_id: number;
}

export interface Institution {
  id: number;
  name: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}