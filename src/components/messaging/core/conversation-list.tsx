'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Search, Plus, MoreHorizontal, Users, Bell, BellOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  currentUserId: string;
  onConversationSelect: (conversation: Conversation) => void;
  onCreateGroup: () => void;
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export function ConversationList({
  conversations,
  selectedConversationId,
  currentUserId,
  onConversationSelect,
  onCreateGroup,
  onSearch,
  isLoading = false
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.avatar) {
      return conversation.avatar;
    }
    return undefined;
  };

  const getConversationInitials = (conversation: Conversation) => {
    return conversation.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatLastMessageTime = (timestamp: Date) => {
    return formatDistanceToNow(timestamp, { addSuffix: true });
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <ConversationListHeader onCreateGroup={onCreateGroup} />
        <ConversationListSkeleton />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <ConversationListHeader onCreateGroup={onCreateGroup} />
      
      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Conversations */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {conversations.length === 0 ? (
            <EmptyConversationState onCreateGroup={onCreateGroup} />
          ) : (
            conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isSelected={conversation.id === selectedConversationId}
                onClick={() => onConversationSelect(conversation)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function ConversationListHeader({ onCreateGroup }: { onCreateGroup: () => void }) {
  return (
    <div className="p-4 border-b bg-background">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Messages</h1>
          <p className="text-sm text-muted-foreground">Stay connected with your team</p>
        </div>
        <Button onClick={onCreateGroup} size="icon" variant="outline">
          <Plus className="h-4 w-4" />
          <span className="sr-only">Create new group</span>
        </Button>
      </div>
    </div>
  );
}

function ConversationItem({ 
  conversation, 
  isSelected, 
  onClick 
}: { 
  conversation: Conversation; 
  isSelected: boolean; 
  onClick: () => void; 
}) {
  return (
    <Card 
      className={cn(
        "mb-2 cursor-pointer transition-all duration-200 hover:shadow-md",
        isSelected && "ring-2 ring-primary bg-primary/5"
      )}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center space-x-3">
          {/* Avatar with online indicator */}
                     <div className="relative">
             <Avatar className="h-12 w-12">
               <AvatarImage src={conversation.avatar} />
               <AvatarFallback className="bg-primary/10 text-primary font-medium">
                 {conversation.name
                   .split(' ')
                   .map(n => n[0])
                   .join('')
                   .toUpperCase()
                   .slice(0, 2)}
               </AvatarFallback>
             </Avatar>
            {conversation.type === 'direct' && conversation.isOnline && (
              <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-background rounded-full" />
            )}
            {conversation.type === 'group' && (
              <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-primary border-2 border-background rounded-full flex items-center justify-center">
                <Users className="h-2 w-2 text-primary-foreground" />
              </div>
            )}
          </div>

          {/* Conversation info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-sm truncate">
                  {conversation.name}
                </h3>
                {conversation.isMuted && (
                  <BellOff className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
                             {conversation.lastMessage && (
                 <span className="text-xs text-muted-foreground">
                   {formatDistanceToNow(conversation.lastMessage.timestamp, { addSuffix: true })}
                 </span>
               )}
            </div>

            {/* Last message */}
            {conversation.lastMessage ? (
              <div className="flex items-center justify-between mt-1">
                <p className="text-sm text-muted-foreground truncate">
                  {conversation.type === 'group' && (
                    <span className="font-medium">
                      {conversation.lastMessage.senderName}: 
                    </span>
                  )}
                  {conversation.lastMessage.content}
                </p>
                {conversation.unreadCount > 0 && (
                  <Badge variant="default" className="ml-2 px-2 py-1 text-xs">
                    {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                  </Badge>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between mt-1">
                <p className="text-sm text-muted-foreground italic">
                  {conversation.type === 'group' 
                    ? `${conversation.members} members` 
                    : 'No messages yet'
                  }
                </p>
                {conversation.unreadCount > 0 && (
                  <Badge variant="default" className="ml-2 px-2 py-1 text-xs">
                    {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* More options */}
          <Button size="icon" variant="ghost" className="h-8 w-8 opacity-0 group-hover:opacity-100">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">More options</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyConversationState({ onCreateGroup }: { onCreateGroup: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        <Users className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-medium text-lg mb-2">No conversations yet</h3>
      <p className="text-muted-foreground text-sm mb-4 max-w-sm">
        Start connecting with your team by creating a group or sending a direct message.
      </p>
      <Button onClick={onCreateGroup} className="gap-2">
        <Plus className="h-4 w-4" />
        Create Your First Group
      </Button>
    </div>
  );
}

function ConversationListSkeleton() {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="p-3">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-muted rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
            </div>
            <div className="h-3 w-8 bg-muted rounded animate-pulse" />
          </div>
        </Card>
      ))}
    </div>
  );
} 