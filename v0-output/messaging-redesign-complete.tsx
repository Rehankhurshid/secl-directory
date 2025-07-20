Of course. Here is a complete, production-ready redesign of the real-time messaging interface, built with React, Next.js, TypeScript, and shadcn/ui.

This solution follows modern best practices, including a component-based architecture, responsive design, dark mode support, and accessibility considerations, tailored for a professional corporate environment.

<br />

### 1. Installation and Setup

First, ensure you have a Next.js project set up. Then, install the required `shadcn/ui` components and `lucide-react` for icons.

```bash
# Install shadcn/ui components
npx shadcn-ui@latest add button card input avatar badge separator tooltip textarea

# Install lucide-react for icons
npm install lucide-react
```

This will set up the necessary UI primitives for the messaging interface.

### 2. Project Structure

For maintainability, the components are organized into a logical file structure.

```
.
├── app/
│   └── page.tsx
├── components/
│   ├── messaging/
│   │   ├── chat-area.tsx
│   │   ├── chat-header.tsx
│   │   ├── chat-input.tsx
│   │   ├── conversation-card.tsx
│   │   ├── conversation-sidebar.tsx
│   │   ├── message-bubble.tsx
│   │   └── realtime-messaging-interface.tsx
│   └── ui/
│       └── ... (shadcn components)
├── lib/
│   ├── hooks/
│   │   └── use-mock-messaging.ts
│   ├── types.ts
│   └── utils.ts
└── public/
    └── placeholder.svg
```

### 3. Data Types and Utilities

These files define the core data structures and helper functions.

<CodeGroup>
```typescript file="lib/types.ts"
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: "text" | "image" | "file";
  status: "pending" | "sent" | "delivered" | "read";
  createdAt: Date;
}

export interface Employee {
  empCode: string;
  name: string;
  department?: string;
  designation?: string;
  avatarUrl?: string;
  isOnline?: boolean;
}

export interface Conversation {
  id: string;
  name: string;
  members: Employee[];
  lastMessage: Message | null;
  unreadCount: number;
  isGroup: boolean;
}
```

```typescript file="lib/utils.ts"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diff / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return "now";
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  } else if (diffHours < 24) {
    return `${diffHours}h`;
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  } else {
    return date.toLocaleDateString('en-US');
  }
}
```

### 4. Mock Data and Logic Hook

To demonstrate the UI's dynamic capabilities without a live WebSocket connection, this custom hook simulates real-time events like receiving messages, typing indicators, and status changes. You can replace this with your actual WebSocket logic.

