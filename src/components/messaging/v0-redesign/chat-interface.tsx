'use client'

import { ChatData } from './types'
import ChatHeader from './chat-header'
import MessageList from './message-list'
import MessageInput from './message-input'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageSquare } from 'lucide-react'

interface ChatInterfaceProps {
  chatData: ChatData | null
  loading: boolean
  onSidebarToggle: () => void
}

const ChatSkeleton = () => (
  <div className="flex flex-col h-full">
    <div className="flex items-center p-4 border-b border-neutral-800">
      <Skeleton className="h-10 w-10 rounded-full mr-3" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="ml-auto flex gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
    <div className="flex-1 p-6 space-y-4">
       <Skeleton className="h-12 w-3/4 self-start rounded-lg" />
       <Skeleton className="h-16 w-1/2 self-end rounded-lg" />
       <Skeleton className="h-8 w-2/3 self-start rounded-lg" />
       <Skeleton className="h-12 w-3/4 self-end rounded-lg" />
    </div>
    <div className="p-4 border-t border-neutral-800">
       <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  </div>
)

export default function ChatInterface({ chatData, loading, onSidebarToggle }: ChatInterfaceProps) {
  if (loading) {
    return <ChatSkeleton />
  }

  if (!chatData) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-neutral-500">
        <MessageSquare className="h-16 w-16 mb-4" />
        <h2 className="text-2xl font-semibold">Select a conversation</h2>
        <p>Choose from your existing conversations to start chatting.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-neutral-950">
      <ChatHeader group={chatData.groupInfo} onSidebarToggle={onSidebarToggle} />
      <MessageList messages={chatData.messages} currentUser={{ id: 'user-1', name: 'You', avatar: 'https://i.pravatar.cc/150?u=you' }} />
      <MessageInput />
    </div>
  )
}