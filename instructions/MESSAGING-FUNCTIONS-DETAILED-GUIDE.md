# Messaging Functions - Comprehensive Technical Guide

## 🚀 Overview

The Employee Directory PWA includes a sophisticated **real-time messaging system** that enables group communication among employees with comprehensive push notification support. The messaging functionality combines WebSocket real-time communication, Firebase Cloud Messaging (FCM) for push notifications, and a robust backend API for persistent storage.

## 🏗️ System Architecture

### Frontend Architecture
```
Messaging System Frontend
├── Components/
│   ├── simple-messaging-dashboard.tsx (Main Dashboard)
│   ├── whatsapp-chat.tsx (Chat Interface)
│   ├── group-chat-fullscreen.tsx (Fullscreen Chat)
│   ├── create-group-dialog.tsx (Group Creation)
│   └── notification-status.tsx (Notification Indicators)
├── Services/
│   ├── socketService.ts (WebSocket Management)
│   ├── firebase/fcmService.ts (FCM Integration)
│   └── firebase/useFCMNotifications.ts (React Hook)
└── Hooks/
    ├── use-native-notifications.tsx (Native API)
    └── use-device-type.ts (Responsive Behavior)
```

### Backend Architecture
```
Messaging System Backend
├── API Routes/
│   ├── /api/groups (Group Management)
│   ├── /api/groups/:id/messages (Message Operations)
│   ├── /api/groups/:id/members (Member Management)
│   └── /api/fcm/* (Push Notification Endpoints)
├── Services/
│   ├── socketService.ts (WebSocket Server)
│   ├── notification-service.ts (Push Notifications)
│   └── fcm-service.ts (Firebase Integration)
└── Database/
    ├── groups (Group Storage)
    ├── group_members (Membership)
    ├── messages (Message History)
    └── fcm_tokens (Push Tokens)
```

## 💬 Core Messaging Components

### 1. Simple Messaging Dashboard

**File**: `client/src/components/messaging/simple-messaging-dashboard.tsx`

**Purpose**: Main entry point for messaging functionality with group management and real-time updates.

#### Component Structure
```jsx
export function SimpleMessagingDashboard({ 
  employeeId, 
  sessionToken, 
  employees = [], 
  employeesLoading = false, 
  onBackToDirectory 
}: SimpleMessagingDashboardProps) {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showFullscreenChat, setShowFullscreenChat] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false, 
    authenticated: false 
  });

  // Real-time group updates
  const { data: groups = [] } = useQuery<Group[]>({
    queryKey: ['/api/groups'],
    queryFn: () => apiRequest('/api/groups'),
    enabled: !!sessionToken
  });
}
```

#### Key Features
- **Group List**: Displays user's groups with unread message counts
- **Real-time Updates**: WebSocket integration for instant message previews
- **Connection Status**: Visual indicators for WebSocket connectivity
- **FCM Integration**: Push notification setup and management
- **Group Creation**: Modal dialog for creating new groups

#### Group Enhancement Logic
```typescript
const enhancedGroups = Array.isArray(groups) ? groups.map(group => {
  let lastMessageText = 'No recent messages';
  if (group.lastMessage) {
    if (typeof group.lastMessage === 'string') {
      lastMessageText = group.lastMessage;
    } else if (typeof group.lastMessage === 'object' && group.lastMessage.content) {
      lastMessageText = group.lastMessage.content;
    }
  }
  
  return {
    ...group,
    lastMessage: lastMessageText,
    unreadCount: group.unreadCount || 0,
    lastMessageTime: group.lastMessageTime || group.updatedAt
  };
}) : [];
```

### 2. WhatsApp-Style Chat Interface

**File**: `client/src/components/messaging/whatsapp-chat.tsx`

**Purpose**: Full-featured chat interface with real-time messaging and native notifications.

#### Component Architecture
```jsx
export function WhatsAppChat({ group, onBack, currentUser }: WhatsAppChatProps) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showNotification } = useNativeNotifications();

  // Real-time message fetching
  const { data: messages = [] } = useQuery({
    queryKey: ['/api/groups', group.id, 'messages'],
    queryFn: () => apiRequest(`/api/groups/${group.id}/messages`),
    refetchInterval: 2000
  });
}
```

#### Real-time Message Handling
```typescript
useEffect(() => {
  const handleMessage = async (message: any) => {
    if (message.groupId === group.id) {
      // Invalidate cache for instant UI update
      queryClient.invalidateQueries({ 
        queryKey: ['/api/groups', group.id, 'messages'] 
      });
      
      // Show notification for messages from other users
      if (message.senderId !== currentUser.employeeId) {
        await showNotification({
          title: group.name,
          body: `${message.senderName}: ${message.content}`,
          requireInteraction: false,
          silent: false,
          tag: `message-${message.id}`,
          data: {
            groupId: message.groupId,
            messageId: message.id
          }
        });
      }
    }
  };

  // Setup Socket.IO listener
  socketService.onMessage(handleMessage);
  socketService.joinGroup(group.id);
  
  return () => {
    socketService.leaveGroup(group.id);
  };
}, [group.id, queryClient]);
```

