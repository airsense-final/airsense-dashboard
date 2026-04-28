import { BASE_URL } from '../constants';
import type {
  LoginRequest,
  GoogleLoginRequest,
  GoogleRegisterRequest,
  RegisterRequest,
  AuthResponse,
  User,
  Company,
  ThresholdConfig,
  ThresholdUpsert,
  SensorDashboardView,
  ChangePasswordRequest,
  Alert
} from '../types/types';

const TOKEN_KEY = 'iot_dashboard_access_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);

/**
 * Generic fetch wrapper with User-Friendly Error Handling
 */
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = 'An unexpected error occurred.';

      try {
        const errorBody = await response.json();
        if (errorBody.detail) {
          if (Array.isArray(errorBody.detail)) {
            errorMessage = errorBody.detail[0].msg || 'Validation error.';
          } else {
            errorMessage = errorBody.detail;
          }
        }
      } catch {
      }

      if (response.status === 401 || response.status === 403) {
        removeToken();
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));

        if (response.status === 401 && (errorMessage === 'Unauthorized' || errorMessage === 'An unexpected error occurred.')) {
          errorMessage = 'Incorrect email or password.';
        } else if (response.status === 403 && (!errorMessage || errorMessage === 'An unexpected error occurred.')) {
          errorMessage = 'You do not have permission to perform this action.';
        }
      }
      else if (response.status === 404) {
        if (!errorMessage || errorMessage === 'An unexpected error occurred.') {
          errorMessage = 'Requested resource not found.';
        }
      }
      else if (response.status >= 500) {
        errorMessage = 'Something went wrong on our end. Please try again later.';
      }

      throw new Error(errorMessage);
    }

    if (response.status === 204 || response.headers.get('Content-Length') === '0') {
      return undefined as T;
    }

    return response.json() as Promise<T>;

  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.error(`Network Error [${endpoint}]:`, error);
      throw new Error('Connection failed. Please check your internet connection and try again.');
    }

    throw error;
  }
}

// --- Auth Endpoints ---

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: data.email,
      password: data.password,
    }),
  });
  if (!res?.access_token) throw new Error('Login response missing access_token.'); // Guarding if no token is returned
  setToken(res.access_token);
  return res;
}

export async function googleLogin(data: GoogleLoginRequest): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({
      id_token: data.id_token,
    }),
  });
  if (!res?.access_token) throw new Error('Google login response missing access_token.');
  setToken(res.access_token);
  return res;
}

export function googleRegister(data: GoogleRegisterRequest): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/auth/google-register', {
    method: 'POST',
    body: JSON.stringify({
      id_token: data.id_token,
      company_name: data.company_name,
    }),
  });
}

export function changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function register(data: RegisterRequest): Promise<string> {
  return apiFetch<string>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      username: data.username,
      email: data.email,
      password: data.password,
      password_confirm: data.password_confirm,
      company_name: data.company_name,
    }),
  });
}

export function getCompanies(): Promise<Company[]> {
  return apiFetch<Company[]>('/companies/');
}

// --- User Management Endpoints ---

export function getUsers(): Promise<User[]> {
  return apiFetch<User[]>('/users/');
}

export function getPendingUsers(): Promise<User[]> {
  return apiFetch<User[]>('/users/pending');
}

export function updateUserRole(userId: string, role: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  });
}

export function updateUserStatus(userId: string, is_active: boolean): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/users/${userId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ is_active }),
  });
}

export function deleteUser(userId: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/users/${userId}`, {
    method: 'DELETE',
  });
}

// --- Company Management Endpoints ---

export function createCompany(name: string): Promise<{ message: string; company_id: string }> {
  return apiFetch<{ message: string; company_id: string }>('/companies/', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function createCompanyWithAdmin(data: {
  company_name: string;
  admin_username: string;
  admin_email: string;
  admin_password: string;
}): Promise<{ success: boolean; company_id: string; company_name: string; admin_username: string; message: string }> {
  return apiFetch<{ success: boolean; company_id: string; company_name: string; admin_username: string; message: string }>('/companies/with-admin', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function createCompanyAdmin(data: {
  username: string;
  email: string;
  password: string;
  company_name: string;
}): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/auth/create-company-admin', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function deleteCompany(companyId: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/companies/${companyId}`, {
    method: 'DELETE',
  });
}

// --- Get Current User ---
export function getCurrentUser(): Promise<User> {
  return apiFetch<User>('/auth/me');
}

// --- Sensor Data Endpoints ---

export function getDashboardSummary(companyName?: string): Promise<SensorDashboardView[]> {
  const params = companyName ? `?target_company_name=${encodeURIComponent(companyName)}` : '';
  return apiFetch<SensorDashboardView[]>(`/api/v1/sensors/dashboard/summary${params}`);
}

export function getLatestSensorData(companyName?: string): Promise<any[]> {
  const params = companyName ? `?target_company_name=${encodeURIComponent(companyName)}` : '';
  return apiFetch<any[]>(`/api/v1/sensors/latest${params}`);
}

export function getSensorHistory(
  filterKey: string,
  filterValue: string,
  limit: number = 100,
  companyName?: string,
  startTime?: string,
  endTime?: string
): Promise<any[]> {
  const params = new URLSearchParams({
    filter_key: filterKey,
    filter_value: filterValue,
    limit: limit.toString(),
  });
  if (companyName) {
    params.append('target_company_name', companyName);
  }
  if (startTime) {
    params.append('start_time', startTime);
  }
  if (endTime) {
    params.append('end_time', endTime);
  }
  return apiFetch<any[]>(`/api/v1/sensors/history?${params.toString()}`);
}

