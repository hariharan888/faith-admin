/**
 * Authentication Provider
 * 
 * Provides authentication context and initializes auth state
 * Wraps the app to ensure authentication state is available everywhere
 */

"use client";

import { useEffect } from 'react';
import { useAuthStore } from '../stores/auth.store';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { initializeAuth, isInitializing } = useAuthStore();

  useEffect(() => {
    // Initialize authentication state on app load
    initializeAuth();
  }, [initializeAuth]);

  // Show loading state while initializing authentication
  // This prevents any child components from rendering before auth is determined
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

