/**
 * Hook for managing offline status and sync states
 */

import { useState, useEffect, useCallback } from 'react';
import offlineSyncManager, { type SyncResult } from '../lib/storage/offline-sync-manager';
import wsManager from '../lib/websocket/websocket-manager';

export interface OfflineStatus {
  isOnline: boolean;
  isWSConnected: boolean;
  isSyncing: boolean;
  queueStats: {
    messages: number;
    actions: number;
  };
  lastSyncResult?: SyncResult;
  lastSyncTime?: Date;
}

export function useOfflineStatus() {
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isWSConnected: false,
    isSyncing: false,
    queueStats: { messages: 0, actions: 0 }
  });

  // Update connection status
  const updateConnectionStatus = useCallback(async () => {
    try {
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      const isWSConnected = wsManager.isConnected();
      const isSyncing = offlineSyncManager.isSyncInProgress();
      const queueStats = await offlineSyncManager.getQueueStats();

      setStatus(prev => ({
        ...prev,
        isOnline,
        isWSConnected,
        isSyncing,
        queueStats
      }));
    } catch (error) {
      console.warn('Failed to update connection status:', error);
      // Update basic status without queue stats
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      const isWSConnected = wsManager.isConnected();
      const isSyncing = offlineSyncManager.isSyncInProgress();

      setStatus(prev => ({
        ...prev,
        isOnline,
        isWSConnected,
        isSyncing
      }));
    }
  }, []);

  // Handle online/offline events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      console.log('🌐 Browser online');
      updateConnectionStatus();
    };

    const handleOffline = () => {
      console.log('📵 Browser offline');
      updateConnectionStatus();
    };

    // Browser online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // WebSocket events
    const handleWSConnected = () => {
      console.log('🔌 WebSocket connected');
      updateConnectionStatus();
    };

    const handleWSDisconnected = () => {
      console.log('🔌 WebSocket disconnected');
      updateConnectionStatus();
    };

    // Sync events
    const handleSyncStarted = () => {
      setStatus(prev => ({ ...prev, isSyncing: true }));
    };

    const handleSyncCompleted = (result: SyncResult) => {
      setStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncResult: result,
        lastSyncTime: new Date()
      }));
      updateConnectionStatus(); // Update queue stats
    };

    const handleSyncFailed = (error: any) => {
      setStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncResult: {
          success: false,
          syncedMessages: 0,
          syncedActions: 0,
          failed: 1,
          errors: [error?.message || 'Unknown sync error']
        },
        lastSyncTime: new Date()
      }));
      updateConnectionStatus();
    };

    const handleMessageQueued = () => {
      updateConnectionStatus(); // Update queue stats
    };

    const handleActionQueued = () => {
      updateConnectionStatus(); // Update queue stats
    };

    // Subscribe to offline sync manager events
    offlineSyncManager.on('syncStarted', handleSyncStarted);
    offlineSyncManager.on('syncCompleted', handleSyncCompleted);
    offlineSyncManager.on('syncFailed', handleSyncFailed);
    offlineSyncManager.on('messageQueued', handleMessageQueued);
    offlineSyncManager.on('actionQueued', handleActionQueued);

    // Subscribe to WebSocket events
    wsManager.on('connected', handleWSConnected);
    wsManager.on('disconnected', handleWSDisconnected);

    // Initial status update (delayed to allow initialization)
    const initialUpdateTimeout = setTimeout(updateConnectionStatus, 1000);

    // Periodic status updates
    const statusInterval = setInterval(updateConnectionStatus, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      offlineSyncManager.off('syncStarted', handleSyncStarted);
      offlineSyncManager.off('syncCompleted', handleSyncCompleted);
      offlineSyncManager.off('syncFailed', handleSyncFailed);
      offlineSyncManager.off('messageQueued', handleMessageQueued);
      offlineSyncManager.off('actionQueued', handleActionQueued);
      
      wsManager.off('connected', handleWSConnected);
      wsManager.off('disconnected', handleWSDisconnected);
      
      clearTimeout(initialUpdateTimeout);
      clearInterval(statusInterval);
    };
  }, [updateConnectionStatus]);

  // Manual sync trigger
  const triggerSync = useCallback(async () => {
    if (!status.isOnline || !status.isWSConnected) {
      console.warn('Cannot sync: offline or WebSocket disconnected');
      return;
    }

    if (status.isSyncing) {
      console.warn('Sync already in progress');
      return;
    }

    try {
      await offlineSyncManager.startSync();
    } catch (error) {
      console.error('Failed to trigger sync:', error);
    }
  }, [status.isOnline, status.isWSConnected, status.isSyncing]);

  // Clear queue
  const clearQueue = useCallback(async () => {
    try {
      await offlineSyncManager.clearQueue();
      await updateConnectionStatus();
    } catch (error) {
      console.error('Failed to clear queue:', error);
      // Still try to update status even if clear failed
      await updateConnectionStatus();
    }
  }, [updateConnectionStatus]);

  // Get connection quality description
  const getConnectionQuality = useCallback((): 'excellent' | 'good' | 'poor' | 'offline' => {
    if (!status.isOnline) return 'offline';
    if (status.isWSConnected) return 'excellent';
    return 'poor';
  }, [status.isOnline, status.isWSConnected]);

  // Get status description
  const getStatusDescription = useCallback((): string => {
    if (!status.isOnline) {
      return `Offline - ${status.queueStats.messages + status.queueStats.actions} items queued`;
    }
    
    if (!status.isWSConnected) {
      return 'Poor connection - Real-time messaging unavailable';
    }

    if (status.isSyncing) {
      return 'Syncing offline messages...';
    }

    const totalQueued = status.queueStats.messages + status.queueStats.actions;
    if (totalQueued > 0) {
      return `${totalQueued} items waiting to sync`;
    }

    return 'Connected';
  }, [status]);

  return {
    ...status,
    triggerSync,
    clearQueue,
    getConnectionQuality,
    getStatusDescription,
    hasQueuedItems: status.queueStats.messages > 0 || status.queueStats.actions > 0,
    isFullyConnected: status.isOnline && status.isWSConnected,
    canSync: status.isOnline && status.isWSConnected && !status.isSyncing
  };
} 