// --- Sensor Management Endpoints ---

export function listSensors(companyName?: string): Promise<any[]> {
  const params = companyName ? `?target_company_name=${encodeURIComponent(companyName)}` : '';
  return apiFetch<any[]>(`/api/v1/sensors${params}`);
}

export function createSensor(data: {
  sensor_id: string;
  sensor_name: string;
  sensor_type: string;
  location?: string;
  company_name?: string;
}): Promise<{ message: string; sensor: any }> {
  return apiFetch<{ message: string; sensor: any }>('/api/v1/sensors', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateSensor(sensorId: string, data: {
  sensor_name?: string;
  sensor_type?: string;
  location?: string;
  scenario?: string;
}): Promise<{ message: string; sensor: any }> {
  return apiFetch<{ message: string; sensor: any }>(`/api/v1/sensors/${sensorId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteSensor(sensorId: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/v1/sensors/${sensorId}`, {
    method: 'DELETE',
  });
}

export function getSensor(sensorId: string): Promise<any> {
  return apiFetch<any>(`/api/v1/sensors/${sensorId}`);
}

// --- Threshold Configuration Endpoints ---

export function listThresholds(scenario?: string): Promise<ThresholdConfig[]> {
  const params = scenario ? `?scenario=${encodeURIComponent(scenario)}` : '';
  return apiFetch<ThresholdConfig[]>(`/api/v1/thresholds${params}`);
}

export function saveThreshold(data: ThresholdUpsert): Promise<ThresholdConfig> {
  return apiFetch<ThresholdConfig>('/api/v1/thresholds', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function deleteThreshold(thresholdId: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/v1/thresholds/${thresholdId}`, {
    method: 'DELETE',
  });
}

// --- Alert Endpoints ---

export function getAlerts(companyName?: string): Promise<Alert[]> {
  const params = companyName ? `?target_company_name=${encodeURIComponent(companyName)}` : '';
  return apiFetch<Alert[]>(`/api/v1/alerts${params}`);
}

export function getLatestAlerts(companyName?: string, isResolved?: boolean): Promise<Alert[]> {
  const params = new URLSearchParams();
  if (companyName) params.append('target_company_name', companyName);
  if (isResolved !== undefined) params.append('is_resolved', isResolved.toString());

  return apiFetch<Alert[]>(`/api/v1/alerts/latest?${params.toString()}`);
}

export interface SimulationAlertEmailRequest {
  message: string;
  alert_type: 'warning' | 'critical';
  sensor_type?: string;
  scenario_name?: string;
  target_company_name?: string;
  value?: number;
  unit?: string;
  threshold_value?: number;
  location?: string;
}

export function sendSimulationAlertEmail(payload: SimulationAlertEmailRequest): Promise<{ message: string; sent_count?: number }> {
  return apiFetch<{ message: string; sent_count?: number }>('/api/v1/alerts/simulation/email', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface AlertHistoryParams {
  target_company_name?: string;
  start_date?: string;
  end_date?: string;
  sensor_id?: string;
  is_resolved?: boolean;
  is_read?: boolean;
  limit?: number;
}

export function getAlertHistory(params: AlertHistoryParams): Promise<Alert[]> {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value.toString());
    }
  });

  return apiFetch<Alert[]>(`/api/v1/alerts/history?${queryParams.toString()}`);
}

export async function getAggregatedAlertHistory(companies: Company[], params: AlertHistoryParams): Promise<Alert[]> {
  const promises = companies.map(company =>
    getAlertHistory({
      ...params,
      target_company_name: company.name
    }).catch(err => {
      console.warn(`Failed to fetch alerts for company ${company.name}`, err);
      return [];
    })
  );

  const results = await Promise.all(promises);
  const flatResults = results.flat();

  // Sort by timestamp descending
  return flatResults.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function markAlertAsRead(alertId: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/v1/alerts/${alertId}/read`, {
    method: 'PUT',
  });
}

export function markAllAlertsAsRead(targetCompanyName?: string): Promise<{ message: string }> {
  const params = targetCompanyName ? `?target_company_name=${encodeURIComponent(targetCompanyName)}` : '';
  return apiFetch<{ message: string }>(`/api/v1/alerts/mark-all-read${params}`, {
    method: 'PUT',
  });
}

export function triggerManualAnomaly(data: {
  company_name: string;
  scenario_id: string;
  sensor_data: any;
}): Promise<{ message: string; results: any }> {
  return apiFetch<{ message: string; results: any }>('/api/v1/alerts/trigger-manual', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function exportAlertsPDF(params: {
  target_company_name?: string;
  start_date?: string;
  end_date?: string;
  is_resolved?: boolean;
  include_anomalies?: boolean;
}): Promise<void> {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value.toString());
    }
  });

  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found. Please login again.');
  }

  const response = await fetch(`${BASE_URL}/api/v1/alerts/export/pdf?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to export PDF' }));
    throw new Error(errorData.detail || 'Failed to export PDF');
  }

  // Get filename from Content-Disposition header or create default
  const contentDisposition = response.headers.get('Content-Disposition');
  let filename = 'AirSense_Alert_Report.pdf';
  
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, '');
    }
  }

  // Create blob and download
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
