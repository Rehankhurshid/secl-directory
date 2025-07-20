'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Search, Plus, MessageSquareText } from 'lucide-react';
import { Group, ConnectionStatus } from './types';
import { getInitials, formatTimeAgo } from './utils';
import { cn } from '@/lib/utils';

interface ConversationSidebarProps {
  groups: Group[];
  selectedGroupId: number | null;
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
        "flex items-center w-full text-left p-3 rounded-lg transition-colors gap-3",
        isSelected ? "bg-muted" : "hover:bg-muted/50"
      )}
    >
      <Avatar className="h-12 w-12 flex-shrink-0">
        <AvatarFallback className={cn("text-base", isSelected ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20")}>
          {getInitials(group.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-sm truncate">{group.name}</h3>
          {group.lastMessageTime && (
            <Tooltip>
              <TooltipTrigger asChild>
                <time className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                  {formatTimeAgo(new Date(group.lastMessageTime))}
                </time>
              </TooltipTrigger>
              <TooltipContent>
                <p>{new Date(group.lastMessageTime).toLocaleString()}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="flex justify-between items-start mt-1">
          <p className="text-sm text-muted-foreground truncate pr-2">
            {group.lastMessage}
          </p>
          {group.unreadCount > 0 && (
            <Badge variant="default" className="h-5 w-5 p-0 flex items-center justify-center rounded-full">
              {group.unreadCount > 9 ? '9+' : group.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}

function SidebarSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {Array.from({ length: 8 }).map((_, i) => (
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    const handleViewportChange = () => {
      if (window.visualViewport) {
        const height = window.innerHeight - window.visualViewport.height;
        setKeyboardHeight(height);
      }
    };

    window.visualViewport?.addEventListener('resize', handleViewportChange);
    return () => window.visualViewport?.removeEventListener('resize', handleViewportChange);
  }, []);

  // Keyboard shortcut for search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      <header className="p-4 border-b space-y-4 flex-shrink-0 bg-background">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Badge variant={connectionStatus.connected ? "default" : "destructive"} className="gap-1 px-2 py-0.5">
              <div className={cn("w-2 h-2 rounded-full", connectionStatus.connected ? "bg-green-400" : "bg-red-400")}></div>
              {connectionStatus.connected ? "Connected" : "Offline"}
            </Badge>
            <h2 className="text-lg font-bold">Messages</h2>
          </div>
          <Button onClick={onCreateGroup} size="icon" variant="ghost">
            <Plus className="h-5 w-5" />
            <span className="sr-only">Create Group</span>
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search (⌘K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClick={() => setCommandOpen(true)}
            className="pl-9 rounded-full cursor-pointer"
            readOnly
          />
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50">
        {isLoading ? (
          <SidebarSkeleton />
        ) : (
          <div className="p-4 space-y-1">
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
              </div>
            )}
          </div>
        )}
      </div>

      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Type to search groups..." />
        <CommandList>
          <CommandEmpty>No groups found.</CommandEmpty>
          <CommandGroup heading="Conversations">
            {groups.map((group) => (
              <CommandItem
                key={group.id}
                onSelect={() => {
                  onGroupSelect(group);
                  setCommandOpen(false);
                }}
              >
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarFallback className="text-xs">
                    {getInitials(group.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{group.name}</span>
                    {group.unreadCount > 0 && (
                      <Badge variant="default" className="ml-2">
                        {group.unreadCount}
                      </Badge>
                    )}
                  </div>
                  {group.lastMessage && (
                    <p className="text-sm text-muted-foreground truncate">
                      {group.lastMessage}
                    </p>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}