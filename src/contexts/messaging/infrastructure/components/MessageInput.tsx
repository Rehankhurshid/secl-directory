'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSend?: (content: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [content, setContent] = useState('');

  const handleSend = () => {
    if (!content.trim()) return;
    if (onSend) {
      onSend(content.trim());
      setContent('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (onSend) {
        handleSend();
      }
    }
  };

  return (
    <div className="border-t p-4">
      <div className="flex items-end gap-2">
        <Textarea
          name="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="min-h-[40px] flex-1 resize-none"
          rows={1}
          disabled={disabled}
        />
        <Button
          type={onSend ? "button" : "submit"}
          onClick={onSend ? handleSend : undefined}
          size="icon"
          disabled={!content.trim() || disabled}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}