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

async function fetchGroups(token: string): Promise<Group[]> {
  const response = await fetch('/api/messaging/groups', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch groups');
  }

  const data = await response.json();
  return data.map((group: any) => ({
    ...group,
    lastMessageTime: group.lastMessageTime ? new Date(group.lastMessageTime) : undefined,
  }));
}

async function fetchMessages(groupId: number, token: string): Promise<Message[]> {
  const response = await fetch(`/api/messaging/groups/${groupId}/messages`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch messages');
  }

  const data = await response.json();
  return data.map((msg: any) => ({
    id: msg.id.toString(),
    text: msg.content,
    timestamp: msg.createdAt,
    sender: {
      id: msg.senderId,
      name: msg.senderName || msg.senderId,
    },
    status: msg.status || 'delivered',
  }));
}

async function fetchEmployees(token: string): Promise<Employee[]> {
  const response = await fetch('/api/employees?limit=1000', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch employees');
  }

  const data = await response.json();
  return data.employees.map((emp: any) => ({
    id: emp.empCode,
    empCode: emp.empCode,
    name: emp.name,
    designation: emp.designation || 'Employee',
    department: emp.department || 'N/A',
    location: emp.location,
    profileImage: emp.profileImage,
  }));
}

export default function MessagingPage() {
  const router = useRouter();
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showChat, setShowChat] = useState(false);
  
  const { connect, disconnect, connected, authenticated, sendMessage: socketSendMessage, onNewMessage, markMessagesRead } = useSocketStore();
  // Show as connected for now (Socket.IO requires custom server)
  const connectionStatus = { connected: true, authenticated: true };

  const token = typeof window !== 'undefined' ? localStorage.getItem('sessionToken') || 'test-token' : null;

  // Initialize Socket.IO connection
  useEffect(() => {
    if (token) {
      // Enable Socket.IO for real-time messaging
      connect(token);
      
      return () => {
        disconnect();
      };
    }
    return undefined;
  }, [token, connect, disconnect]);

  // Listen for new messages
  useEffect(() => {
    const handleNewMessage = (socketMessage: any) => {
      // Transform socket message to match our format
      const message: Message = {
        id: socketMessage.id,
        text: socketMessage.content,
        timestamp: socketMessage.createdAt,
        sender: {
          id: socketMessage.senderId,
          name: socketMessage.senderName,
        },
        status: socketMessage.status || 'delivered',
      };
      
      // Invalidate messages query for the group
      queryClient.invalidateQueries({ 
        queryKey: ['messaging', 'groups', socketMessage.groupId, 'messages'] 
      });
      // Invalidate groups to update last message
      queryClient.invalidateQueries({ 
        queryKey: ['messaging', 'groups'] 
      });
    };

    onNewMessage(handleNewMessage);
  }, [onNewMessage, queryClient]);

  // Mark messages as read when viewing a group
  useEffect(() => {
    if (selectedGroupId && token) {
      // Call the API to mark messages as read
      fetch(`/api/messaging/groups/${selectedGroupId}/messages/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }).catch(console.error);
    }
  }, [selectedGroupId, token]);

  // Redirect if not authenticated
  if (!auth.isAuthenticated) {
    router.push('/login');
    return null;
  }

  // Fetch groups
  const { data: groups = [], isLoading: groupsLoading, isFetching: groupsFetching } = useQuery({
    queryKey: ['messaging', 'groups'],
    queryFn: () => fetchGroups(token!),
    enabled: !!token,
    refetchInterval: 60000, // Refetch every 60 seconds
    staleTime: 30000, // Consider data stale after 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  // Fetch messages for selected group
  const { data: messages = [], isLoading: messagesLoading, isFetching: messagesFetching } = useQuery({
    queryKey: ['messaging', 'groups', selectedGroupId, 'messages'],
    queryFn: () => fetchMessages(selectedGroupId!, token!),
    enabled: !!token && !!selectedGroupId,
    refetchInterval: false, // No automatic refetch for messages
    staleTime: Infinity, // Messages never go stale automatically
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Fetch employees for group creation
  const { data: employees = [], isLoading: employeesLoading, error: employeesError } = useQuery({
    queryKey: ['employees'],
    queryFn: () => fetchEmployees(token!),
    enabled: !!token && showCreateDialog,
  });

  // Log employee fetch status
  useEffect(() => {
    if (showCreateDialog && employeesError) {
      console.error('Error fetching employees:', employeesError);
    }
    if (showCreateDialog && employees.length > 0) {
      console.log('Employees loaded:', employees.length);
    }
  }, [showCreateDialog, employees, employeesError]);

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

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return response.json();
    },
    onSuccess: (newMessage) => {
      // Optimistically update the messages cache
      queryClient.setQueryData(
        ['messaging', 'groups', selectedGroupId, 'messages'],
        (oldMessages: Message[] = []) => [...oldMessages, {
          id: newMessage.id.toString(),
          text: newMessage.content,
          timestamp: newMessage.createdAt,
          sender: {
            id: newMessage.senderId,
            name: newMessage.senderName || auth.employee?.name || newMessage.senderId,
          },
          status: 'delivered',
        }]
      );
      // Update groups to refresh last message
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

      if (!response.ok) {
        const error = await response.json();
        console.error('Group creation failed:', error);
        throw new Error(error.details ? `${error.error}: ${error.details}` : error.error || 'Failed to create group');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messaging', 'groups'] });
      setShowCreateDialog(false);
    },
    onError: (error: Error) => {
      console.error('Error creating group:', error);
      alert(`Failed to create group: ${error.message}`);
    },
  });

  const handleGroupSelect = (group: Group) => {
    setSelectedGroupId(group.id);
    setShowChat(true);
  };

  const handleSendMessage = (content: string) => {
    if (selectedGroupId && connected) {
      // Send via Socket.IO for real-time delivery
      socketSendMessage(selectedGroupId, content);
      
      // Also send via API as fallback
      sendMessageMutation.mutate({ groupId: selectedGroupId, content });
    } else if (selectedGroupId) {
      // Fallback to API if not connected
      sendMessageMutation.mutate({ groupId: selectedGroupId, content });
    }
  };

  const handleCreateGroup = (data: { name: string; description?: string; memberIds: string[] }) => {
    createGroupMutation.mutate(data);
  };

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  // Mobile view: show either dashboard or chat
  if (typeof window !== 'undefined' && window.innerWidth < 768 && showChat && selectedGroup) {
    return (
      <NotificationProvider vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''}>
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
    <NotificationProvider vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''}>
      <div className="h-[calc(100vh-64px)] md:h-[calc(100vh-57px)] flex flex-col overflow-hidden" style={{ overscrollBehavior: 'none' }}>
        <div className="flex-1 flex">
          {/* Groups List */}
          <div className="w-full md:w-1/3 h-full">
            <MessagingDashboard
              groups={groups}
              selectedGroupId={selectedGroupId || 0}
              connectionStatus={connectionStatus}
              onGroupSelect={handleGroupSelect}
              onCreateGroup={() => setShowCreateDialog(true)}
              currentUserId={auth.employee?.empCode || ''}
              isLoading={groupsLoading}
            />
          </div>

          {/* Chat Area - Desktop only */}
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

        {/* Create Group Dialog */}
        <CreateGroupDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          employees={employees}
          onCreateGroup={handleCreateGroup}
          isCreating={createGroupMutation.isPending}
        />
        
        {/* PWA Notification Permission Banner */}
        <NotificationPermissionBanner />
      </div>
    </NotificationProvider>
  );
}