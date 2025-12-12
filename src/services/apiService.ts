import { API_BASE_URL } from '../constants';
import type { 
    LoginRequest, 
    RegisterRequest, 
    AuthResponse, 
    User, 
    Institution 
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
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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

export function login(data: LoginRequest): Promise<AuthResponse> {
    const formData = new URLSearchParams();
    formData.append('username', data.email);
    formData.append('password', data.password);

    return apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
    });
}

export function register(data: RegisterRequest): Promise<User> {
    return apiFetch<User>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export function getInstitutions(): Promise<Institution[]> {
    return apiFetch<Institution[]>('/institutions'); 
}

export function getCurrentUser(): Promise<User> {
    return apiFetch<User>('/auth/me'); 
}