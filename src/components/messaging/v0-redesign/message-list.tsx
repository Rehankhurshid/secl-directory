'use client'

import { Message } from './types'
import MessageItem from './message-item'
import { AnimatePresence } from 'framer-motion'
import { Separator } from '@/components/ui/separator'

interface MessageListProps {
  messages: Message[]
  currentUser: { id: string; name: string; avatar: string }
}

export default function MessageList({ messages, currentUser }: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar">
      <AnimatePresence>
        <div className="text-center my-4">
          <Separator className="bg-neutral-800" />
          <span className="text-xs text-neutral-500 bg-neutral-950 px-2 relative -top-2.5">Today</span>
        </div>
        {messages.map((message, index) => {
           const prevMessage = messages[index - 1];
           const showAvatar = !prevMessage || prevMessage.sender.id !== message.sender.id;
          return (
          <MessageItem key={message.id} message={message} isCurrentUser={message.sender.id === currentUser.id} showAvatar={showAvatar} />
        )})}
      </AnimatePresence>
      <div className="text-neutral-500 text-sm flex items-center gap-2 p-2">
          <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-neutral-400"></div>
          Alice is typing...
      </div>
    </div>
  )
}