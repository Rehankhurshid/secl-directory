'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';

// Mock hooks and API functions - replace with your actual implementations
import { useAuth } from '@/lib/hooks/use-auth';
import { useSocketStore } from '@/lib/socket/client';

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

  // NOTE: Assuming useSocketStore and useAuth are implemented as in your original code
  const connectionStatus = { connected: true, authenticated: true };
  const token = typeof window !== 'undefined' ? localStorage.getItem('sessionToken') || 'test-token' : 'test-token';
  const currentUserId = auth.employee?.empCode || '';

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
    onSuccess: (data, variables) => {
      // Invalidate both groups and messages queries
      queryClient.invalidateQueries({ queryKey: ['messaging', 'groups'] });
      queryClient.invalidateQueries({ queryKey: ['messaging', 'groups', variables.groupId, 'messages'] });
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
      sendMessageMutation.mutate({ groupId: selectedGroupId, content });
    }
  };

  const handleCreateGroup = (data: { name: string; description?: string; memberIds: string[] }) => {
    createGroupMutation.mutate(data);
  };

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  return (
    <>
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
    </>
  );
}