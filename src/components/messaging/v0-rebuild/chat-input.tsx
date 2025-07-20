'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  groupId: number;
  connectionStatus?: { connected: boolean; authenticated: boolean };
  onStartTyping?: () => void;
  onStopTyping?: () => void;
}

export default function ChatInput({ 
  onSendMessage, 
  groupId, 
  connectionStatus,
  onStartTyping,
  onStopTyping 
}: ChatInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Ensure input stays visible when keyboard opens
  useEffect(() => {
    const handleFocus = () => {
      // Small delay to let keyboard open
      setTimeout(() => {
        containerRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'end',
          inline: 'nearest' 
        });
      }, 300);
    };

    const textarea = textareaRef.current;
    textarea?.addEventListener('focus', handleFocus);
    
    return () => {
      textarea?.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    
    // Handle typing indicators
    if (e.target.value.trim() && connectionStatus?.connected) {
      onStartTyping?.();
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        onStopTyping?.();
      }, 2000);
    } else if (!e.target.value.trim()) {
      onStopTyping?.();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleSend = () => {
    const content = text.trim();
    if (content) {
      onSendMessage(content);
      setText('');
      onStopTyping?.();
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

    return () => {
        if(typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }

  }, [text]);


  return (
    <div ref={containerRef} className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom)+4rem)] md:pb-[calc(1rem+env(safe-area-inset-bottom))] border-t bg-background">
      <div className="relative flex items-end gap-2">
        <Button variant="ghost" size="icon" className="flex-shrink-0">
          <Paperclip className="h-5 w-5" />
          <span className="sr-only">Attach file</span>
        </Button>
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={connectionStatus?.connected ? "Type a message..." : "Connecting..."}
          rows={1}
          className="flex-1 resize-none bg-muted border-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 rounded-2xl max-h-32 pr-12"
          disabled={!connectionStatus?.connected}
        />
        <Button 
            size="icon" 
            className="rounded-full flex-shrink-0"
            onClick={handleSend}
            disabled={!text.trim() || !connectionStatus?.connected}
            aria-label={!connectionStatus?.connected ? "Connecting..." : "Send message"}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}