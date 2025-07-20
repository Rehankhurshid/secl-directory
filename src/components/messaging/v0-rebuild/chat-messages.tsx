'use client';

import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import MessageBubble from './message-bubble';
import { Message } from './types';
import { shouldShowDateSeparator, formatDateSeparator } from './utils';
// Mock hook - replace with your actual implementation
import { useSocketStore } from '@/lib/socket/client';

interface ChatMessagesProps {
  messages: Message[];
  currentUserId: string;
  groupId: number;
}

export interface ChatMessagesRef {
  scrollToBottom: () => void;
}

function TypingIndicator({ users, currentUserId }: { users: Set<string>, currentUserId: string }) {
  const typingUsers = Array.from(users).filter(id => id && id !== currentUserId);

  if (typingUsers.length === 0) return null;

  const names = typingUsers.slice(0, 2).join(', ');
  const additional = typingUsers.length > 2 ? ` and ${typingUsers.length - 2} others` : '';
  const text = `${names}${additional} ${typingUsers.length === 1 ? 'is' : 'are'} typing...`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center gap-2 px-6 py-2 text-sm text-muted-foreground"
    >
      <div className="flex gap-1 items-center">
          <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>{text}</span>
    </motion.div>
  );
}


const ChatMessages = forwardRef<ChatMessagesRef, ChatMessagesProps>(
  ({ messages, currentUserId, groupId }, ref) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingUsers = useSocketStore(state => state.typingUsers);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  useImperativeHandle(ref, () => ({
    scrollToBottom
  }));

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);

  // Also scroll when messages length changes (more reliable)
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const groupTypingUsers = typingUsers.get(groupId) || new Set();

  return (
    <div 
      className="h-full overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50" 
      ref={scrollContainerRef}
    >
      <div className="p-4 md:p-6 pb-2 space-y-2">
        {messages.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="font-semibold">No messages yet</h3>
            <p className="text-muted-foreground text-sm">Be the first to say something!</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((message, index) => {
              const previousMessage = index > 0 ? messages[index - 1] : undefined;
              const showSeparator = shouldShowDateSeparator(message, previousMessage);
              const isOwn = message.sender?.id === currentUserId;

              return (
                <motion.div
                  key={message.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  {showSeparator && (
                    <div className="flex justify-center my-4">
                      <div className="text-xs text-muted-foreground bg-background px-3 py-1 rounded-full border">
                        {formatDateSeparator(new Date(message.timestamp))}
                      </div>
                    </div>
                  )}
                  <MessageBubble message={message} isOwnMessage={isOwn} />
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <TypingIndicator users={groupTypingUsers} currentUserId={currentUserId} />
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
});

ChatMessages.displayName = 'ChatMessages';

export default ChatMessages;