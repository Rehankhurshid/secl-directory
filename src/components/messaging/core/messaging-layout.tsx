'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Phone, 
  Video, 
  MoreVertical,
  Users,
  Bell,
  BellOff,
  Settings
} from 'lucide-react';
import { ConversationList } from './conversation-list';
import { MessageInput } from './message-input';
import { formatDistanceToNow } from 'date-fns';

// Simple interfaces for now
interface Conversation {
  id: string;
  name: string;
  type: 'group' | 'direct';
  members: number;
  lastMessage?: {
    content: string;
    timestamp: Date;
    senderName: string;
  };
  unreadCount: number;
  isOnline?: boolean;
  isMuted?: boolean;
  avatar?: string;
}

interface SimpleMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  status: 'pending' | 'sent' | 'delivered' | 'read';
}

interface MessagingLayoutProps {
  currentUserId: string;
  currentUserName: string;
  onSendMessage: (conversationId: string, content: string, attachments?: File[]) => void;
  onCreateGroup: () => void;
}

export function MessagingLayout({
  currentUserId,
  currentUserName,
  onSendMessage,
  onCreateGroup
}: MessagingLayoutProps) {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showConversationList, setShowConversationList] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<SimpleMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyTo, setReplyTo] = useState<any>(null);

  // Mock data for development
  useEffect(() => {
    const mockConversations: Conversation[] = [
      {
        id: '1',
        name: 'Engineering Team',
        type: 'group',
        members: 12,
        lastMessage: {
          content: 'Great work on the new feature!',
          timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          senderName: 'John Doe'
        },
        unreadCount: 3,
        avatar: undefined
      },
      {
        id: '2',
        name: 'Sarah Wilson',
        type: 'direct',
        members: 2,
        lastMessage: {
          content: 'Can we schedule a meeting for tomorrow?',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          senderName: 'Sarah Wilson'
        },
        unreadCount: 1,
        isOnline: true,
        avatar: undefined
      },
      {
        id: '3',
        name: 'HR Department',
        type: 'group',
        members: 5,
        lastMessage: {
          content: 'Please submit your timesheets by Friday',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          senderName: 'HR Admin'
        },
        unreadCount: 0,
        avatar: undefined
      }
    ];

    const mockMessages: SimpleMessage[] = [
      {
        id: '1',
        content: 'Hello everyone! Welcome to the team.',
        senderId: 'other1',
        senderName: 'John Doe',
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        status: 'read'
      },
      {
        id: '2',
        content: 'Thanks! Excited to be here.',
        senderId: currentUserId,
        senderName: currentUserName,
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        status: 'read'
      },
      {
        id: '3',
        content: 'Great work on the new feature!',
        senderId: 'other1',
        senderName: 'John Doe',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        status: 'delivered'
      }
    ];

    setConversations(mockConversations);
    setMessages(mockMessages);
  }, [currentUserId, currentUserName]);

  // Handle responsive design
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mobile: hide conversation list when chat is selected
  useEffect(() => {
    if (isMobileView && selectedConversation) {
      setShowConversationList(false);
    } else if (!isMobileView) {
      setShowConversationList(true);
    }
  }, [isMobileView, selectedConversation]);

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    
    // Mark as read (mock)
    setConversations(prev => 
      prev.map(c => 
        c.id === conversation.id 
          ? { ...c, unreadCount: 0 }
          : c
      )
    );
  };

  const handleSendMessage = (content: string, attachments?: File[]) => {
    if (!selectedConversation) return;
    
    // Add optimistic message
    const newMessage: SimpleMessage = {
      id: `temp-${Date.now()}`,
      content,
      senderId: currentUserId,
      senderName: currentUserName,
      timestamp: new Date(),
      status: 'pending'
    };
    
    setMessages(prev => [...prev, newMessage]);
    setReplyTo(null);
    
    // Call parent handler
    onSendMessage(selectedConversation.id, content, attachments);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Implement search logic here
  };

  const handleBackToList = () => {
    setShowConversationList(true);
    if (isMobileView) {
      setSelectedConversation(null);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex bg-background">
      {/* Conversation List */}
      <div className={cn(
        "flex-shrink-0 border-r",
        isMobileView ? "w-full" : "w-80",
        isMobileView && !showConversationList && "hidden"
      )}>
        <ConversationList
          conversations={filteredConversations}
          selectedConversationId={selectedConversation?.id}
          currentUserId={currentUserId}
          onConversationSelect={handleConversationSelect}
          onCreateGroup={onCreateGroup}
          onSearch={handleSearch}
        />
      </div>

      {/* Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col",
        isMobileView && showConversationList && "hidden"
      )}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <ChatHeader
              conversation={selectedConversation}
              onBack={isMobileView ? handleBackToList : undefined}
            />
            
            {/* Messages */}
            <div className="flex-1 overflow-hidden">
              <SimpleMessageList
                messages={messages}
                currentUserId={currentUserId}
                conversationName={selectedConversation.name}
              />
            </div>
            
            {/* Message Input */}
            <MessageInput
              onSendMessage={handleSendMessage}
              replyTo={replyTo}
              onCancelReply={() => setReplyTo(null)}
              placeholder={`Message ${selectedConversation.name}...`}
            />
          </>
        ) : (
          <EmptyChatState onCreateGroup={onCreateGroup} />
        )}
      </div>
    </div>
  );
}

