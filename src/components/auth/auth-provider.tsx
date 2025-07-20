'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';

interface AuthContextValue {
  employee: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const PUBLIC_PATHS = ['/login', '/forgot-password', '/reset-password'];
const DEFAULT_REDIRECT = '/employee-directory';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // Check if current path requires authentication
  const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));

  useEffect(() => {
    // Skip if still loading
    if (auth.isLoading) return;
    
    console.log('AuthProvider check:', {
      pathname,
      isPublicPath,
      isAuthenticated: auth.isAuthenticated,
      isLoading: auth.isLoading
    });
    
    if (!auth.isAuthenticated && !isPublicPath) {
      // Redirect to login if not authenticated and trying to access protected route
      console.log('Redirecting to login - not authenticated');
      router.replace('/login');
    } else if (auth.isAuthenticated && pathname === '/login') {
      // Redirect to default page if authenticated and on login page
      console.log('Redirecting to employee directory - already authenticated');
      router.replace(DEFAULT_REDIRECT);
    }
  }, [auth.isAuthenticated, auth.isLoading, pathname, router, isPublicPath]);

  // Show loading state while checking authentication
  if (auth.isLoading && !isPublicPath) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}