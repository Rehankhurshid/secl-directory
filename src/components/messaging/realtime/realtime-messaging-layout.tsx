'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  Users, 
  Send, 
  Smile,
  Paperclip,
  Search,
  MoreVertical,
  Phone,
  Video
} from 'lucide-react';

// Import authentication and WebSocket hooks
import { useAuth } from '@/lib/hooks/use-auth';
import { useWebSocket, useRealTimeMessages, useTypingIndicator, useOnlinePresence } from '@/lib/hooks/use-websocket';
import { ConnectionStatus, TypingIndicator, OnlineIndicator } from './connection-status';
import { MessageThread } from '../core/message-thread';
import { MessageInput } from '../core/message-input';

// Mock conversation data - using consistent conversation IDs for testing
const conversations = [
  {
    id: 'general',
    name: 'General Chat',
    type: 'group' as const,
    members: ['ADMIN001', '90145293'],
    lastMessage: 'Let\'s test real-time messaging...',
    lastMessageTime: new Date(Date.now() - 30 * 60000),
    unreadCount: 0
  },
  {
    id: 'development', 
    name: 'Development Team',
    type: 'direct' as const,
    members: ['ADMIN001', '90145293'],
    lastMessage: 'WebSocket integration is working!',
    lastMessageTime: new Date(Date.now() - 2 * 60 * 60000),
    unreadCount: 0
  },
  {
    id: 'announcements',
    name: 'Announcements',
    type: 'group' as const,
    members: ['ADMIN001', '90145293'],
    lastMessage: 'Welcome to the new messaging system',
    lastMessageTime: new Date(Date.now() - 24 * 60 * 60000),
    unreadCount: 0
  }
];

// Mock user data - will be replaced with real employee data
const mockUsers = {
  'ADMIN001': { name: 'System Admin', avatar: 'SA' },
  '90145293': { name: 'Test User', avatar: 'TU' },
  'anonymous': { name: 'Anonymous', avatar: 'A' }
};

export function RealtimeMessagingLayout() {
  const [selectedConversation, setSelectedConversation] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get current authenticated user
  const { employee } = useAuth();
  const currentUserId = employee?.empCode || 'anonymous';

  // WebSocket hooks - now using real employee ID
  const { status, isConnected, sendMessage: sendWsMessage } = useWebSocket(currentUserId);
  const { messages, isLoading, sendMessage } = useRealTimeMessages(selectedConversation);
  const { typingUsers, sendTypingIndicator } = useTypingIndicator(selectedConversation, currentUserId);
  const { onlineUsers } = useOnlinePresence();

  const handleSendMessage = (content: string) => {
    sendMessage(content, currentUserId);
  };

  const handleTyping = (isTyping: boolean) => {
    sendTypingIndicator(isTyping);
  };

  const getUserName = (userId: string) => {
    // If it's the current user, show their name from auth
    if (userId === currentUserId && employee?.name) {
      return employee.name;
    }
    // Otherwise, fall back to mock data or show "Unknown User"
    return mockUsers[userId as keyof typeof mockUsers]?.name || 'Unknown User';
  };

  // Show loading if no employee data yet
  if (!employee) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading messaging...</p>
        </div>
      </div>
    );
  }

  // Convert domain Message entities to MessageThread interface
  const threadMessages = messages.map(msg => ({
    id: msg.id,
    content: msg.content,
    senderId: msg.senderId,
    senderName: getUserName(msg.senderId),
    timestamp: msg.createdAt,
    status: msg.status.toLowerCase() as 'pending' | 'sent' | 'delivered' | 'read' | 'failed',
    type: msg.type.toLowerCase() as 'text' | 'image' | 'file' | 'audio',
    isEdited: !!msg.editedAt
  }));

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar - Conversation List */}
      <div className="w-80 border-r bg-muted/30">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-semibold">Messages</h1>
            <div className="flex items-center gap-2">
              <ConnectionStatus status={status} className="minimal" />
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  localStorage.removeItem('messaging_conversations');
                  window.location.reload();
                }}
                title="Clear stored messages"
              >
                🗑️
              </Button>
              <Button variant="ghost" size="sm">
                <Users className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {conversations.map((conversation) => (
              <Card
                key={conversation.id}
                className={cn(
                  "mb-2 cursor-pointer transition-colors hover:bg-accent",
                  selectedConversation === conversation.id && "bg-accent border-primary"
                )}
                onClick={() => setSelectedConversation(conversation.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {conversation.type === 'group' ? (
                            <Users className="h-5 w-5" />
                          ) : (
                            mockUsers[conversation.members.find(m => m !== currentUserId) as keyof typeof mockUsers]?.avatar || '?'
                          )}
                        </AvatarFallback>
                      </Avatar>
                      {conversation.type === 'direct' && (
                        <OnlineIndicator 
                          isOnline={onlineUsers.has(conversation.members.find(m => m !== currentUserId) || '')}
                          className="absolute -bottom-0.5 -right-0.5"
                        />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium truncate">{conversation.name}</h3>
                        <span className="text-xs text-muted-foreground">
                          {conversation.lastMessageTime.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessage}
                      </p>
                    </div>
                    
                    {conversation.unreadCount > 0 && (
                      <Badge variant="default" className="ml-2 min-w-[20px] h-5 text-xs">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-background">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {selectedConv.type === 'group' ? (
                        <Users className="h-4 w-4" />
                      ) : (
                        mockUsers[selectedConv.members.find(m => m !== currentUserId) as keyof typeof mockUsers]?.avatar || '?'
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold">{selectedConv.name}</h2>
                    <div className="flex items-center gap-2">
                      {selectedConv.type === 'group' ? (
                        <span className="text-sm text-muted-foreground">
                          {selectedConv.members.length} members
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <OnlineIndicator 
                            isOnline={onlineUsers.has(selectedConv.members.find(m => m !== currentUserId) || '')}
                            size="sm"
                          />
                          {onlineUsers.has(selectedConv.members.find(m => m !== currentUserId) || '') ? 'Online' : 'Offline'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Connection Status Alert */}
            <div className="px-4 pt-4">
              <ConnectionStatus status={status} />
            </div>

            {/* Messages */}
            <div className="flex-1 flex flex-col min-h-0">
              <ScrollArea className="flex-1 px-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Loading messages...</p>
                    </div>
                  </div>
                                 ) : (
                   <MessageThread 
                     messages={threadMessages}
                     currentUserId={currentUserId}
                     conversationName={selectedConv.name}
                   />
                 )}
              </ScrollArea>

              {/* Typing Indicator */}
              <TypingIndicator 
                typingUsers={typingUsers}
                getUserName={getUserName}
                className="px-4"
              />

              {/* Message Input */}
              <div className="p-4 border-t">
                <MessageInput
                  onSendMessage={handleSendMessage}
                  onStartTyping={() => handleTyping(true)}
                  onStopTyping={() => handleTyping(false)}
                  disabled={!isConnected}
                  placeholder={isConnected ? "Type a message..." : "Reconnecting..."}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">Choose a conversation from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 