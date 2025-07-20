'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import wsManager, { MessagePayload, TypingPayload } from '@/lib/websocket/websocket-manager';
import { Message, MessageType, MessageStatus } from '@/contexts/messaging/domain/entities';
import offlineSyncManager from '@/lib/storage/offline-sync-manager';

type WebSocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export function useWebSocket(userId: string) {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const handleStatusChange = (newStatus: WebSocketStatus) => {
      setStatus(newStatus);
      setIsConnected(newStatus === 'connected');
    };

    wsManager.on('statusChange', handleStatusChange);
    
    // Auto-connect
    wsManager.connect(userId).catch(error => {
      console.error('Failed to connect WebSocket:', error);
    });

    return () => {
      wsManager.off('statusChange', handleStatusChange);
      wsManager.disconnect();
    };
  }, [userId]);

  const sendMessage = useCallback((content: string, conversationId: string) => {
    return wsManager.sendChatMessage(content, conversationId, userId);
  }, [userId]);

  const sendTyping = useCallback((conversationId: string, isTyping: boolean) => {
    wsManager.sendTypingIndicator(conversationId, userId, isTyping);
  }, [userId]);

  const markAsRead = useCallback((messageId: string) => {
    // Mark as read functionality can be implemented later if needed
    console.log('Mark as read:', messageId);
  }, []);

  return {
    status,
    isConnected,
    sendMessage,
    sendTyping,
    markAsRead
  };
}

// Simple message persistence using localStorage
const MESSAGE_STORAGE_KEY = 'messaging_conversations';

function getStoredMessages(conversationId: string): Message[] {
  try {
    const stored = localStorage.getItem(MESSAGE_STORAGE_KEY);
    console.log('📦 Loading stored messages for:', conversationId);
    console.log('📦 Raw stored data:', stored);
    
    if (!stored) {
      console.log('📦 No stored messages found');
      return [];
    }
    
    const allMessages = JSON.parse(stored);
    const conversationMessages = allMessages[conversationId] || [];
    console.log('📦 Found messages for conversation:', conversationMessages.length);
    
    return conversationMessages.map((msg: any) => new Message(
      msg.id,
      msg.conversationId,
      msg.senderId,
      msg.content,
      msg.type,
      msg.status,
      new Date(msg.createdAt),
      msg.editedAt ? new Date(msg.editedAt) : undefined,
      msg.deletedAt ? new Date(msg.deletedAt) : undefined,
      msg.replyTo,
      msg.reactions,
      msg.readBy
    ));
  } catch (error) {
    console.error('Failed to load stored messages:', error);
    return [];
  }
}

function storeMessage(conversationId: string, message: Message) {
  try {
    console.log('💾 Storing message:', { conversationId, messageId: message.id, content: message.content });
    
    const stored = localStorage.getItem(MESSAGE_STORAGE_KEY);
    const allMessages = stored ? JSON.parse(stored) : {};
    
    if (!allMessages[conversationId]) {
      allMessages[conversationId] = [];
    }
    
    // Check if message already exists (to prevent duplicates)
    const existingIndex = allMessages[conversationId].findIndex((m: any) => m.id === message.id);
    
    const messageData = {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      type: message.type,
      status: message.status,
      createdAt: message.createdAt.toISOString(),
      editedAt: message.editedAt?.toISOString(),
      deletedAt: message.deletedAt?.toISOString(),
      replyTo: message.replyTo,
      reactions: message.reactions,
      readBy: message.readBy
    };
    
    if (existingIndex >= 0) {
      console.log('💾 Updating existing message at index:', existingIndex);
      allMessages[conversationId][existingIndex] = messageData;
    } else {
      console.log('💾 Adding new message to conversation');
      allMessages[conversationId].push(messageData);
    }
    
    localStorage.setItem(MESSAGE_STORAGE_KEY, JSON.stringify(allMessages));
    console.log('💾 Messages stored successfully. Total conversations:', Object.keys(allMessages).length);
  } catch (error) {
    console.error('Failed to store message:', error);
  }
}

