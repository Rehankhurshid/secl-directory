/**
 * Offline Database Manager using IndexedDB
 * Handles local storage for messages, conversations, and offline queue
 */

interface DBMessage {
  id: string;
  tempId?: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'audio' | 'video' | 'document';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  replyToId?: string;
  replyToMessage?: DBMessage;
  editedAt?: Date;
  editCount?: number;
  isDeleted?: boolean;
  deletedAt?: Date;
  reactions?: Array<{
    id: string;
    messageId: string;
    userId: string;
    userName: string;
    emoji: string;
    createdAt: Date;
  }>;
  attachments?: Array<{
    id: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    fileUrl: string;
    thumbnailUrl?: string;
  }>;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  synced: boolean; // Whether this message has been synced to server
}

interface DBConversation {
  id: string;
  name: string;
  type: 'group' | 'direct';
  members: string[];
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  lastSyncTime?: Date;
  updatedAt: Date;
}

interface QueuedMessage {
  id: string;
  conversationId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  replyToId?: string;
  attachments?: any[];
  metadata?: Record<string, any>;
  createdAt: Date;
  retryCount: number;
  lastRetryAt?: Date;
  error?: string;
}

interface QueuedAction {
  id: string;
  type: 'reaction' | 'edit' | 'delete' | 'status_update';
  messageId: string;
  conversationId: string;
  payload: any;
  createdAt: Date;
  retryCount: number;
  lastRetryAt?: Date;
  error?: string;
}

class OfflineDatabase {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'SECL_MessagingDB';
  private readonly DB_VERSION = 1;

