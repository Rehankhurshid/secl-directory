// lib/offline/messageQueue.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface MessageQueueDB extends DBSchema {
  messages: {
    key: string
    value: {
      id: string
      conversationId: string
      senderId: string
      recipientId: string
      content: string
      type: 'text' | 'image' | 'file'
      status: 'pending' | 'sending' | 'failed'
      createdAt: Date
      retryCount: number
      attachments?: Array<{
        url: string
        type: string
        size: number
      }>
    }
    indexes: { 
      'by-status': 'status'
      'by-conversation': 'conversationId'
      'by-created': 'createdAt'
    }
  }
  
  employees: {
    key: string
    value: {
      id: string
      employeeId: string
      name: string
      email: string
      department: string
      designation: string
      phoneNumber: string
      lastSyncedAt: Date
    }
    indexes: {
      'by-department': 'department'
      'by-name': 'name'
    }
  }
}

class OfflineMessageQueue {
  private db: IDBPDatabase<MessageQueueDB> | null = null
  private syncInProgress = false

  async init() {
    this.db = await openDB<MessageQueueDB>('EmployeeMessagingDB', 1, {
      upgrade(db) {
        // Create message store
        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages', {
            keyPath: 'id',
          })
          messageStore.createIndex('by-status', 'status')
          messageStore.createIndex('by-conversation', 'conversationId')
          messageStore.createIndex('by-created', 'createdAt')
        }

        // Create employee cache store
        if (!db.objectStoreNames.contains('employees')) {
          const employeeStore = db.createObjectStore('employees', {
            keyPath: 'id',
          })
          employeeStore.createIndex('by-department', 'department')
          employeeStore.createIndex('by-name', 'name')
        }
      },
    })

    // Set up online/offline listeners
    window.addEventListener('online', () => this.syncMessages())
    window.addEventListener('offline', () => console.log('App is offline'))

    // Register background sync if available
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then((registration) => {
        return (registration as any).sync.register('sync-messages')
      })
    }
  }

  async queueMessage(message: Omit<MessageQueueDB['messages']['value'], 'id' | 'status' | 'createdAt' | 'retryCount'>) {
    if (!this.db) await this.init()
    
    const id = crypto.randomUUID()
    const queuedMessage: MessageQueueDB['messages']['value'] = {
      ...message,
      id,
      status: 'pending',
      createdAt: new Date(),
      retryCount: 0,
    }

    await this.db!.add('messages', queuedMessage)
    
    // Try to send immediately if online
    if (navigator.onLine) {
      this.syncMessages()
    }

    return id
  }

  async syncMessages() {
    if (!this.db || this.syncInProgress || !navigator.onLine) return
    
    this.syncInProgress = true

    try {
      const tx = this.db.transaction('messages', 'readwrite')
      const pendingMessages = await tx.store.index('by-status').getAll('pending')

      for (const message of pendingMessages) {
        try {
          // Update status to sending
          message.status = 'sending'
          await tx.store.put(message)

          // Send to server
          const response = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conversationId: message.conversationId,
              recipientId: message.recipientId,
              content: message.content,
              type: message.type,
              attachments: message.attachments,
            }),
          })

          if (response.ok) {
            // Remove from queue on success
            await this.db.delete('messages', message.id)
          } else {
            throw new Error(`Failed to send: ${response.status}`)
          }
        } catch (error) {
          console.error('Failed to sync message:', error)
          
          // Update retry count and status
          message.retryCount += 1
          message.status = message.retryCount >= 3 ? 'failed' : 'pending'
          await this.db.put('messages', message)
        }
      }
    } finally {
      this.syncInProgress = false
    }
  }

  async getPendingMessages(conversationId?: string) {
    if (!this.db) await this.init()
    
    if (conversationId) {
      return this.db!.getAllFromIndex('messages', 'by-conversation', conversationId)
    }
    
    return this.db!.getAllFromIndex('messages', 'by-status', 'pending')
  }

  async cacheEmployees(employees: MessageQueueDB['employees']['value'][]) {
    if (!this.db) await this.init()
    
    const tx = this.db!.transaction('employees', 'readwrite')
    
    for (const employee of employees) {
      await tx.store.put({
        ...employee,
        lastSyncedAt: new Date(),
      })
    }
    
    await tx.done
  }

  async searchOfflineEmployees(query: string) {
    if (!this.db) await this.init()
    
    const employees = await this.db!.getAll('employees')
    
    // Simple offline search
    const searchTerm = query.toLowerCase()
    return employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(searchTerm) ||
        emp.email.toLowerCase().includes(searchTerm) ||
        emp.department.toLowerCase().includes(searchTerm)
    )
  }

  async clearFailedMessages() {
    if (!this.db) await this.init()
    
    const failedMessages = await this.db!.getAllFromIndex('messages', 'by-status', 'failed')
    
    for (const message of failedMessages) {
      await this.db!.delete('messages', message.id)
    }
  }
}

export const offlineQueue = new OfflineMessageQueue()

// React hook for using offline queue
export function useOfflineQueue() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    offlineQueue.init().then(() => {
      setIsInitialized(true)
      updatePendingCount()
    })

    const interval = setInterval(updatePendingCount, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const updatePendingCount = async () => {
    const pending = await offlineQueue.getPendingMessages()
    setPendingCount(pending.length)
  }

  const sendMessage = async (
    recipientId: string,
    conversationId: string,
    content: string,
    type: 'text' | 'image' | 'file' = 'text'
  ) => {
    const messageId = await offlineQueue.queueMessage({
      conversationId,
      senderId: getCurrentUserId(), // You'll need to implement this
      recipientId,
      content,
      type,
    })
    
    await updatePendingCount()
    
    return messageId
  }

  return {
    isInitialized,
    pendingCount,
    sendMessage,
    syncMessages: () => offlineQueue.syncMessages(),
    getPendingMessages: offlineQueue.getPendingMessages.bind(offlineQueue),
  }
}

// Helper function - implement based on your auth system
function getCurrentUserId(): string {
  // Replace with actual user ID from your auth system
  return 'current-user-id'
}