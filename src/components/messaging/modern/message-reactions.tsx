"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { MessageReaction } from "@/lib/messaging/types";

interface MessageReactionsProps {
  messageId: string;
  reactions: MessageReaction[];
  currentUserId: string;
  onReactionAdd: (emoji: string) => void;
  onReactionRemove: (emoji: string) => void;
  className?: string;
}

interface GroupedReaction {
  emoji: string;
  count: number;
  users: Array<{ id: string; name: string; createdAt: Date }>;
  hasCurrentUser: boolean;
}

export function MessageReactions({
  messageId,
  reactions,
  currentUserId,
  onReactionAdd,
  onReactionRemove,
  className
}: MessageReactionsProps) {
  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    const existing = acc.find(group => group.emoji === reaction.emoji);
    
    if (existing) {
      existing.count++;
      existing.users.push({
        id: reaction.userId,
        name: reaction.userName,
        createdAt: reaction.createdAt
      });
      if (reaction.userId === currentUserId) {
        existing.hasCurrentUser = true;
      }
    } else {
      acc.push({
        emoji: reaction.emoji,
        count: 1,
        users: [{
          id: reaction.userId,
          name: reaction.userName,
          createdAt: reaction.createdAt
        }],
        hasCurrentUser: reaction.userId === currentUserId
      });
    }
    
    return acc;
  }, [] as GroupedReaction[]);

  if (groupedReactions.length === 0) {
    return null;
  }

  const handleReactionClick = (reaction: GroupedReaction) => {
    if (reaction.hasCurrentUser) {
      onReactionRemove(reaction.emoji);
    } else {
      onReactionAdd(reaction.emoji);
    }
  };

  const getTooltipContent = (reaction: GroupedReaction) => {
    const sortedUsers = [...reaction.users].sort((a, b) => 
      a.createdAt.getTime() - b.createdAt.getTime()
    );

    if (reaction.count === 1) {
      return `${sortedUsers[0].name} reacted with ${reaction.emoji}`;
    }

    if (reaction.count <= 3) {
      const names = sortedUsers.map(user => user.name).join(', ');
      return `${names} reacted with ${reaction.emoji}`;
    }

    const firstThree = sortedUsers.slice(0, 3).map(user => user.name).join(', ');
    const remaining = reaction.count - 3;
    return `${firstThree} and ${remaining} other${remaining > 1 ? 's' : ''} reacted with ${reaction.emoji}`;
  };

  return (
    <div className={cn("flex flex-wrap gap-1 mt-1", className)}>
      <TooltipProvider>
        {groupedReactions.map((reaction) => (
          <Tooltip key={reaction.emoji}>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className={cn(
                  "h-7 px-2 py-1 rounded-full text-xs font-normal transition-all duration-200",
                  "hover:scale-105 active:scale-95",
                  reaction.hasCurrentUser
                    ? "bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground border border-border"
                )}
                onClick={() => handleReactionClick(reaction)}
              >
                <span className="text-sm mr-1">{reaction.emoji}</span>
                <span className="text-xs">{reaction.count}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="max-w-[200px]">
                {getTooltipContent(reaction)}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
}

// Compact version for smaller spaces
interface CompactMessageReactionsProps extends Omit<MessageReactionsProps, 'className'> {
  maxVisible?: number;
  className?: string;
}

export function CompactMessageReactions({
  messageId,
  reactions,
  currentUserId,
  onReactionAdd,
  onReactionRemove,
  maxVisible = 3,
  className
}: CompactMessageReactionsProps) {
  const groupedReactions = reactions.reduce((acc, reaction) => {
    const existing = acc.find(group => group.emoji === reaction.emoji);
    
    if (existing) {
      existing.count++;
      existing.users.push({
        id: reaction.userId,
        name: reaction.userName,
        createdAt: reaction.createdAt
      });
      if (reaction.userId === currentUserId) {
        existing.hasCurrentUser = true;
      }
    } else {
      acc.push({
        emoji: reaction.emoji,
        count: 1,
        users: [{
          id: reaction.userId,
          name: reaction.userName,
          createdAt: reaction.createdAt
        }],
        hasCurrentUser: reaction.userId === currentUserId
      });
    }
    
    return acc;
  }, [] as GroupedReaction[]);

  if (groupedReactions.length === 0) {
    return null;
  }

  const visibleReactions = groupedReactions.slice(0, maxVisible);
  const hiddenCount = groupedReactions.length - maxVisible;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <TooltipProvider>
        {visibleReactions.map((reaction) => (
          <Tooltip key={reaction.emoji}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-6 w-6 p-0 rounded-full text-xs transition-all duration-200",
                  "hover:scale-110 active:scale-95",
                  reaction.hasCurrentUser
                    ? "bg-blue-100 hover:bg-blue-200 text-blue-700"
                    : "hover:bg-muted"
                )}
                onClick={() => {
                  if (reaction.hasCurrentUser) {
                    onReactionRemove(reaction.emoji);
                  } else {
                    onReactionAdd(reaction.emoji);
                  }
                }}
              >
                {reaction.emoji}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                {reaction.count} reaction{reaction.count > 1 ? 's' : ''}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
        
        {hiddenCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="h-6 px-2 rounded-full bg-muted text-xs text-muted-foreground flex items-center">
                +{hiddenCount}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                {hiddenCount} more reaction{hiddenCount > 1 ? 's' : ''}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
}

// Animated reaction for when a new reaction is added
interface AnimatedReactionProps {
  emoji: string;
  onAnimationComplete?: () => void;
}

export function AnimatedReaction({ emoji, onAnimationComplete }: AnimatedReactionProps) {
  return (
    <div 
      className="absolute pointer-events-none text-lg animate-bounce"
      style={{
        animation: 'reactionPop 0.6s ease-out forwards'
      }}
      onAnimationEnd={onAnimationComplete}
    >
      {emoji}
      <style jsx>{`
        @keyframes reactionPop {
          0% {
            transform: scale(0) translateY(0);
            opacity: 1;
          }
          50% {
            transform: scale(1.2) translateY(-10px);
            opacity: 1;
          }
          100% {
            transform: scale(0.8) translateY(-20px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
} 