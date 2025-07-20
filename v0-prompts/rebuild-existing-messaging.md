# Rebuild Existing Messaging Interface

Please analyze the following existing messaging implementation and rebuild it in your own style, keeping the same functionality and structure but improving the design and code quality.

## Current Implementation Overview

The messaging system has these main components:
1. A messaging dashboard (sidebar) showing groups/conversations
2. A chat interface showing messages for the selected group
3. A create group dialog for making new groups
4. Real-time features with Socket.IO (typing indicators, etc.)

## Existing Code to Analyze and Rebuild

### 1. Main Messaging Page Component

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useRouter } from 'next/navigation';
import MessagingDashboard from '@/components/messaging/messaging-dashboard';
import ChatInterface from '@/components/messaging/chat-interface';
import CreateGroupDialog from '@/components/messaging/create-group-dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSocketStore } from '@/lib/socket/client';
import { NotificationProvider } from '@/contexts/notifications/NotificationContext';
import { NotificationPermissionBanner } from '@/components/notifications/notification-permission-banner';

interface Group {
  id: number;
  name: string;
  memberCount: number;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
}

interface Message {
  id: string;
  text: string;
  timestamp: string;
  sender: {
    id: string;
    name: string;
  };
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

interface Employee {
  id: string;
  empCode: string;
  name: string;
  designation?: string;
  department?: string;
  location?: string;
  profileImage?: string;
}

export default function MessagingPage() {
  const router = useRouter();
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showChat, setShowChat] = useState(false);
  
  const { connect, disconnect, connected, authenticated, sendMessage: socketSendMessage, onNewMessage, markMessagesRead } = useSocketStore();
  const connectionStatus = { connected: true, authenticated: true };

  const token = typeof window !== 'undefined' ? localStorage.getItem('sessionToken') || 'test-token' : null;

  // Fetch groups
  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['messaging', 'groups'],
    queryFn: () => fetchGroups(token!),
    enabled: !!token,
  });

  // Fetch messages for selected group
  const { data: messages = [], isLoading: messagesLoading, isFetching: messagesFetching } = useQuery({
    queryKey: ['messaging', 'groups', selectedGroupId, 'messages'],
    queryFn: () => fetchMessages(selectedGroupId!, token!),
    enabled: !!token && !!selectedGroupId,
  });

  // Fetch employees for group creation
  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => fetchEmployees(token!),
    enabled: !!token && showCreateDialog,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ groupId, content }: { groupId: number; content: string }) => {
      const response = await fetch(`/api/messaging/groups/${groupId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messaging', 'groups'] });
    },
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; memberIds: string[] }) => {
      const response = await fetch('/api/messaging/groups', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messaging', 'groups'] });
      setShowCreateDialog(false);
    },
  });

  const handleGroupSelect = (group: Group) => {
    setSelectedGroupId(group.id);
    setShowChat(true);
  };

  const handleSendMessage = (content: string) => {
    if (selectedGroupId) {
      sendMessageMutation.mutate({ groupId: selectedGroupId, content });
    }
  };

  const handleCreateGroup = (data: { name: string; description?: string; memberIds: string[] }) => {
    createGroupMutation.mutate(data);
  };

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  // Mobile view handling
  if (typeof window !== 'undefined' && window.innerWidth < 768 && showChat && selectedGroup) {
    return (
      <NotificationProvider vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY}>
        <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden" style={{ overscrollBehavior: 'none' }}>
          <ChatInterface
            group={selectedGroup}
            messages={messages}
            currentUserId={auth.employee?.empCode || ''}
            onSendMessage={handleSendMessage}
            onBack={() => setShowChat(false)}
            isLoading={messagesLoading}
            isFetching={messagesFetching && !messagesLoading}
          />
          <NotificationPermissionBanner />
        </div>
      </NotificationProvider>
    );
  }

  return (
    <NotificationProvider vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY}>
      <div className="h-[calc(100vh-64px)] md:h-[calc(100vh-57px)] flex flex-col overflow-hidden" style={{ overscrollBehavior: 'none' }}>
        <div className="flex-1 flex">
          <div className="w-full md:w-1/3 h-full">
            <MessagingDashboard
              groups={groups}
              selectedGroupId={selectedGroupId}
              connectionStatus={connectionStatus}
              onGroupSelect={handleGroupSelect}
              onCreateGroup={() => setShowCreateDialog(true)}
              currentUserId={auth.employee?.empCode || ''}
              isLoading={groupsLoading}
            />
          </div>
          <div className="hidden md:block md:w-2/3 h-full border-l">
            {selectedGroup && (
              <ChatInterface
                group={selectedGroup}
                messages={messages}
                currentUserId={auth.employee?.empCode || ''}
                onSendMessage={handleSendMessage}
                isLoading={messagesLoading}
                isFetching={messagesFetching && !messagesLoading}
              />
            )}
          </div>
        </div>
        <CreateGroupDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          employees={employees}
          onCreateGroup={handleCreateGroup}
          isCreating={createGroupMutation.isPending}
        />
        <NotificationPermissionBanner />
      </div>
    </NotificationProvider>
  );
}
```

### 2. Messaging Dashboard Component (Sidebar)

```tsx
'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Search, Plus, MessageCircle, Users } from 'lucide-react'

interface Group {
  id: number
  name: string
  memberCount: number
  lastMessage?: string
  lastMessageTime?: Date
  unreadCount: number
}

interface MessagingDashboardProps {
  groups: Group[]
  selectedGroupId?: number
  connectionStatus: { connected: boolean; authenticated: boolean }
  onGroupSelect: (group: Group) => void
  onCreateGroup: () => void
  currentUserId: string
  isLoading?: boolean
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'now'
  if (diffInMinutes < 60) return `${diffInMinutes}m`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays}d`
  
  return date.toLocaleDateString()
}

function getGroupInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function ConnectionStatus({ connectionStatus }: { connectionStatus: { connected: boolean; authenticated: boolean } }) {
  const getStatusConfig = () => {
    if (connectionStatus.connected && connectionStatus.authenticated) {
      return {
        color: 'bg-green-500',
        text: 'Connected',
        textColor: 'text-green-700'
      }
    } else if (connectionStatus.connected && !connectionStatus.authenticated) {
      return {
        color: 'bg-yellow-500',
        text: 'Connecting...',
        textColor: 'text-yellow-700'
      }
    } else {
      return {
        color: 'bg-red-500',
        text: 'Offline',
        textColor: 'text-red-700'
      }
    }
  }

  const status = getStatusConfig()

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b">
      <div className={`w-2 h-2 rounded-full ${status.color}`} />
      <span className={`text-xs font-medium ${status.textColor}`}>
        {status.text}
      </span>
    </div>
  )
}

