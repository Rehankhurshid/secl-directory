'use client';

import React from 'react';
import { MainLayout } from './main-layout';
import { useAuth } from '@/lib/hooks/use-auth';
import { usePathname } from 'next/navigation';
import { Toaster } from 'sonner';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const auth = useAuth();

  // Prepare user data for the layout
  const user = auth?.employee ? {
    name: auth.employee.name,
    email: auth.employee.emailId || 'user@example.com',
    ...(auth.employee.profileImage && { avatar: auth.employee.profileImage }),
    ...(auth.employee.role && { role: auth.employee.role }),
  } : undefined;

  // Don't show navigation on login page
  if (pathname === '/login') {
    return (
      <>
        {children}
        <Toaster richColors position="top-center" />
      </>
    );
  }

  return (
    <>
      {user ? (
        <MainLayout user={user}>
          {children}
        </MainLayout>
      ) : (
        <MainLayout>
          {children}
        </MainLayout>
      )}
      <Toaster richColors position="top-center" />
    </>
  );
}