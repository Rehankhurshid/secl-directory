'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { WebSocketStatus } from '@/lib/websocket/websocket-manager';
import { 
  Wifi, 
  WifiOff, 
  Loader2, 
  AlertTriangle,
  CheckCircle2,
  RefreshCw 
} from 'lucide-react';

interface ConnectionStatusProps {
  status: WebSocketStatus;
  onReconnect?: () => void;
  className?: string;
}

export function ConnectionStatus({ status, onReconnect, className }: ConnectionStatusProps) {
  const getStatusConfig = (status: WebSocketStatus) => {
    switch (status) {
      case 'connected':
        return {
          icon: CheckCircle2,
          label: 'Connected',
          variant: 'default' as const,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'connecting':
        return {
          icon: Loader2,
          label: 'Connecting...',
          variant: 'secondary' as const,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          animate: true
        };
      case 'disconnected':
        return {
          icon: WifiOff,
          label: 'Disconnected',
          variant: 'secondary' as const,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
      case 'error':
        return {
          icon: AlertTriangle,
          label: 'Connection Error',
          variant: 'destructive' as const,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  // Minimal badge version for header
  if (className?.includes('minimal')) {
    return (
      <Badge variant={config.variant} className={cn("gap-1", className)}>
        <Icon 
          className={cn(
            "h-3 w-3", 
            config.animate && "animate-spin"
          )} 
        />
        {config.label}
      </Badge>
    );
  }

  // Full card version for detailed status
  if (status === 'error' || status === 'disconnected') {
    return (
      <Alert className={cn("mb-4", className)}>
        <Icon className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            {status === 'error' 
              ? 'Connection failed. Messages may not be delivered in real-time.'
              : 'You are offline. Messages will be sent when connection is restored.'
            }
          </span>
          {onReconnect && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onReconnect}
              className="ml-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Status indicator for connected/connecting states
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn(
        "flex items-center gap-2 px-2 py-1 rounded-md border",
        config.bgColor,
        config.borderColor
      )}>
        <Icon 
          className={cn(
            "h-3 w-3",
            config.color,
            config.animate && "animate-spin"
          )} 
        />
        <span className={cn("text-xs font-medium", config.color)}>
          {config.label}
        </span>
      </div>
    </div>
  );
}

// Typing indicator component
interface TypingIndicatorProps {
  typingUsers: Set<string>;
  getUserName?: (userId: string) => string;
  className?: string;
}

export function TypingIndicator({ typingUsers, getUserName, className }: TypingIndicatorProps) {
  if (typingUsers.size === 0) return null;

  const userNames = Array.from(typingUsers).map(userId => 
    getUserName ? getUserName(userId) : `User ${userId.slice(-4)}`
  );

  const displayText = userNames.length === 1 
    ? `${userNames[0]} is typing...`
    : userNames.length === 2
    ? `${userNames[0]} and ${userNames[1]} are typing...`
    : `${userNames[0]} and ${userNames.length - 1} others are typing...`;

  return (
    <div className={cn("flex items-center gap-2 px-3 py-2", className)}>
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
      </div>
      <span className="text-sm text-muted-foreground italic">
        {displayText}
      </span>
    </div>
  );
}

// Online presence indicator
interface OnlineIndicatorProps {
  isOnline: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function OnlineIndicator({ isOnline, size = 'sm', className }: OnlineIndicatorProps) {
  const sizeMap = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3', 
    lg: 'w-4 h-4'
  };

  return (
    <div className={cn("relative", className)}>
      <div 
        className={cn(
          "rounded-full border-2 border-white",
          sizeMap[size],
          isOnline ? "bg-green-500" : "bg-gray-400"
        )}
      />
      {isOnline && (
        <div 
          className={cn(
            "absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75",
            sizeMap[size]
          )}
        />
      )}
    </div>
  );
} 