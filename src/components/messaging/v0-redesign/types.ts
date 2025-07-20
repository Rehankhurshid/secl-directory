export interface Group {
  id: string
  name: string
  avatar: string
  memberCount: number
  lastMessage?: string
  lastMessageTime?: string
  unreadCount: number
  isArchived?: boolean
  isPinned?: boolean
}

export interface Message {
  id: string
  text: string
  timestamp: string
  sender: {
    id: string
    name: string
    avatar: string
  }
  status: 'sending' | 'sent' | 'delivered' | 'read'
  type: 'text' | 'image' | 'file' | 'voice'
  fileInfo?: {
    name: string
    size: string
    url: string
  }
  reactions?: { [emoji: string]: number }
}

export interface Employee {
  id: string
  empCode: string
  name: string
  designation?: string
  department?: string
  profileImage: string
}

export interface ChatData {
  groupInfo: Group
  messages: Message[]
}