#### Message Sending Logic
```typescript
const sendMessageMutation = useMutation({
  mutationFn: async (messageText: string) => {
    // Try Socket.IO first for instant delivery
    if (socketService.isAuthenticated) {
      const success = socketService.sendMessage(group.id, messageText);
      if (success) {
        return { success: true, method: 'socket' };
      }
    }
    
    // Fallback to HTTP API
    return apiRequest(`/api/groups/${group.id}/messages`, {
      method: 'POST',
      body: { content: messageText },
    }).then(result => ({ ...result, method: 'http' }));
  },
  onSuccess: (result) => {
    console.log(`Message sent via ${result.method}`);
    queryClient.invalidateQueries({ 
      queryKey: ['/api/groups', group.id, 'messages'] 
    });
    setMessage('');
    scrollToBottom();
  }
});
```

### 3. Group Creation Dialog

**File**: `client/src/components/messaging/create-group-dialog.tsx`

**Purpose**: Modal interface for creating new groups with employee selection.

#### Implementation
```jsx
export function CreateGroupDialog({ employees, sessionToken }: CreateGroupDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Employee[]>([]);

  const createGroupMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; memberIds: string[] }) => {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
      // Reset form and close dialog
    }
  });
}
```

## 🌐 Real-time Communication (WebSocket)

### Socket Service Architecture

**File**: `client/src/services/socketService.ts`

#### Connection Management
```typescript
export class SocketService {
  private socket: Socket | null = null;
  private sessionToken: string | null = null;
  private connectionStatus: ConnectionStatus = {
    connected: false,
    authenticated: false,
    connecting: false,
    error: null
  };

  connect(sessionToken: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.sessionToken = sessionToken;
      
      // Create socket connection
      const socketUrl = window.location.origin;
      this.socket = io(socketUrl, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        timeout: 10000,
        forceNew: true
      });

      // Authentication flow
      this.socket.on('connect', () => {
        this.connectionStatus.connected = true;
        this.authenticate();
      });
    });
  }
}
```

#### Message Broadcasting
```typescript
sendMessage(groupId: number, content: string): boolean {
  if (!this.socket || !this.isAuthenticated) {
    return false;
  }

  this.socket.emit('send_message', {
    groupId,
    content,
    timestamp: new Date().toISOString()
  });
  
  return true;
}

onMessage(callback: (message: MessageData) => void) {
  this.onMessageCallback = callback;
}

// Group management
joinGroup(groupId: number) {
  if (this.socket && this.isAuthenticated) {
    this.socket.emit('join_group', { groupId });
  }
}
```

### Backend WebSocket Handler

**File**: `server/services/socketService.ts`

#### Authentication & Message Handling
```typescript
export class SocketService {
  private io: Server;
  private authenticatedSockets = new Map<string, AuthenticatedSocket>();

  setupSocket(server: any) {
    this.io = new Server(server, {
      cors: { origin: "*" },
      path: '/socket.io'
    });

    this.io.on('connection', (socket) => {
      // Authentication handler
      socket.on('authenticate', async (data) => {
        try {
          const session = await storage.getAuthSessionByToken(data.sessionToken);
          if (!session) {
            socket.emit('auth_error', { message: 'Invalid session' });
            return;
          }

          // Store authenticated socket
          this.authenticatedSockets.set(socket.id, {
            socket,
            employeeId: session.employeeId,
            employee: employee,
            groups: groupIds
          });

          socket.emit('auth_success');
        } catch (error) {
          socket.emit('auth_error', { message: 'Authentication failed' });
        }
      });

      // Message sending handler
      socket.on('send_message', async (data) => {
        const authSocket = this.authenticatedSockets.get(socket.id);
        if (!authSocket) return;

        const { groupId, content } = data;
        
        // Create message in database
        const message = await storage.createMessage({
          groupId,
          senderId: authSocket.employeeId,
          content,
          messageType: 'text'
        });

        // Broadcast to group members
        const messageData = {
          id: message.id,
          groupId: message.groupId,
          content: message.content,
          senderId: message.senderId,
          senderName: authSocket.employee.name,
          createdAt: message.createdAt
        };

        this.io.to(`group_${groupId}`).emit('new_message', messageData);

        // Send push notifications
        await notificationService.sendGroupMessageNotification(
          groupId,
          authSocket.employee.name,
          content,
          authSocket.employeeId
        );
      });
    });
  }
}
```

## 📱 Push Notification System

### Firebase Cloud Messaging Integration

**File**: `client/src/services/firebase/fcmService.ts`

