'use client';

import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/lib/hooks/use-auth';
import { useWebSocket, useRealTimeMessages, useTypingIndicator } from '@/lib/hooks/use-websocket';
import ConversationSidebar from './conversation-sidebar';
import MessageBubble from './message-bubble';
import ChatInput from './chat-input';
import CreateGroupDialog from './create-group-dialog';
import { ConnectionStatusIndicator } from '../offline/connection-status-indicator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, MoreVertical, WifiOff, AlertTriangle } from 'lucide-react';
import { formatDateSeparator, shouldShowDateSeparator, getInitials } from '@/lib/messaging/utils';
import { cn } from '@/lib/utils';
import offlineSyncManager from '@/lib/storage/offline-sync-manager';

// Employee and Group types
interface Employee {
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

interface Group {
  id: string;
  name: string;
  description?: string;
  memberCount?: number;
  lastMessage?: string;
  lastMessageTime: Date;
  unreadCount: number;
  type?: 'group';
  members?: string[];
}

// Mock conversations data - will be replaced with real groups
const mockConversations = [
  {
    id: 'general',
    name: 'General',
    type: 'group' as const,
    members: ['ADMIN001', '90145293'],
    lastMessage: 'Welcome to the general chat!',
    lastMessageTime: new Date(Date.now() - 30 * 60000),
    unreadCount: 0
  },
  {
    id: 'development',
    name: 'Development Team',
    type: 'group' as const,
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
    lastMessage: 'New updates available',
    lastMessageTime: new Date(Date.now() - 24 * 60 * 60000),
    unreadCount: 1
  }
];

interface TypingIndicatorProps {
  typingUsers: string[];
  currentUserId: string;
  employees: Array<{ empCode: string; name: string; }>;
}

function TypingIndicator({ typingUsers, currentUserId, employees }: TypingIndicatorProps) {
  const activeTypingUsers = typingUsers.filter(id => id !== currentUserId);
  
  if (activeTypingUsers.length === 0) return null;

  // Function to get employee name from ID
  const getEmployeeName = (empCode: string) => {
    const employee = employees.find(emp => emp.empCode === empCode);
    return employee ? employee.name : empCode; // Fallback to empCode if name not found
  };

  const typingNames = activeTypingUsers.slice(0, 2).map(getEmployeeName);
  const names = typingNames.join(', ');
  const additional = activeTypingUsers.length > 2 ? ` and ${activeTypingUsers.length - 2} others` : '';
  const text = `${names}${additional} ${activeTypingUsers.length === 1 ? 'is' : 'are'} typing...`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground bg-background/80"
    >
      <div className="flex gap-1 items-center">
        <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="font-medium">{text}</span>
    </motion.div>
  );
}

interface ChatHeaderProps {
  conversation: any;
  onBack: () => void;
}

