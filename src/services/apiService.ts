import { BASE_URL } from '../constants';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse, 
  User,
  Company
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

      if (response.status === 401) {
        removeToken();
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        
        if (errorMessage === 'Unauthorized' || errorMessage === 'An unexpected error occurred.') {
            errorMessage = 'Incorrect email or password.';
        }
      } 
      else if (response.status === 403) {
        errorMessage = 'You do not have permission to perform this action.';
      }
      else if (response.status === 404) {
        errorMessage = 'Requested resource not found.';
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