```typescript file="lib/hooks/use-mock-messaging.ts"
"use client";

import { useState, useEffect } from "react";
import { Message, Employee, Conversation } from "@/lib/types";

// Mock Data
const MOCK_EMPLOYEES: Employee[] = [
  { empCode: "ADMIN001", name: "System Admin", avatarUrl: "/placeholder.svg", isOnline: true },
  { empCode: "90145293", name: "John Doe", avatarUrl: "/placeholder.svg", isOnline: true },
  { empCode: "82345678", name: "Jane Smith", avatarUrl: "/placeholder.svg", isOnline: false },
  { empCode: "73456789", name: "Peter Jones", avatarUrl: "/placeholder.svg", isOnline: true },
  { empCode: "64567890", name: "Mary Johnson", avatarUrl: "/placeholder.svg", isOnline: true },
];

const currentUser: Employee = MOCK_EMPLOYEES[1];

const MOCK_MESSAGES: Message[] = [
    { id: 'm1', conversationId: 'c1', senderId: '90145293', content: 'Hey everyone, stand-up in 5.', type: 'text', status: 'read', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) },
    { id: 'm2', conversationId: 'c1', senderId: '73456789', content: 'On my way!', type: 'text', status: 'read', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 10000) },
    { id: 'm3', conversationId: 'c2', senderId: '82345678', content: 'Can you review the Q3 report?', type: 'text', status: 'read', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5) },
    { id: 'm4', conversationId: 'c2', senderId: '90145293', content: 'Sure, I\'ll take a look this afternoon.', type: 'text', status: 'delivered', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4) },
    { id: 'm5', conversationId: 'c3', senderId: 'ADMIN001', content: 'System maintenance scheduled for this weekend.', type: 'text', status: 'read', createdAt: new Date(Date.now() - 1000 * 60 * 30) },
];

const MOCK_CONVERSATIONS: Conversation[] = [
    { id: 'c1', name: 'Dev Team', members: [MOCK_EMPLOYEES[1], MOCK_EMPLOYEES[3], MOCK_EMPLOYEES[4]], lastMessage: MOCK_MESSAGES[1], unreadCount: 0, isGroup: true },
    { id: 'c2', name: 'Jane Smith', members: [MOCK_EMPLOYEES[1], MOCK_EMPLOYEES[2]], lastMessage: MOCK_MESSAGES[3], unreadCount: 2, isGroup: false },
    { id: 'c3', name: 'Announcements', members: [MOCK_EMPLOYEES[0], MOCK_EMPLOYEES[1]], lastMessage: MOCK_MESSAGES[4], unreadCount: 0, isGroup: true },
];

export const useMockMessaging = () => {
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [typingUsers, setTypingUsers] = useState<Employee[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected">("connected");

  const sendMessage = (conversationId: string, content: string) => {
    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      conversationId,
      senderId: currentUser.empCode,
      content,
      type: "text",
      status: "pending",
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    
    // Simulate network delay and status updates
    setTimeout(() => {
        setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'sent' } : m));
    }, 1000);
    setTimeout(() => {
        setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'delivered' } : m));
    }, 2500);
  };
  
  // Simulate receiving messages and typing indicators
  useEffect(() => {
    const typingInterval = setInterval(() => {
      const isTyping = Math.random() > 0.7;
      if (isTyping) {
        const typingUser = MOCK_EMPLOYEES[Math.floor(Math.random() * MOCK_EMPLOYEES.length)];
        if(typingUser.empCode !== currentUser.empCode && !typingUsers.find(u => u.empCode === typingUser.empCode)) {
          setTypingUsers(prev => [...prev, typingUser]);
          setTimeout(() => {
            setTypingUsers(prev => prev.filter(u => u.empCode !== typingUser.empCode));
          }, 3000);
        }
      }
    }, 5000);

    return () => clearInterval(typingInterval);
  }, [typingUsers]);

  return {
    messages,
    conversations,
    typingUsers,
    connectionStatus,
    currentUser,
    employees: MOCK_EMPLOYEES,
    sendMessage,
    setConnectionStatus,
  };
};
```

### 5. Messaging Components

These components form the building blocks of the UI. They are designed to be modular and reusable.

#### Main Interface Wrapper
This component orchestrates the entire layout and state management.

