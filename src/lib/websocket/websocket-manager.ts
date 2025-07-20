import EventEmitter from 'events';
import type { 
  WebSocketMessage, 
  WebSocketMessageType,
  MessagePayload,
  ReactionPayload,
  EditMessagePayload,
  DeleteMessagePayload,
  StatusUpdatePayload,
  TypingPayload,
  PresencePayload,
  FileUploadPayload,
  Message
} from '../messaging/types';

type MessageStatus = 'sent' | 'delivered' | 'read';

interface MessageStatusPayload {
  messageId: string;
  status: MessageStatus;
}

class WebSocketManager extends EventEmitter {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3; // Reduced from 5 to save costs
  private reconnectDelay = 2000; // Increased base delay
  private maxReconnectDelay = 30000; // Max 30 seconds
  private messageQueue: WebSocketMessage[] = [];
  private status: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private lastHeartbeat: number = 0;
  private isReconnecting = false;

  constructor(url?: string) {
    super();
    // Use dynamic URL based on environment configuration or current host
    this.url = url || this.getDefaultWebSocketUrl();
    console.log('🔌 WebSocketManager initialized with URL:', this.url);
  }
  
  private getDefaultWebSocketUrl(): string {
    // Check for environment variable first
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_WEBSOCKET_URL) {
      console.log('🔌 Using environment variable for default WebSocket URL:', process.env.NEXT_PUBLIC_WEBSOCKET_URL);
      return process.env.NEXT_PUBLIC_WEBSOCKET_URL;
    }
    
    // Use current hostname (works for both desktop and mobile)
    if (typeof window !== 'undefined') {
      // Check if we're in local development (localhost or 127.0.0.1)
      const isLocalDev = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname.includes('loca.lt'); // ngrok local tunnel
      
      if (isLocalDev) {
        // For local development (including ngrok), always use localhost:3002
        const localUrl = `ws://localhost:3002`;
        console.log('🔌 Using local development default WebSocket URL:', localUrl);
        console.log('🔌 Current location:', window.location.href);
        console.log('🔌 Protocol:', window.location.protocol);
        console.log('🔌 Hostname:', window.location.hostname);
        console.log('🔌 Detected local development environment');
        return localUrl;
      }
      
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const defaultUrl = `${protocol}//${window.location.hostname}:3002`;
      console.log('🔌 Using default WebSocket URL:', defaultUrl);
      console.log('🔌 Current location:', window.location.href);
      console.log('🔌 Protocol:', window.location.protocol);
      console.log('🔌 Hostname:', window.location.hostname);
      return defaultUrl;
    }
    
