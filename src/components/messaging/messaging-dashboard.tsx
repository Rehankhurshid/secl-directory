'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Search, Plus, MessageCircle, Users } from 'lucide-react'

interface Group {
  id: number
  name: string
  memberCount: number
  lastMessage?: string
  lastMessageTime?: Date
  unreadCount: number
}

interface MessagingDashboardProps {
  groups: Group[]
  selectedGroupId?: number
  connectionStatus: { connected: boolean; authenticated: boolean }
  onGroupSelect: (group: Group) => void
  onCreateGroup: () => void
  currentUserId: string
  isLoading?: boolean
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'now'
  if (diffInMinutes < 60) return `${diffInMinutes}m`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays}d`
  
  return date.toLocaleDateString()
}

function getGroupInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function ConnectionStatus({ 
  connectionStatus 
}: { 
  connectionStatus: { connected: boolean; authenticated: boolean } 
}) {
  const getStatusConfig = () => {
    if (connectionStatus.connected && connectionStatus.authenticated) {
      return {
        color: 'bg-green-500',
        text: 'Connected',
        textColor: 'text-green-700'
      }
    } else if (connectionStatus.connected && !connectionStatus.authenticated) {
      return {
        color: 'bg-yellow-500',
        text: 'Connecting...',
        textColor: 'text-yellow-700'
      }
    } else {
      return {
        color: 'bg-red-500',
        text: 'Offline',
        textColor: 'text-red-700'
      }
    }
  }

  const status = getStatusConfig()

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b">
      <div className={`w-2 h-2 rounded-full ${status.color}`} />
      <span className={`text-xs font-medium ${status.textColor}`}>
        {status.text}
      </span>
    </div>
  )
}

function GroupCard({ 
  group, 
  isSelected, 
  onClick 
}: { 
  group: Group
  isSelected: boolean
  onClick: () => void 
}) {
  return (
    <Card 
      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
        isSelected ? 'bg-muted border-primary' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* Group Avatar */}
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-primary">
              {getGroupInitials(group.name)}
            </span>
          </div>
          
          {/* Group Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm truncate">{group.name}</h3>
                <Badge variant="secondary" className="text-xs">
                  {group.memberCount}
                </Badge>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {group.lastMessageTime && (
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(group.lastMessageTime)}
                  </span>
                )}
                {group.unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs min-w-[20px] h-5 flex items-center justify-center">
                    {group.unreadCount > 99 ? '99+' : group.unreadCount}
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Last Message Preview */}
            {group.lastMessage && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-tight">
                {group.lastMessage}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function MessagingDashboard({
  groups,
  selectedGroupId,
  connectionStatus,
  onGroupSelect,
  onCreateGroup,
  currentUserId,
  isLoading = false
}: MessagingDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-background">
        <ConnectionStatus connectionStatus={connectionStatus} />
        <div className="flex-1 p-4 space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background relative">
      {/* Sticky header section - accounts for navbar */}
      <div className="sticky top-[64px] md:top-[57px] z-10 bg-background">
        <ConnectionStatus connectionStatus={connectionStatus} />
        <div className="p-4 pb-0">
          <div className="bg-background/95 backdrop-blur-sm border-b pb-3 space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Create Group Button */}
          <Button 
            onClick={onCreateGroup}
            className="w-full"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Group
          </Button>
          </div>
        </div>
      </div>

      {/* Groups List - Scrollable Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4 overscroll-none" style={{ overscrollBehavior: 'none' }}>
          <div className="space-y-2">
            {filteredGroups.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold text-muted-foreground mb-1">
                  {searchQuery ? 'No groups found' : 'No groups yet'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery 
                    ? 'Try adjusting your search terms' 
                    : 'Create your first group to get started'
                  }
                </p>
              </div>
            ) : (
              filteredGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  isSelected={selectedGroupId === group.id}
                  onClick={() => onGroupSelect(group)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}