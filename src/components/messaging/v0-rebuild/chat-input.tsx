'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, Send } from 'lucide-react';
// Mock hook - replace with your actual implementation
import { useSocketStore } from '@/lib/socket/client';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  groupId: number;
}

export default function ChatInput({ onSendMessage, groupId }: ChatInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  const startTyping = useSocketStore(state => state.startTyping);
  const stopTyping = useSocketStore(state => state.stopTyping);

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

  const handleSend = () => {
    const content = text.trim();
    if (content) {
      onSendMessage(content);
      setText('');
      stopTyping(groupId);
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
    if (text.trim()) {
        startTyping(groupId);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => stopTyping(groupId), 2000);
    } else {
        stopTyping(groupId);
    }

    return () => {
        if(typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }

  }, [text, groupId, startTyping, stopTyping]);


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
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 resize-none bg-muted border-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 rounded-2xl max-h-32 pr-12"
        />
        <Button 
            size="icon" 
            className="rounded-full flex-shrink-0"
            onClick={handleSend}
            disabled={!text.trim()}
            aria-label="Send message"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}