function ChatHeader({ conversation, onBack }: ChatHeaderProps) {
  return (
    <header className="flex items-center p-4 border-b bg-background sticky top-0 z-10">
      <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={onBack}>
        <ArrowLeft className="h-5 w-5" />
        <span className="sr-only">Back</span>
      </Button>
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/20 text-primary font-semibold">
            {getInitials(conversation.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold text-base">{conversation.name}</h2>
          <p className="text-sm text-muted-foreground">{conversation.members?.length || 0} members</p>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <ConnectionStatusIndicator variant="compact" showActions={false} />
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5" />
          <span className="sr-only">Group options</span>
        </Button>
      </div>
    </header>
  );
}

// Connection Status Banner Component
function ConnectionStatusBanner({ status, isConnected }: { status: string; isConnected: boolean }) {
  const [showIncognitoWarning, setShowIncognitoWarning] = useState(false);

  useEffect(() => {
    // Show incognito warning if disconnected for more than 10 seconds
    if (!isConnected && status === 'error') {
      const timer = setTimeout(() => {
        setShowIncognitoWarning(true);
      }, 10000);
      return () => clearTimeout(timer);
    } else {
      setShowIncognitoWarning(false);
    }
  }, [isConnected, status]);

  if (isConnected) return null;

  return (
    <Alert className="mx-4 mt-2 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
      <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
      <AlertDescription className="text-sm text-orange-800 dark:text-orange-200">
        {showIncognitoWarning ? (
          <>
            <strong>Incognito Mode Detected:</strong> Real-time messaging may be limited. Messages will be stored locally and sync when you exit incognito mode.
          </>
        ) : status === 'connecting' ? (
          <>
            <WifiOff className="inline h-3 w-3 mr-1" />
            Connecting to real-time messaging...
          </>
        ) : (
          <>
            <WifiOff className="inline h-3 w-3 mr-1" />
            Real-time messaging temporarily unavailable. Messages will be stored locally.
          </>
        )}
      </AlertDescription>
    </Alert>
  );
}

export default function ModernMessagingLayout() {
  const [selectedConversation, setSelectedConversation] = useState<string>('general');
  const [isMobileChatVisible, setIsMobileChatVisible] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Get current authenticated user
  const { employee } = useAuth();
  const currentUserId = employee?.empCode || 'anonymous';

  // WebSocket hooks
  const { status, isConnected } = useWebSocket(currentUserId);
  const { messages, isLoading, sendMessage } = useRealTimeMessages(selectedConversation);
  const { typingUsers, sendTypingIndicator } = useTypingIndicator(selectedConversation, currentUserId);

  // Initialize offline sync manager
  useEffect(() => {
    let mounted = true;

    const initOfflineSync = async () => {
      try {
        await offlineSyncManager.init();
        if (mounted) {
          console.log('✅ Offline sync manager initialized');
        }
      } catch (error) {
        if (mounted) {
          console.error('❌ Failed to initialize offline sync manager:', error);
        }
      }
    };

    // Initialize immediately
    initOfflineSync();

    return () => {
      mounted = false;
    };
  }, []);

  // Fetch employees for group creation
  useEffect(() => {
    const fetchEmployees = async () => {
      setIsLoadingEmployees(true);
      try {
        const token = localStorage.getItem('sessionToken');
        if (!token) return;

        const response = await fetch('/api/employees?limit=50000', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const employeeData = data.employees.map((emp: any) => ({
            empCode: emp.empCode,
            name: emp.name,
            designation: emp.designation || 'Employee',
            department: emp.department || 'N/A',
            location: emp.location,
            profileImage: emp.profileImage,
            grade: emp.grade,
            category: emp.category,
            gender: emp.gender,
          }));
          setEmployees(employeeData);
        }
      } catch (error) {
        console.error('Failed to fetch employees:', error);
      } finally {
        setIsLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, []);

  // Fetch user's groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const token = localStorage.getItem('sessionToken');
        if (!token) return;

        const response = await fetch('/api/messaging/groups', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const groupData = data.map((group: any) => ({
            id: group.id.toString(),
            name: group.name,
            description: group.description,
            memberCount: group.memberCount,
            lastMessage: group.lastMessage,
            lastMessageTime: new Date(group.lastMessageTime || group.createdAt),
            unreadCount: group.unreadCount
          }));
          setGroups(groupData);
        }
      } catch (error) {
        console.error('Failed to fetch groups:', error);
      }
    };

    fetchGroups();
  }, []);

  // Handle group creation
  const handleCreateGroup = async (data: { name: string; description?: string; memberIds: string[] }) => {
    setIsCreatingGroup(true);
    try {
      const token = localStorage.getItem('sessionToken');
      if (!token) throw new Error('No session token');

      const response = await fetch('/api/messaging/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Group created successfully:', result);
        
        // Refresh groups list
        const groupsResponse = await fetch('/api/messaging/groups', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (groupsResponse.ok) {
          const groupsData = await groupsResponse.json();
          const formattedGroups = groupsData.map((group: any) => ({
            id: group.id.toString(),
            name: group.name,
            description: group.description,
            memberCount: group.memberCount,
            lastMessage: group.lastMessage,
            lastMessageTime: new Date(group.lastMessageTime || group.createdAt),
            unreadCount: group.unreadCount
          }));
          setGroups(formattedGroups);
        }
        
        setShowCreateDialog(false);
      } else {
        const error = await response.json();
        console.error('Failed to create group:', error);
      }
    } catch (error) {
      console.error('Error creating group:', error);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);

  const handleGroupSelect = (group: any) => {
    setSelectedConversation(group.id);
    setIsMobileChatVisible(true);
  };

  const handleSendMessage = (content: string) => {
    sendMessage(content, currentUserId);
  };

  const handleTypingStart = () => {
    sendTypingIndicator(true);
  };

  const handleTypingStop = () => {
    sendTypingIndicator(false);
  };

  // Use the same groups that are displayed in the sidebar
  const activeGroups = groups.length > 0 ? groups : mockConversations;
  const selectedGroup = activeGroups.find(g => g.id === selectedConversation);
  const connectionStatus = { connected: isConnected, authenticated: true };
  


  // Show loading if no employee data yet
  if (!employee) {
    return (
      <div className="h-[calc(100vh-57px)] flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading messaging...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-57px)] flex flex-col bg-background overflow-hidden">
      {/* Connection Status Banner */}
      <ConnectionStatusBanner status={status} isConnected={isConnected} />
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversation Sidebar */}
        <div className={cn(
          "w-full md:w-[340px] md:flex flex-col h-full", 
          isMobileChatVisible ? "hidden md:flex" : "flex"
        )}>
          <ConversationSidebar
            groups={activeGroups as any}
            selectedGroupId={selectedConversation}
            connectionStatus={connectionStatus}
            onGroupSelect={handleGroupSelect}
            onCreateGroup={() => setShowCreateDialog(true)}
            isLoading={false}
          />
        </div>
      
      {/* Chat Area */}
      <div className={cn(
        "w-full flex-1 h-full", 
        isMobileChatVisible ? "flex" : "hidden md:flex"
      )}>
        <AnimatePresence>
          {selectedGroup ? (
            <motion.div
              key={selectedGroup.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full flex flex-col bg-muted/20"
            >
              {/* Chat Header */}
              <ChatHeader 
                conversation={selectedGroup} 
                onBack={() => setIsMobileChatVisible(false)} 
              />
              
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto">
                <ScrollArea className="h-full" ref={scrollAreaRef}>
                  <div className="p-4 md:p-6 space-y-2">
                    {messages.length === 0 ? (
                      <div className="text-center py-16">
                        <h3 className="font-semibold">No messages yet</h3>
                        <p className="text-muted-foreground text-sm">Be the first to say something!</p>
                      </div>
                    ) : (
                      <AnimatePresence initial={false}>
                        {messages.map((message, index) => {
                          const isOwn = message.senderId === currentUserId;
                          
                          // Convert message to the format expected by MessageBubble
                          const messageForBubble = {
                            id: message.id,
                            content: message.content,
                            timestamp: message.createdAt.toISOString(),
                            senderId: message.senderId,
                            senderName: isOwn ? employee.name : 'Other User',
                            status: message.status.toLowerCase() as 'pending' | 'sent' | 'delivered' | 'read'
                          };

                          return (
                            <motion.div
                              key={message.id}
                              layout
                              initial={{ opacity: 0, scale: 0.8, y: 20 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            >
                              <MessageBubble 
                                message={messageForBubble}
                                isOwnMessage={isOwn} 
                                currentUserId={currentUserId}
                              />
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Typing Indicator - Always visible above input */}
              <div className="border-t bg-background">
                <AnimatePresence>
                  <TypingIndicator 
                    typingUsers={Array.from(typingUsers)} 
                    currentUserId={currentUserId}
                    employees={employees}
                  />
                </AnimatePresence>
              </div>

              {/* Chat Input */}
              <ChatInput
                conversationId={selectedConversation}
                onSendMessage={handleSendMessage}
                onTypingStart={handleTypingStart}
                onTypingStop={handleTypingStop}
                disabled={false} // Remove connection dependency - handled internally
              />
            </motion.div>
          ) : (
            <div className="hidden md:flex flex-col items-center justify-center w-full h-full text-center bg-muted/40">
              <div className="p-8 border rounded-lg bg-background shadow-sm">
                <h2 className="text-xl font-semibold text-foreground">Welcome to Messages</h2>
                <p className="mt-2 text-muted-foreground">Select a conversation to start chatting.</p>
              </div>
            </div>
          )}
        </AnimatePresence>
        </div>
      </div>
      
      {/* Create Group Dialog */}
      <CreateGroupDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        employees={employees}
        onCreateGroup={handleCreateGroup}
        isCreating={isCreatingGroup}
        isLoadingEmployees={isLoadingEmployees}
      />
    </div>
  );
} 