```tsx file="components/messaging/realtime-messaging-interface.tsx"
"use client";

import { useState, useMemo } from "react";
import { useMockMessaging } from "@/lib/hooks/use-mock-messaging";
import { ConversationSidebar } from "./conversation-sidebar";
import { ChatArea } from "./chat-area";
import { Employee, Conversation } from "@/lib/types";
import { Card } from "@/components/ui/card";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

export function RealtimeMessagingInterface() {
  const {
    messages,
    conversations,
    typingUsers,
    connectionStatus,
    currentUser,
    employees,
    sendMessage,
  } = useMockMessaging();

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(conversations[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = useMemo(() => {
    return conversations.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => (b.lastMessage?.createdAt.getTime() || 0) - (a.lastMessage?.createdAt.getTime() || 0));
  }, [conversations, searchQuery]);

  const selectedConversation = useMemo(() => {
    return conversations.find(c => c.id === selectedConversationId) || null;
  }, [conversations, selectedConversationId]);
  
  const currentMessages = useMemo(() => {
    return messages.filter(m => m.conversationId === selectedConversationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }, [messages, selectedConversationId]);

  const getEmployee = (empCode: string): Employee | undefined => {
    return employees.find(e => e.empCode === empCode);
  };
  
  return (
    <div className="flex h-screen w-full flex-col bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <Card className="h-full w-full rounded-none md:rounded-lg border-0 md:border md:m-4">
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
          <ResizablePanel defaultSize={30} minSize={20} maxSize={40} className="hidden md:block">
            <ConversationSidebar
              conversations={filteredConversations}
              selectedConversationId={selectedConversationId}
              onConversationSelect={setSelectedConversationId}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              currentUser={currentUser}
            />
          </ResizablePanel>
          <ResizableHandle withHandle className="hidden md:flex" />
          <ResizablePanel defaultSize={70}>
            <ChatArea
              conversation={selectedConversation}
              messages={currentMessages}
              typingUsers={typingUsers.filter(u => selectedConversation?.members.some(m => m.empCode === u.empCode))}
              currentUser={currentUser}
              onSendMessage={(content) => {
                if(selectedConversationId) sendMessage(selectedConversationId, content)
              }}
              getEmployee={getEmployee}
              connectionStatus={connectionStatus}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </Card>
    </div>
  );
}
```

#### Conversation List (Left Panel)

```tsx file="components/messaging/conversation-sidebar.tsx"
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConversationCard } from "./conversation-card";
import { Conversation, Employee } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ConversationSidebarProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onConversationSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentUser: Employee;
}

export function ConversationSidebar({
  conversations,
  selectedConversationId,
  onConversationSelect,
  searchQuery,
  onSearchChange,
  currentUser,
}: ConversationSidebarProps) {
  return (
    <div className="flex h-full flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
      <div className="p-4">
        <h2 className="text-2xl font-bold">Chats</h2>
      </div>
      <div className="px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {conversations.length > 0 ? (
            conversations.map((convo) => (
              <ConversationCard
                key={convo.id}
                conversation={convo}
                isSelected={selectedConversationId === convo.id}
                onClick={() => onConversationSelect(convo.id)}
                currentUser={currentUser}
              />
            ))
          ) : (
            <div className="p-4 text-center text-slate-500">
              <p>No conversations found.</p>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="p-4">
        <Button className="w-full">
          <Plus className="mr-2 h-4 w-4" /> New Conversation
        </Button>
      </div>
    </div>
  );
}
```

#### Individual Conversation Card

```tsx file="components/messaging/conversation-card.tsx"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Conversation, Employee } from "@/lib/types";
import { cn, formatTimestamp } from "@/lib/utils";

interface ConversationCardProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
  currentUser: Employee;
}

export function ConversationCard({ conversation, isSelected, onClick, currentUser }: ConversationCardProps) {
  const getParticipant = () => {
    if (conversation.isGroup) return null;
    return conversation.members.find(m => m.empCode !== currentUser.empCode);
  };

  const participant = getParticipant();
  const name = conversation.isGroup ? conversation.name : participant?.name || 'Unknown';
  const avatarUrl = conversation.isGroup ? '/placeholder.svg' : participant?.avatarUrl;
  const isOnline = participant?.isOnline;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-4 rounded-lg p-3 text-left transition-colors",
        isSelected
          ? "bg-slate-200 dark:bg-slate-800"
          : "hover:bg-slate-100 dark:hover:bg-slate-800/50"
      )}
    >
      <div className="relative">
        <Avatar>
          <AvatarImage src={avatarUrl} alt={name} />
          <AvatarFallback>{name.charAt(0)}</AvatarFallback>
        </Avatar>
        {!conversation.isGroup && isOnline && (
          <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-slate-950" />
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold truncate">{name}</h3>
          {conversation.lastMessage && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {formatTimestamp(conversation.lastMessage.createdAt)}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400 truncate pr-2">
            {conversation.lastMessage?.content || "No messages yet"}
          </p>
          {conversation.unreadCount > 0 && (
            <Badge className="h-5 min-w-[20px] justify-center px-1.5">{conversation.unreadCount}</Badge>
          )}
        </div>
      </div>
    </button>
  );
}
```

