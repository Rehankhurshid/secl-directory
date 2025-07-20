'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Send, Paperclip, Smile, MoreVertical, Circle, Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSocketStore } from '@/lib/socket/client';

interface Message {
  id: string;
  text: string;
  timestamp: string;
  sender: {
    id: string;
    name: string;
  };
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

interface ChatInterfaceProps {
  group: { id: number; name: string; memberCount: number }
  messages: Message[]
  currentUserId: string
  onSendMessage: (content: string) => void
  onBack?: () => void
  isLoading?: boolean
  isFetching?: boolean
}

// Utility functions
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

const formatDateSeparator = (date: Date) => {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  } else {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
}

const shouldShowDateSeparator = (currentMessage: Message, previousMessage?: Message) => {
  if (!previousMessage) return true
  return new Date(currentMessage.timestamp).toDateString() !== new Date(previousMessage.timestamp).toDateString()
}

function MessageStatus({ status }: { status?: string }) {
  if (!status || status === 'sending') {
    return <Circle className="w-3 h-3 text-muted-foreground" />
  }
  
  if (status === 'sent') {
    return <Check className="w-3 h-3 text-muted-foreground" />
  }
  
  if (status === 'delivered') {
    return <CheckCheck className="w-3 h-3 text-muted-foreground" />
  }
  
  if (status === 'read') {
    return <CheckCheck className="w-3 h-3 text-blue-500" />
  }
  
  return null
}

function MessageBubble({ 
  message, 
  isOwnMessage 
}: { 
  message: Message
  isOwnMessage: boolean 
}) {
  return (
    <div className={cn(
      "flex w-full mb-4",
      isOwnMessage ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[80%] md:max-w-[60%] rounded-2xl px-4 py-2",
        isOwnMessage 
          ? "bg-primary text-primary-foreground rounded-br-sm" 
          : "bg-muted rounded-bl-sm"
      )}>
        {!isOwnMessage && (
          <p className="text-xs font-semibold mb-1 opacity-70">
            {message.sender.name}
          </p>
        )}
        <p className="text-sm break-words">{message.text}</p>
        <div className={cn(
          "flex items-center justify-between mt-1 text-xs gap-2",
          isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          <span>{formatTime(new Date(message.timestamp))}</span>
          {isOwnMessage && message.status && <MessageStatus status={message.status} />}
        </div>
      </div>
    </div>
  )
}

function ChatHeader({ 
  group, 
  onBack,
  isFetching 
}: { 
  group: { name: string; memberCount: number }
  onBack?: () => void 
  isFetching?: boolean
}) {
  return (
    <div className="sticky top-[64px] md:top-[57px] z-10 bg-background backdrop-blur-md border-b border-border/50 shadow-sm">
      <div className="p-4">
        <div className="flex items-center gap-3">
          {/* Back Button - Mobile Only */}
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="md:hidden h-8 w-8"
              title="Back to groups"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          
          {/* Group Info Section */}
          <div className="flex items-center gap-3 flex-1">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {group.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              {/* Online Status Indicator */}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-base truncate">{group.name}</h2>
                {isFetching && (
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" title="Updating..." />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MessageInput({ 
  onSendMessage,
  groupId 
}: { 
  onSendMessage: (content: string) => void
  groupId: number 
}) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const startTyping = useSocketStore(state => state.startTyping)
  const stopTyping = useSocketStore(state => state.stopTyping)

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    
    // Handle typing indicator
    if (e.target.value.trim()) {
      startTyping(groupId)
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      // Set new timeout to stop typing after 2 seconds
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(groupId)
      }, 2000)
    } else {
      stopTyping(groupId)
    }
    
    // Auto-resize logic
    const textarea = textareaRef.current
    if (textarea) {
      // Reset height to auto to get accurate scrollHeight
      textarea.style.height = 'auto'
      
      // Calculate new height, but limit it
      const maxHeight = 120 // 4 lines approximately
      const newHeight = Math.min(textarea.scrollHeight, maxHeight)
      textarea.style.height = `${newHeight}px`
    }
  }

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim())
      setMessage('')
      stopTyping(groupId)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t p-4 bg-background sticky bottom-0">
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInput}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="w-full px-4 py-2 pr-16 text-sm border rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary bg-background overflow-y-auto"
            style={{ 
              minHeight: '40px',
              maxHeight: '120px',
              height: '40px'
            }}
          />
          {message.length > 500 && (
            <span className="absolute bottom-2 right-12 text-xs text-muted-foreground">
              {message.length}/1000
            </span>
          )}
        </div>
        <Button
          onClick={handleSend}
          disabled={!message.trim()}
          size="icon"
          className="rounded-full h-10 w-10"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

export default function ChatInterface({
  group,
  messages,
  currentUserId,
  onSendMessage,
  onBack,
  isLoading = false,
  isFetching = false
}: ChatInterfaceProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingUsers = useSocketStore(state => state.typingUsers)
  const onTypingStart = useSocketStore(state => state.onTypingStart)
  const onTypingStop = useSocketStore(state => state.onTypingStop)
  const [typingUsersList, setTypingUsersList] = useState<string[]>([])
  
  // Get typing users for this group
  const groupTypingUsers = typingUsers.get(group.id) || new Set()

  // Update typing users list
  useEffect(() => {
    const usersList = Array.from(groupTypingUsers).filter(userId => userId !== currentUserId)
    // Only update if the list has actually changed
    setTypingUsersList(prev => {
      const hasChanged = prev.length !== usersList.length || 
        prev.some((id, idx) => id !== usersList[idx])
      return hasChanged ? usersList : prev
    })
  }, [groupTypingUsers, currentUserId])
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    // Use a small delay to avoid conflicts with React's rendering
    const timeoutId = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
    
    return () => clearTimeout(timeoutId)
  }, [messages.length]) // Only depend on message count, not the entire array

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <ChatHeader group={group} {...(onBack && { onBack })} isFetching={false} />
        <div className="flex-1 p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={cn(
              "flex w-full",
              i % 2 === 0 ? "justify-start" : "justify-end"
            )}>
              <div className="max-w-[60%] space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-16 w-48 rounded-2xl" />
              </div>
            </div>
          ))}
        </div>
        <MessageInput onSendMessage={onSendMessage} groupId={group.id} />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <ChatHeader group={group} onBack={onBack} isFetching={isFetching} />
      
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 overscroll-none" style={{ overscrollBehavior: 'none' }}>
        {messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const previousMessage = index > 0 ? messages[index - 1] : undefined
              const showDateSeparator = shouldShowDateSeparator(message, previousMessage)
              const isOwnMessage = message.sender.id === currentUserId

              return (
                <React.Fragment key={message.id}>
                  {showDateSeparator && (
                    <div className="flex items-center justify-center my-4">
                      <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                        {formatDateSeparator(new Date(message.timestamp))}
                      </div>
                    </div>
                  )}
                  <MessageBubble
                    message={message}
                    isOwnMessage={isOwnMessage}
                  />
                </React.Fragment>
              )
            })}
            
            {/* Typing indicator */}
            {typingUsersList.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>
                  {typingUsersList.length === 1 
                    ? `${typingUsersList[0]} is typing...`
                    : `${typingUsersList.length} people are typing...`
                  }
                </span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </ScrollArea>
      
      <MessageInput onSendMessage={onSendMessage} groupId={group.id} />
    </div>
  )
}