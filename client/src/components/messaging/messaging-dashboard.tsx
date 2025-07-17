import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Users, Send, Plus, ArrowLeft, Search, Settings, RotateCcw } from 'lucide-react';
import { NotificationSettings } from '@/components/push-notifications/notification-settings';
import { useToast } from '@/hooks/use-toast';
import { useNativeNotifications } from '@/hooks/use-native-notifications';
import { EasterEggAnimation, useEasterEggAnimations } from '@/components/animations/easter-egg-animations';
import { usePWA } from '@/hooks/use-pwa';
import { CreateGroupDialog } from './create-group-dialog';
import { GroupChatFullscreen } from './group-chat-fullscreen';
import { WhatsAppChat } from './whatsapp-chat';
import { NotificationStatus } from './notification-status';
import type { Group, Message, Employee } from '@shared/schema';

interface MessagingDashboardProps {
  employeeId: string;
  sessionToken: string;
  employees?: Employee[];
  employeesLoading?: boolean;
  onBackToDirectory?: () => void;
}

interface WebSocketMessage {
  type: string;
  data?: any;
  message?: string;
}

export function MessagingDashboard({ employeeId, sessionToken, employees = [], employeesLoading = false, onBackToDirectory }: MessagingDashboardProps) {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showFullscreenChat, setShowFullscreenChat] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showMembersDrawer, setShowMembersDrawer] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { handleNewMessage, requestPermission, permission } = useNativeNotifications();
  const { activeAnimation, triggerAnimation, clearAnimation } = useEasterEggAnimations();
  const { hardRefresh } = usePWA();

  // Fetch user's groups
  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['/api/groups', employeeId],
    queryFn: async () => {
      const response = await fetch(`/api/groups?employeeId=${employeeId}`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }
      return response.json();
    },
    enabled: !!employeeId,
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });

  // Fetch messages for selected group
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/messages', selectedGroup?.id],
    queryFn: async () => {
      if (!selectedGroup) return [];
      const response = await fetch(`/api/messages/${selectedGroup.id}`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      return response.json();
    },
    enabled: !!selectedGroup,
    refetchOnWindowFocus: false,
    staleTime: 10000,
  });

  // Fetch unread message count
  const { data: unreadData } = useQuery({
    queryKey: ['/api/notifications/unread-count'],
    queryFn: async () => {
      const response = await fetch('/api/notifications/unread-count', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch unread count');
      }
      return response.json();
    },
    enabled: !!sessionToken,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // Initialize native notifications and service worker
  useEffect(() => {
    // Register native service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/native-sw.js')
        .then((registration) => {
          console.log('Native SW registered successfully:', registration);
        })
        .catch((error) => {
          console.error('Native SW registration failed:', error);
        });
    }
    
    // Request notification permission if not already granted
    if (permission === 'default') {
      requestPermission();
    }
    
    // Handle visibility changes
    const handleVisibilityChange = () => {
      if (!document.hidden && 'serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          if (registration.active) {
            registration.active.postMessage({ type: 'clear-badge' });
          }
        });
      }
    };
    
    // Handle navigation from notifications
    const handleNotificationNavigation = (event: CustomEvent) => {
      if (event.detail.groupId) {
        const group = groups.find(g => g.id === event.detail.groupId);
        if (group) {
          setSelectedGroup(group);
          setShowFullscreenChat(true);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('notification-navigate', handleNotificationNavigation as EventListener);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('notification-navigate', handleNotificationNavigation as EventListener);
    };
  }, [employeeId, sessionToken, permission, requestPermission, groups]);

  // Set up WebSocket connection
  useEffect(() => {
    if (!sessionToken) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log('WebSocket connected for messaging dashboard');
      websocket.send(JSON.stringify({ type: 'auth', data: { sessionToken } }));
    };

    websocket.onmessage = async (event) => {
      const message: WebSocketMessage = JSON.parse(event.data);
      console.log('Received WebSocket message:', message);
      switch (message.type) {
        case 'auth_success':
          console.log('WebSocket authenticated:', message.data);
          setIsConnected(true);
          // Join groups after authentication
          const userGroups = groups.map(g => g.id);
          if (userGroups.length > 0) {
            websocket.send(JSON.stringify({ 
              type: 'join_groups', 
              data: { groupIds: userGroups }
            }));
          }
          break;
        case 'auth_error':
          console.error('WebSocket authentication failed:', message.message);
          setIsConnected(false);
          break;
        case 'groups_joined':
          console.log('Joined groups:', message.data);
          break;
        case 'new_message':
          // Handle new message notification
          if (message.data) {
            // Find the group name from current groups
            const group = groups.find(g => g.id === message.data.groupId);
            await handleNewMessage({
              ...message.data,
              groupName: group?.name || 'Group Message'
            }, employeeId);
            
            // Trigger Easter egg animation for new message
            const senderName = message.data.sender?.name || 'Someone';
            triggerAnimation('new-message', `${senderName} sent a message`);
          }
          // Invalidate queries to update UI
          queryClient.invalidateQueries({ queryKey: ['/api/groups', message.data?.groupId, 'messages'] });
          queryClient.invalidateQueries({ queryKey: ['/api/groups', employeeId] });
          queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
          
          // Show toast notification if not in the current group or not in fullscreen mode
          if (!showFullscreenChat || !selectedGroup || selectedGroup.id !== message.data.groupId) {
            const senderName = message.data.sender?.name || 'Someone';
            const groupName = groups.find(g => g.id === message.data.groupId)?.name || 'Group';
            toast({
              title: `${senderName} in ${groupName}`,
              description: message.data.content,
              duration: 4000,
            });
          }
          break;
        case 'message':
          queryClient.invalidateQueries({ queryKey: ['/api/groups', selectedGroup?.id, 'messages'] });
          queryClient.invalidateQueries({ queryKey: ['/api/groups', employeeId] });
          queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
          break;
        case 'group_created':
          queryClient.invalidateQueries({ queryKey: ['/api/groups', employeeId] });
          triggerAnimation('group-created', 'New group created! 🎉');
          break;
        case 'group_updated':
          queryClient.invalidateQueries({ queryKey: ['/api/groups', employeeId] });
          break;
        case 'message_read':
          queryClient.invalidateQueries({ queryKey: ['/api/groups', selectedGroup?.id, 'messages'] });
          queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
          break;
        case 'error':
          console.error('WebSocket error:', message.message);
          break;
      }
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected from messaging dashboard');
      setIsConnected(false);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setWs(websocket);
    
    // Store WebSocket reference globally for child components
    (window as any).messagingWebSocket = websocket;

    return () => {
      websocket.close();
      delete (window as any).messagingWebSocket;
    };
  }, [sessionToken, queryClient, employeeId, groups, handleNewMessage, selectedGroup?.id]);

  // Handle service worker messages
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('SW message received:', event.data);
        
        if (event.data?.type === 'navigate-to-group' && event.data?.groupId) {
          const group = groups.find(g => g.id === event.data.groupId);
          if (group) {
            setSelectedGroup(group);
            setShowFullscreenChat(true);
          }
        }
        
        if (event.data?.type === 'reply-to-message' && event.data?.groupId) {
          const group = groups.find(g => g.id === event.data.groupId);
          if (group) {
            setSelectedGroup(group);
            setShowFullscreenChat(true);
            // Focus on message input
            setTimeout(() => {
              const messageInput = document.querySelector('textarea[placeholder*="message"]');
              if (messageInput) {
                (messageInput as HTMLElement).focus();
              }
            }, 100);
          }
        }
      });
    }
  }, [groups]);

  // Send message function
  const sendMessage = async () => {
    if (!selectedGroup || !newMessage.trim() || !ws) return;

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          groupId: selectedGroup.id,
          content: newMessage.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setNewMessage('');
      
      // Refresh messages
      queryClient.invalidateQueries({ queryKey: ['/api/messages', selectedGroup.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/groups', employeeId] });
      
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Handle Enter key to send message
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Format time display
  const formatTime = (timestamp: string | undefined | null) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  // Format date display
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  // Get employee name from ID
  const getEmployeeName = (employeeId: string | undefined | null) => {
    if (!employeeId) return 'Unknown';
    const employee = employees.find(emp => emp.employeeId === employeeId);
    return employee?.name || employeeId;
  };

  // Get employee initials
  const getEmployeeInitials = (employeeId: string | undefined | null) => {
    if (!employeeId) return 'UN';
    const employee = employees.find(emp => emp.employeeId === employeeId);
    if (employee?.name) {
      return employee.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return employeeId.substring(0, 2).toUpperCase();
  };



  // Filter members based on search query
  const filteredMembers = employees.filter(employee =>
    employee.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
    employee.employeeId.toLowerCase().includes(memberSearchQuery.toLowerCase())
  );

  if (showFullscreenChat && selectedGroup) {
    return (
      <GroupChatFullscreen
        group={selectedGroup}
        employeeId={employeeId}
        sessionToken={sessionToken}
        onBack={() => setShowFullscreenChat(false)}
      />
    );
  }

  // Error handling for groups loading
  if (!groups && !groupsLoading) {
    return (
      <div className="flex flex-col h-screen bg-background items-center justify-center">
        <p className="text-muted-foreground">Failed to load groups. Please refresh the page.</p>
        <Button onClick={hardRefresh} className="mt-4">
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Easter egg animations */}
      {activeAnimation && (
        <EasterEggAnimation
          type={activeAnimation.type}
          trigger={activeAnimation.trigger}
          message={activeAnimation.message}
          onComplete={clearAnimation}
        />
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToDirectory}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Directory</span>
          </Button>
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold">Messages</h1>
            <span className="text-xs text-muted-foreground">
              v{new Date().toLocaleString('en-US', { 
                month: '2-digit', 
                day: '2-digit', 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false
              })}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <NotificationStatus />
          <Button
            variant="ghost"
            size="sm"
            onClick={hardRefresh}
            title="Force refresh to clear cache"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Messaging Settings</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <NotificationSettings />
              </div>
            </SheetContent>
          </Sheet>
          <CreateGroupDialog 
            employees={employees}
            employeesLoading={employeesLoading}
            sessionToken={sessionToken}
            onGroupCreated={() => {
              queryClient.invalidateQueries({ queryKey: ['/api/groups', employeeId] });
            }}
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Groups sidebar */}
        <div className="w-80 border-r flex flex-col bg-muted/20">
          <div className="p-4 border-b">
            <h2 className="font-semibold mb-2">Your Groups</h2>
            {groupsLoading ? (
              <div className="text-sm text-muted-foreground">Loading groups...</div>
            ) : (
              <div className="text-sm text-muted-foreground">
                {groups.length} group{groups.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2">
              {groups.map((group) => (
                <Card
                  key={group.id}
                  className={`mb-2 cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedGroup?.id === group.id ? 'bg-primary/10 border-primary' : ''
                  }`}
                  onClick={() => setSelectedGroup(group)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">{group.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      {group.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {group.unreadCount}
                        </Badge>
                      )}
                    </div>
                    {group.lastMessage && group.lastMessage.content && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-muted-foreground truncate">
                          {getEmployeeName(group.lastMessage.senderEmployeeId)}: {group.lastMessage.content}
                        </p>
                        {group.lastMessage.timestamp && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTime(group.lastMessage.timestamp)}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {selectedGroup ? (
            <>
              {/* Chat header */}
              <div className="p-4 border-b bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{selectedGroup.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedGroup.memberCount} member{selectedGroup.memberCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFullscreenChat(true)}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Fullscreen
                    </Button>
                    <Sheet open={showMembersDrawer} onOpenChange={setShowMembersDrawer}>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Users className="w-4 h-4 mr-2" />
                          Members
                        </Button>
                      </SheetTrigger>
                      <SheetContent>
                        <SheetHeader>
                          <SheetTitle>Group Members</SheetTitle>
                        </SheetHeader>
                        <div className="mt-4">
                          <div className="relative mb-4">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search members..."
                              value={memberSearchQuery}
                              onChange={(e) => setMemberSearchQuery(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                          <ScrollArea className="h-[400px]">
                            {selectedGroup.members?.map((member) => (
                              <div key={member.employeeId} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={member.profileImage} />
                                  <AvatarFallback>{getEmployeeInitials(member.employeeId)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{getEmployeeName(member.employeeId)}</p>
                                  <p className="text-xs text-muted-foreground">{member.employeeId}</p>
                                </div>
                              </div>
                            ))}
                          </ScrollArea>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {messagesLoading ? (
                  <div className="text-center text-muted-foreground">Loading messages...</div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message: Message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderEmployeeId === employeeId ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.senderEmployeeId === employeeId
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {message.senderEmployeeId !== employeeId && (
                            <p className="text-xs font-medium mb-1">
                              {getEmployeeName(message.senderEmployeeId)}
                            </p>
                          )}
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Message input */}
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 min-h-[60px] resize-none"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="h-[60px]"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-medium text-lg mb-2">Select a group to start messaging</h3>
                <p className="text-muted-foreground">
                  Choose a group from the sidebar to view and send messages
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}