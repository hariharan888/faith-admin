/**
 * Authentication Service
 * 
 * Handles all authentication-related API calls:
 * - Login
 * - User profile management
 * - Token refresh
 * - Logout
 */

import { http, ApiResponse } from '../http';

// Types
export interface User {
  id: number;
  email?: string;
  username?: string;
}

export interface AuthUser {
  user: User;
  is_admin: boolean;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface LoginData {
  email?: string;
  username?: string;
  password: string;
}

/**
 * Authentication Service Class
 * Contains all authentication-related API methods
 */
export class AuthService {
  /**
   * Login with username/email and password
   */
  static async login(data: LoginData): Promise<ApiResponse<LoginResponse>> {
    return http.post<LoginResponse>('/auth/login', { user: data }, false);
  }

  /**
   * Get current authenticated user details
   * Requires valid JWT token
   */
  static async getCurrentUser(): Promise<ApiResponse<AuthUser>> {
    return http.get<AuthUser>('/auth/me');
  }

  /**
   * Refresh JWT token
   * Requires valid JWT token
   */
  static async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    return http.post<{ token: string }>('/auth/refresh');
  }

  /**
   * Logout user (client-side token removal)
   */
  static async logout(): Promise<ApiResponse<{ message: string }>> {
    return http.post<{ message: string }>('/auth/logout');
  }

  /**
   * Validate if current token is still valid
   */
  static async validateToken(): Promise<boolean> {
    try {
      await this.getCurrentUser();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Change user password
   * Requires valid JWT token
   */
  static async changePassword(data: {
    old_password: string;
    new_password: string;
    new_password_confirmation: string;
  }): Promise<ApiResponse<{ message: string }>> {
    return http.post<{ message: string }>('/auth/change_password', data);
  }
}

