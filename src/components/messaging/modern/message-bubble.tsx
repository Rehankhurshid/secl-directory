'use client';

import { useState } from "react";
import { formatMessageTime } from "@/lib/messaging/utils";
import { cn } from "@/lib/utils";
import { MessageStatusWithTooltip } from "./message-status";
import { MessageReactions } from "./message-reactions";
import { QuickReactions } from "./emoji-picker";
import { MoreHorizontal, Reply, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Message {
  id: string;
  content: string;
  timestamp: string;
  senderId: string;
  senderName: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  // Phase 2 enhancements
  replyToId?: string;
  replyToMessage?: Message;
  editedAt?: Date;
  editCount?: number;
  isDeleted?: boolean;
  deletedAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  readByUsers?: Array<{ id: string; name: string; readAt: Date }>;
  reactions?: Array<{ id: string; messageId: string; userId: string; userName: string; emoji: string; createdAt: Date }>;
}

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  groupMembers?: number;
  currentUserId: string;
  onReactionAdd?: (messageId: string, emoji: string) => void;
  onReactionRemove?: (messageId: string, emoji: string) => void;
  onReply?: (message: Message) => void;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
}

export default function MessageBubble({ 
  message, 
  isOwnMessage, 
  groupMembers = 0,
  currentUserId,
  onReactionAdd,
  onReactionRemove,
  onReply,
  onEdit,
  onDelete
}: MessageBubbleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showQuickReactions, setShowQuickReactions] = useState(false);
  // Handle deleted messages
  if (message.isDeleted) {
  return (
    <div className={cn("flex w-full items-end gap-2", isOwnMessage ? "justify-end" : "justify-start")}>
      <div className={cn(
          "flex flex-col max-w-[75%]", 
          isOwnMessage ? "items-end" : "items-start"
      )}>
        {!isOwnMessage && (
            <span className="text-xs text-muted-foreground px-1 mb-0.5">{message.senderName}</span>
        )}
        <div className={cn(
            "rounded-2xl px-3.5 py-2.5 text-sm shadow-sm italic",
            "bg-muted text-muted-foreground border border-dashed"
          )}>
            <p className="leading-snug">This message was deleted</p>
          </div>
          <div className={cn(
            "flex items-center gap-1.5 mt-1 text-xs",
            "text-muted-foreground"
          )}>
              <time>{formatMessageTime(new Date(message.timestamp))}</time>
          </div>
        </div>
      </div>
    );
  }

  const handleReactionAdd = (emoji: string) => {
    onReactionAdd?.(message.id, emoji);
    setShowQuickReactions(false);
  };

  const handleReactionRemove = (emoji: string) => {
    onReactionRemove?.(message.id, emoji);
  };

  return (
    <div 
      className={cn("group relative flex w-full items-end gap-2", isOwnMessage ? "justify-end" : "justify-start")}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowQuickReactions(false);
      }}
    >
      <div className={cn(
          "flex flex-col max-w-[75%] relative", 
          isOwnMessage ? "items-end" : "items-start"
      )}>
        {!isOwnMessage && (
            <span className="text-xs text-muted-foreground px-1 mb-0.5">{message.senderName}</span>
        )}
        
        {/* Reply indicator */}
        {message.replyToMessage && (
          <div className={cn(
            "text-xs px-2 py-1 mb-1 rounded-lg bg-muted/50 border-l-2 cursor-pointer hover:bg-muted/70 transition-colors",
            isOwnMessage ? "border-primary/50" : "border-muted-foreground/50"
          )}
          onClick={() => {
            // Scroll to replied message functionality could be added here
          }}>
            <div className="text-muted-foreground">Replying to {message.replyToMessage.senderName}</div>
            <div className="truncate max-w-[200px]">{message.replyToMessage.content}</div>
          </div>
        )}

        <div className={cn(
          "rounded-2xl px-3.5 py-2.5 text-sm shadow-sm relative",
          isOwnMessage 
            ? "bg-primary text-primary-foreground rounded-br-lg" 
            : "bg-background rounded-bl-lg border"
        )}>
          <p className="leading-snug break-words whitespace-pre-wrap">{message.content}</p>
          
          {/* Edit indicator */}
          {message.editedAt && (
            <div className="text-xs mt-1 opacity-70">
              edited {message.editCount && message.editCount > 1 ? `${message.editCount} times` : ''}
            </div>
          )}

          {/* Quick reactions on hover */}
          {isHovered && !showQuickReactions && (
            <div className={cn(
              "absolute -top-8 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
              isOwnMessage ? "-left-2" : "-right-2"
            )}>
              <QuickReactions
                onReact={handleReactionAdd}
                className="shadow-lg"
              />
            </div>
          )}
        </div>

        {/* Message reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <MessageReactions
            messageId={message.id}
            reactions={message.reactions}
            currentUserId={currentUserId}
            onReactionAdd={handleReactionAdd}
            onReactionRemove={handleReactionRemove}
            className="mt-1"
          />
        )}
        
        <div className={cn(
          "flex items-center gap-1.5 mt-1 text-xs",
          isOwnMessage ? "text-muted-foreground" : "text-muted-foreground"
        )}>
            <time>{formatMessageTime(new Date(message.timestamp))}</time>
            {isOwnMessage && (
              <MessageStatusWithTooltip 
                status={message.status} 
                size="sm"
                deliveredAt={message.deliveredAt}
                readAt={message.readAt}
                readByUsers={message.readByUsers}
                readCount={message.readByUsers?.length || 0}
                totalMembers={groupMembers}
                showReadCount={groupMembers > 2}
              />
            )}
        </div>
      </div>

      {/* Message actions menu */}
      {isHovered && (
        <div className={cn(
          "absolute top-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
          isOwnMessage ? "left-0 -translate-x-full" : "right-0 translate-x-full"
        )}>
          <div className="flex items-center gap-1 bg-background border rounded-lg p-1 shadow-sm">
            {onReply && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onReply(message)}
              >
                <Reply className="h-3 w-3" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setShowQuickReactions(!showQuickReactions)}
            >
              😊
            </Button>

            {isOwnMessage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(message.id)}>
                      <Pencil className="h-3 w-3 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem 
                      onClick={() => onDelete(message.id)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 