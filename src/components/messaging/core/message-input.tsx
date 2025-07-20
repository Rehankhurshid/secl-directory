'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Mic, 
  X,
  Image as ImageIcon,
  FileText,
  MapPin,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface MessageInputProps {
  onSendMessage: (content: string, attachments?: File[]) => void;
  onStartTyping?: () => void;
  onStopTyping?: () => void;
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  } | null;
  onCancelReply?: () => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
}

export function MessageInput({
  onSendMessage,
  onStartTyping,
  onStopTyping,
  replyTo,
  onCancelReply,
  placeholder = "Type a message...",
  disabled = false,
  maxLength = 1000
}: MessageInputProps) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleSend = useCallback(() => {
    const trimmedContent = content.trim();
    if (!trimmedContent && attachments.length === 0) return;
    
    onSendMessage(trimmedContent, attachments);
    setContent('');
    setAttachments([]);
    onStopTyping?.();
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [content, attachments, onSendMessage, onStopTyping]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    if (newContent.length <= maxLength) {
      setContent(newContent);
      
      // Auto-resize textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        const scrollHeight = textareaRef.current.scrollHeight;
        const maxHeight = 120; // ~6 lines
        textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      }

      // Typing indicators
      if (newContent.trim()) {
        onStartTyping?.();
        
        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        // Set timeout to stop typing
        typingTimeoutRef.current = setTimeout(() => {
          onStopTyping?.();
        }, 2000);
      } else {
        onStopTyping?.();
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      // Basic file validation (10MB limit)
      return file.size <= 10 * 1024 * 1024;
    });
    
    setAttachments(prev => [...prev, ...validFiles]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const insertEmoji = (emoji: string) => {
    const newContent = content + emoji;
    if (newContent.length <= maxLength) {
      setContent(newContent);
      setShowEmojiPicker(false);
      textareaRef.current?.focus();
    }
  };

  const startVoiceRecording = async () => {
    try {
      // This would implement voice recording functionality
      setIsRecording(true);
      // Add actual voice recording implementation here
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopVoiceRecording = () => {
    setIsRecording(false);
    // Add voice recording stop logic here
  };

  const canSend = content.trim() || attachments.length > 0;

  return (
    <div className="border-t bg-background p-4">
      {/* Reply Preview */}
      {replyTo && (
        <Card className="mb-3 p-3 bg-muted/50">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Replying to {replyTo.senderName}
              </p>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {replyTo.content}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={onCancelReply}
              className="h-6 w-6 ml-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Attachment Preview */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <AttachmentPreview
              key={index}
              file={file}
              onRemove={() => removeAttachment(index)}
            />
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        {/* Attachment Options */}
        <div className="flex gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button size="icon" variant="ghost" disabled={disabled}>
                <Plus className="h-5 w-5" />
                <span className="sr-only">Add attachment</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" className="w-auto p-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col gap-1 h-auto p-3"
                >
                  <FileText className="h-5 w-5" />
                  <span className="text-xs">File</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = 'image/*';
                      fileInputRef.current.click();
                    }
                  }}
                  className="flex flex-col gap-1 h-auto p-3"
                >
                  <ImageIcon className="h-5 w-5" />
                  <span className="text-xs">Photo</span>
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <Button size="icon" variant="ghost" disabled={disabled}>
                <Smile className="h-5 w-5" />
                <span className="sr-only">Add emoji</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" className="w-auto p-2">
              <EmojiPicker onEmojiSelect={insertEmoji} />
            </PopoverContent>
          </Popover>
        </div>

        {/* Message Input */}
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-[44px] max-h-[120px] resize-none border-0 bg-muted/50 focus:bg-background"
            rows={1}
          />
          
          {/* Character Counter */}
          {content.length > maxLength * 0.8 && (
            <div className="text-xs text-muted-foreground mt-1 text-right">
              {content.length}/{maxLength}
            </div>
          )}
        </div>

        {/* Send/Voice Button */}
        {canSend ? (
          <Button 
            onClick={handleSend} 
            size="icon" 
            disabled={disabled}
            className="h-11 w-11"
          >
            <Send className="h-5 w-5" />
            <span className="sr-only">Send message</span>
          </Button>
        ) : (
          <Button 
            onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
            size="icon"
            variant={isRecording ? "destructive" : "default"}
            disabled={disabled}
            className="h-11 w-11"
          >
            <Mic className={cn("h-5 w-5", isRecording && "animate-pulse")} />
            <span className="sr-only">
              {isRecording ? "Stop recording" : "Record voice message"}
            </span>
          </Button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
      />
    </div>
  );
}

function AttachmentPreview({ 
  file, 
  onRemove 
}: { 
  file: File; 
  onRemove: () => void; 
}) {
  const isImage = file.type.startsWith('image/');
  const fileSize = (file.size / 1024 / 1024).toFixed(1); // MB

  return (
    <Card className="relative p-2 flex items-center gap-2 max-w-xs">
      <div className="flex-shrink-0">
        {isImage ? (
          <ImageIcon className="h-4 w-4 text-blue-500" />
        ) : (
          <FileText className="h-4 w-4 text-gray-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">{fileSize} MB</p>
      </div>
      <Button
        size="icon"
        variant="ghost"
        onClick={onRemove}
        className="h-6 w-6 flex-shrink-0"
      >
        <X className="h-3 w-3" />
      </Button>
    </Card>
  );
}

function EmojiPicker({ 
  onEmojiSelect 
}: { 
  onEmojiSelect: (emoji: string) => void; 
}) {
  const commonEmojis = [
    '😀', '😂', '🥰', '😍', '🤔', '😮', '😢', '😡',
    '👍', '👎', '👏', '🙌', '💪', '🤝', '🙏', '❤️',
    '🎉', '🔥', '💯', '✨', '⭐', '🚀', '💡', '🎯'
  ];

  return (
    <div className="grid grid-cols-8 gap-1 p-2 max-w-72">
      {commonEmojis.map((emoji) => (
        <Button
          key={emoji}
          variant="ghost"
          size="sm"
          onClick={() => onEmojiSelect(emoji)}
          className="h-8 w-8 p-0 hover:bg-muted"
        >
          {emoji}
        </Button>
      ))}
    </div>
  );
} 