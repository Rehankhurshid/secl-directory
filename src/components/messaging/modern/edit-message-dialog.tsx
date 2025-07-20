"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface EditMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newContent: string) => Promise<void>;
  currentContent: string;
  messageSender: string;
}

export function EditMessageDialog({
  isOpen,
  onClose,
  onSave,
  currentContent,
  messageSender
}: EditMessageDialogProps) {
  const [content, setContent] = useState(currentContent);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setContent(currentContent);
      // Focus and select all text when dialog opens
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.select();
        }
      }, 100);
    }
  }, [isOpen, currentContent]);

  const handleSave = async () => {
    const trimmedContent = content.trim();
    
    if (!trimmedContent) {
      return; // Don't save empty messages
    }

    if (trimmedContent === currentContent.trim()) {
      onClose(); // No changes made
      return;
    }

    setIsSaving(true);
    try {
      await onSave(trimmedContent);
      onClose();
    } catch (error) {
      console.error('Failed to save message:', error);
      // Error handling could be improved with toast notifications
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const hasChanges = content.trim() !== currentContent.trim();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Message</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Editing message from {messageSender}
          </div>
          
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your message..."
            className="min-h-[120px] resize-none"
            disabled={isSaving}
          />
          
          <div className="text-xs text-muted-foreground">
            Press Cmd/Ctrl + Enter to save, Escape to cancel
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!hasChanges || !content.trim() || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 