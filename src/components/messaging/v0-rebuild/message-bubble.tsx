import { Message } from "./types";
import { formatMessageTime } from "./utils";
import { cn } from "@/lib/utils";
import { Check, CheckCheck, Clock, MoreHorizontal, Reply, Copy, Trash2, Edit } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

function MessageStatus({ status }: { status?: Message['status'] }) {
    if (status === 'sending') return <Clock className="h-3.5 w-3.5" />;
    if (status === 'sent') return <Check className="h-3.5 w-3.5" />;
    if (status === 'delivered') return <CheckCheck className="h-3.5 w-3.5" />;
    if (status === 'read') return <CheckCheck className="h-3.5 w-3.5 text-blue-500" />;
    return null;
}

export default function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.text);
  };

  return (
    <div className={cn("group flex w-full items-start gap-2", isOwnMessage ? "justify-end" : "justify-start")}>
      <div className={cn(
          "flex flex-col max-w-[75%]", 
          isOwnMessage ? "items-end" : "items-start"
      )}>
        {!isOwnMessage && message.sender?.name && (
            <span className="text-xs text-muted-foreground px-1 mb-0.5">{message.sender.name}</span>
        )}
        <div className="relative flex items-center gap-1">
          <div className={cn(
            "rounded-2xl px-3.5 py-2.5 text-sm",
            isOwnMessage 
              ? "bg-primary text-primary-foreground rounded-br-lg" 
              : "bg-background rounded-bl-lg border"
          )}>
            <p className="leading-snug break-words whitespace-pre-wrap">{message.text}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity",
                  isOwnMessage ? "order-first" : "order-last"
                )}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
                <span className="sr-only">Message options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isOwnMessage ? "end" : "start"}>
              <DropdownMenuItem>
                <Reply className="mr-2 h-4 w-4" />
                Reply
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyMessage}>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </DropdownMenuItem>
              {isOwnMessage && (
                <>
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className={cn(
          "flex items-center gap-1.5 mt-1 text-xs",
          isOwnMessage ? "text-muted-foreground" : "text-muted-foreground"
        )}>
            <Tooltip>
              <TooltipTrigger asChild>
                <time>{formatMessageTime(new Date(message.timestamp))}</time>
              </TooltipTrigger>
              <TooltipContent>
                <p>{new Date(message.timestamp).toLocaleString()}</p>
              </TooltipContent>
            </Tooltip>
            {isOwnMessage && <MessageStatus status={message.status} />}
        </div>
      </div>
    </div>
  );
}