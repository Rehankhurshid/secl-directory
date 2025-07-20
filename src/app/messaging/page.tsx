'use client';

import { useAuth } from '@/lib/hooks/use-auth';
import { useRouter } from 'next/navigation';
import ModernMessagingLayout from '@/components/messaging/modern/messaging-layout';
import { AppLayout } from '@/components/layout/app-layout';

export default function MessagingPage() {
  const router = useRouter();
  const auth = useAuth();

  // Redirect if not authenticated
  if (!auth.isAuthenticated && !auth.isLoading) {
    router.push('/login');
    return null;
  }

  // Show loading state while checking auth
  if (auth.isLoading) {
    return (
      <AppLayout>
        <div className="h-[calc(100vh-64px)] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="h-[calc(100vh-64px-4rem)] md:h-[calc(100vh-57px)] flex flex-col overflow-hidden" style={{ overscrollBehavior: 'none' }}>
        <ModernMessagingLayout />
      </div>
    </AppLayout>
  );
}