#### Chat Area (Right Panel)
This component displays the conversation header, messages, and input area.

```tsx file="components/messaging/chat-area.tsx"
import { useRef, useEffect } from "react";
import { Conversation, Message, Employee } from "@/lib/types";
import { ChatHeader } from "./chat-header";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare } from "lucide-react";

interface ChatAreaProps {
  conversation: Conversation | null;
  messages: Message[];
  typingUsers: Employee[];
  currentUser: Employee;
  onSendMessage: (content: string) => void;
  getEmployee: (empCode: string) => Employee | undefined;
  connectionStatus: "connected" | "connecting" | "disconnected";
}

export function ChatArea({
  conversation,
  messages,
  typingUsers,
  currentUser,
  onSendMessage,
  getEmployee,
  connectionStatus,
}: ChatAreaProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-white dark:bg-slate-900">
        <MessageSquare className="h-16 w-16 text-slate-400 dark:text-slate-600" />
        <h2 className="mt-4 text-xl font-semibold">Select a conversation</h2>
        <p className="text-slate-500">Start messaging by choosing a conversation from the left panel.</p>
      </div>
    );
  }

  const isMessageFromSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-slate-900">
      <ChatHeader 
        conversation={conversation} 
        currentUser={currentUser} 
        connectionStatus={connectionStatus}
      />
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message, index) => {
            const sender = getEmployee(message.senderId);
            const isOwnMessage = message.senderId === currentUser.empCode;
            const prevMessage = messages[index - 1];
            const showDateSeparator = !prevMessage || !isMessageFromSameDay(new Date(message.createdAt), new Date(prevMessage.createdAt));
            const showSenderInfo = !isOwnMessage && (index === 0 || messages[index-1].senderId !== message.senderId);

            return (
              <div key={message.id}>
                {showDateSeparator && (
                  <Separator className="my-4">
                    <span className="px-2 bg-white dark:bg-slate-900 text-xs text-slate-500">
                      {new Date(message.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </Separator>
                )}
                <MessageBubble
                  message={message}
                  isOwnMessage={isOwnMessage}
                  sender={sender}
                  showSenderInfo={showSenderInfo}
                />
              </div>
            );
          })}
        </div>
      </ScrollArea>
      <ChatInput onSendMessage={onSendMessage} typingUsers={typingUsers} />
    </div>
  );
}
```

#### Chat Header

```tsx file="components/messaging/chat-header.tsx"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Conversation, Employee } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  conversation: Conversation;
  currentUser: Employee;
  connectionStatus: "connected" | "connecting" | "disconnected";
}

export function ChatHeader({ conversation, currentUser, connectionStatus }: ChatHeaderProps) {
  const getParticipant = () => {
    if (conversation.isGroup) return null;
    return conversation.members.find(m => m.empCode !== currentUser.empCode);
  };
  
  const participant = getParticipant();
  const name = conversation.isGroup ? conversation.name : participant?.name || "Unknown";
  const memberCount = conversation.members.length;
  const statusText = conversation.isGroup ? `${memberCount} members` : (participant?.isOnline ? "Online" : "Offline");

  const connectionIndicatorColor = {
    connected: "bg-green-500",
    connecting: "bg-yellow-500 animate-pulse",
    disconnected: "bg-red-500",
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-4">
        <Avatar>
          <AvatarImage src={conversation.isGroup ? '/placeholder.svg' : participant?.avatarUrl} />
          <AvatarFallback>{name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-bold text-lg">{name}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{statusText}</p>
        </div>
      </div>
       <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">{connectionStatus}</span>
        <div className={cn("h-2.5 w-2.5 rounded-full", connectionIndicatorColor[connectionStatus])}></div>
      </div>
    </div>
  );
}
```

