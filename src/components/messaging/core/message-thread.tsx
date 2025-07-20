'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  CheckCheck, 
  Clock, 
  AlertCircle, 
  Reply,
  MoreHorizontal,
  Copy,
  Trash2,
  Edit,
  Heart,
  ThumbsUp,
  Smile,
  ArrowDown
} from 'lucide-react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  timestamp: Date;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  type: 'text' | 'image' | 'file' | 'audio';
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  };
  reactions?: {
    emoji: string;
    count: number;
    users: string[];
  }[];
  isEdited?: boolean;
  isDeleted?: boolean;
}

interface MessageThreadProps {
  messages: Message[];
  currentUserId: string;
  conversationName: string;
  isLoading?: boolean;
  onReply?: (message: Message) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function MessageThread({
  messages,
  currentUserId,
  conversationName,
  isLoading = false,
  onReply,
  onReact,
  onEdit,
  onDelete,
  onLoadMore,
  hasMore = false
}: MessageThreadProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  // Handle scroll to detect if user scrolled up
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    setAutoScroll(isNearBottom);
    setShowScrollToBottom(!isNearBottom);

    // Load more messages when near top
    if (scrollTop < 100 && hasMore && onLoadMore) {
      onLoadMore();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setAutoScroll(true);
    setShowScrollToBottom(false);
  };

  if (isLoading && messages.length === 0) {
    return <MessageThreadSkeleton />;
  }

  return (
    <div className="relative h-full flex flex-col bg-background">
      {/* Messages */}
      <ScrollArea 
        className="flex-1 px-4"
        onScrollCapture={handleScroll}
        ref={scrollAreaRef}
      >
        <div className="py-4 space-y-1">
          {/* Load more indicator */}
          {hasMore && (
            <div className="text-center py-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onLoadMore}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Load older messages'}
              </Button>
            </div>
          )}

          {/* Group messages by date and sender */}
          {groupMessagesByDate(messages).map((dateGroup, dateIndex) => (
            <div key={dateGroup.date}>
              <DateSeparator date={new Date(dateGroup.date)} />
              {groupConsecutiveMessages(dateGroup.messages).map((messageGroup, groupIndex) => (
                <MessageGroup
                  key={`${dateIndex}-${groupIndex}`}
                  messages={messageGroup}
                  currentUserId={currentUserId}
                  isLastGroup={dateIndex === groupMessagesByDate(messages).length - 1 && 
                              groupIndex === groupConsecutiveMessages(dateGroup.messages).length - 1}
                  onReply={onReply}
                  onReact={onReact}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          ))}

          {/* Empty state */}
          {messages.length === 0 && (
            <EmptyMessageState conversationName={conversationName} />
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Scroll to bottom button */}
      {showScrollToBottom && (
        <Button
          size="icon"
          variant="secondary"
          className="absolute bottom-4 right-4 rounded-full shadow-lg z-10"
          onClick={scrollToBottom}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function MessageGroup({ 
  messages, 
  currentUserId, 
  isLastGroup,
  onReply,
  onReact,
  onEdit,
  onDelete
}: {
  messages: Message[];
  currentUserId: string;
  isLastGroup: boolean;
  onReply?: (message: Message) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
}) {
  if (messages.length === 0) return null;
  
  const firstMessage = messages[0];
  if (!firstMessage) return null;
  
  const isOwn = firstMessage.senderId === currentUserId;
  const showAvatar = !isOwn && messages.length > 0;

  return (
    <div className={cn(
      "flex gap-2 mb-6",
      isOwn ? "justify-end" : "justify-start"
    )}>
      {/* Avatar for others' messages */}
      {showAvatar && (
        <Avatar className="h-8 w-8 mt-auto">
          <AvatarImage src={firstMessage.senderAvatar} />
          <AvatarFallback className="text-xs">
            {firstMessage.senderName.split(' ').map(n => n[0]).join('').toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Messages */}
      <div className={cn(
        "flex flex-col space-y-1 max-w-[80%] md:max-w-[60%]",
        isOwn && "items-end"
      )}>
        {/* Sender name for group messages */}
        {!isOwn && (
          <span className="text-xs text-muted-foreground ml-3 mb-1">
            {firstMessage.senderName}
          </span>
        )}

        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={isOwn}
            isFirst={index === 0}
            isLast={index === messages.length - 1}
            showStatus={isOwn && index === messages.length - 1}
            onReply={onReply}
            onReact={onReact}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  isOwn,
  isFirst,
  isLast,
  showStatus,
  onReply,
  onReact,
  onEdit,
  onDelete
}: {
  message: Message;
  isOwn: boolean;
  isFirst: boolean;
  isLast: boolean;
  showStatus: boolean;
  onReply?: (message: Message) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);

  if (message.isDeleted) {
    return (
      <div className={cn(
        "flex items-center gap-2 p-3 rounded-2xl",
        isOwn ? "bg-muted/30 text-muted-foreground" : "bg-muted/50 text-muted-foreground",
        isFirst && !isOwn && "rounded-tl-md",
        isFirst && isOwn && "rounded-tr-md",
        isLast && !isOwn && "rounded-bl-md",
        isLast && isOwn && "rounded-br-md"
      )}>
        <Trash2 className="h-4 w-4" />
        <span className="text-sm italic">This message was deleted</span>
      </div>
    );
  }

  return (
    <div 
      className="group relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Reply preview */}
      {message.replyTo && (
        <div className={cn(
          "mb-1 p-2 rounded-lg border-l-4 bg-muted/30",
          isOwn ? "ml-8" : "mr-8"
        )}>
          <p className="text-xs font-medium text-muted-foreground">
            {message.replyTo.senderName}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {message.replyTo.content}
          </p>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Quick reactions (shown on hover) */}
        {showActions && !isOwn && (
          <div className="flex gap-1 mb-2">
            {['👍', '❤️', '😂', '😮', '😢', '😡'].map((emoji) => (
              <Button
                key={emoji}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-background/80"
                onClick={() => onReact?.(message.id, emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        )}

        {/* Message bubble */}
        <Card className={cn(
          "relative max-w-full transition-all duration-200",
          isOwn 
            ? "bg-primary text-primary-foreground" 
            : "bg-background border",
          isFirst && !isOwn && "rounded-tl-md",
          isFirst && isOwn && "rounded-tr-md",
          isLast && !isOwn && "rounded-bl-md",
          isLast && isOwn && "rounded-br-md",
          "rounded-2xl"
        )}>
          <div className="p-3">
            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
              {message.content}
            </p>
            
            <div className="flex items-center justify-between mt-2 gap-2">
              <div className="flex items-center gap-1 text-xs opacity-70">
                <span>{format(message.timestamp, 'HH:mm')}</span>
                {message.isEdited && (
                  <span className="italic">(edited)</span>
                )}
              </div>
              
              {showStatus && <MessageStatusIcon status={message.status} />}
            </div>
          </div>

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 p-2 pt-0">
              {message.reactions.map((reaction) => (
                <Badge
                  key={reaction.emoji}
                  variant="secondary"
                  className="text-xs px-2 py-1 cursor-pointer hover:bg-secondary/80"
                  onClick={() => onReact?.(message.id, reaction.emoji)}
                >
                  {reaction.emoji} {reaction.count}
                </Badge>
              ))}
            </div>
          )}
        </Card>

        {/* Actions menu */}
        {showActions && (
                     <MessageActions
             message={message}
             isOwn={isOwn}
             onReply={onReply || undefined}
             onEdit={onEdit || undefined}
             onDelete={onDelete || undefined}
           />
        )}

        {/* Quick reactions for own messages */}
        {showActions && isOwn && (
          <div className="flex gap-1 mb-2">
            {['👍', '❤️', '😂', '😮', '😢', '😡'].map((emoji) => (
              <Button
                key={emoji}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-background/80"
                onClick={() => onReact?.(message.id, emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MessageActions({
  message,
  isOwn,
  onReply,
  onEdit,
  onDelete
}: {
  message: Message;
  isOwn: boolean;
  onReply?: (message: Message) => void;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
}) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onReply?.(message)}>
          <Reply className="mr-2 h-4 w-4" />
          Reply
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyToClipboard}>
          <Copy className="mr-2 h-4 w-4" />
          Copy text
        </DropdownMenuItem>
        {isOwn && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit?.(message.id)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete?.(message.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MessageStatusIcon({ status }: { status: Message['status'] }) {
  switch (status) {
    case 'pending':
      return <Clock className="h-3 w-3" />;
    case 'sent':
      return <Check className="h-3 w-3" />;
    case 'delivered':
      return <CheckCheck className="h-3 w-3" />;
    case 'read':
      return <CheckCheck className="h-3 w-3 text-blue-400" />;
    case 'failed':
      return <AlertCircle className="h-3 w-3 text-destructive" />;
    default:
      return null;
  }
}

function DateSeparator({ date }: { date: Date }) {
  const formatDate = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  return (
    <div className="flex items-center justify-center my-6">
      <div className="bg-muted px-3 py-1 rounded-full">
        <span className="text-xs text-muted-foreground font-medium">
          {formatDate(date)}
        </span>
      </div>
    </div>
  );
}

function EmptyMessageState({ conversationName }: { conversationName: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-96 text-center">
      <div className="rounded-full bg-muted p-8 mb-4">
        <Smile className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="font-medium text-lg mb-2">
        Welcome to {conversationName}
      </h3>
      <p className="text-muted-foreground text-sm max-w-sm">
        This is the beginning of your conversation. Send a message to get started!
      </p>
    </div>
  );
}

function MessageThreadSkeleton() {
  return (
    <div className="h-full p-4 space-y-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={cn(
          "flex gap-3",
          i % 2 === 0 ? "justify-start" : "justify-end"
        )}>
          {i % 2 === 0 && (
            <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
          )}
          <div className={cn(
            "space-y-2 max-w-xs",
            i % 2 === 1 && "items-end"
          )}>
            <div className="h-16 bg-muted rounded-2xl animate-pulse" />
            <div className="h-3 w-12 bg-muted rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper functions
function groupMessagesByDate(messages: Message[]) {
  const groups: { date: string; messages: Message[] }[] = [];
  
  messages.forEach(message => {
    const dateStr = format(message.timestamp, 'yyyy-MM-dd');
    const existingGroup = groups.find(g => g.date === dateStr);
    
    if (existingGroup) {
      existingGroup.messages.push(message);
    } else {
      groups.push({ date: dateStr, messages: [message] });
    }
  });
  
  return groups;
}

function groupConsecutiveMessages(messages: Message[]) {
  const groups: Message[][] = [];
  let currentGroup: Message[] = [];
  
  messages.forEach((message, index) => {
    const prevMessage = messages[index - 1];
    
    if (!prevMessage || 
        prevMessage.senderId !== message.senderId ||
        (message.timestamp.getTime() - prevMessage.timestamp.getTime()) > 5 * 60 * 1000) {
      // New group
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = [message];
    } else {
      // Same group
      currentGroup.push(message);
    }
  });
  
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }
  
  return groups;
} 