    // Server-side fallback (shouldn't be used in practice)
    console.log('🔌 Using server-side fallback WebSocket URL: ws://localhost:3002');
    return 'ws://localhost:3002';
  }

  private getWebSocketUrl(): string {
    // Priority 1: Environment variable (for production/ngrok)
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_WEBSOCKET_URL) {
      console.log('🔌 Using environment variable for WebSocket URL:', process.env.NEXT_PUBLIC_WEBSOCKET_URL);
      return process.env.NEXT_PUBLIC_WEBSOCKET_URL;
    }
    
    // Priority 2: For local development, always use localhost:3002
    if (typeof window !== 'undefined') {
      // Check if we're in local development (localhost or 127.0.0.1)
      const isLocalDev = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname.includes('loca.lt'); // ngrok local tunnel
      
      if (isLocalDev) {
        // For local development (including ngrok), always use localhost:3002
        const localUrl = `ws://localhost:3002`;
        console.log('🔌 Using local development WebSocket URL:', localUrl);
        console.log('🔌 Current location:', window.location.href);
        console.log('🔌 Detected local development environment');
        return localUrl;
      }
      
      // For production ngrok domains, use the same domain but WebSocket protocol
      if (window.location.hostname.includes('ngrok-free.app') || window.location.hostname.includes('ngrok.app')) {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ngrokUrl = `${protocol}//${window.location.hostname}:3002`;
        console.log('🔌 Using production ngrok WebSocket URL:', ngrokUrl);
        return ngrokUrl;
      }
    }
    
    // Priority 3: Use configured URL (includes local network IP)
    console.log('🔌 Using configured WebSocket URL:', this.url);
    return this.url;
  }

  async connect(userId: string): Promise<void> {
    if (this.status === 'connected' || this.status === 'connecting') {
      console.log('🔌 WebSocket already connected or connecting');
      return;
    }

    if (this.isReconnecting) {
      console.log('🔌 Reconnection already in progress');
      return;
    }

    this.status = 'connecting';
    this.emit('statusChange', this.status);

    try {
      const wsUrl = this.getWebSocketUrl();
      const fullUrl = `${wsUrl}?userId=${encodeURIComponent(userId)}`;
      
      console.log('🔌 Connecting to WebSocket:', fullUrl);
      console.log('🔌 WebSocket URL resolved to:', wsUrl);
      console.log('🔌 User ID:', userId);
      
      // Set connection timeout
      this.connectionTimeout = setTimeout(() => {
        if (this.status === 'connecting') {
          console.warn('🔌 Connection timeout after 10 seconds');
          this.handleConnectionFailure();
        }
      }, 10000); // 10 second timeout

      this.ws = new WebSocket(fullUrl);
      console.log('🔌 WebSocket object created, setting up event listeners...');
      this.setupEventListeners();
      
    } catch (error) {
      console.error('🔌 WebSocket connection error:', error);
      this.handleConnectionFailure();
    }
  }

  private setupEventListeners(): void {
    if (!this.ws) return;

    console.log('🔌 Setting up WebSocket event listeners...');

    this.ws.onopen = () => {
      console.log('🔌 WebSocket connected successfully');
      this.status = 'connected';
      this.reconnectAttempts = 0; // Reset on successful connection
      this.isReconnecting = false;
      
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }

      this.emit('statusChange', this.status);
      this.startHeartbeat();
      this.flushMessageQueue();
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        // Handle heartbeat response
        if (message.type === 'pong') {
          this.lastHeartbeat = Date.now();
          return;
        }

        this.handleMessage(message);
      } catch (error) {
        console.error('🔌 Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('🔌 WebSocket disconnected:', event.code, event.reason);
      this.status = 'disconnected';
      this.stopHeartbeat();
      
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }

      // Only log abnormal disconnections, reduce noise
      if (event.code === 1006) {
        console.warn('🔌 Abnormal disconnection detected (possible network issue)');
      }

      this.emit('statusChange', this.status);
      
      // Only auto-reconnect for certain conditions
      if (event.code !== 1000 && !this.isReconnecting && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.warn('❌ Max reconnection attempts reached, stopping auto-reconnect');
        this.status = 'error';
        this.emit('statusChange', this.status);
      }
    };

    this.ws.onerror = (error) => {
      console.error('🔌 WebSocket error:', error);
      console.error('🔌 WebSocket readyState:', this.ws?.readyState);
      this.status = 'error';
      this.emit('statusChange', this.status);
    };

    console.log('🔌 WebSocket event listeners set up successfully');
  }

  private startHeartbeat(): void {
    this.stopHeartbeat(); // Clear any existing interval
    this.lastHeartbeat = Date.now();
    
    // Send ping every 30 seconds (reduced frequency to save costs)
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() }));
        
        // Check if we've received a pong recently
        if (Date.now() - this.lastHeartbeat > 60000) { // 1 minute timeout
          console.warn('🔌 Heartbeat timeout, reconnecting...');
          this.disconnect();
          this.scheduleReconnect();
        }
      }
    }, 30000); // 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.isReconnecting) return;
    
    this.isReconnecting = true;
    this.reconnectAttempts++;
    
    // Progressive backoff: 2s, 4s, 8s (capped at 30s)
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);
    
    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      if (this.status !== 'connected') {
        // Get userId from current connection
        const userId = this.getCurrentUserId();
        if (userId) {
          this.connect(userId).catch(error => {
            console.error('Reconnection failed:', error);
            this.isReconnecting = false;
          });
        } else {
          this.isReconnecting = false;
        }
      } else {
        this.isReconnecting = false;
      }
    }, delay);
  }

  private getCurrentUserId(): string | null {
    // Extract userId from current WebSocket URL
    if (this.ws?.url) {
      const url = new URL(this.ws.url);
      return url.searchParams.get('userId');
    }
    return null;
  }

  private handleConnectionFailure(): void {
    this.status = 'error';
    this.emit('statusChange', this.status);
    
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  private handleMessage(message: WebSocketMessage) {
    const { type, payload } = message;
    
    // Emit to specific event listeners
    this.emit(type, payload);
    
    // Emit to general message listeners
    this.emit('message', message);
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendMessage(message);
      }
    }
  }

  private sendMessage(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue message if not connected (max 50 messages to prevent memory issues)
      if (this.messageQueue.length < 50) {
        this.messageQueue.push(message);
      }
    }
  }

  sendChatMessage(content: string, conversationId: string, senderId: string): void {
    const message: WebSocketMessage = {
      type: 'message',
      payload: {
        id: `temp-${Date.now()}`,
        conversationId,
        senderId,
        content,
        type: 'text' as Message['type'],
        createdAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };

    this.sendMessage(message);
  }

  // Throttled typing indicator to reduce message frequency
  private typingTimeouts = new Map<string, NodeJS.Timeout>();
  
  sendTypingIndicator(conversationId: string, userId: string, isTyping: boolean): void {
    const key = `${conversationId}-${userId}`;
    
    // Clear existing timeout
    const existingTimeout = this.typingTimeouts.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.typingTimeouts.delete(key);
    }
    
    // Only send typing=true immediately, throttle typing=false
    if (isTyping) {
      const message: WebSocketMessage = {
        type: 'typing',
        payload: { conversationId, userId, isTyping },
        timestamp: new Date().toISOString()
      };
      this.sendMessage(message);
    } else {
      // Delay typing=false by 500ms to reduce spam
      const timeout = setTimeout(() => {
        const message: WebSocketMessage = {
          type: 'typing',
          payload: { conversationId, userId, isTyping: false },
          timestamp: new Date().toISOString()
        };
        this.sendMessage(message);
        this.typingTimeouts.delete(key);
      }, 500);
      
      this.typingTimeouts.set(key, timeout);
    }
  }

  // Phase 2: Enhanced messaging methods

  sendReaction(messageId: string, conversationId: string, userId: string, userName: string, emoji: string, action: 'add' | 'remove'): void {
    if (this.status !== 'connected') {
      console.warn('⚠️ Cannot send reaction - WebSocket not connected');
      return;
    }

    const message: WebSocketMessage = {
      type: 'reaction',
      payload: {
        messageId,
        conversationId,
        userId,
        userName,
        emoji,
        action
      },
      timestamp: new Date().toISOString()
    };

    this.sendMessage(message);
    console.log(`${action === 'add' ? '👍' : '👎'} Sent ${emoji} reaction to message ${messageId}`);
  }

  editMessage(messageId: string, conversationId: string, userId: string, newContent: string): void {
    if (this.status !== 'connected') {
      console.warn('⚠️ Cannot edit message - WebSocket not connected');
      return;
    }

    const message: WebSocketMessage = {
      type: 'edit_message',
      payload: {
        messageId,
        conversationId,
        userId,
        newContent,
        editedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };

    this.sendMessage(message);
    console.log(`✏️ Editing message ${messageId}`);
  }

  deleteMessage(messageId: string, conversationId: string, userId: string): void {
    if (this.status !== 'connected') {
      console.warn('⚠️ Cannot delete message - WebSocket not connected');
      return;
    }

    const message: WebSocketMessage = {
      type: 'delete_message',
      payload: {
        messageId,
        conversationId,
        userId,
        deletedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };

    this.sendMessage(message);
    console.log(`🗑️ Deleting message ${messageId}`);
  }

  sendStatusUpdate(messageId: string, conversationId: string, userId: string, status: 'delivered' | 'read'): void {
    if (this.status !== 'connected') {
      console.warn('⚠️ Cannot send status update - WebSocket not connected');
      return;
    }

    const message: WebSocketMessage = {
      type: 'status_update',
      payload: {
        messageId,
        conversationId,
        userId,
        status,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };

    this.sendMessage(message);
    console.log(`📋 Marking message ${messageId} as ${status}`);
  }

  sendPresenceUpdate(userId: string, status: 'online' | 'offline' | 'away'): void {
    if (this.status !== 'connected') {
      console.warn('⚠️ Cannot send presence update - WebSocket not connected');
      return;
    }

    const message: WebSocketMessage = {
      type: 'presence_update',
      payload: {
        userId,
        status,
        lastSeen: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };

    this.sendMessage(message);
    console.log(`👤 Updated presence to ${status}`);
  }

  sendFileUpload(messageId: string, conversationId: string, senderId: string, attachment: any): void {
    if (this.status !== 'connected') {
      console.warn('⚠️ Cannot send file upload - WebSocket not connected');
      return;
    }

    const message: WebSocketMessage = {
      type: 'file_upload',
      payload: {
        messageId,
        conversationId,
        senderId,
        attachment
      },
      timestamp: new Date().toISOString()
    };

    this.sendMessage(message);
    console.log(`📎 Uploading file ${attachment.fileName}`);
  }

  disconnect(): void {
    this.stopHeartbeat();
    this.isReconnecting = false;
    
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    // Clear all typing timeouts
    this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.typingTimeouts.clear();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.status = 'disconnected';
    this.emit('statusChange', this.status);
  }

  getStatus(): string {
    return this.status;
  }

  isConnected(): boolean {
    return this.status === 'connected' && this.ws?.readyState === WebSocket.OPEN;
  }

  override on(event: string, listener: (...args: any[]) => void) {
    return super.on(event, listener);
  }

  override off(event: string, listener: (...args: any[]) => void) {
    return super.off(event, listener);
  }
}

// Create and export singleton instance
const wsManager = new WebSocketManager();
export default wsManager;

// Export types
export type { WebSocketMessage, MessagePayload, TypingPayload, MessageStatusPayload, MessageStatus }; 