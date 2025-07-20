'use client';

import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  connected: boolean;
  authenticated: boolean;
}

export default function ConnectionStatus({ connected, authenticated }: ConnectionStatusProps) {
  const isReady = connected && authenticated;
  
  return (
    <div className="flex items-center gap-2 text-xs">
      <div className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-full",
        isReady ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
      )}>
        {isReady ? (
          <>
            <Wifi className="h-3 w-3" />
            <span>Connected</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            <span>Disconnected</span>
          </>
        )}
      </div>
      {!connected && <span className="text-muted-foreground">Reconnecting...</span>}
    </div>
  );
}