'use client'

import { io, Socket } from 'socket.io-client'
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
  socket: Socket | null
  connected: boolean
  authenticated: boolean
  typingUsers: Map<number, Set<string>>
  connect: (token: string) => void
  disconnect: () => void
  sendMessage: (groupId: number, content: string) => void
  startTyping: (groupId: number) => void
  stopTyping: (groupId: number) => void
  markMessagesRead: (groupId: number) => void
  onNewMessage: (callback: (message: Message) => void) => void
  onTypingStart: (callback: (data: { userId: string; groupId: number }) => void) => void
  onTypingStop: (callback: (data: { userId: string; groupId: number }) => void) => void
  onMessagesRead: (callback: (data: { groupId: number; readBy: string }) => void) => void
}

export const useSocketStore = create<SocketStore>((set, get) => ({
  socket: null,
  connected: false,
  authenticated: false,
  typingUsers: new Map(),

  connect: (token: string) => {
    const existingSocket = get().socket
    if (existingSocket?.connected) return

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      auth: { token },
      transports: ['websocket', 'polling']
    })

    socket.on('connect', () => {
      console.log('Socket connected')
      set({ connected: true })
      socket.emit('join-groups')
    })

    socket.on('disconnect', () => {
      console.log('Socket disconnected')
      set({ connected: false, authenticated: false })
    })

    socket.on('groups-joined', (groupIds: number[]) => {
      console.log('Joined groups:', groupIds)
      set({ authenticated: true })
    })

    socket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error.message)
    })

    set({ socket })
  },

  disconnect: () => {
    const socket = get().socket
    if (socket) {
      socket.disconnect()
      set({ socket: null, connected: false, authenticated: false })
    }
  },

  sendMessage: (groupId: number, content: string) => {
    const socket = get().socket
    if (socket?.connected) {
      socket.emit('send-message', { groupId, content })
    }
  },

  startTyping: (groupId: number) => {
    const socket = get().socket
    if (socket?.connected) {
      socket.emit('typing-start', { groupId })
    }
  },

  stopTyping: (groupId: number) => {
    const socket = get().socket
    if (socket?.connected) {
      socket.emit('typing-stop', { groupId })
    }
  },

  markMessagesRead: (groupId: number) => {
    const socket = get().socket
    if (socket?.connected) {
      socket.emit('mark-messages-read', { groupId })
    }
  },

  onNewMessage: (callback: (message: Message) => void) => {
    const socket = get().socket
    if (socket) {
      socket.on('new-message', callback)
    }
  },

  onTypingStart: (callback: (data: { userId: string; groupId: number }) => void) => {
    const socket = get().socket
    if (socket) {
      socket.on('user-typing', (data) => {
        const typingUsers = get().typingUsers
        const groupTyping = typingUsers.get(data.groupId) || new Set()
        groupTyping.add(data.userId)
        typingUsers.set(data.groupId, groupTyping)
        set({ typingUsers: new Map(typingUsers) })
        callback(data)
      })
    }
  },

  onTypingStop: (callback: (data: { userId: string; groupId: number }) => void) => {
    const socket = get().socket
    if (socket) {
      socket.on('user-stop-typing', (data) => {
        const typingUsers = get().typingUsers
        const groupTyping = typingUsers.get(data.groupId)
        if (groupTyping) {
          groupTyping.delete(data.userId)
          if (groupTyping.size === 0) {
            typingUsers.delete(data.groupId)
          } else {
            typingUsers.set(data.groupId, groupTyping)
          }
          set({ typingUsers: new Map(typingUsers) })
        }
        callback(data)
      })
    }
  },

  onMessagesRead: (callback: (data: { groupId: number; readBy: string }) => void) => {
    const socket = get().socket
    if (socket) {
      socket.on('messages-read', callback)
    }
  }
}))