function GroupCard({ group, isSelected, onClick }: { group: Group; isSelected: boolean; onClick: () => void }) {
  return (
    <Card 
      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
        isSelected ? 'bg-muted border-primary' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-primary">
              {getGroupInitials(group.name)}
            </span>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm truncate">{group.name}</h3>
                <Badge variant="secondary" className="text-xs">
                  {group.memberCount}
                </Badge>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {group.lastMessageTime && (
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(group.lastMessageTime)}
                  </span>
                )}
                {group.unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs min-w-[20px] h-5 flex items-center justify-center">
                    {group.unreadCount > 99 ? '99+' : group.unreadCount}
                  </Badge>
                )}
              </div>
            </div>
            
            {group.lastMessage && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-tight">
                {group.lastMessage}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function MessagingDashboard({
  groups,
  selectedGroupId,
  connectionStatus,
  onGroupSelect,
  onCreateGroup,
  currentUserId,
  isLoading = false
}: MessagingDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-background">
        <ConnectionStatus connectionStatus={connectionStatus} />
        <div className="flex-1 p-4 space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background relative">
      <div className="sticky top-[64px] md:top-[57px] z-10 bg-background">
        <ConnectionStatus connectionStatus={connectionStatus} />
        <div className="p-4 pb-0">
          <div className="bg-background/95 backdrop-blur-sm border-b pb-3 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search groups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Button 
              onClick={onCreateGroup}
              className="w-full"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4 overscroll-none" style={{ overscrollBehavior: 'none' }}>
          <div className="space-y-2">
            {filteredGroups.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold text-muted-foreground mb-1">
                  {searchQuery ? 'No groups found' : 'No groups yet'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery 
                    ? 'Try adjusting your search terms' 
                    : 'Create your first group to get started'
                  }
                </p>
              </div>
            ) : (
              filteredGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  isSelected={selectedGroupId === group.id}
                  onClick={() => onGroupSelect(group)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
```

### 3. Chat Interface Component

```tsx
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Send, Paperclip, Smile, MoreVertical, Circle, Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSocketStore } from '@/lib/socket/client';

interface Message {
  id: string;
  text: string;
  timestamp: string;
  sender: {
    id: string;
    name: string;
  };
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

interface ChatInterfaceProps {
  group: { id: number; name: string; memberCount: number }
  messages: Message[]
  currentUserId: string
  onSendMessage: (content: string) => void
  onBack?: () => void
  isLoading?: boolean
  isFetching?: boolean
}

// Utility functions
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

const formatDateSeparator = (date: Date) => {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  } else {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
}

const shouldShowDateSeparator = (currentMessage: Message, previousMessage?: Message) => {
  if (!previousMessage) return true
  return new Date(currentMessage.timestamp).toDateString() !== new Date(previousMessage.timestamp).toDateString()
}

function MessageStatus({ status }: { status?: string }) {
  if (!status || status === 'sending') {
    return <Circle className="w-3 h-3 text-muted-foreground" />
  }
  
  if (status === 'sent') {
    return <Check className="w-3 h-3 text-muted-foreground" />
  }
  
  if (status === 'delivered') {
    return <CheckCheck className="w-3 h-3 text-muted-foreground" />
  }
  
  if (status === 'read') {
    return <CheckCheck className="w-3 h-3 text-blue-500" />
  }
  
  return null
}

function MessageBubble({ message, isOwnMessage }: { message: Message; isOwnMessage: boolean }) {
  return (
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
        {!isOwnMessage && (
          <p className="text-xs font-semibold mb-1 opacity-70">
            {message.sender.name}
          </p>
        )}
        <p className="text-sm break-words">{message.text}</p>
        <div className={cn(
          "flex items-center justify-between mt-1 text-xs gap-2",
          isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          <span>{formatTime(new Date(message.timestamp))}</span>
          {isOwnMessage && <MessageStatus status={message.status} />}
        </div>
      </div>
    </div>
  )
}

function ChatHeader({ group, onBack, isFetching }: { group: { name: string; memberCount: number }; onBack?: () => void; isFetching?: boolean }) {
  return (
    <div className="sticky top-[64px] md:top-[57px] z-10 bg-background backdrop-blur-md border-b border-border/50 shadow-sm">
      <div className="p-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="md:hidden h-8 w-8"
              title="Back to groups"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          
          <div className="flex items-center gap-3 flex-1">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {group.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-base truncate">{group.name}</h2>
                {isFetching && (
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" title="Updating..." />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MessageInput({ onSendMessage, groupId }: { onSendMessage: (content: string) => void; groupId: number }) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const startTyping = useSocketStore(state => state.startTyping)
  const stopTyping = useSocketStore(state => state.stopTyping)

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    
    // Handle typing indicator
    if (e.target.value.trim()) {
      startTyping(groupId)
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(groupId)
      }, 2000)
    } else {
      stopTyping(groupId)
    }
    
    // Auto-resize logic
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const maxHeight = 120
      const newHeight = Math.min(textarea.scrollHeight, maxHeight)
      textarea.style.height = `${newHeight}px`
    }
  }

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim())
      setMessage('')
      stopTyping(groupId)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t p-4 bg-background sticky bottom-0">
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInput}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="w-full px-4 py-2 pr-16 text-sm border rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary bg-background overflow-y-auto"
            style={{ 
              minHeight: '40px',
              maxHeight: '120px',
              height: '40px'
            }}
          />
          {message.length > 500 && (
            <span className="absolute bottom-2 right-12 text-xs text-muted-foreground">
              {message.length}/1000
            </span>
          )}
        </div>
        <Button
          onClick={handleSend}
          disabled={!message.trim()}
          size="icon"
          className="rounded-full h-10 w-10"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

export default function ChatInterface({
  group,
  messages,
  currentUserId,
  onSendMessage,
  onBack,
  isLoading = false,
  isFetching = false
}: ChatInterfaceProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingUsers = useSocketStore(state => state.typingUsers)
  const [typingUsersList, setTypingUsersList] = useState<string[]>([])
  
  const groupTypingUsers = typingUsers.get(group.id) || new Set()

  useEffect(() => {
    const usersList = Array.from(groupTypingUsers).filter(userId => userId !== currentUserId)
    setTypingUsersList(prev => {
      const hasChanged = prev.length !== usersList.length || 
        prev.some((id, idx) => id !== usersList[idx])
      return hasChanged ? usersList : prev
    })
  }, [groupTypingUsers, currentUserId])
  
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
    
    return () => clearTimeout(timeoutId)
  }, [messages.length])

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <ChatHeader group={group} onBack={onBack} isFetching={false} />
        <div className="flex-1 p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={cn(
              "flex w-full",
              i % 2 === 0 ? "justify-start" : "justify-end"
            )}>
              <div className="max-w-[60%] space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-16 w-48 rounded-2xl" />
              </div>
            </div>
          ))}
        </div>
        <MessageInput onSendMessage={onSendMessage} groupId={group.id} />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <ChatHeader group={group} onBack={onBack} isFetching={isFetching} />
      
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 overscroll-none" style={{ overscrollBehavior: 'none' }}>
        {messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const previousMessage = index > 0 ? messages[index - 1] : undefined
              const showDateSeparator = shouldShowDateSeparator(message, previousMessage)
              const isOwnMessage = message.sender.id === currentUserId

              return (
                <React.Fragment key={message.id}>
                  {showDateSeparator && (
                    <div className="flex items-center justify-center my-4">
                      <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                        {formatDateSeparator(new Date(message.timestamp))}
                      </div>
                    </div>
                  )}
                  <MessageBubble
                    message={message}
                    isOwnMessage={isOwnMessage}
                  />
                </React.Fragment>
              )
            })}
            
            {typingUsersList.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>
                  {typingUsersList.length === 1 
                    ? `${typingUsersList[0]} is typing...`
                    : `${typingUsersList.length} people are typing...`
                  }
                </span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </ScrollArea>
      
      <MessageInput onSendMessage={onSendMessage} groupId={group.id} />
    </div>
  )
}
```

### 4. Create Group Dialog Component

```tsx
'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { X, Users } from 'lucide-react'
import EmployeeSelectionDrawer from '@/components/messaging/employee-selection-drawer'

