'use client';

import { MessagingLayout } from '@/components/messaging/v0-redesign';
import { NotificationProvider } from '@/contexts/notifications/NotificationContext';
import { NotificationPermissionBanner } from '@/components/notifications/notification-permission-banner';

export default function V0MessagingPage() {
  return (
    <NotificationProvider vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''}>
      <div className="h-[calc(100vh-64px)] md:h-[calc(100vh-57px)] overflow-hidden">
        <MessagingLayout />
        <NotificationPermissionBanner />
      </div>
    </NotificationProvider>
  );
}