#### FCM Service Implementation
```typescript
class FCMService {
  private messaging: Messaging | null = null;
  private isInitialized = false;

  async initialize(): Promise<boolean> {
    try {
      // Register service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('[FCM] Service worker registered:', registration);
      }

      // Initialize Firebase
      this.app = initializeApp(firebaseConfig);
      this.messaging = getMessaging(this.app);
      
      // Setup foreground message listener
      onMessage(this.messaging, (payload) => {
        this.handleMessage(payload);
      });

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('[FCM] Failed to initialize:', error);
      return false;
    }
  }

  async requestPermission(): Promise<string | null> {
    if (!this.messaging) return null;

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return null;
    }

    // Get FCM token
    const token = await getToken(this.messaging, {
      vapidKey: 'YOUR_VAPID_KEY'
    });

    return token;
  }
}
```

#### Background Message Handler

**File**: `client/public/firebase-messaging-sw.js`

```javascript
// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new message',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: payload.data?.tag || 'fcm-notification',
    data: payload.data || {},
    requireInteraction: false,
    renotify: true
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus existing window or open new one
      for (const client of clientList) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          client.navigate(urlToOpen);
          return;
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});
```

### Backend Notification Service

**File**: `server/services/notification-service.ts`

```typescript
export class NotificationService {
  private fcmService = getFCMService(storage);

  async sendGroupMessageNotification(
    groupId: number,
    senderName: string,
    message: string,
    senderEmployeeId: string
  ): Promise<void> {
    try {
      const group = await storage.getGroupById(groupId);
      if (!group) return;

      // Get all group members (including sender for self-notification)
      const members = await storage.getGroupMembers(groupId);
      
      // Send notification to ALL members (including sender)
      for (const member of members) {
        const tokens = await storage.getFCMTokensByEmployeeId(member.employeeId);
        
        for (const tokenData of tokens) {
          const success = await this.fcmService.sendToToken(tokenData.fcmToken, {
            title: `${group.name}`,
            body: `${senderName}: ${message}`,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            data: {
              groupId: groupId.toString(),
              type: 'group_message',
              url: `/messaging/groups/${groupId}`
            }
          });
        }
      }
    } catch (error) {
      console.error('[Notification Service] Error:', error);
    }
  }
}
```

## 🗄️ Database Schema

### Groups Table
```sql
CREATE TABLE groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Group Members Table
```sql
CREATE TABLE group_members (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
  employee_id VARCHAR(50) NOT NULL,
  role VARCHAR(50) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW()
);
```

### Messages Table
```sql
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
  sender_id VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text',
  read_by TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### FCM Tokens Table
```sql
CREATE TABLE fcm_tokens (
  id SERIAL PRIMARY KEY,
  employee_id VARCHAR(50) NOT NULL,
  fcm_token TEXT NOT NULL UNIQUE,
  platform VARCHAR(20) DEFAULT 'web',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🔌 API Endpoints

### Group Management

#### GET `/api/groups`
**Purpose**: Get user's groups with message previews
**Headers**: `Authorization: Bearer <sessionToken>`
**Response**:
```json
[
  {
    "id": 1,
    "name": "IT Department",
    "description": "Technical discussions",
    "memberCount": 15,
    "lastMessage": {
      "senderEmployeeId": "EMP001",
      "content": "Meeting at 3 PM",
      "timestamp": "2025-01-19T15:30:00Z"
    },
    "unreadCount": 3,
    "createdAt": "2025-01-15T10:00:00Z"
  }
]
```

#### POST `/api/groups`
**Purpose**: Create new group
**Request Body**:
```json
{
  "name": "Project Team Alpha",
  "description": "Alpha project coordination",
  "memberIds": ["EMP001", "EMP002", "EMP003"]
}
```
**Response**:
```json
{
  "success": true,
  "group": {
    "id": 5,
    "name": "Project Team Alpha",
    "description": "Alpha project coordination",
    "createdBy": "EMP001",
    "createdAt": "2025-01-19T16:00:00Z"
  }
}
```

### Message Operations

#### GET `/api/groups/:id/messages`
**Purpose**: Get group messages with pagination
**Query Parameters**: `limit`, `offset`
**Response**:
```json
[
  {
    "id": 123,
    "content": "Hello everyone!",
    "senderId": "EMP001",
    "senderName": "John Doe",
    "messageType": "text",
    "createdAt": "2025-01-19T15:45:00Z",
    "readBy": ["EMP001", "EMP002"]
  }
]
```

#### POST `/api/groups/:id/messages`
**Purpose**: Send message to group
**Request Body**:
```json
{
  "content": "New message content"
}
```

#### POST `/api/groups/:id/read`
**Purpose**: Mark group messages as read
**Response**:
```json
{
  "success": true,
  "message": "Messages marked as read"
}
```

### FCM Token Management

#### POST `/api/fcm/subscribe`
**Purpose**: Save FCM token for push notifications
**Request Body**:
```json
{
  "token": "fcm_token_string_here",
  "platform": "web"
}
```

## 📲 Mobile-Optimized Features

### Touch-Friendly Interface
- **Large Touch Targets**: 44px minimum for all interactive elements
- **Swipe Gestures**: Swipe to go back from chat view
- **Auto-Scroll**: Automatic scrolling to latest messages
- **Keyboard Handling**: Proper viewport adjustment for mobile keyboards

### Responsive Message Layout
```jsx
<div className={cn(
  "flex w-full mb-4",
  isOwnMessage ? "justify-end" : "justify-start"
)}>
  <div className={cn(
    "max-w-[80%] md:max-w-[60%] rounded-2xl px-4 py-2",
    isOwnMessage 
      ? "bg-primary text-primary-foreground rounded-br-sm" 
      : "bg-muted rounded-bl-sm"
  )}>
    <p className="text-sm break-words">{message.content}</p>
    <div className={cn(
      "flex items-center justify-between mt-1 text-xs",
      isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
    )}>
      <span>{formatTime(message.createdAt)}</span>
      {isOwnMessage && <MessageStatus status="delivered" />}
    </div>
  </div>