interface Employee {
  id: string
  empCode: string
  name: string
  designation?: string
  department?: string
  profileImage?: string
}

interface CreateGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employees: Employee[]
  onCreateGroup: (data: {
    name: string
    description?: string
    memberIds: string[]
  }) => void
  isCreating?: boolean
}

export default function CreateGroupDialog({
  open,
  onOpenChange,
  employees,
  onCreateGroup,
  isCreating = false
}: CreateGroupDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<Employee[]>([])
  const [showEmployeeDrawer, setShowEmployeeDrawer] = useState(false)

  React.useEffect(() => {
    if (!open) {
      setName('')
      setDescription('')
      setSelectedMembers([])
    }
  }, [open])

  const handleEmployeeSelection = (employees: Employee[]) => {
    setSelectedMembers(employees)
  }

  const removeMember = (employeeId: string) => {
    setSelectedMembers(prev => prev.filter(emp => emp.empCode !== employeeId))
  }

  const handleSubmit = () => {
    if (name.trim() && selectedMembers.length >= 1) {
      const groupData = {
        name: name.trim(),
        description: description.trim() || undefined,
        memberIds: selectedMembers.map(emp => emp.empCode)
      };
      onCreateGroup(groupData);
    }
  }

  const isValid = name.trim().length > 0 && selectedMembers.length >= 1

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>
              Add a name and select at least 2 members for your group.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">
                Group Name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="group-name"
                  placeholder="Enter group name"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 50))}
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {name.length}/50
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="What's this group about?"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {description.length}/200
              </p>
            </div>

            <div className="space-y-2">
              <Label>
                Team Members <span className="text-destructive">*</span>
              </Label>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowEmployeeDrawer(true)}
                className="w-full justify-start"
              >
                <Users className="w-4 h-4 mr-2" />
                {selectedMembers.length > 0 
                  ? `${selectedMembers.length} member${selectedMembers.length !== 1 ? 's' : ''} selected`
                  : 'Select team members'
                }
              </Button>
              
              <p className="text-xs text-muted-foreground">
                Select at least 1 member to create a group (you will be added automatically)
              </p>

              {selectedMembers.length > 0 && (
                <div className="mt-3 space-y-2 max-h-[200px] overflow-y-auto">
                  {selectedMembers.map((member) => (
                    <div key={member.empCode} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{member.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {member.empCode} {member.designation && `• ${member.designation}`}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMember(member.empCode)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isValid || isCreating}
            >
              {isCreating ? 'Creating group...' : 'Create Group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EmployeeSelectionDrawer
        open={showEmployeeDrawer}
        onOpenChange={setShowEmployeeDrawer}
        onSelectEmployees={handleEmployeeSelection}
        initialSelected={selectedMembers}
      />
    </>
  )
}
```

## Requirements for V0 Rebuild

Please rebuild these components with the following requirements:

1. **Keep the exact same functionality** - All features should work the same way
2. **Keep the same structure** - Main page with dashboard sidebar and chat interface
3. **Keep the same data flow** - Using React Query, Socket.IO integration, etc.
4. **Keep the mobile responsiveness** - Mobile view shows one component at a time

But improve:
1. **Visual design** - Use your modern design sensibilities
2. **Code organization** - Better component structure if needed
3. **Animations** - Add smooth transitions where appropriate
4. **UI/UX polish** - Better loading states, hover effects, etc.

Please provide a complete rebuild of this messaging interface in your own style.