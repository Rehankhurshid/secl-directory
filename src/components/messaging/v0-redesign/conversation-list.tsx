'use client'

import { Group } from './types'
import ConversationItem from './conversation-item'
import { Skeleton } from '@/components/ui/skeleton'
import { Pin } from 'lucide-react'

interface ConversationListProps {
  loading: boolean
  pinnedGroups: Group[]
  otherGroups: Group[]
  onSelectGroup: (group: Group) => void
  selectedGroupId?: string
}

const ConversationSkeleton = () => (
  <div className="flex items-center gap-3 px-4 py-3">
    <Skeleton className="h-12 w-12 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  </div>
)

export default function ConversationList({ loading, pinnedGroups, otherGroups, onSelectGroup, selectedGroupId }: ConversationListProps) {
  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto">
        {Array.from({ length: 10 }).map((_, i) => (
          <ConversationSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {pinnedGroups.length > 0 && (
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
            <Pin className="h-3 w-3" /> Pinned
          </h2>
        </div>
      )}
      {pinnedGroups.map((group) => (
        <ConversationItem
          key={group.id}
          group={group}
          onSelect={onSelectGroup}
          isSelected={selectedGroupId === group.id}
        />
      ))}
      
      {otherGroups.length > 0 && pinnedGroups.length > 0 && <div className="px-4 pt-4 pb-2">
          <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">All Messages</h2>
        </div>}
        
      {otherGroups.map((group) => (
        <ConversationItem
          key={group.id}
          group={group}
          onSelect={onSelectGroup}
          isSelected={selectedGroupId === group.id}
        />
      ))}
    </div>
  )
}