function ChatHeader({ 
  conversation, 
  onBack 
}: { 
  conversation: Conversation; 
  onBack?: () => void; 
}) {
  return (
    <div className="p-4 border-b bg-background flex items-center gap-3">
      {onBack && (
        <Button size="icon" variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}
      
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={conversation.avatar} />
            <AvatarFallback>
              {conversation.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          {conversation.type === 'direct' && conversation.isOnline && (
            <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h2 className="font-medium truncate">{conversation.name}</h2>
          <p className="text-sm text-muted-foreground">
            {conversation.type === 'group' 
              ? `${conversation.members} members`
              : conversation.isOnline ? 'Online' : 'Last seen recently'
            }
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        <Button size="icon" variant="ghost">
          <Phone className="h-5 w-5" />
        </Button>
        <Button size="icon" variant="ghost">
          <Video className="h-5 w-5" />
        </Button>
        <Button size="icon" variant="ghost">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

function SimpleMessageList({ 
  messages, 
  currentUserId, 
  conversationName 
}: { 
  messages: SimpleMessage[]; 
  currentUserId: string; 
  conversationName: string; 
}) {
  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-center p-8">
        <div>
          <h3 className="font-medium text-lg mb-2">Welcome to {conversationName}</h3>
          <p className="text-muted-foreground">Send a message to start the conversation!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex gap-3",
            message.senderId === currentUserId ? "justify-end" : "justify-start"
          )}
        >
          {message.senderId !== currentUserId && (
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {message.senderName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          
          <div className={cn(
            "max-w-[70%] space-y-1",
            message.senderId === currentUserId && "items-end"
          )}>
            {message.senderId !== currentUserId && (
              <p className="text-xs text-muted-foreground ml-3">
                {message.senderName}
              </p>
            )}
            
            <Card className={cn(
              "p-3 rounded-2xl",
              message.senderId === currentUserId
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            )}>
              <p className="text-sm leading-relaxed">{message.content}</p>
              <div className="flex items-center gap-1 mt-1 text-xs opacity-70">
                <span>{formatDistanceToNow(message.timestamp, { addSuffix: true })}</span>
                {message.senderId === currentUserId && (
                  <MessageStatusIcon status={message.status} />
                )}
              </div>
            </Card>
          </div>
        </div>
      ))}
    </div>
  );
}

function MessageStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'pending':
      return <Badge variant="secondary" className="h-2 w-2 p-0 bg-yellow-500" />;
    case 'sent':
      return <Badge variant="secondary" className="h-2 w-2 p-0 bg-blue-500" />;
    case 'delivered':
      return <Badge variant="secondary" className="h-2 w-2 p-0 bg-green-500" />;
    case 'read':
      return <Badge variant="secondary" className="h-2 w-2 p-0 bg-green-500" />;
    default:
      return null;
  }
}

function EmptyChatState({ onCreateGroup }: { onCreateGroup: () => void }) {
  return (
    <div className="h-full flex items-center justify-center text-center p-8">
      <div className="max-w-md">
        <div className="rounded-full bg-muted p-8 mx-auto mb-6 w-fit">
          <Users className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Welcome to Messaging</h2>
        <p className="text-muted-foreground mb-6">
          Select a conversation from the sidebar to start messaging, or create a new group to get started.
        </p>
        <Button onClick={onCreateGroup} size="lg">
          Create New Group
        </Button>
      </div>
    </div>
  );
} 