</div>
```

## 🎯 Advanced Features

### Typing Indicators
```typescript
// Client-side typing detection
useEffect(() => {
  const timer = setTimeout(() => {
    if (isTyping) {
      setIsTyping(false);
      socketService.stopTyping(group.id);
    }
  }, 1000);

  return () => clearTimeout(timer);
}, [message, isTyping]);

const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setMessage(e.target.value);
  
  if (!isTyping && e.target.value) {
    setIsTyping(true);
    socketService.startTyping(group.id);
  }
};
```

### Message Status Indicators
```jsx
function MessageStatus({ status }: { status: 'sent' | 'delivered' | 'read' }) {
  return (
    <div className="flex items-center ml-1">
      {status === 'sent' && <Check className="w-3 h-3" />}
      {status === 'delivered' && <CheckCheck className="w-3 h-3" />}
      {status === 'read' && <CheckCheck className="w-3 h-3 text-blue-500" />}
    </div>
  );
}
```

### Connection Status Indicator
```jsx
function ConnectionStatus({ isConnected, isAuthenticated }: ConnectionStatusProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
      {isConnected ? (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-green-700">
            {isAuthenticated ? 'Connected' : 'Connecting...'}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-red-500" />
          <span className="text-xs text-red-700">Disconnected</span>
        </div>
      )}
    </div>
  );
}
```

## 🔒 Security & Privacy

### Message Encryption
- Messages are transmitted over HTTPS/WSS
- Session-based authentication for all operations
- Group membership verification for all message access

### Access Control
```typescript
// Backend middleware for group access
const verifyGroupMembership = async (req: Request, res: Response, next: NextFunction) => {
  const groupId = parseInt(req.params.id);
  const employeeId = req.user?.employeeId;
  
  const isMember = await storage.isGroupMember(groupId, employeeId);
  if (!isMember) {
    return res.status(403).json({ error: "Not a member of this group" });
  }
  
  next();
};
```

### Token Security
- FCM tokens are stored securely with employee associations
- Invalid tokens are automatically cleaned up
- Session tokens are validated for all WebSocket connections

## 🚀 Performance Optimizations

### Message Pagination
```typescript
const { data: messages, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['/api/groups', group.id, 'messages'],
  queryFn: ({ pageParam = 0 }) => 
    apiRequest(`/api/groups/${group.id}/messages?offset=${pageParam}&limit=50`),
  getNextPageParam: (lastPage, allPages) => {
    return lastPage.length === 50 ? allPages.length * 50 : undefined;
  }
});
```

### Connection Pooling
- WebSocket connection reuse across components
- Automatic reconnection with exponential backoff
- Connection state shared via context

### Optimistic Updates
```typescript
const sendMessage = useMutation({
  mutationFn: sendMessageAPI,
  onMutate: async (newMessage) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['messages', groupId] });

    // Snapshot current messages
    const previousMessages = queryClient.getQueryData(['messages', groupId]);

    // Optimistically update messages
    queryClient.setQueryData(['messages', groupId], (old: Message[]) => [
      ...old,
      { ...newMessage, id: 'temp-' + Date.now(), status: 'sending' }
    ]);

    return { previousMessages };
  },
  onError: (err, newMessage, context) => {
    // Rollback on error
    queryClient.setQueryData(['messages', groupId], context.previousMessages);
  }
});
```

This comprehensive messaging system provides enterprise-grade group communication with real-time delivery, reliable push notifications, and a responsive mobile-first interface suitable for the Employee Directory PWA's professional environment.