import MobileDebug from '@/components/messaging/mobile-debug';
import { AppLayout } from '@/components/layout/app-layout';

export default function WebSocketDebugPage() {
  return (
    <AppLayout>
    <div className="container mx-auto">
      <MobileDebug />
    </div>
    </AppLayout>
  );
} 