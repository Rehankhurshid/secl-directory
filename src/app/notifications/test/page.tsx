import { PushNotificationDebug } from '@/components/notifications/push-notification-debug';

export default function NotificationTestPage() {
  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Push Notification Test</h1>
      <PushNotificationDebug />
      
      <div className="mt-8 space-y-4">
        <h2 className="text-lg font-semibold">Troubleshooting Steps:</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Make sure you're accessing the app via HTTPS (localtunnel URL)</li>
          <li>Check that you're logged in (push notifications require authentication)</li>
          <li>Grant notification permission when prompted</li>
          <li>Ensure service worker is registered (should happen automatically)</li>
          <li>Create a push subscription if one doesn't exist</li>
          <li>Send a test notification to verify everything works</li>
        </ol>
        
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> On iOS, push notifications only work when the app is installed as a PWA from Safari.
          </p>
        </div>
      </div>
    </div>
  );
}