  private readonly STORES = {
    messages: 'messages',
    conversations: 'conversations',
    messageQueue: 'messageQueue',
    actionQueue: 'actionQueue',
    syncMetadata: 'syncMetadata'
  } as const;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('IndexedDB is not available in server environment'));
        return;
      }

      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('📦 IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createStores(db);
      };
    });
  }

  private createStores(db: IDBDatabase): void {
    // Messages store
    if (!db.objectStoreNames.contains(this.STORES.messages)) {
      const messageStore = db.createObjectStore(this.STORES.messages, { keyPath: 'id' });
      messageStore.createIndex('conversationId', 'conversationId', { unique: false });
      messageStore.createIndex('createdAt', 'createdAt', { unique: false });
      messageStore.createIndex('synced', 'synced', { unique: false });
      messageStore.createIndex('tempId', 'tempId', { unique: false });
    }

    // Conversations store
    if (!db.objectStoreNames.contains(this.STORES.conversations)) {
      const conversationStore = db.createObjectStore(this.STORES.conversations, { keyPath: 'id' });
      conversationStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      conversationStore.createIndex('lastSyncTime', 'lastSyncTime', { unique: false });
    }

    // Message queue store (for offline messages)
    if (!db.objectStoreNames.contains(this.STORES.messageQueue)) {
      const queueStore = db.createObjectStore(this.STORES.messageQueue, { keyPath: 'id' });
      queueStore.createIndex('createdAt', 'createdAt', { unique: false });
      queueStore.createIndex('retryCount', 'retryCount', { unique: false });
    }

    // Action queue store (for offline reactions, edits, etc.)
    if (!db.objectStoreNames.contains(this.STORES.actionQueue)) {
      const actionStore = db.createObjectStore(this.STORES.actionQueue, { keyPath: 'id' });
      actionStore.createIndex('type', 'type', { unique: false });
      actionStore.createIndex('createdAt', 'createdAt', { unique: false });
    }

    // Sync metadata store
    if (!db.objectStoreNames.contains(this.STORES.syncMetadata)) {
      db.createObjectStore(this.STORES.syncMetadata, { keyPath: 'key' });
    }

    console.log('📦 IndexedDB stores created successfully');
  }

  // Message operations
  async saveMessage(message: Omit<DBMessage, 'synced' | 'updatedAt'>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const dbMessage: DBMessage = {
      ...message,
      synced: false,
      updatedAt: new Date()
    };

    const transaction = this.db.transaction([this.STORES.messages], 'readwrite');
    const store = transaction.objectStore(this.STORES.messages);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(dbMessage);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    console.log('💾 Message saved to IndexedDB:', message.id);
  }

  async getMessages(conversationId: string, limit: number = 50, offset: number = 0): Promise<DBMessage[]> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([this.STORES.messages], 'readonly');
    const store = transaction.objectStore(this.STORES.messages);
    const index = store.index('conversationId');

    return new Promise((resolve, reject) => {
      const messages: DBMessage[] = [];
      const range = IDBKeyRange.only(conversationId);
      const request = index.openCursor(range, 'prev'); // Latest first

      let count = 0;
      let skipped = 0;

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor && count < limit) {
          if (skipped >= offset) {
            messages.push(cursor.value);
            count++;
          } else {
            skipped++;
          }
          cursor.continue();
        } else {
          resolve(messages);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async updateMessage(messageId: string, updates: Partial<DBMessage>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([this.STORES.messages], 'readwrite');
    const store = transaction.objectStore(this.STORES.messages);

    // Get existing message
    const existing = await new Promise<DBMessage>((resolve, reject) => {
      const request = store.get(messageId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (!existing) {
      throw new Error(`Message ${messageId} not found`);
    }

    // Update message
    const updated: DBMessage = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };

    await new Promise<void>((resolve, reject) => {
      const request = store.put(updated);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    console.log('📝 Message updated in IndexedDB:', messageId);
  }

  async deleteMessage(messageId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([this.STORES.messages], 'readwrite');
    const store = transaction.objectStore(this.STORES.messages);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(messageId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    console.log('🗑️ Message deleted from IndexedDB:', messageId);
  }

  // Conversation operations
  async saveConversation(conversation: Omit<DBConversation, 'updatedAt'>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const dbConversation: DBConversation = {
      ...conversation,
      updatedAt: new Date()
    };

    const transaction = this.db.transaction([this.STORES.conversations], 'readwrite');
    const store = transaction.objectStore(this.STORES.conversations);

    await new Promise<void>((resolve, reject) => {
      const request = store.put(dbConversation);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    console.log('💬 Conversation saved to IndexedDB:', conversation.id);
  }

  async getConversations(): Promise<DBConversation[]> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([this.STORES.conversations], 'readonly');
    const store = transaction.objectStore(this.STORES.conversations);
    const index = store.index('updatedAt');

    return new Promise((resolve, reject) => {
      const conversations: DBConversation[] = [];
      const request = index.openCursor(null, 'prev'); // Latest first

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          conversations.push(cursor.value);
          cursor.continue();
        } else {
          resolve(conversations);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Queue operations
  async queueMessage(message: Omit<QueuedMessage, 'id' | 'createdAt' | 'retryCount'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const queuedMessage: QueuedMessage = {
      ...message,
      id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      retryCount: 0
    };

    const transaction = this.db.transaction([this.STORES.messageQueue], 'readwrite');
    const store = transaction.objectStore(this.STORES.messageQueue);

    await new Promise<void>((resolve, reject) => {
      const request = store.add(queuedMessage);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    console.log('📤 Message queued for offline sync:', queuedMessage.id);
    return queuedMessage.id;
  }

  async getQueuedMessages(): Promise<QueuedMessage[]> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([this.STORES.messageQueue], 'readonly');
    const store = transaction.objectStore(this.STORES.messageQueue);
    const index = store.index('createdAt');

    return new Promise((resolve, reject) => {
      const messages: QueuedMessage[] = [];
      const request = index.openCursor();

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          messages.push(cursor.value);
          cursor.continue();
        } else {
          resolve(messages);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async removeQueuedMessage(queueId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([this.STORES.messageQueue], 'readwrite');
    const store = transaction.objectStore(this.STORES.messageQueue);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(queueId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    console.log('✅ Queued message removed:', queueId);
  }

  async queueAction(action: Omit<QueuedAction, 'id' | 'createdAt' | 'retryCount'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const queuedAction: QueuedAction = {
      ...action,
      id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      retryCount: 0
    };

    const transaction = this.db.transaction([this.STORES.actionQueue], 'readwrite');
    const store = transaction.objectStore(this.STORES.actionQueue);

    await new Promise<void>((resolve, reject) => {
      const request = store.add(queuedAction);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    console.log('📤 Action queued for offline sync:', queuedAction.id);
    return queuedAction.id;
  }

  async getQueuedActions(): Promise<QueuedAction[]> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([this.STORES.actionQueue], 'readonly');
    const store = transaction.objectStore(this.STORES.actionQueue);
    const index = store.index('createdAt');

    return new Promise((resolve, reject) => {
      const actions: QueuedAction[] = [];
      const request = index.openCursor();

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          actions.push(cursor.value);
          cursor.continue();
        } else {
          resolve(actions);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async removeQueuedAction(actionId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([this.STORES.actionQueue], 'readwrite');
    const store = transaction.objectStore(this.STORES.actionQueue);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(actionId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    console.log('✅ Queued action removed:', actionId);
  }

  // Sync metadata operations
  async setSyncMetadata(key: string, value: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([this.STORES.syncMetadata], 'readwrite');
    const store = transaction.objectStore(this.STORES.syncMetadata);

    await new Promise<void>((resolve, reject) => {
      const request = store.put({ key, value, updatedAt: new Date() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncMetadata(key: string): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([this.STORES.syncMetadata], 'readonly');
    const store = transaction.objectStore(this.STORES.syncMetadata);

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Check if database is initialized
  isInitialized(): boolean {
    return this.db !== null;
  }

  // Utility methods
  async clearAll(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const stores = Object.values(this.STORES);
    const transaction = this.db.transaction(stores, 'readwrite');

    await Promise.all(
      stores.map(storeName => 
        new Promise<void>((resolve, reject) => {
          const request = transaction.objectStore(storeName).clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        })
      )
    );

    console.log('🧹 All offline data cleared');
  }

  async getStorageStats(): Promise<{
    messages: number;
    conversations: number;
    queuedMessages: number;
    queuedActions: number;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(Object.values(this.STORES), 'readonly');

    const counts = await Promise.all([
      this.getCount(transaction.objectStore(this.STORES.messages)),
      this.getCount(transaction.objectStore(this.STORES.conversations)),
      this.getCount(transaction.objectStore(this.STORES.messageQueue)),
      this.getCount(transaction.objectStore(this.STORES.actionQueue))
    ]);

    return {
      messages: counts[0],
      conversations: counts[1],
      queuedMessages: counts[2],
      queuedActions: counts[3]
    };
  }

  private async getCount(store: IDBObjectStore): Promise<number> {
    return new Promise((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Create singleton instance
const offlineDB = new OfflineDatabase();

export default offlineDB;
export type { DBMessage, DBConversation, QueuedMessage, QueuedAction }; 