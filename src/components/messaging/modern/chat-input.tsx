'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, Send, Smile, WifiOff, Clock } from 'lucide-react';
import { ReplyComposer, CompactReplyComposer } from './reply-composer';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useOfflineStatus } from '@/hooks/use-offline-status';
import offlineSyncManager from '@/lib/storage/offline-sync-manager';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Message {
  id: string;
  content: string;
  timestamp: string;
  senderId: string;
  senderName: string;
}

interface ChatInputProps {
  conversationId: string;
  onSendMessage: (content: string, replyToId?: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  disabled?: boolean;
  replyToMessage?: Message;
  onCancelReply?: () => void;
}

export default function ChatInput({ 
  conversationId,
  onSendMessage, 
  onTypingStart, 
  onTypingStop, 
  disabled = false,
  replyToMessage,
  onCancelReply 
}: ChatInputProps) {
  const [text, setText] = useState('');
  const [isQueueing, setIsQueueing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const isTypingRef = useRef(false);
  const typingStartTimeRef = useRef<number>(0);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { isFullyConnected, isOnline, hasQueuedItems } = useOfflineStatus();

  const handleSend = async () => {
    const content = text.trim();
    if (content && !disabled) {
      // If fully connected, send normally
      if (isFullyConnected) {
        onSendMessage(content, replyToMessage?.id);
      } else {
        // Queue message for offline sync
        setIsQueueing(true);
        try {
          await offlineSyncManager.queueMessage(
            conversationId,
            content,
            'text',
            replyToMessage?.id
          );
          console.log('📤 Message queued for offline sync');
        } catch (error) {
          console.error('❌ Failed to queue message:', error);
        } finally {
          setIsQueueing(false);
        }
      }
      
      setText('');
      // Clear reply after sending
      if (replyToMessage && onCancelReply) {
        onCancelReply();
      }
      // Stop typing when sending
      if (isTypingRef.current) {
        onTypingStop();
        isTypingRef.current = false;
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    // Auto-resize textarea
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 128; // 8rem
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }

    // Typing indicator logic
    if (text.trim() && !disabled) {
      if (!isTypingRef.current) {
        onTypingStart();
        isTypingRef.current = true;
        typingStartTimeRef.current = Date.now();
      }
      
      // Clear existing timeout
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      // Set new timeout to stop typing after 1.5 seconds of inactivity (responsive UX)
      typingTimeoutRef.current = setTimeout(() => {
        if (isTypingRef.current) {
          onTypingStop();
          isTypingRef.current = false;
          typingStartTimeRef.current = 0;
        }
      }, 1500);
    } else if (isTypingRef.current && !text.trim()) {
      // Only stop typing if it has been showing for at least 500ms (prevents flickering)
      const minTypingDuration = 500;
      const elapsed = Date.now() - typingStartTimeRef.current;
      
      if (elapsed >= minTypingDuration) {
        onTypingStop();
        isTypingRef.current = false;
        typingStartTimeRef.current = 0;
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      } else {
        // Delay the stop to meet minimum duration
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          if (isTypingRef.current && !text.trim()) {
            onTypingStop();
            isTypingRef.current = false;
            typingStartTimeRef.current = 0;
          }
        }, minTypingDuration - elapsed);
      }
    }

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [text, onTypingStart, onTypingStop, disabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isTypingRef.current) {
        onTypingStop();
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [onTypingStop]);

  const placeholder = replyToMessage 
    ? `Reply to ${replyToMessage.senderName}...`
    : "Type a message...";

  return (
    <div className="border-t bg-background">
      {/* Reply composer */}
      {replyToMessage && onCancelReply && (
        isMobile ? (
          <CompactReplyComposer 
            replyToMessage={replyToMessage}
            onCancel={onCancelReply}
          />
        ) : (
          <ReplyComposer 
            replyToMessage={replyToMessage}
            onCancel={onCancelReply}
          />
        )
      )}

      <div className="p-4">
      <div className="relative flex items-end gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="flex-shrink-0 h-10 w-10 text-muted-foreground hover:text-foreground"
          disabled={disabled}
        >
          <Paperclip className="h-5 w-5" />
          <span className="sr-only">Attach file</span>
        </Button>
        
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
              placeholder={placeholder}
            rows={1}
            disabled={disabled}
              className={`resize-none bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 rounded-2xl min-h-[2.5rem] max-h-32 pr-12 text-sm ${
                replyToMessage ? 'border-primary/20 ring-1 ring-primary/10' : ''
              }`}
          />
          <Button 
            variant="ghost"
            size="icon"
            className="absolute right-2 bottom-1 h-8 w-8 text-muted-foreground hover:text-foreground"
            disabled={disabled}
          >
            <Smile className="h-4 w-4" />
            <span className="sr-only">Add emoji</span>
          </Button>
        </div>
        
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
        <Button 
          size="icon" 
                  className={`rounded-full flex-shrink-0 h-10 w-10 transition-all duration-200 ${
                    replyToMessage ? 'bg-primary hover:bg-primary/90' : ''
                  } ${!isFullyConnected ? 'bg-yellow-500 hover:bg-yellow-600' : ''}`}
          onClick={handleSend}
                  disabled={!text.trim() || disabled || isQueueing}
                  aria-label={
                    !isFullyConnected ? "Offline - message will be queued for sync" : 
                    replyToMessage ? `Reply to ${replyToMessage.senderName}` : "Send message"
                  }
        >
                  {isQueueing ? (
                    <Clock className="h-4 w-4 animate-pulse" />
                  ) : !isOnline ? (
                    <WifiOff className="h-4 w-4" />
                  ) : !isFullyConnected ? (
                    <Clock className="h-4 w-4" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
        </Button>
              </TooltipTrigger>
              
              <TooltipContent side="top">
                {isQueueing ? (
                  "Queuing message..."
                ) : !isOnline ? (
                  "Offline - Messages will be queued for sync"
                ) : !isFullyConnected ? (
                  "Poor connection - Messages will be queued"
                ) : replyToMessage ? (
                  `Reply to ${replyToMessage.senderName}`
                ) : (
                  "Send message"
                )}
                {hasQueuedItems && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Messages queued for sync
                  </div>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
} 