<Thinking>
I need to create a WhatsApp-style chat interface component with the following requirements:

1. Header with group name, member count, back button (mobile only), connection indicator, fixed top
2. Message area with scrollable messages, auto-scroll to bottom, message bubbles with different styles for own/others, date separators, loading skeleton
3. Message input with auto-resize, send button, character counter
4. Mobile optimizations
5. Use shadcn/ui components, TypeScript, Tailwind CSS

Let me break this down:

1. I'll need to create the main ChatInterface component
2. I'll need separate components for:
   - ChatHeader
   - MessageArea with MessageBubble and DateSeparator
   - MessageInput
3. I'll use shadcn/ui components like Input, Button, ScrollArea, Avatar
4. I'll need to handle auto-scroll, auto-resize textarea, character counting
5. I'll need to make it responsive and mobile-friendly

Let me structure this properly:

1. Main ChatInterface component
2. ChatHeader component
3. MessageArea component with MessageBubble and DateSeparator
4. MessageInput component
5. Proper TypeScript interfaces
6. Mobile-first responsive design
7. Accessibility considerations

I'll need to use "use client" since this will have interactive elements like useState, useEffect, useRef.

For the auto-scroll functionality, I'll use useRef and useEffect.
For the auto-resize textarea, I'll use useRef and handle the resize logic.
For date formatting, I'll create utility functions.
For the loading skeleton, I'll create a simple skeleton component.

Let me start coding this step by step.
</Thinking>

I'll create a comprehensive WhatsApp-style chat interface with all the features you requested. Let me build this with proper component separation and mobile optimization.

```tsx file="components/chat-interface.tsx"
'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ArrowLeft, Send, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  content: string
  senderId: string
  senderName: string
  createdAt: Date
  status?: 'sending' | 'sent' | 'delivered' | 'read'
}

interface ChatInterfaceProps {
  group: { id: number; name: string; memberCount: number }
  messages: Message[]
  currentUserId: string
  onSendMessage: (content: string) => void
  onBack?: () => void
  isLoading?: boolean
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
  
  const currentDate = new Date(currentMessage.createdAt).toDateString()
  const previousDate = new Date(previousMessage.createdAt).toDateString()
  
  return currentDate !== previousDate
}

// Loading skeleton component
const MessageSkeleton = () => (
  <div className="flex items-start gap-2 mb-4">
    <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
    <div className="flex-1 max-w-[80%] md:max-w-[60%]">
      <div className="h-3 bg-muted rounded animate-pulse mb-2 w-20" />
      <div className="bg-muted rounded-lg p-3 animate-pulse">
        <div className="h-4 bg-muted-foreground/20 rounded mb-2" />
        <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
      </div>
    </div>
  </div>
)

// Date separator component
const DateSeparator = ({ date }: { date: Date }) => (
  <div className="flex items-center justify-center my-4">
    <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
      {formatDateSeparator(date)}
    </div>
  </div>
)

// Message bubble component
const MessageBubble = ({ 
  message, 
  isOwn, 
  showSender 
}: { 
  message: Message
  isOwn: boolean
  showSender: boolean
}) => {
  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <Circle className="w-3 h-3 text-muted-foreground animate-pulse" />
      case 'sent':
        return <div className="w-3 h-3 text-muted-foreground">✓</div>
      case 'delivered':
        return <div className="w-3 h-3 text-muted-foreground">✓✓</div>
      case 'read':
        return <div className="w-3 h-3 text-blue-500">✓✓</div>
      default:
        return null
    }
  }

  return (
    <div className={cn(
      "flex mb-4 max-w-[80%] md:max-w-[60%]",
      isOwn ? "ml-auto" : "mr-auto"
    )}>
      {!isOwn && (
        <Avatar className="w-8 h-8 mr-2 flex-shrink-0">
          <AvatarFallback className="text-xs">
            {message.senderName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn("flex flex-col", isOwn && "items-end")}>
        {!isOwn && showSender && (
          <span className="text-xs text-muted-foreground mb-1 px-1">
            {message.senderName}
          </span>
        )}
        
        <div className={cn(
          "rounded-lg px-3 py-2 break-words",
          isOwn 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted"
        )}>
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>
        
        <div className={cn(
          "flex items-center gap-1 mt-1 px-1",
          isOwn ? "flex-row-reverse" : "flex-row"
        )}>
          <span className="text-xs text-muted-foreground">
            {formatTime(message.createdAt)}
          </span>
          {isOwn && getStatusIcon()}
        </div>
      </div>
    </div>
  )
}

// Chat header component
const ChatHeader = ({ 
  group, 
  onBack, 
  isConnected = true 
}: { 
  group: { name: string; memberCount: number }
  onBack?: () => void
  isConnected?: boolean
}) => (
  <div className="flex items-center gap-3 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
    {onBack && (
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="md:hidden p-2 h-auto"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="sr-only">Go back</span>
      </Button>
    )}
    
    <Avatar className="w-10 h-10">
      <AvatarFallback>
        {group.name.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
    
    <div className="flex-1 min-w-0">
      <h1 className="font-semibold text-sm truncate">{group.name}</h1>
      <div className="flex items-center gap-2">
        <div className={cn(
          "w-2 h-2 rounded-full",
          isConnected ? "bg-green-500" : "bg-red-500"
        )} />
        <span className="text-xs text-muted-foreground">
          {group.memberCount} members
        </span>
      </div>
    </div>
  </div>
)

// Message input component
const MessageInput = ({ 
  onSendMessage, 
  disabled = false 
}: { 
  onSendMessage: (content: string) => void
  disabled?: boolean
}) => {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const scrollHeight = textarea.scrollHeight
      const maxHeight = 4 * 24 // 4 lines * line height
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`
    }
  }
  
  useEffect(() => {
    adjustTextareaHeight()
  }, [message])
  
  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim())
      setMessage('')
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }
  
  const charCount = message.length
  const showCharCount = charCount > 500
  
  return (
    <div className="border-t bg-background p-4 pb-safe">
      {showCharCount && (
        <div className="text-xs text-muted-foreground mb-2 text-right">
          {charCount}/1000
        </div>
      )}
      
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled}
            maxLength={1000}
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[40px] max-h-24"
            rows={1}
          />
        </div>
        
        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          size="sm"
          className="h-10 w-10 rounded-full p-0 flex-shrink-0"
        >
          <Send className="w-4 h-4" />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
    </div>
  )
}

