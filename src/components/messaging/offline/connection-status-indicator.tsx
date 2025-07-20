"use client";

/**
 * Connection Status Indicator Component
 * Shows offline status, sync progress, and queue information
 */

import React from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, RotateCcw, Trash2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useOfflineStatus } from '@/hooks/use-offline-status';
import { cn } from '@/lib/utils';

interface ConnectionStatusIndicatorProps {
  variant?: 'compact' | 'detailed';
  showActions?: boolean;
  className?: string;
}

export function ConnectionStatusIndicator({
  variant = 'compact',
  showActions = true,
  className
}: ConnectionStatusIndicatorProps) {
  const {
    isOnline,
    isWSConnected,
    isSyncing,
    queueStats,
    lastSyncResult,
    lastSyncTime,
    triggerSync,
    clearQueue,
    getConnectionQuality,
    getStatusDescription,
    hasQueuedItems,
    isFullyConnected,
    canSync
  } = useOfflineStatus();

  const connectionQuality = getConnectionQuality();
  const statusDescription = getStatusDescription();
  const totalQueued = queueStats.messages + queueStats.actions;

  // Connection status icon and color
  const getStatusIcon = () => {
    if (isSyncing) {
      return <RotateCcw className="h-4 w-4 animate-spin" />;
    }
    
    if (!isOnline) {
      return <WifiOff className="h-4 w-4" />;
    }
    
    if (!isWSConnected) {
      return <CloudOff className="h-4 w-4" />;
    }
    
    return <Cloud className="h-4 w-4" />;
  };

  const getStatusColor = () => {
    if (isSyncing) return 'text-blue-500';
    if (!isOnline) return 'text-red-500';
    if (!isWSConnected) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStatusBadgeVariant = () => {
    if (isSyncing) return 'default';
    if (!isOnline) return 'destructive';
    if (!isWSConnected) return 'secondary';
    return 'default';
  };

  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "flex items-center gap-2 px-2 py-1 rounded-md transition-colors",
              "hover:bg-muted/50",
              className
            )}>
              <div className={cn("transition-colors", getStatusColor())}>
                {getStatusIcon()}
              </div>
              
              {hasQueuedItems && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                  {totalQueued}
                </Badge>
              )}
              
              {isSyncing && (
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              )}
            </div>
          </TooltipTrigger>
          
          <TooltipContent side="bottom" align="start" className="max-w-xs">
            <div className="space-y-2">
              <p className="font-medium">{statusDescription}</p>
              
              {hasQueuedItems && (
                <div className="text-sm text-muted-foreground">
                  {queueStats.messages > 0 && <div>{queueStats.messages} messages queued</div>}
                  {queueStats.actions > 0 && <div>{queueStats.actions} actions queued</div>}
                </div>
              )}
              
              {lastSyncTime && (
                <div className="text-xs text-muted-foreground">
                  Last sync: {lastSyncTime.toLocaleTimeString()}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("transition-colors", getStatusColor())}>
              {getStatusIcon()}
            </div>
            <CardTitle className="text-sm">Connection Status</CardTitle>
          </div>
          
          <Badge variant={getStatusBadgeVariant()}>
            {connectionQuality}
          </Badge>
        </div>
        
        <CardDescription className="text-sm">
          {statusDescription}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Connection Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Wifi className={cn("h-4 w-4", isOnline ? "text-green-500" : "text-red-500")} />
            <span className="text-muted-foreground">Network:</span>
            <span className={isOnline ? "text-green-600" : "text-red-600"}>
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Cloud className={cn("h-4 w-4", isWSConnected ? "text-green-500" : "text-yellow-500")} />
            <span className="text-muted-foreground">WebSocket:</span>
            <span className={isWSConnected ? "text-green-600" : "text-yellow-600"}>
              {isWSConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>

        {/* Sync Progress */}
        {isSyncing && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <RotateCcw className="h-4 w-4 animate-spin text-blue-500" />
              <span>Syncing offline messages...</span>
            </div>
            <Progress value={undefined} className="h-2" />
          </div>
        )}

        {/* Queue Information */}
        {hasQueuedItems && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span>Queued Items ({totalQueued})</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              {queueStats.messages > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Messages:</span>
                  <Badge variant="secondary">{queueStats.messages}</Badge>
                </div>
              )}
              
              {queueStats.actions > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Actions:</span>
                  <Badge variant="secondary">{queueStats.actions}</Badge>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Last Sync Result */}
        {lastSyncResult && lastSyncTime && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              {lastSyncResult.success ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="font-medium">Last Sync</span>
              <span className="text-muted-foreground">
                {lastSyncTime.toLocaleTimeString()}
              </span>
            </div>
            
            {lastSyncResult.success ? (
              <div className="text-sm text-green-600">
                ✅ Synced {lastSyncResult.syncedMessages} messages, {lastSyncResult.syncedActions} actions
              </div>
            ) : (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Sync failed: {lastSyncResult.errors[0] || 'Unknown error'}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={triggerSync}
              disabled={!canSync}
              className="flex-1"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {isSyncing ? "Syncing..." : "Sync Now"}
            </Button>
            
            {hasQueuedItems && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearQueue}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Queue
              </Button>
            )}
          </div>
        )}

        {/* Connection Tips */}
        {!isFullyConnected && (
          <Alert className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {!isOnline && "Check your internet connection. Messages will be queued until you're back online."}
              {isOnline && !isWSConnected && "Real-time messaging is unavailable. Refresh the page to reconnect."}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
} 