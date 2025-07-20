'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { TooltipProvider } from '@/components/ui/tooltip';

// Real WebSocket implementation
import { useAuth } from '@/lib/hooks/use-auth';
import { useWebSocket, useRealTimeMessages, useTypingIndicator } from '@/lib/hooks/use-websocket';

import ConversationSidebar from './conversation-sidebar';
import ChatView from './chat-view';
import CreateGroupDialog from './create-group-dialog';
import { Group, Message, Employee } from './types';
import { fetchGroups, fetchMessages, fetchEmployees } from './api';
import { cn } from '@/lib/utils';

export default function MessagingLayout() {
  const queryClient = useQueryClient();
  const auth = useAuth();
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isMobileChatVisible, setIsMobileChatVisible] = useState(false);

  // Real WebSocket connection
  const token = typeof window !== 'undefined' ? localStorage.getItem('sessionToken') || 'test-token' : 'test-token';
  const currentUserId = auth.employee?.empCode || '';

  // WebSocket hooks for real-time functionality
  const { status, isConnected } = useWebSocket(currentUserId);
  const { messages: realtimeMessages, sendMessage: sendRealtimeMessage } = useRealTimeMessages(selectedGroupId?.toString() || '');
  const { typingUsers, sendTypingIndicator } = useTypingIndicator(selectedGroupId?.toString() || '', currentUserId);

  const connectionStatus = { connected: isConnected, authenticated: true };

  // Store current user ID for notifications
  useEffect(() => {
    if (currentUserId && typeof window !== 'undefined') {
      localStorage.setItem('currentUserId', currentUserId);
    }
  }, [currentUserId]);

  // Log connection status changes
  useEffect(() => {
    console.log('🔌 WebSocket connection status:', status, 'Connected:', isConnected);
  }, [status, isConnected]);

  // Log when group selection changes
  useEffect(() => {
    if (selectedGroupId) {
      console.log('📨 Joined conversation:', selectedGroupId);
    }
  }, [selectedGroupId]);

  // --- DATA FETCHING ---
  const { data: groups = [], isLoading: groupsLoading } = useQuery<Group[]>({
    queryKey: ['messaging', 'groups'],
    queryFn: () => fetchGroups(token),
    enabled: !!token,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ['messaging', 'groups', selectedGroupId, 'messages'],
    queryFn: () => fetchMessages(selectedGroupId!, token),
    enabled: !!token && !!selectedGroupId,
  });

  const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: () => fetchEmployees(token),
    enabled: showCreateDialog && !!token,
  });

  // --- MUTATIONS ---
  const sendMessageMutation = useMutation({
    mutationFn: async ({ groupId, content }: { groupId: number; content: string }) => {
        const response = await fetch(`/api/messaging/groups/${groupId}/messages`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ content }),
        });
        if (!response.ok) throw new Error('Failed to send message');
        return response.json();
    },
    onMutate: async ({ groupId, content }) => {
      console.log('📤 Sending message optimistically:', { groupId, content });
      
      // Cancel any outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ['messaging', 'groups', groupId, 'messages'] });

      // Get previous messages
      const previousMessages = queryClient.getQueryData(['messaging', 'groups', groupId, 'messages']) || [];
      console.log('📋 Previous messages count:', (previousMessages as any[]).length);

      // Create optimistic message with unique temp ID
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const optimisticMessage = {
        id: tempId,
        text: content,
        timestamp: new Date().toISOString(),
        sender: {
          id: currentUserId,
          name: auth.employee?.name || 'You',
        },
        status: 'sending' as const,
      };

      // Optimistically update messages
      queryClient.setQueryData(['messaging', 'groups', groupId, 'messages'], (old: any) => {
        const newMessages = [...(old || []), optimisticMessage];
        console.log('✅ Updated messages optimistically, new count:', newMessages.length);
        return newMessages;
      });

      return { previousMessages, optimisticMessage, tempId };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          ['messaging', 'groups', variables.groupId, 'messages'], 
          context.previousMessages
        );
      }
    },
    onSuccess: (data, variables) => {
      console.log('✅ Message sent successfully:', data);
      
      // Update the optimistic message with real data
      queryClient.setQueryData(['messaging', 'groups', variables.groupId, 'messages'], (old: any) => {
        const messages = old || [];
        const realMessage = {
          id: data.id.toString(),
          text: data.content,
          timestamp: data.createdAt,
          sender: {
            id: data.senderId,
            name: data.senderName || auth.employee?.name || 'You',
          },
          status: 'delivered' as const,
        };
        
        // First, remove any temp messages with the same content
        const withoutTemp = messages.filter((msg: any) => 
          !(msg.id.startsWith('temp-') && msg.text === data.content)
        );
        
        // Check if real message already exists (from socket)
        const realExists = withoutTemp.some((msg: any) => msg.id === realMessage.id);
        
        if (realExists) {
          console.log('🔄 Real message already exists (from socket), keeping it');
          return withoutTemp;
        }
        
        // Add the real message
        console.log('🆕 Adding real message to replace optimistic one');
        return [...withoutTemp, realMessage];
      });
      
      // Don't invalidate queries immediately - let the socket handle updates for better UX
      // queryClient.invalidateQueries({ queryKey: ['messaging', 'groups'] });
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; memberIds: string[] }) => {
      const response = await fetch('/api/messaging/groups', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create group');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messaging', 'groups'] });
      setShowCreateDialog(false);
    },
  });

  // --- HANDLERS ---
  const handleGroupSelect = (group: Group) => {
    setSelectedGroupId(group.id);
    setIsMobileChatVisible(true);
  };

  const handleSendMessage = (content: string) => {
    if (selectedGroupId) {
      // Send via API which will handle persistence and broadcast via WebSocket
      sendMessageMutation.mutate({ groupId: selectedGroupId, content });
      
      // Also send via WebSocket for real-time delivery
      if (isConnected) {
        console.log('📤 Sending message via WebSocket:', content);
        sendRealtimeMessage(content, currentUserId);
      } else {
        console.warn('⚠️ WebSocket not connected, message sent via API only');
      }
    }
  };

  const handleCreateGroup = (data: { name: string; description?: string; memberIds: string[] }) => {
    createGroupMutation.mutate(data);
  };

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  return (
    <TooltipProvider>
      <div className="h-full flex bg-background overflow-hidden">
        {/* Desktop Sidebar & Mobile View */}
        <div className={cn("w-full md:w-[340px] md:flex flex-col border-r h-full overflow-hidden", 
          isMobileChatVisible ? "hidden md:flex" : "flex"
        )}>
          <ConversationSidebar
            groups={groups}
            selectedGroupId={selectedGroupId}
            connectionStatus={connectionStatus}
            onGroupSelect={handleGroupSelect}
            onCreateGroup={() => setShowCreateDialog(true)}
            isLoading={groupsLoading}
          />
        </div>
        
        {/* Chat View Area */}
        <div className={cn("w-full flex-1 h-full", 
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
                className="w-full h-full"
              >
                <ChatView
                  group={selectedGroup}
                  messages={messages}
                  currentUserId={currentUserId}
                  onSendMessage={handleSendMessage}
                  isLoading={messagesLoading && !messages.length}
                  onBack={() => setIsMobileChatVisible(false)}
                  connectionStatus={connectionStatus}
                  typingUsers={Array.from(typingUsers)}
                  onStartTyping={() => sendTypingIndicator(true)}
                  onStopTyping={() => sendTypingIndicator(false)}
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
      <CreateGroupDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        employees={employees}
        onCreateGroup={handleCreateGroup}
        isCreating={createGroupMutation.isPending}
        isLoadingEmployees={employeesLoading}
      />
    </TooltipProvider>
  );
}