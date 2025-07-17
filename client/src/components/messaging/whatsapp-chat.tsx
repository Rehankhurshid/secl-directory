import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, Send, Users, Phone, Video, MoreVertical, 
  Check, CheckCheck, Clock, Mic, Paperclip, Smile, Edit, Trash2, UserPlus
} from 'lucide-react';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import type { Group, Message, Employee } from '@shared/schema';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';

interface WhatsAppChatProps {
  group: Group;
  onBack: () => void;
  currentUser: Employee;
}

export function WhatsAppChat({ group, onBack, currentUser }: WhatsAppChatProps) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch group messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/groups', group.id, 'messages'],
    queryFn: () => apiRequest(`/api/groups/${group.id}/messages`),
    refetchInterval: 2000, // More frequent updates for chat
  });

  // Fetch group members
  const { data: members = [] } = useQuery({
    queryKey: ['/api/groups', group.id, 'members'],
    queryFn: () => apiRequest(`/api/groups/${group.id}/members`),
  });

  // Debug messages structure
  console.log('Messages from API:', messages);
  console.log('Current user:', currentUser);
  console.log('Members:', members);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (messageText: string) => 
      apiRequest(`/api/groups/${group.id}/messages`, {
        method: 'POST',
        body: { content: messageText },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups', group.id, 'messages'] });
      setMessage('');
      setIsTyping(false);
      scrollToBottom();
    },
    onError: (error) => {
      toast({
        title: "Message failed",
        description: "Tap to retry",
        variant: "destructive",
      });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark messages as read when component mounts
  useEffect(() => {
    const markMessagesRead = async () => {
      try {
        await apiRequest(`/api/groups/${group.id}/read`, {
          method: 'POST',
        });
      } catch (error) {
        console.error('Failed to mark messages as read:', error);
      }
    };
    
    markMessagesRead();
  }, [group.id]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = () => {
    if (message.trim()) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM dd, HH:mm');
    }
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const grouped: { [key: string]: Message[] } = {};
    
    // Handle both array and object responses
    const messageArray = Array.isArray(messages) ? messages : [];
    
    // Sort messages by createdAt in ascending order (oldest first)
    const sortedMessages = [...messageArray].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    sortedMessages.forEach(msg => {
      const date = new Date(msg.createdAt);
      let dateKey: string;
      
      if (isToday(date)) {
        dateKey = 'Today';
      } else if (isYesterday(date)) {
        dateKey = 'Yesterday';
      } else {
        dateKey = format(date, 'MMM dd, yyyy');
      }
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(msg);
    });
    
    return grouped;
  };

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">{group.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {members.length} member{members.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="p-2" onClick={() => setShowEditDrawer(true)}>
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Chat Background */}
      <div className="flex-1 relative bg-gray-50 dark:bg-gray-800 overflow-hidden">
        {/* Messages */}
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {Object.entries(groupedMessages).map(([dateKey, dayMessages]) => (
              <div key={dateKey}>
                {/* Date separator */}
                <div className="flex justify-center my-4">
                  <div className="bg-white dark:bg-gray-700 px-3 py-1 rounded-full text-xs text-gray-500 dark:text-gray-400 shadow-sm">
                    {dateKey}
                  </div>
                </div>
                
                {/* Messages for this date */}
                {dayMessages.map((msg, index) => {
                  const isOwnMessage = msg.senderId === currentUser.employeeId;
                  const previousMsg = dayMessages[index - 1];
                  const nextMsg = dayMessages[index + 1];
                  
                  const isFirstInGroup = !previousMsg || previousMsg.senderId !== msg.senderId;
                  const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;
                  
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-1`}
                    >
                      <div
                        className={`max-w-[75%] ${
                          isOwnMessage 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                        } rounded-2xl px-4 py-2 shadow-sm relative ${
                          isFirstInGroup && !isOwnMessage ? 'rounded-tl-md' : ''
                        } ${
                          isLastInGroup && !isOwnMessage ? 'rounded-bl-md' : ''
                        } ${
                          isFirstInGroup && isOwnMessage ? 'rounded-tr-md' : ''
                        } ${
                          isLastInGroup && isOwnMessage ? 'rounded-br-md' : ''
                        }`}
                      >
                        {/* Sender name for group messages */}
                        {!isOwnMessage && isFirstInGroup && (
                          <div className="text-xs font-semibold text-blue-500 dark:text-blue-400 mb-1">
                            {members.find(m => m.employeeId === msg.senderId)?.name || msg.senderId}
                          </div>
                        )}
                        
                        {/* Message content */}
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">
                          {msg.content || msg.message}
                        </div>
                        
                        {/* Message time and status */}
                        <div className={`flex items-center justify-end mt-1 space-x-1 ${
                          isOwnMessage ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          <span className="text-xs">
                            {formatMessageTime(msg.createdAt)}
                          </span>
                          {isOwnMessage && (
                            <CheckCheck className="w-3 h-3" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-200 dark:bg-gray-600 rounded-2xl px-4 py-2 max-w-[75%]">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Message Input */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t">
        <div className="flex items-center space-x-2">

          
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="rounded-full border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
              disabled={sendMessageMutation.isPending}
            />

          </div>
          
          {message.trim() ? (
            <Button
              onClick={handleSendMessage}
              disabled={sendMessageMutation.isPending}
              className="rounded-full w-10 h-10 p-0 bg-blue-500 hover:bg-blue-600"
            >
              <Send className="w-4 h-4" />
            </Button>
          ) : null}
        </div>
      </div>

      {/* Group Edit Drawer */}
      <Drawer open={showEditDrawer} onOpenChange={setShowEditDrawer}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Group Settings</DrawerTitle>
            <DrawerDescription>Manage group members and settings</DrawerDescription>
          </DrawerHeader>
          
          <div className="p-4 space-y-4">
            {/* Group Info */}
            <div className="space-y-2">
              <h3 className="font-semibold">Group Information</h3>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="font-medium">{group.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{group.description}</p>
              </div>
            </div>

            {/* Members List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Members ({members.length})</h3>
                <Button variant="outline" size="sm">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
              </div>
              
              <div className="max-h-60 overflow-y-auto space-y-2">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{member.name}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{member.designation}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {member.grade}
                      </Badge>
                      {member.employeeId !== currentUser.employeeId && (
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2 pt-4">
              <Button variant="outline" className="flex-1">
                <Edit className="w-4 h-4 mr-2" />
                Edit Group
              </Button>
              <Button variant="outline" className="flex-1 text-red-500 hover:text-red-700">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Group
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}