export function useRealTimeMessages(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load messages from database via API
    const loadInitialMessages = async () => {
      setIsLoading(true);
      
      try {
        // Get auth token
        const token = typeof window !== 'undefined' ? localStorage.getItem('sessionToken') : null;
        
        if (!token) {
          console.warn('No auth token available, falling back to localStorage');
          // Fallback to localStorage if no token
      const storedMessages = getStoredMessages(conversationId);
          setMessages(storedMessages);
          setIsLoading(false);
          return;
        }

        // Fetch messages from database
        const response = await fetch(`/api/messaging/groups/${conversationId}/messages?limit=100&offset=0`, {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' 
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to load messages: ${response.status}`);
        }

        const data = await response.json();
        const apiMessages = data.messages || [];
        
        // Convert API messages to Message objects
        const dbMessages = apiMessages.map((msg: any) => new Message(
          msg.id.toString(),
          conversationId,
          msg.senderId,
          msg.content,
          msg.messageType === 'image' ? MessageType.IMAGE : 
          msg.messageType === 'file' ? MessageType.FILE : MessageType.TEXT,
          MessageStatus.DELIVERED, // Messages from DB are considered delivered
          new Date(msg.createdAt),
          msg.editedAt ? new Date(msg.editedAt) : undefined,
          msg.deletedAt ? new Date(msg.deletedAt) : undefined,
          msg.replyToId ? msg.replyToId.toString() : undefined,
          [], // reactions - TODO: implement when needed
          msg.readBy || [] // readBy array
        ));

        // Store messages locally for offline access
        dbMessages.forEach(msg => storeMessage(conversationId, msg));
        setMessages(dbMessages);
        
        console.log(`✅ Loaded ${dbMessages.length} messages from database for conversation ${conversationId}`);

      } catch (error) {
        console.error('❌ Failed to load messages from database:', error);
        
        // Fallback to localStorage on error
        console.log('📱 Falling back to localStorage...');
        const storedMessages = getStoredMessages(conversationId);
        setMessages(storedMessages);
        
        // If no stored messages either, show empty state
        if (storedMessages.length === 0) {
          console.log('💬 No messages found, starting fresh conversation');
        }
      }
      
      setIsLoading(false);
    };

    loadInitialMessages();
  }, [conversationId]);

  useEffect(() => {
    const handleNewMessage = (payload: MessagePayload) => {
      if (payload.conversationId === conversationId) {
        const newMessage = new Message(
          payload.id,
          payload.conversationId,
          payload.senderId,
          payload.content,
          payload.type === 'text' ? MessageType.TEXT : 
          payload.type === 'image' ? MessageType.IMAGE : MessageType.FILE,
          MessageStatus.DELIVERED, // Set as delivered since we received it via WebSocket
          new Date(payload.createdAt)
        );

        // Store the message
        storeMessage(conversationId, newMessage);
        
        setMessages(prev => {
          // Check if message already exists to prevent duplicates
          const existingIndex = prev.findIndex(m => m.id === newMessage.id);
          if (existingIndex >= 0) {
            // Update existing message
            const updated = [...prev];
            updated[existingIndex] = newMessage;
            return updated;
          } else {
            // Add new message
            return [...prev, newMessage];
          }
        });
      }
    };

    const handleMessageStatus = (payload: any) => {
      if (payload.messageId) {
        setMessages(prev => prev.map(msg => {
          if (msg.id === payload.messageId) {
            // Update message status
            const updatedMessage = new Message(
              msg.id,
              msg.conversationId,
              msg.senderId,
              msg.content,
              msg.type,
              payload.status === 'delivered' ? MessageStatus.DELIVERED : 
              payload.status === 'read' ? MessageStatus.READ : MessageStatus.SENT,
              msg.createdAt,
              msg.editedAt,
              msg.deletedAt,
              msg.replyTo,
              msg.reactions,
              msg.readBy
            );
            
            // Update stored message
            storeMessage(conversationId, updatedMessage);
            return updatedMessage;
          }
          return msg;
        }));
      }
    };

    wsManager.on('message', handleNewMessage);
    wsManager.on('message_status', handleMessageStatus);

    return () => {
      wsManager.off('message', handleNewMessage);
      wsManager.off('message_status', handleMessageStatus);
    };
  }, [conversationId]);

  const sendMessage = useCallback(async (content: string, senderId: string) => {
    const tempId = `temp-${Date.now()}`;

    // Optimistically add message to UI with pending status
    const optimisticMessage = new Message(
      tempId,
      conversationId,
      senderId,
      content,
      MessageType.TEXT,
      MessageStatus.PENDING,
      new Date()
    );

    // Store the optimistic message locally
    storeMessage(conversationId, optimisticMessage);
    setMessages(prev => [...prev, optimisticMessage]);

    // Check if we're online and have a good connection
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const isWSConnected = wsManager.isConnected();
    
    if (!isOnline || !isWSConnected) {
      // Queue for offline sync instead of immediate sending
      try {
        await offlineSyncManager.queueMessage(conversationId, content, 'text');
        
        // Update to queued status
        const queuedMessage = new Message(
          tempId,
          conversationId,
          senderId,
          content,
          MessageType.TEXT,
          MessageStatus.PENDING, // Keep as pending until synced
          new Date()
        );

        storeMessage(conversationId, queuedMessage);
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? queuedMessage : msg
        ));
        
        console.log('📤 Message queued for offline sync');
        return;
        
      } catch (error) {
        console.error('❌ Failed to queue message for offline sync:', error);
        
        // Update to failed status
        const failedMessage = new Message(
        tempId,
          conversationId,
          senderId,
          content,
          MessageType.TEXT,
          MessageStatus.FAILED,
          new Date()
        );

        storeMessage(conversationId, failedMessage);
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? failedMessage : msg
        ));
        return;
      }
    }

    try {
      // Get auth token
      const token = typeof window !== 'undefined' ? localStorage.getItem('sessionToken') : null;
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Send to database via API
      const response = await fetch(`/api/messaging/groups/${conversationId}/messages`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ content, messageType: 'text' }),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const savedMessage = await response.json();
      
      // Update message with real database ID and sent status
      const dbMessage = new Message(
        savedMessage.id.toString(), // Convert DB ID to string
        conversationId,
        senderId,
        content,
        MessageType.TEXT,
        MessageStatus.SENT,
        new Date(savedMessage.createdAt)
      );
      
      // Update stored message with real ID
      storeMessage(conversationId, dbMessage);
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? dbMessage : msg
      ));

      // Send via WebSocket for real-time delivery to other users
      wsManager.sendChatMessage(content, conversationId, senderId);
      
      console.log('✅ Message saved to database with ID:', savedMessage.id);

    } catch (error) {
      console.error('❌ Failed to save message to database:', error);
      
      // Queue for retry via offline sync
      try {
        await offlineSyncManager.queueMessage(conversationId, content, 'text');
        
        // Update message status to queued
        const queuedMessage = new Message(
          tempId,
          conversationId,
          senderId,
          content,
          MessageType.TEXT,
          MessageStatus.PENDING, // Will be retried via offline sync
          new Date()
        );

        storeMessage(conversationId, queuedMessage);
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? queuedMessage : msg
        ));
        
        console.log('📤 Message queued for retry via offline sync');
        
      } catch (queueError) {
        console.error('❌ Failed to queue message for retry:', queueError);
        
        // Update message status to failed as last resort
        const failedMessage = new Message(
          tempId,
          conversationId,
          senderId,
          content,
          MessageType.TEXT,
          MessageStatus.FAILED,
          new Date()
        );

        storeMessage(conversationId, failedMessage);
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? failedMessage : msg
        ));
      }
    }
  }, [conversationId]);

  return {
    messages,
    isLoading,
    sendMessage
  };
}

export function useTypingIndicator(conversationId: string, currentUserId: string) {
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    const handleTyping = (payload: TypingPayload) => {
      if (payload.conversationId === conversationId && payload.userId !== currentUserId) {
        const timeouts = typingTimeoutRef.current;
        
        if (payload.isTyping) {
          // Add user to typing set
          setTypingUsers(prev => new Set([...prev, payload.userId]));
          
          // Clear existing timeout for this user
          const existingTimeout = timeouts.get(payload.userId);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }
          
          // Set new timeout to remove user after 3 seconds of inactivity
          const newTimeout = setTimeout(() => {
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(payload.userId);
              return newSet;
            });
            timeouts.delete(payload.userId);
          }, 3000);
          
          timeouts.set(payload.userId, newTimeout);
        } else {
          // Remove user from typing set immediately
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(payload.userId);
            return newSet;
          });
          
          // Clear timeout
          const timeout = timeouts.get(payload.userId);
          if (timeout) {
            clearTimeout(timeout);
            timeouts.delete(payload.userId);
          }
        }
      }
    };

    wsManager.on('typing', handleTyping);

    return () => {
      wsManager.off('typing', handleTyping);
      // Clear all timeouts
      typingTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
      typingTimeoutRef.current.clear();
    };
  }, [conversationId, currentUserId]);

  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    wsManager.sendTypingIndicator(conversationId, currentUserId, isTyping);
  }, [conversationId, currentUserId]);

  return {
    typingUsers,
    sendTypingIndicator
  };
}

export function useOnlinePresence() {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Presence functionality to be implemented when needed
    const handlePresence = (payload: any) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (payload.isOnline) {
          newSet.add(payload.userId);
        } else {
          newSet.delete(payload.userId);
        }
        return newSet;
      });
    };

    wsManager.on('presence', handlePresence);

    return () => {
      wsManager.off('presence', handlePresence);
    };
  }, []);

  const updatePresence = useCallback((userId: string, isOnline: boolean) => {
    // Presence update functionality to be implemented when needed
    console.log('Update presence:', { userId, isOnline });
  }, []);

  return {
    onlineUsers,
    updatePresence
  };
} 