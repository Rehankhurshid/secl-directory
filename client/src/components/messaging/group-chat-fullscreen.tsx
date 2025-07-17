import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, Send, Users, MoreVertical, Phone, Mail, 
  User, Clock, CheckCircle2, Circle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import type { Group, Message, Employee } from '@shared/schema';

interface GroupChatFullscreenProps {
  group: Group;
  onBack: () => void;
  currentUser: Employee;
}

export function GroupChatFullscreen({ group, onBack, currentUser }: GroupChatFullscreenProps) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Set up WebSocket listener for real-time updates
  useEffect(() => {
    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_message' && data.data?.groupId === group.id) {
          // Invalidate messages query to trigger refetch
          queryClient.invalidateQueries({ queryKey: ['/api/groups', group.id, 'messages'] });
        }
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    // Listen to WebSocket messages from the parent component
    const ws = (window as any).messagingWebSocket;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.addEventListener('message', handleWebSocketMessage);
    }

    return () => {
      if (ws) {
        ws.removeEventListener('message', handleWebSocketMessage);
      }
    };
  }, [group.id, queryClient]);

  // Fetch group messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/groups', group.id, 'messages'],
    queryFn: () => apiRequest(`/api/groups/${group.id}/messages`),
    refetchInterval: 2000, // Refetch every 2 seconds for real-time updates
    refetchOnWindowFocus: true,
  });

  // Fetch group members
  const { data: members = [] } = useQuery({
    queryKey: ['/api/groups', group.id, 'members'],
    queryFn: () => apiRequest(`/api/groups/${group.id}/members`),
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (messageText: string) => 
      apiRequest(`/api/groups/${group.id}/messages`, {
        method: 'POST',
        body: { content: messageText },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups', group.id, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications', 'unread-count'] });
      setMessage('');
      setIsTyping(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when component mounts
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    setIsTyping(e.target.value.length > 0);
  };

  const getMemberById = (employeeId: string) => {
    return members.find(member => member.employeeId === employeeId);
  };

  const getMessageTime = (createdAt: string) => {
    return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .substring(0, 2);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-card">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-semibold">{group.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {members.length} members
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              {members.length} members
            </Badge>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {messagesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading messages...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No messages yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Start the conversation!</p>
                </div>
              </div>
            ) : (
              messages.map((msg: Message) => {
                const sender = getMemberById(msg.senderId);
                const isOwnMessage = msg.senderId === currentUser.employeeId;
                const initials = sender ? getInitials(sender.name) : msg.senderId.substring(0, 2);
                
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-3 max-w-[70%] ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-primary-foreground">{initials}</span>
                      </div>
                      <div className={`space-y-1 ${isOwnMessage ? 'text-right' : ''}`}>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">
                            {sender?.name || msg.senderId}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {getMessageTime(msg.createdAt)}
                          </span>
                        </div>
                        <Card className={`${isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          <CardContent className="p-3">
                            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Message Input - Sticky at bottom */}
      <div className="flex-shrink-0 border-t border-border bg-card">
        <div className="p-4">
          <div className="flex items-center space-x-2">
            <Input
              ref={inputRef}
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1"
              disabled={sendMessageMutation.isPending}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || sendMessageMutation.isPending}
              size="sm"
              className="px-3"
            >
              {sendMessageMutation.isPending ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          {isTyping && (
            <div className="mt-2 flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-xs text-muted-foreground">You are typing...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}