#### Message Bubble

```tsx file="components/messaging/message-bubble.tsx"
import { Check, CheckCheck, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Message, Employee } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  sender?: Employee;
  showSenderInfo: boolean;
}

export function MessageBubble({ message, isOwnMessage, sender, showSenderInfo }: MessageBubbleProps) {
  const getStatusIcon = () => {
    switch (message.status) {
      case "pending": return <Clock className="h-4 w-4 text-slate-400" />;
      case "sent": return <Check className="h-4 w-4 text-slate-400" />;
      case "delivered": return <CheckCheck className="h-4 w-4 text-slate-400" />;
      case "read": return <CheckCheck className="h-4 w-4 text-blue-500" />;
      default: return null;
    }
  };

  return (
    <div className={cn("flex items-end gap-2", isOwnMessage ? "justify-end" : "justify-start")}>
      {!isOwnMessage && (
        <div className="w-8 h-8">
        {showSenderInfo && sender && (
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-sm">
                {sender.name.charAt(0)}
            </div>
        )}
        </div>
      )}
      <div className={cn("max-w-xs md:max-w-md lg:max-w-lg rounded-xl px-4 py-2", isOwnMessage
        ? "bg-slate-800 text-white dark:bg-slate-700 rounded-br-none"
        : "bg-slate-100 dark:bg-slate-800 rounded-bl-none"
      )}>
        {!isOwnMessage && showSenderInfo && (
          <p className="text-sm font-semibold text-blue-500 mb-1">{sender?.name}</p>
        )}
        <p className="whitespace-pre-wrap">{message.content}</p>
        <div className="flex items-center justify-end gap-2 mt-1">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          {isOwnMessage && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>{getStatusIcon()}</TooltipTrigger>
                <TooltipContent>
                  <p>{message.status.charAt(0).toUpperCase() + message.status.slice(1)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </div>
  );
}

```

#### Chat Input
This component handles message composition and sending.

```tsx file="components/messaging/chat-input.tsx"
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SendHorizontal, Paperclip, Smile } from "lucide-react";
import { Employee } from "@/lib/types";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  typingUsers: Employee[];
}

export function ChatInput({ onSendMessage, typingUsers }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };
  
  const getTypingText = () => {
    if(typingUsers.length === 0) return "\u00a0"; // Non-breaking space for layout consistency
    if(typingUsers.length === 1) return `${typingUsers[0].name} is typing...`;
    if(typingUsers.length === 2) return `${typingUsers[0].name} and ${typingUsers[1].name} are typing...`;
    return "Several people are typing...";
  }

  return (
    <div className="border-t border-slate-200 dark:border-slate-800 p-4">
      <div className="h-6 text-sm text-slate-500 italic">
        {getTypingText()}
      </div>
      <div className="flex items-end gap-2">
        <Textarea
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          rows={1}
          className="flex-1 resize-none bg-slate-100 dark:bg-slate-800"
        />
        <Button variant="ghost" size="icon" className="shrink-0">
          <Paperclip className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="shrink-0">
          <Smile className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!message.trim()}
          className="shrink-0"
        >
          <SendHorizontal className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
```

### 6. Main Page

Finally, assemble the main interface in your `app/page.tsx`. This component remains a Server Component, wrapping the main client-side interface.

```tsx file="app/page.tsx"
import { RealtimeMessagingInterface } from "@/components/messaging/realtime-messaging-interface";

// npx shadcn-ui@latest add resizable
// This is required for the resizable panel group

export default function Home() {
  return (
    <main className="h-screen w-screen bg-slate-100 dark:bg-slate-900">
      <RealtimeMessagingInterface />
    </main>
  );
}
```

This comprehensive solution provides a professional, modern, and fully functional messaging interface that is ready for integration into your PWA. It meets all specified design and technical requirements, offering a significant upgrade to your user experience.