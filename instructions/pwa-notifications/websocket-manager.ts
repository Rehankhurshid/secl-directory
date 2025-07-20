// lib/websocket/websocketManager.ts
import { offlineQueue } from '../offline/messageQueue'
import { showNotification } from '../notifications/pushNotifications'

interface WebSocketMessage {
  type: 'message' | 'presence' | 'typing' | 'read' | 'delivered'
  data: any
  timestamp: number
}

interface ConnectionState {
  status: 'connecting' | 'connected' | 'disconnected' | 'error'
  lastConnected?: Date
  reconnectAttempts: number
}

type WebSocketEventHandler = (message: WebSocketMessage) => void

class WebSocketManager {
  private ws: WebSocket | null = null
  private url: string
  private reconnectTimer: NodeJS.Timeout | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private messageHandlers: Set<WebSocketEventHandler> = new Set()
  private connectionState: ConnectionState = {
    status: 'disconnected',
    reconnectAttempts: 0,
  }
  
  // Configuration
  private readonly config = {
    reconnectDelay: 1000,
    maxReconnectDelay: 30000,
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000,
    connectionTimeout: 10000,
  }

  constructor(url: string) {
    this.url = url
    
    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline())
    window.addEventListener('offline', () => this.handleOffline())
    
    // Listen for visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.connectionState.status === 'disconnected') {
        this.connect()
      }
    })
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN || !navigator.onLine) {
      return
    }

    this.updateConnectionState({ status: 'connecting' })

    try {
      this.ws = new WebSocket(this.url)
      this.setupEventHandlers()
      
      // Set connection timeout
      const timeoutId = setTimeout(() => {
        if (this.ws?.readyState !== WebSocket.OPEN) {
          this.ws?.close()
          this.handleError(new Error('Connection timeout'))
        }
      }, this.config.connectionTimeout)

      this.ws.addEventListener('open', () => clearTimeout(timeoutId), { once: true })
    } catch (error) {
      this.handleError(error as Error)
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return

    this.ws.addEventListener('open', this.handleOpen.bind(this))
    this.ws.addEventListener('message', this.handleMessage.bind(this))
    this.ws.addEventListener('close', this.handleClose.bind(this))
    this.ws.addEventListener('error', this.handleError.bind(this))
  }

  private handleOpen(): void {
    console.log('WebSocket connected')
    
    this.updateConnectionState({
      status: 'connected',
      lastConnected: new Date(),
      reconnectAttempts: 0,
    })

    // Start heartbeat
    this.startHeartbeat()

    // Sync any pending messages
    offlineQueue.syncMessages()

    // Notify handlers
    this.notifyHandlers({
      type: 'presence',
      data: { status: 'online' },
      timestamp: Date.now(),
    })
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data)
      
      // Handle different message types
      switch (message.type) {
        case 'message':
          this.handleIncomingMessage(message.data)
          break
          
        case 'presence':
          this.handlePresenceUpdate(message.data)
          break
          
        case 'typing':
          this.handleTypingIndicator(message.data)
          break
          
        case 'read':
        case 'delivered':
          this.handleMessageStatus(message.type, message.data)
          break
      }

      // Notify all handlers
      this.notifyHandlers(message)
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
    }
  }

  private handleIncomingMessage(data: any): void {
    // Show notification if app is in background
    if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
      showNotification(`New message from ${data.senderName}`, {
        body: data.content,
        tag: `message-${data.conversationId}`,
        data: {
          messageId: data.id,
          conversationId: data.conversationId,
        },
      })
    }
  }

  private handlePresenceUpdate(data: any): void {
    // Update user presence in UI
    console.log('Presence update:', data)
  }

  private handleTypingIndicator(data: any): void {
    // Update typing indicator in UI
    console.log('Typing indicator:', data)
  }

  private handleMessageStatus(type: 'read' | 'delivered', data: any): void {
    // Update message status in UI
    console.log(`Message ${type}:`, data)
  }

  private handleClose(event: CloseEvent): void {
    console.log('WebSocket closed:', event.code, event.reason)
    
    this.updateConnectionState({ status: 'disconnected' })
    this.stopHeartbeat()

    // Attempt reconnection if not a normal closure
    if (event.code !== 1000 && navigator.onLine) {
      this.scheduleReconnect()
    }
  }

  private handleError(error: Error): void {
    console.error('WebSocket error:', error)
    this.updateConnectionState({ status: 'error' })
  }

  private handleOnline(): void {
    console.log('Network is online')
    if (this.connectionState.status === 'disconnected') {
      this.connect()
    }
  }

  private handleOffline(): void {
    console.log('Network is offline')
    this.disconnect()
  }

  private scheduleReconnect(): void {
    if (this.connectionState.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.connectionState.reconnectAttempts),
      this.config.maxReconnectDelay
    )

    console.log(`Reconnecting in ${delay}ms...`)

    this.reconnectTimer = setTimeout(() => {
      this.updateConnectionState({
        reconnectAttempts: this.connectionState.reconnectAttempts + 1,
      })
      this.connect()
    }, delay)
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' })
      }
    }, this.config.heartbeatInterval)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private updateConnectionState(update: Partial<ConnectionState>): void {
    this.connectionState = { ...this.connectionState, ...update }
    
    // Notify UI of connection state change
    window.dispatchEvent(
      new CustomEvent('websocket-state-change', {
        detail: this.connectionState,
      })
    )
  }

  private notifyHandlers(message: WebSocketMessage): void {
    this.messageHandlers.forEach((handler) => {
      try {
        handler(message)
      } catch (error) {
        console.error('Error in WebSocket message handler:', error)
      }
    })
  }

  // Public methods
  send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    } else {
      // Queue message if offline
      console.log('WebSocket not connected, queueing message')
      // The actual queueing would be handled by the messaging system
    }
  }

  sendMessage(conversationId: string, content: string, type: 'text' | 'image' | 'file' = 'text'): void {
    this.send({
      type: 'message',
      data: {
        conversationId,
        content,
        messageType: type,
        timestamp: Date.now(),
      },
    })
  }

  sendTypingIndicator(conversationId: string, isTyping: boolean): void {
    this.send({
      type: 'typing',
      data: {
        conversationId,
        isTyping,
      },
    })
  }

  markAsRead(conversationId: string, messageId: string): void {
    this.send({
      type: 'read',
      data: {
        conversationId,
        messageId,
      },
    })
  }

  subscribe(handler: WebSocketEventHandler): () => void {
    this.messageHandlers.add(handler)
    
    // Return unsubscribe function
    return () => {
      this.messageHandlers.delete(handler)
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    this.stopHeartbeat()

    if (this.ws) {
      this.ws.close(1000, 'Normal closure')
      this.ws = null
    }

    this.updateConnectionState({ status: 'disconnected' })
  }

  getConnectionState(): ConnectionState {
    return { ...this.connectionState }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

// Singleton instance
let wsManager: WebSocketManager | null = null

export function getWebSocketManager(): WebSocketManager {
  if (!wsManager) {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'
    wsManager = new WebSocketManager(wsUrl)
  }
  return wsManager
}

// React hook for WebSocket
export function useWebSocket() {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
    reconnectAttempts: 0,
  })
  const [messages, setMessages] = useState<WebSocketMessage[]>([])

  useEffect(() => {
    const wsManager = getWebSocketManager()
    
    // Subscribe to messages
    const unsubscribe = wsManager.subscribe((message) => {
      setMessages((prev) => [...prev, message])
    })

    // Listen for connection state changes
    const handleStateChange = (event: CustomEvent<ConnectionState>) => {
      setConnectionState(event.detail)
    }

    window.addEventListener('websocket-state-change', handleStateChange as any)

    // Connect on mount
    wsManager.connect()

    // Set initial state
    setConnectionState(wsManager.getConnectionState())

    return () => {
      unsubscribe()
      window.removeEventListener('websocket-state-change', handleStateChange as any)
    }
  }, [])

  const sendMessage = useCallback((conversationId: string, content: string) => {
    const wsManager = getWebSocketManager()
    wsManager.sendMessage(conversationId, content)
  }, [])

  const sendTypingIndicator = useCallback((conversationId: string, isTyping: boolean) => {
    const wsManager = getWebSocketManager()
    wsManager.sendTypingIndicator(conversationId, isTyping)
  }, [])

  return {
    connectionState,
    messages,
    sendMessage,
    sendTypingIndicator,
    isConnected: connectionState.status === 'connected',
  }
}