'use client'

import { useState } from 'react'
import { Group, Employee } from './types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Plus, Search, Wifi, WifiOff } from 'lucide-react'
import ConversationList from './conversation-list'
import CreateGroupDialog from './create-group-dialog'

interface ConversationSidebarProps {
  groups: Group[]
  employees: Employee[]
  loading: boolean
  onSelectGroup: (group: Group) => void
  selectedGroupId?: string
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export default function ConversationSidebar({
  groups,
  employees,
  loading,
  onSelectGroup,
  selectedGroupId,
  isOpen,
  setIsOpen
}: ConversationSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isOnline, setIsOnline] = useState(true) // Mock connection status

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const pinnedGroups = filteredGroups.filter(g => g.isPinned);
  const otherGroups = filteredGroups.filter(g => !g.isPinned);


  const content = (
     <div className="flex flex-col h-full bg-neutral-900/80 backdrop-blur-xl border-r border-neutral-800">
      <div className="p-4 border-b border-neutral-800">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-neutral-100">Messages</h1>
           <CreateGroupDialog employees={employees} triggerButton={<Button variant="ghost" size="icon"><Plus className="h-5 w-5" /></Button>} />
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-neutral-800 border-neutral-700 focus:ring-green-500 focus:ring-offset-neutral-900"
          />
        </div>
      </div>
      <ConversationList
        loading={loading}
        pinnedGroups={pinnedGroups}
        otherGroups={otherGroups}
        onSelectGroup={onSelectGroup}
        selectedGroupId={selectedGroupId}
      />
      <div className="mt-auto p-4 border-t border-neutral-800">
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          {isOnline ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
          <span>{isOnline ? 'Connected' : 'Offline'}</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
       {/* Mobile sidebar */}
      <Sheet open={isOpen && window.innerWidth < 768} onOpenChange={setIsOpen}>
          <SheetContent side="left" className="p-0 w-[350px] bg-transparent border-none">
              {content}
          </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-[350px] z-20 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 hidden md:block`}>
        {content}
      </aside>
    </>
  )
}