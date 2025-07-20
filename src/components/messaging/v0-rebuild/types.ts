export interface Group {
  id: number;
  name: string;
  memberCount: number;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
}

export interface Message {
  id: string;
  text: string;
  timestamp: string;
  sender: {
    id: string;
    name: string;
  };
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

export interface Employee {
  id: string;
  empCode: string;
  name: string;
  designation?: string;
  department?: string;
  location?: string;
  profileImage?: string;
  grade?: string;
  category?: string;
  gender?: string;
}

export interface ConnectionStatus {
  connected: boolean;
  authenticated: boolean;
}