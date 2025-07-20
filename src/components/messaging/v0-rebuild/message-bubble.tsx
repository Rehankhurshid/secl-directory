import { Message } from "./types";
import { formatMessageTime } from "./utils";
import { cn } from "@/lib/utils";
import { Check, CheckCheck, Clock } from "lucide-react";

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
  return (
    <div className={cn("flex w-full items-end gap-2", isOwnMessage ? "justify-end" : "justify-start")}>
      <div className={cn(
          "flex flex-col max-w-[75%]", 
          isOwnMessage ? "items-end" : "items-start"
      )}>
        {!isOwnMessage && message.sender?.name && (
            <span className="text-xs text-muted-foreground px-1 mb-0.5">{message.sender.name}</span>
        )}
        <div className={cn(
          "rounded-2xl px-3.5 py-2.5 text-sm",
          isOwnMessage 
            ? "bg-primary text-primary-foreground rounded-br-lg" 
            : "bg-background rounded-bl-lg border"
        )}>
          <p className="leading-snug break-words whitespace-pre-wrap">{message.text}</p>
        </div>
        <div className={cn(
          "flex items-center gap-1.5 mt-1 text-xs",
          isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
            <time>{formatMessageTime(new Date(message.timestamp))}</time>
            {isOwnMessage && <MessageStatus status={message.status} />}
        </div>
      </div>
    </div>
  );
}