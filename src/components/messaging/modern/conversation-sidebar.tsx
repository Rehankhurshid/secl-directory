'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Plus, MessageSquareText } from 'lucide-react';
import { getInitials, formatTimeAgo } from '@/lib/messaging/utils';
import { cn } from '@/lib/utils';

interface Group {
  id: string;
  name: string;
  memberCount?: number;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  type: 'group' | 'direct';
}

interface ConnectionStatus {
  connected: boolean;
  authenticated: boolean;
}

interface ConversationSidebarProps {
  groups: Group[];
  selectedGroupId: string | null;
  connectionStatus: ConnectionStatus;
  onGroupSelect: (group: Group) => void;
  onCreateGroup: () => void;
  isLoading?: boolean;
}

function GroupCard({ group, isSelected, onClick }: { group: Group; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center w-full text-left p-3 rounded-lg transition-all duration-200 gap-3 hover:bg-muted/60",
        isSelected && "bg-muted border border-border"
      )}
    >
      <Avatar className="h-12 w-12 flex-shrink-0">
        <AvatarFallback className={cn(
          "text-base font-medium",
          isSelected ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20"
        )}>
          {getInitials(group.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-sm truncate">{group.name}</h3>
          {group.lastMessageTime && (
            <time className="text-xs text-muted-foreground flex-shrink-0 ml-2">
              {formatTimeAgo(group.lastMessageTime)}
            </time>
          )}
        </div>
        <div className="flex justify-between items-start mt-1">
          <p className="text-sm text-muted-foreground truncate pr-2">
            {group.lastMessage || 'No messages yet'}
          </p>
          {group.unreadCount > 0 && (
            <div className="bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
              {group.unreadCount > 9 ? '9+' : group.unreadCount}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function SidebarSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/5" />
            </div>
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ConversationSidebar({
  groups, selectedGroupId, connectionStatus, onGroupSelect, onCreateGroup, isLoading = false
}: ConversationSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-background border-r">
      <header className="p-4 border-b space-y-4 sticky top-0 bg-background z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2.5 h-2.5 rounded-full transition-colors",
              connectionStatus.connected ? "bg-green-500" : "bg-red-500"
            )}></div>
            <h2 className="text-lg font-bold">Messages</h2>
          </div>
          <Button onClick={onCreateGroup} size="icon" variant="ghost" className="h-8 w-8">
            <Plus className="h-4 w-4" />
            <span className="sr-only">Create Group</span>
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-full bg-muted/50 border-none focus-visible:ring-1"
          />
        </div>
      </header>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <SidebarSkeleton />
        ) : (
          <div className="p-2 space-y-1">
            {filteredGroups.length > 0 ? (
              filteredGroups.map(group => (
                <GroupCard
                  key={group.id}
                  group={group}
                  isSelected={selectedGroupId === group.id}
                  onClick={() => onGroupSelect(group)}
                />
              ))
            ) : (
              <div className="text-center py-16 px-4">
                <MessageSquareText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No Conversations</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {searchQuery ? "No groups match your search." : "Create a new group to start chatting."}
                </p>
                {!searchQuery && (
                  <Button onClick={onCreateGroup} className="mt-4" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Group
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
} 