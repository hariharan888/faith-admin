/**
 * Authentication Store (Zustand)
 * 
 * Manages global authentication state:
 * - User data
 * - Authentication status
 * - Loading states
 * - Error handling
 */

import { create } from 'zustand';
import { AuthService, AuthUser } from '../services/auth.service';
import { tokenManager } from '../http';
import { clog } from '../logger';

// Store State Interface
interface AuthState {
  // User Data
  user: AuthUser | null;
  isAuthenticated: boolean;
  
  // Loading States
  isLoading: boolean;
  isInitializing: boolean;
  
  // Error Handling
  error: string | null;
  
  // Actions
  login: (token: string, userData: AuthUser) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Async Actions
  initializeAuth: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  validateAuth: () => Promise<boolean>;
}

/**
 * Authentication Store
 * Uses Zustand for client-side state management (no persistence)
 */
// Check for existing token synchronously on store creation
// This runs on the client side only
const getInitialAuthState = (): { user: AuthUser | null; isAuthenticated: boolean; isInitializing: boolean } => {
  // Always start with not authenticated during SSR
  if (typeof window === 'undefined') {
    return {
      user: null,
      isAuthenticated: false,
      isInitializing: false,
    };
  }

  try {
    const token = tokenManager.getToken();
    const userData = tokenManager.getUserData();
    
    if (token && userData) {
      // Optimistically set authenticated state if token exists
      // Will be validated asynchronously
      return {
        user: userData,
        isAuthenticated: true,
        isInitializing: true, // Will be set to false after validation
      };
    }
  } catch (error) {
    // If localStorage access fails, start unauthenticated
    console.error('Failed to check initial auth state:', error);
  }

  return {
    user: null,
    isAuthenticated: false,
    isInitializing: false,
  };
};

// Only get initial state on client side
const initialAuthState = typeof window !== 'undefined' ? getInitialAuthState() : {
  user: null,
  isAuthenticated: false,
  isInitializing: false,
};

export const useAuthStore = create<AuthState>()((set, get) => ({
      // Initial State - check for token synchronously
      user: initialAuthState.user,
      isAuthenticated: initialAuthState.isAuthenticated,
      isLoading: false,
      isInitializing: initialAuthState.isInitializing,
      error: null,

      // Synchronous Actions
      login: (token: string, userData: AuthUser) => {
        clog.auth('User login', { userId: userData.user.id, email: userData.user.email });
        tokenManager.setToken(token);
        tokenManager.setUserData(userData);
        set({
          user: userData,
          isAuthenticated: true,
          error: null,
        });
        clog.store('Auth state updated - user logged in', { isAuthenticated: true });
      },

      logout: () => {
        clog.auth('User logout');
        tokenManager.removeToken();
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
        clog.store('Auth state updated - user logged out', { isAuthenticated: false });
      },

      setLoading: (loading: boolean) => {
        clog.store('Loading state changed', { isLoading: loading });
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        if (error) {
          clog.error('Auth error set', { error });
        }
        set({ error });
      },

      clearError: () => {
        clog.store('Auth error cleared');
        set({ error: null });
      },

      // Async Actions
      initializeAuth: async () => {
        const state = get();
        // If already initializing and we don't have optimistic auth, skip
        // If we have optimistic auth (isAuthenticated from token check), we still need to validate
        if (state.isInitializing && !state.isAuthenticated) {
          return; // Already initializing without optimistic auth
        }

        clog.auth('Initializing authentication');
        // Set isInitializing if not already set (it might be set from optimistic auth)
        set({ isInitializing: true, error: null });

        try {
          const token = tokenManager.getToken();
          if (!token) {
            clog.auth('No token found, skipping initialization');
            set({ 
              isInitializing: false,
              isAuthenticated: false,
              user: null,
            });
            return;
          }

          // If we already have user data from initial state, we're optimistically authenticated
          // Just validate the token
          const currentState = get();
          const hasOptimisticAuth = currentState.isAuthenticated && currentState.user;

          if (!hasOptimisticAuth) {
            // Try to get user data from localStorage first
            const cachedUserData = tokenManager.getUserData();
            if (cachedUserData) {
              set({
                user: cachedUserData,
                isAuthenticated: true,
              });
            }
          }

          clog.auth('Validating existing token');
          // Validate token by fetching user data
          const response = await AuthService.getCurrentUser();
          const userData = response.data;

          clog.auth('Token validation successful', { userId: userData.user.id });
          // Update with fresh user data
          tokenManager.setUserData(userData);
          set({
            user: userData,
            isAuthenticated: true,
            isInitializing: false,
            error: null,
          });
          clog.store('Auth state initialized - user authenticated', { isAuthenticated: true, user: userData });
        } catch (error: any) {
          // Token is invalid, clear it
          clog.error('Token validation failed', { error: error.status?.message });
          tokenManager.removeToken();
          set({
            user: null,
            isAuthenticated: false,
            isInitializing: false,
            error: error.status?.message || 'Authentication failed',
          });
          clog.store('Auth state initialized - user not authenticated', { isAuthenticated: false });
        }
      },

      refreshUserData: async () => {
        const { isLoading } = get();
        if (isLoading) return;

        clog.auth('Refreshing user data');
        set({ isLoading: true, error: null });

        try {
          const response = await AuthService.getCurrentUser();
          const userData = response.data;

          clog.auth('User data refreshed successfully', { userId: userData.user.id });
          tokenManager.setUserData(userData);
          set({
            user: userData,
            isLoading: false,
            error: null,
          });
          clog.store('Auth state updated - user data refreshed', { userId: userData.user.id });
        } catch (error: any) {
          clog.error('Failed to refresh user data', { error: error.status?.message });
          set({
            isLoading: false,
            error: error.status?.message || 'Failed to refresh user data',
          });
        }
      },

      validateAuth: async () => {
        try {
          clog.auth('Validating authentication');
          const isValid = await AuthService.validateToken();
          if (!isValid) {
            clog.auth('Authentication validation failed - logging out');
            get().logout();
          } else {
            clog.auth('Authentication validation successful');
          }
          return isValid;
        } catch (error) {
          clog.error('Authentication validation error', { error });
          get().logout();
          return false;
        }
      },
    }));

// Convenience hooks for common use cases
export const useAuth = () => {
  const store = useAuthStore();
  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,
    login: store.login,
    logout: store.logout,
    clearError: store.clearError,
  };
};

export const useAuthActions = () => {
  const store = useAuthStore();
  return {
    initializeAuth: store.initializeAuth,
    refreshUserData: store.refreshUserData,
    validateAuth: store.validateAuth,
    setLoading: store.setLoading,
    setError: store.setError,
  };
};

// Helper functions
export const getAuthUser = () => useAuthStore.getState().user;
export const getIsAuthenticated = () => useAuthStore.getState().isAuthenticated;