// Main chat interface component
export default function ChatInterface({
  group,
  messages,
  currentUserId,
  onSendMessage,
  onBack,
  isLoading = false
}: ChatInterfaceProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isAtBottom && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages, isAtBottom])
  
  // Check if user is at bottom of scroll area
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const threshold = 100
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < threshold)
  }
  
  return (
    <div className="flex flex-col h-screen max-h-screen bg-background">
      <ChatHeader group={group} onBack={onBack} />
      
      <ScrollArea 
        ref={scrollAreaRef}
        className="flex-1 px-4"
        onScrollCapture={handleScroll}
      >
        <div className="py-4">
          {messages.map((message, index) => {
            const previousMessage = index > 0 ? messages[index - 1] : undefined
            const showDateSeparator = shouldShowDateSeparator(message, previousMessage)
            const isOwn = message.senderId === currentUserId
            const showSender = !isOwn && (
              !previousMessage || 
              previousMessage.senderId !== message.senderId ||
              shouldShowDateSeparator(message, previousMessage)
            )
            
            return (
              <React.Fragment key={message.id}>
                {showDateSeparator && <DateSeparator date={message.createdAt} />}
                <MessageBubble
                  message={message}
                  isOwn={isOwn}
                  showSender={showSender}
                />
              </React.Fragment>
            )
          })}
          
          {isLoading && (
            <>
              <MessageSkeleton />
              <MessageSkeleton />
            </>
          )}
        </div>
      </ScrollArea>
      
      <MessageInput onSendMessage={onSendMessage} disabled={isLoading} />
    </div>
  )
}
```

```tsx file="app/chat/page.tsx"
'use client'

import { useState } from 'react'
import ChatInterface from '@/components/chat-interface'

// Sample data for demonstration
const sampleGroup = {
  id: 1,
  name: 'Team Discussion',
  memberCount: 8
}

const sampleMessages = [
  {
    id: '1',
    content: 'Hey everyone! How are the project updates coming along?',
    senderId: 'user2',
    senderName: 'Alice Johnson',
    createdAt: new Date(Date.now() - 86400000), // Yesterday
    status: 'read' as const
  },
  {
    id: '2',
    content: 'Making good progress on the frontend components. Should have the first draft ready by tomorrow.',
    senderId: 'current-user',
    senderName: '