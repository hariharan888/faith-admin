/**
 * Centralized HTTP Handler for API Requests
 * 
 * This module provides a single HTTP client that automatically handles:
 * - JWT token management
 * - Product key headers
 * - Request/response interceptors
 * - Error handling
 * - Type safety
 */

import { clog } from './logger';
import { useAuthStore } from './stores/auth.store';

// Configuration
const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
  productKey: process.env.NEXT_PUBLIC_PRODUCT_KEY || '',
  timeout: 10000, // 10 seconds
} as const;

// Debug logging for development
clog.info('HTTP Handler Configuration', {
  baseURL: API_CONFIG.baseURL,
  productKey: API_CONFIG.productKey.substring(0, 20) + '...',
  timeout: API_CONFIG.timeout,
});

// Types
export interface ApiResponse<T = any> {
  status: {
    http_code: number;
    code: string;
    message: string;
  };
  data: T;
}

export interface ApiError {
  status: {
    http_code: number;
    code: string;
    message: string;
  };
  data?: any;
}

export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  data?: any;
  headers?: Record<string, string>;
  requireAuth?: boolean; // Default: true
  responseType?: 'json' | 'blob'; // Default: 'json'
}

// 401 Handler for automatic logout and redirect
const handleUnauthorized = () => {
  clog.auth('401 Unauthorized - clearing auth state and redirecting to login');
  
  // Clear auth store
  const authStore = useAuthStore.getState();
  authStore.logout();
  
  // Redirect to login page
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

// Token management utilities
class TokenManager {
  private static readonly TOKEN_KEY = 'faith_admin_jwt';
  private static readonly USER_DATA_KEY = 'faith_admin_user';

  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_DATA_KEY);
  }

  static getUserData(): any {
    if (typeof window === 'undefined') return null;
    const userData = localStorage.getItem(this.USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  static setUserData(userData: any): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
  }
}

// HTTP Client Class
class HttpClient {
  private baseURL: string;
  private productKey: string;
  private timeout: number;

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    this.productKey = API_CONFIG.productKey;
    this.timeout = API_CONFIG.timeout;
  }

  /**
   * Main HTTP request method
   * Automatically handles authentication, headers, and error handling
   */
  async request<T = any>(config: RequestConfig): Promise<ApiResponse<T> | Response> {
    const {
      method,
      url,
      data,
      headers = {},
      requireAuth = true,
      responseType = 'json',
    } = config;

    // Build full URL
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;

    // Prepare headers - ALWAYS include product key
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Product-Key': this.productKey,
      ...headers,
    };

    // Add JWT token if authentication is required
    if (requireAuth) {
      const token = TokenManager.getToken();
      if (token) {
        requestHeaders.Authorization = `Bearer ${token}`;
      }
    }

    // Debug logging for development
    clog.http(`${method} ${fullUrl}`, {
      headers: {
        ...requestHeaders,
        'X-Product-Key': requestHeaders['X-Product-Key']?.substring(0, 20) + '...',
        'Authorization': requestHeaders.Authorization ? 'Bearer ***' : 'None',
      },
      requireAuth,
    });

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      signal: AbortSignal.timeout(this.timeout),
    };

    // Add body for non-GET requests
    if (data && method !== 'GET') {
      // Send data as-is since Rails API supports snake_case
      requestOptions.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(fullUrl, requestOptions);

      // Handle HTTP errors
      if (!response.ok) {
        // Handle 401 Unauthorized - automatic logout and redirect
        if (response.status === 401) {
          handleUnauthorized();
        }
        
        // Try to parse error as JSON, fallback to blob
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          errorData = { status: { code: 'HTTP_ERROR', message: `HTTP ${response.status} Error` } };
        }
        
        const error: ApiError = {
          status: {
            http_code: response.status,
            code: errorData.status?.code || 'HTTP_ERROR',
            message: errorData.status?.message || `HTTP ${response.status} Error`,
          },
          data: errorData.data,
        };
        clog.error(`HTTP Error ${response.status}`, error);
        throw error;
      }

      // Handle blob responses
      if (responseType === 'blob') {
        return response as any;
      }

      // Parse JSON response
      const responseData = await response.json();

      // Return response as-is since Rails API uses snake_case consistently
      const apiResponse = {
        status: responseData.status,
        data: responseData.data
      };

      // Return successful response
      return apiResponse as ApiResponse<T>;
    } catch (error) {
      // Handle network errors, timeouts, etc.
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          clog.error('Request timeout', { url: fullUrl, method });
          throw {
            status: {
              http_code: 408,
              code: 'TIMEOUT',
              message: 'Request timeout',
            },
          } as ApiError;
        }

        clog.error('Network error', { url: fullUrl, method, error: error.message });
        throw {
          status: {
            http_code: 0,
            code: 'NETWORK_ERROR',
            message: error.message || 'Network error',
          },
        } as ApiError;
      }

      // Re-throw API errors
      throw error;
    }
  }

  /**
   * Convenience methods for different HTTP verbs
   */
  async get<T = any>(url: string, requireAuth = true): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'GET', url, requireAuth });
  }

  async post<T = any>(url: string, data?: any, requireAuth = true): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'POST', url, data, requireAuth });
  }

  async put<T = any>(url: string, data?: any, requireAuth = true): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PUT', url, data, requireAuth });
  }

  async patch<T = any>(url: string, data?: any, requireAuth = true): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PATCH', url, data, requireAuth });
  }

  async delete<T = any>(url: string, config?: { data?: any; requireAuth?: boolean }): Promise<ApiResponse<T>> {
    const requireAuth = config?.requireAuth ?? true;
    return this.request<T>({ method: 'DELETE', url, data: config?.data, requireAuth });
  }
}

// Create singleton instance
const httpClient = new HttpClient();

// Export the main HTTP handler
export const http = httpClient;

// Export token management utilities
export const tokenManager = TokenManager;

