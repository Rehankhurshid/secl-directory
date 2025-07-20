import ModernMessagingLayout from '@/components/messaging/modern/messaging-layout';

export default function RealtimeMessagingPage() {
  return (
    <div className="min-h-screen bg-background">
      <ModernMessagingLayout />
    </div>
  );
}

export const metadata = {
  title: 'Real-time Messaging - SECL Directory',
  description: 'WebSocket-powered real-time messaging for employees',
}; 