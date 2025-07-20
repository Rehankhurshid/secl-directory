'use client'

import { useState } from 'react'
import { useMockData } from './use-mock-data'
import ConversationSidebar from './conversation-sidebar'
import ChatInterface from './chat-interface'
import { Group } from './types'

export default function MessagingLayout() {
  const { employees, groups, chatData, loading, chatLoading, fetchChatData } = useMockData()
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const handleSelectGroup = (group: Group) => {
    setSelectedGroup(group)
    fetchChatData(group.id)
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false)
    }
  }

  return (
    <div className="flex h-screen w-full bg-neutral-900 text-neutral-200 overflow-hidden">
      <ConversationSidebar
        groups={groups}
        employees={employees}
        loading={loading}
        onSelectGroup={handleSelectGroup}
        selectedGroupId={selectedGroup?.id}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      <main className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen && 'md:ml-[350px]'}`}>
        <ChatInterface
          chatData={chatData}
          loading={chatLoading}
          onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      </main>
    </div>
  )
}