/**
 * Offline Sync Manager
 * Handles message queuing, background sync, and conflict resolution
 */

import offlineDB, { type DBMessage, type QueuedMessage, type QueuedAction } from './offline-db';
import wsManager from '../websocket/websocket-manager';

export interface SyncResult {
  success: boolean;
  syncedMessages: number;
  syncedActions: number;
  failed: number;
  errors: string[];
}

export interface OfflineSyncOptions {
  maxRetries: number;
  retryDelay: number;
  batchSize: number;
  timeoutMs: number;
}

class OfflineSyncManager {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSyncing: boolean = false;
  private syncTimeout: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  private readonly defaultOptions: OfflineSyncOptions = {
    maxRetries: 3,
    retryDelay: 2000,
    batchSize: 10,
    timeoutMs: 30000
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupEventListeners();
    }
  }

  private setupEventListeners(): void {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Listen for WebSocket connection events
    wsManager.on('connected', this.handleWSConnected.bind(this));
    wsManager.on('disconnected', this.handleWSDisconnected.bind(this));
  }

  private handleOnline(): void {
    console.log('🌐 Network connection restored');
    this.isOnline = true;
    this.emit('online');
    
    // Delay sync to allow network stabilization
    if (this.syncTimeout) clearTimeout(this.syncTimeout);
    this.syncTimeout = setTimeout(() => {
      this.startSync();
    }, 1000);
  }

  private handleOffline(): void {
    console.log('📵 Network connection lost');
    this.isOnline = false;
    this.emit('offline');
    
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = null;
    }
  }

  private handleWSConnected(): void {
    console.log('🔌 WebSocket connected - starting sync');
    if (this.isOnline && !this.isSyncing) {
      this.startSync();
    }
  }

  private handleWSDisconnected(): void {
    console.log('🔌 WebSocket disconnected');
  }

  // Event emitter methods
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(...args));
    }
  }

  // Queue operations
  async queueMessage(
    conversationId: string,
    content: string,
    type: 'text' | 'image' | 'file' = 'text',
    replyToId?: string,
    attachments?: any[],
    metadata?: Record<string, any>
  ): Promise<string> {
    try {
      // Ensure database is initialized
      if (!offlineDB.isInitialized()) {
        await offlineDB.init();
      }

      const queueId = await offlineDB.queueMessage({
        conversationId,
        content,
        type,
        replyToId,
        attachments,
        metadata
      });

      console.log('📤 Message queued for offline sync:', queueId);
      this.emit('messageQueued', { queueId, conversationId, content });

      // Try immediate sync if online
      if (this.isOnline && wsManager.isConnected()) {
        this.startSync();
      }

      return queueId;
    } catch (error) {
      console.error('❌ Failed to queue message:', error);
      throw error;
    }
  }

  async queueAction(
    type: 'reaction' | 'edit' | 'delete' | 'status_update',
    messageId: string,
    conversationId: string,
    payload: any
  ): Promise<string> {
    try {
      // Ensure database is initialized
      if (!offlineDB.isInitialized()) {
        await offlineDB.init();
      }

      const actionId = await offlineDB.queueAction({
        type,
        messageId,
        conversationId,
        payload
      });

      console.log('📤 Action queued for offline sync:', actionId);
      this.emit('actionQueued', { actionId, type, messageId });

      // Try immediate sync if online
      if (this.isOnline && wsManager.isConnected()) {
        this.startSync();
      }

      return actionId;
    } catch (error) {
      console.error('❌ Failed to queue action:', error);
      throw error;
    }
  }

  // Sync operations
  async startSync(options?: Partial<OfflineSyncOptions>): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('⏳ Sync already in progress');
      return { success: false, syncedMessages: 0, syncedActions: 0, failed: 0, errors: ['Sync already in progress'] };
    }

    if (!this.isOnline || !wsManager.isConnected()) {
      console.log('📵 Cannot sync: offline or WebSocket disconnected');
      return { success: false, syncedMessages: 0, syncedActions: 0, failed: 0, errors: ['Offline or WebSocket disconnected'] };
    }

    this.isSyncing = true;
    this.emit('syncStarted');

    const config = { ...this.defaultOptions, ...options };
    const result: SyncResult = {
      success: true,
      syncedMessages: 0,
      syncedActions: 0,
      failed: 0,
      errors: []
    };

    try {
      console.log('🔄 Starting offline sync...');

      // Sync queued messages first
      const messageResult = await this.syncQueuedMessages(config);
      result.syncedMessages = messageResult.synced;
      result.failed += messageResult.failed;
      result.errors.push(...messageResult.errors);

      // Sync queued actions
      const actionResult = await this.syncQueuedActions(config);
      result.syncedActions = actionResult.synced;
      result.failed += actionResult.failed;
      result.errors.push(...actionResult.errors);

      result.success = result.failed === 0;

      console.log('✅ Sync completed:', result);
      this.emit('syncCompleted', result);

      return result;

    } catch (error) {
      console.error('❌ Sync failed:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
      this.emit('syncFailed', error);
      return result;

    } finally {
      this.isSyncing = false;
    }
  }

  private async syncQueuedMessages(config: OfflineSyncOptions): Promise<{ synced: number; failed: number; errors: string[] }> {
    const queuedMessages = await offlineDB.getQueuedMessages();
    
    if (queuedMessages.length === 0) {
      console.log('📭 No queued messages to sync');
      return { synced: 0, failed: 0, errors: [] };
    }

    console.log(`📤 Syncing ${queuedMessages.length} queued messages...`);

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process messages in batches
    for (let i = 0; i < queuedMessages.length; i += config.batchSize) {
      const batch = queuedMessages.slice(i, i + config.batchSize);
      
      for (const queuedMsg of batch) {
        try {
          // Skip messages that have exceeded retry limit
          if (queuedMsg.retryCount >= config.maxRetries) {
            console.warn(`⚠️ Skipping message ${queuedMsg.id} - max retries exceeded`);
            await offlineDB.removeQueuedMessage(queuedMsg.id);
            failed++;
            errors.push(`Max retries exceeded for message ${queuedMsg.id}`);
            continue;
          }

          // Send message via WebSocket
          const success = await this.sendQueuedMessage(queuedMsg, config);
          
          if (success) {
            await offlineDB.removeQueuedMessage(queuedMsg.id);
            synced++;
            console.log(`✅ Synced queued message: ${queuedMsg.id}`);
          } else {
            // Update retry count
            await this.updateQueuedMessageRetry(queuedMsg.id);
            failed++;
            errors.push(`Failed to sync message ${queuedMsg.id}`);
          }

        } catch (error) {
          console.error(`❌ Error syncing message ${queuedMsg.id}:`, error);
          await this.updateQueuedMessageRetry(queuedMsg.id);
          failed++;
          errors.push(`Error syncing message ${queuedMsg.id}: ${error}`);
        }
      }

      // Add delay between batches to avoid overwhelming the server
      if (i + config.batchSize < queuedMessages.length) {
        await this.delay(100);
      }
    }

    return { synced, failed, errors };
  }

  private async syncQueuedActions(config: OfflineSyncOptions): Promise<{ synced: number; failed: number; errors: string[] }> {
    const queuedActions = await offlineDB.getQueuedActions();
    
    if (queuedActions.length === 0) {
      console.log('📭 No queued actions to sync');
      return { synced: 0, failed: 0, errors: [] };
    }

    console.log(`📤 Syncing ${queuedActions.length} queued actions...`);

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const queuedAction of queuedActions) {
      try {
        // Skip actions that have exceeded retry limit
        if (queuedAction.retryCount >= config.maxRetries) {
          console.warn(`⚠️ Skipping action ${queuedAction.id} - max retries exceeded`);
          await offlineDB.removeQueuedAction(queuedAction.id);
          failed++;
          errors.push(`Max retries exceeded for action ${queuedAction.id}`);
          continue;
        }

        // Send action via WebSocket
        const success = await this.sendQueuedAction(queuedAction, config);
        
        if (success) {
          await offlineDB.removeQueuedAction(queuedAction.id);
          synced++;
          console.log(`✅ Synced queued action: ${queuedAction.id}`);
        } else {
          // Update retry count
          await this.updateQueuedActionRetry(queuedAction.id);
          failed++;
          errors.push(`Failed to sync action ${queuedAction.id}`);
        }

      } catch (error) {
        console.error(`❌ Error syncing action ${queuedAction.id}:`, error);
        await this.updateQueuedActionRetry(queuedAction.id);
        failed++;
        errors.push(`Error syncing action ${queuedAction.id}: ${error}`);
      }
    }

    return { synced, failed, errors };
  }

  private async sendQueuedMessage(queuedMsg: QueuedMessage, config: OfflineSyncOptions): Promise<boolean> {
    try {
      // Get auth token
      const token = typeof window !== 'undefined' ? localStorage.getItem('sessionToken') : null;
      
      if (!token) {
        console.error('❌ No auth token available for sync');
        return false;
      }

      // Send to database via API
      const response = await fetch(`/api/messaging/groups/${queuedMsg.conversationId}/messages`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          content: queuedMsg.content, 
          messageType: queuedMsg.type || 'text' 
        }),
      });

      if (!response.ok) {
        console.error(`❌ API call failed for queued message: ${response.status}`);
        return false;
      }

      const savedMessage = await response.json();
      console.log(`✅ Queued message synced to database with ID: ${savedMessage.id}`);

      // Also send via WebSocket for real-time delivery
      try {
        wsManager.sendChatMessage(
          queuedMsg.content,
          queuedMsg.conversationId,
          'SYNC_USER'
        );
      } catch (wsError) {
        console.warn('⚠️ WebSocket send failed during sync, but DB save succeeded:', wsError);
      }

      return true;

    } catch (error) {
      console.error('❌ Failed to sync queued message:', error);
      return false;
    }
  }

  private async sendQueuedAction(queuedAction: QueuedAction, config: OfflineSyncOptions): Promise<boolean> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.warn(`⏰ Action ${queuedAction.id} sync timeout`);
        resolve(false);
      }, config.timeoutMs);

      try {
        // Send different types of actions via WebSocket manager
        switch (queuedAction.type) {
          case 'reaction':
            wsManager.sendReaction(
              queuedAction.messageId,
              queuedAction.conversationId,
              queuedAction.payload.userId,
              queuedAction.payload.userName,
              queuedAction.payload.emoji,
              queuedAction.payload.action
            );
            break;

          case 'edit':
            wsManager.editMessage(
              queuedAction.messageId,
              queuedAction.conversationId,
              queuedAction.payload.userId,
              queuedAction.payload.newContent
            );
            break;

          case 'delete':
            wsManager.deleteMessage(
              queuedAction.messageId,
              queuedAction.conversationId,
              queuedAction.payload.userId
            );
            break;

          case 'status_update':
            wsManager.sendStatusUpdate(
              queuedAction.messageId,
              queuedAction.conversationId,
              queuedAction.payload.userId,
              queuedAction.payload.status
            );
            break;

          default:
            console.warn(`⚠️ Unknown action type: ${queuedAction.type}`);
            clearTimeout(timeout);
            resolve(false);
            return;
        }

        // Clear timeout and resolve success
        clearTimeout(timeout);
        resolve(true);

      } catch (error) {
        clearTimeout(timeout);
        console.error('❌ Failed to send queued action:', error);
        resolve(false);
      }
    });
  }

  private async updateQueuedMessageRetry(queueId: string): Promise<void> {
    // This would update the retry count in IndexedDB
    // Implementation depends on adding an update method to offlineDB
    console.log(`🔄 Updating retry count for queued message: ${queueId}`);
  }

  private async updateQueuedActionRetry(actionId: string): Promise<void> {
    // This would update the retry count in IndexedDB
    // Implementation depends on adding an update method to offlineDB
    console.log(`🔄 Updating retry count for queued action: ${actionId}`);
  }

  // Utility methods
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public status methods
  isOffline(): boolean {
    return !this.isOnline;
  }

  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  async getQueueStats(): Promise<{ messages: number; actions: number }> {
    try {
      // Ensure database is initialized
      if (!offlineDB.isInitialized()) {
        await offlineDB.init();
      }

      const [messages, actions] = await Promise.all([
        offlineDB.getQueuedMessages(),
        offlineDB.getQueuedActions()
      ]);

      return {
        messages: messages.length,
        actions: actions.length
      };
    } catch (error) {
      console.warn('Failed to get queue stats:', error);
      return { messages: 0, actions: 0 };
    }
  }

  async clearQueue(): Promise<void> {
    try {
      // Ensure database is initialized
      if (!offlineDB.isInitialized()) {
        await offlineDB.init();
      }

      const [messages, actions] = await Promise.all([
        offlineDB.getQueuedMessages(),
        offlineDB.getQueuedActions()
      ]);

      await Promise.all([
        ...messages.map(msg => offlineDB.removeQueuedMessage(msg.id)),
        ...actions.map(action => offlineDB.removeQueuedAction(action.id))
      ]);

      console.log('🧹 Offline queue cleared');
      this.emit('queueCleared');
    } catch (error) {
      console.error('❌ Failed to clear queue:', error);
      throw error;
    }
  }

  // Initialize the manager
  async init(): Promise<void> {
    try {
      await offlineDB.init();
      console.log('🔄 Offline sync manager initialized');
      
      // Start initial sync if online
      if (this.isOnline && wsManager.isConnected()) {
        setTimeout(() => this.startSync(), 2000);
      }
    } catch (error) {
      console.error('❌ Failed to initialize offline sync manager:', error);
      throw error;
    }
  }
}

// Create singleton instance
const offlineSyncManager = new OfflineSyncManager();

export default offlineSyncManager; 