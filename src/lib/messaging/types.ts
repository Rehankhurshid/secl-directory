export interface Group {
  id: string;
  name: string;
  memberCount: number;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  type: 'group' | 'direct';
  members: string[]; // Employee codes
}

export interface Message {
  id: string;
  content: string;
  timestamp: string;
  senderId: string; // Employee code
  senderName: string;
  conversationId: string;
  type: 'text' | 'image' | 'file' | 'audio' | 'video' | 'document';
  status: 'pending' | 'sent' | 'delivered' | 'read';
  createdAt: Date;
  // Phase 2 enhancements
  replyToId?: string;
  replyToMessage?: Message;
  editedAt?: Date;
  editCount?: number;
  isDeleted?: boolean;
  deletedAt?: Date;
  reactions?: MessageReaction[];
  attachments?: MessageAttachment[];
  metadata?: Record<string, any>;
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  userName: string;
  emoji: string;
  createdAt: Date;
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number; // for audio/video
  uploadedAt: Date;
}

export interface Employee {
  id: string;
  empCode: string;
  name: string;
  designation?: string;
  department?: string;
  profileImage?: string;
}

export interface ConnectionStatus {
  connected: boolean;
  authenticated: boolean;
}

// Conversation type that matches our existing data
export interface Conversation {
  id: string;
  name: string;
  type: 'group' | 'direct';
  members: string[];
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}

// WebSocket Message Types for Phase 2
export type WebSocketMessageType = 
  | 'message'
  | 'typing'
  | 'reaction'
  | 'reply'
  | 'edit_message'
  | 'delete_message'
  | 'status_update'
  | 'file_upload'
  | 'presence_update'
  | 'message_delivered'
  | 'message_read'
  | 'ping'
  | 'pong';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: any;
  timestamp: string;
}

// WebSocket Payload Types
export interface MessagePayload {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: Message['type'];
  replyToId?: string;
  attachments?: MessageAttachment[];
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface ReactionPayload {
  messageId: string;
  conversationId: string;
  userId: string;
  userName: string;
  emoji: string;
  action: 'add' | 'remove';
}

export interface EditMessagePayload {
  messageId: string;
  conversationId: string;
  userId: string;
  newContent: string;
  editedAt: string;
}

export interface DeleteMessagePayload {
  messageId: string;
  conversationId: string;
  userId: string;
  deletedAt: string;
}

export interface StatusUpdatePayload {
  messageId: string;
  conversationId: string;
  userId: string;
  status: 'delivered' | 'read';
  timestamp: string;
}

export interface TypingPayload {
  conversationId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface PresencePayload {
  userId: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
}

export interface FileUploadPayload {
  messageId: string;
  conversationId: string;
  senderId: string;
  attachment: MessageAttachment;
} 