'use client';

import { useRef, useEffect, useState } from 'react';
import ChatHeader from './chat-header';
import ChatMessages, { ChatMessagesRef } from './chat-messages';
import ChatInput from './chat-input';
import { Group, Message } from './types';
import { Skeleton } from '@/components/ui/skeleton';

interface ChatViewProps {
  group: Group;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  onBack: () => void;
}

function ChatSkeleton() {
    return (
        <div className="flex-1 flex flex-col p-6">
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={`sk-left-${i}`} className="flex items-end gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-16 w-48 rounded-lg" />
                    </div>
                ))}
                {[...Array(2)].map((_, i) => (
                     <div key={`sk-right-${i}`} className="flex items-end justify-end gap-2">
                        <Skeleton className="h-12 w-64 rounded-lg" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function ChatView({ group, messages, currentUserId, onSendMessage, isLoading, onBack }: ChatViewProps) {
  const chatMessagesRef = useRef<ChatMessagesRef>(null);
  const previousMessageCount = useRef(messages.length);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Handle virtual keyboard on mobile
  useEffect(() => {
    const handleViewportChange = () => {
      if (window.visualViewport) {
        const heightDiff = window.innerHeight - window.visualViewport.height;
        setIsKeyboardOpen(heightDiff > 50); // Keyboard is open if difference is significant
      }
    };

    // Initial check
    handleViewportChange();

    // Listen for viewport changes
    window.visualViewport?.addEventListener('resize', handleViewportChange);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
    };
  }, []);

  // Detect when new messages are added
  useEffect(() => {
    if (messages.length > previousMessageCount.current) {
      // New message added, scroll to bottom
      chatMessagesRef.current?.scrollToBottom();
    }
    previousMessageCount.current = messages.length;
  }, [messages.length]);

  const handleSendMessage = (content: string) => {
    onSendMessage(content);
    // Smooth scroll after sending a message
    setTimeout(() => {
      chatMessagesRef.current?.scrollToBottom();
    }, 100);
    // Try again after API response
    setTimeout(() => {
      chatMessagesRef.current?.scrollToBottom();
    }, 600);
  };

  return (
    <div className="h-full flex flex-col bg-muted/20 overflow-hidden">
      <ChatHeader group={group} onBack={onBack} />
      
      <div className="flex-1 min-h-0 overflow-hidden">
        {isLoading ? (
            <ChatSkeleton />
        ) : (
            <ChatMessages 
              ref={chatMessagesRef}
              messages={messages} 
              currentUserId={currentUserId} 
              groupId={group.id} 
            />
        )}
      </div>

      <div 
        className="flex-shrink-0"
        style={{
          paddingBottom: isKeyboardOpen && window.visualViewport 
            ? `${window.innerHeight - window.visualViewport.height}px` 
            : '0'
        }}
      >
        <ChatInput onSendMessage={handleSendMessage} groupId={group.id} />
      </div>
    </div>
  );
}