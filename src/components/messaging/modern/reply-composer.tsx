"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  timestamp: string;
  senderId: string;
  senderName: string;
}

interface ReplyComposerProps {
  replyToMessage: Message;
  onCancel: () => void;
  className?: string;
}

export function ReplyComposer({ replyToMessage, onCancel, className }: ReplyComposerProps) {
  return (
    <div className={cn(
      "flex items-start gap-3 px-4 py-3 bg-muted/50 border-l-4 border-primary/50 border-b",
      className
    )}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-primary font-medium">
            Replying to {replyToMessage.senderName}
          </span>
        </div>
        <div className="text-sm text-muted-foreground line-clamp-2 break-words">
          {replyToMessage.content}
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 hover:bg-muted"
        onClick={onCancel}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

// Compact version for mobile or smaller spaces
interface CompactReplyComposerProps extends ReplyComposerProps {
  maxLength?: number;
}

export function CompactReplyComposer({ 
  replyToMessage, 
  onCancel, 
  maxLength = 50,
  className 
}: CompactReplyComposerProps) {
  const truncatedContent = replyToMessage.content.length > maxLength 
    ? `${replyToMessage.content.slice(0, maxLength)}...`
    : replyToMessage.content;

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 bg-muted/30 border-l-2 border-primary/50",
      className
    )}>
      <div className="flex-1 min-w-0">
        <span className="text-xs text-primary font-medium mr-2">
          Reply to {replyToMessage.senderName}:
        </span>
        <span className="text-xs text-muted-foreground truncate">
          {truncatedContent}
        </span>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        className="h-5 w-5 p-0 hover:bg-muted flex-shrink-0"
        onClick={onCancel}
      >
        <X className="h-2.5 w-2.5" />
      </Button>
    </div>
  );
}

// Reply indicator for sent messages
interface ReplyIndicatorProps {
  replyToMessage: Message;
  onClick?: () => void;
  className?: string;
}

export function ReplyIndicator({ replyToMessage, onClick, className }: ReplyIndicatorProps) {
  return (
    <div 
      className={cn(
        "text-xs px-2 py-1 mb-1 rounded-lg bg-muted/50 border-l-2 border-primary/50",
        "cursor-pointer hover:bg-muted/70 transition-colors",
        className
      )}
      onClick={onClick}
    >
      <div className="text-primary font-medium mb-0.5">
        Replying to {replyToMessage.senderName}
      </div>
      <div className="text-muted-foreground line-clamp-2 max-w-[200px]">
        {replyToMessage.content}
      </div>
    </div>
  );
}

// Thread indicator for messages that have replies
interface ThreadIndicatorProps {
  replyCount: number;
  onClick?: () => void;
  className?: string;
}

export function ThreadIndicator({ replyCount, onClick, className }: ThreadIndicatorProps) {
  if (replyCount === 0) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "h-6 text-xs text-muted-foreground hover:text-foreground mt-1",
        className
      )}
      onClick={onClick}
    >
      {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
    </Button>
  );
} 