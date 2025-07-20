'use client'

import { create } from 'zustand'

interface Message {
  id: string
  groupId: number
  content: string
  senderId: string
  senderName: string
  createdAt: Date
  status?: 'sending' | 'sent' | 'delivered' | 'read'
}

interface SocketStore {
  // Connection state
  connected: boolean
  authenticated: boolean
  
  // Placeholder methods - to be implemented
  connect: (token: string) => void
  disconnect: () => void
  sendMessage: (groupId: number, content: string, tempId: string) => void
  startTyping: (groupId: number) => void
  stopTyping: (groupId: number) => void
  markMessagesRead: (groupId: number) => void
  
  // Event handlers
  onNewMessage: (callback: (message: Message) => void) => void
  onTypingStart: (callback: (data: { userId: string; groupId: number }) => void) => void
  onTypingStop: (callback: (data: { userId: string; groupId: number }) => void) => void
  onMessagesRead: (callback: (data: { groupId: number; readBy: string }) => void) => void
}

export const useSocketStore = create<SocketStore>((set, get) => ({
  connected: false,
  authenticated: false,

  connect: (token: string) => {
    console.log('🔌 Socket connection placeholder - token:', token);
    // TODO: Implement actual connection logic
  },

  disconnect: () => {
    console.log('🔌 Socket disconnect placeholder');
    // TODO: Implement actual disconnect logic
  },

  sendMessage: (groupId: number, content: string, tempId: string) => {
    console.log('📤 Send message placeholder:', { groupId, content, tempId });
    // TODO: Implement actual message sending
  },

  startTyping: (groupId: number) => {
    console.log('⌨️ Start typing placeholder:', groupId);
    // TODO: Implement typing indicator
  },

  stopTyping: (groupId: number) => {
    console.log('⌨️ Stop typing placeholder:', groupId);
    // TODO: Implement typing indicator
  },

  markMessagesRead: (groupId: number) => {
    console.log('✓ Mark messages read placeholder:', groupId);
    // TODO: Implement read receipts
  },

  onNewMessage: (callback: (message: Message) => void) => {
    console.log('📨 New message handler registered');
    // TODO: Implement message listener
  },

  onTypingStart: (callback: (data: { userId: string; groupId: number }) => void) => {
    console.log('⌨️ Typing start handler registered');
    // TODO: Implement typing listener
  },

  onTypingStop: (callback: (data: { userId: string; groupId: number }) => void) => {
    console.log('⌨️ Typing stop handler registered');
    // TODO: Implement typing listener
  },

  onMessagesRead: (callback: (data: { groupId: number; readBy: string }) => void) => {
    console.log('✓ Messages read handler registered');
    // TODO: Implement read receipt listener
  }
}))