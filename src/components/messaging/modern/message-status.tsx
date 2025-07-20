"use client";

import { Check, CheckCheck, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageStatusProps {
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function MessageStatus({ status, className, size = 'sm', showText = false }: MessageStatusProps) {
  const getStatusIcon = () => {
    const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5';
    
    switch (status) {
      case 'pending':
        return <Clock className={cn(iconSize, "text-muted-foreground animate-pulse")} />;
      case 'sent':
        return <Check className={cn(iconSize, "text-muted-foreground")} />;
      case 'delivered':
        return <CheckCheck className={cn(iconSize, "text-muted-foreground")} />;
      case 'read':
        return <CheckCheck className={cn(iconSize, "text-blue-500")} />;
      case 'failed':
        return <X className={cn(iconSize, "text-red-500")} />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'Sending...';
      case 'sent':
        return 'Sent';
      case 'delivered':
        return 'Delivered';
      case 'read':
        return 'Read';
      case 'failed':
        return 'Failed';
      default:
        return '';
    }
  };

  return (
    <div className={cn(
      "flex items-center gap-1",
      size === 'sm' && "text-xs",
      size === 'md' && "text-sm", 
      size === 'lg' && "text-base",
      className
    )}>
      {getStatusIcon()}
      {showText && (
        <span className={cn(
          "text-muted-foreground",
          status === 'read' && "text-blue-500",
          status === 'failed' && "text-red-500"
        )}>
          {getStatusText()}
        </span>
      )}
    </div>
  );
}

// Extended version with read receipts count
interface MessageStatusExtendedProps extends MessageStatusProps {
  readCount?: number;
  totalMembers?: number;
  showReadCount?: boolean;
}

export function MessageStatusExtended({ 
  status, 
  className, 
  size = 'sm', 
  showText = false,
  readCount = 0,
  totalMembers = 0,
  showReadCount = false
}: MessageStatusExtendedProps) {
  const getReadReceiptText = () => {
    if (!showReadCount || totalMembers <= 2) return null;
    
    if (readCount === 0) return null;
    if (readCount === totalMembers - 1) return "Read by all";
    return `Read by ${readCount}`;
  };

  const readReceiptText = getReadReceiptText();

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <MessageStatus 
        status={status} 
        size={size} 
        showText={showText && !readReceiptText}
      />
      {readReceiptText && (
        <span className={cn(
          "text-blue-500",
          size === 'sm' && "text-xs",
          size === 'md' && "text-sm",
          size === 'lg' && "text-base"
        )}>
          {readReceiptText}
        </span>
      )}
    </div>
  );
}

// Tooltip version for detailed status information
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MessageStatusWithTooltipProps extends MessageStatusExtendedProps {
  deliveredAt?: Date;
  readAt?: Date;
  readByUsers?: Array<{ id: string; name: string; readAt: Date }>;
}

export function MessageStatusWithTooltip({
  status,
  className,
  size = 'sm',
  deliveredAt,
  readAt,
  readByUsers = [],
  ...props
}: MessageStatusWithTooltipProps) {
  const getTooltipContent = () => {
    switch (status) {
      case 'pending':
        return "Message is being sent...";
      case 'sent':
        return `Sent at ${new Date().toLocaleTimeString()}`;
      case 'delivered':
        return deliveredAt 
          ? `Delivered at ${deliveredAt.toLocaleTimeString()}`
          : "Message delivered";
      case 'read':
        if (readByUsers.length > 0) {
          return (
            <div className="space-y-1">
              <div className="font-medium">Read by:</div>
              {readByUsers.map((user) => (
                <div key={user.id} className="text-sm">
                  {user.name} - {user.readAt.toLocaleTimeString()}
                </div>
              ))}
            </div>
          );
        }
        return readAt 
          ? `Read at ${readAt.toLocaleTimeString()}`
          : "Message read";
      case 'failed':
        return "Failed to send. Tap to retry.";
      default:
        return null;
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <MessageStatusExtended 
              status={status}
              className={className}
              size={size}
              {...props}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 