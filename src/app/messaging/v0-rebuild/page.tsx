'use client';

import MessagingLayout from '@/components/messaging/v0-rebuild/messaging-layout';
import { NotificationProvider } from '@/contexts/notifications/NotificationContext';
import { NotificationPermissionBanner } from '@/components/notifications/notification-permission-banner';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function MessagingPageSkeleton() {
  return (
    <div className="h-[calc(100dvh-69px)] flex">
      <div className="w-full md:w-1/3 h-full border-r p-4 space-y-3">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 8 }).map((_, i) => (
           <div key={i} className="flex items-center space-x-4">
             <Skeleton className="h-12 w-12 rounded-full" />
             <div className="space-y-2 flex-1">
               <Skeleton className="h-4 w-3/4" />
               <Skeleton className="h-4 w-1/2" />
             </div>
           </div>
        ))}
      </div>
      <div className="hidden md:flex w-2/3 h-full flex-col justify-between p-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

export default function V0RebuildMessagingPage() {
  return (
    <NotificationProvider vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''}>
      <main className="h-[calc(100dvh-69px)] overflow-hidden relative">
        <Suspense fallback={<MessagingPageSkeleton />}>
          <MessagingLayout />
        </Suspense>
        <NotificationPermissionBanner />
      </main>
    </NotificationProvider>
  );
}