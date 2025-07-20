<Thinking>
I need to create a comprehensive messaging dashboard for an employee directory PWA. Let me break down the requirements:

1. **Layout**: 
   - Desktop: Split view (1/3 groups list, 2/3 chat area)
   - Mobile: Full screen views with navigation
   - Header with connection status and create group button

2. **Groups List**:
   - Group cards with name, member count badge, last message preview (max 2 lines), unread count badge, time ago, group avatar with fallback initials
   - Search/filter input at top
   - Loading skeletons
   - Empty state

3. **Connection Status**:
   - Green dot + "Connected" when online
   - Yellow dot + "Connecting..." when connecting  
   - Red dot + "Offline" when disconnected
   - Minimal height, subtle styling

4. **Chat Area**:
   - Show selected group's chat or placeholder
   - "Select a group to start chatting" when none selected

5. **Props**: The interfaces are provided

I need to use shadcn/ui components (Card, Input, Badge, ScrollArea, Skeleton), TypeScript, and Tailwind CSS with mobile-first responsive design.

Let me structure this:
1. Main MessagingDashboard component
2. ConnectionStatus component
3. GroupsList component  
4. GroupCard component
5. ChatArea component
6. Helper functions for time formatting

I'll need to handle:
- Mobile vs desktop layouts
- Loading states with skeletons
- Empty states
- Time formatting
- Avatar fallbacks
- Responsive design
- Connection status styling
</Thinking>

I'll create a comprehensive messaging dashboard with a mobile-first responsive design. Let me build this step by step with all the required components.

```tsx file="components/messaging-dashboard.tsx"
'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Search, Plus, MessageCircle, Users, ArrowLeft } from 'lucide-react'

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

function GroupsList({ 
  groups, 
  selectedGroupId, 
  onGroupSelect, 
  onCreateGroup,
  isLoading 
}: {
  groups: Group[]
  selectedGroupId?: number
  onGroupSelect: (group: Group) => void
  onCreateGroup: () => void
  isLoading?: boolean
}) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="space-y-3">
        {/* Search Skeleton */}
        <Skeleton className="h-10 w-full" />
        
        {/* Group Card Skeletons */}
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
    )
  }

  return (
    <div className="space-y-3">
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

      {/* Groups List */}
      <ScrollArea className="h-[calc(100vh-200px)]">
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
  )
}

function ChatArea({ 
  selectedGroup 
}: { 
  selectedGroup?: Group 
}) {
  if (!selectedGroup) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/20">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            Select a group to start chatting
          </h3>
          <p className="text-muted-foreground">
            Choose a group from the sidebar to view your conversation
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b p-4 bg-background">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {getGroupInitials(selectedGroup.name)}
            </span>
          </div>
          <div>
            <h2 className="font-semibold">{selectedGroup.name}</h2>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="w-3 h-3" />
              <span>{selectedGroup.memberCount} members</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 p-4 bg-muted/20">
        <div className="text-center text-muted-foreground">
          <MessageCircle className="w-8 h-8 mx-auto mb-2" />
          <p>Chat interface would go here</p>
        </div>
      </div>
    </div>
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
  const [showMobileChat, setShowMobileChat] = useState(false)
  const selectedGroup = groups.find(g => g.id === selectedGroupId)

  const handleGroupSelect = (group: Group) => {
    onGroupSelect(group)
    setShowMobileChat(true)
  }

  const handleBackToGroups = () => {
    setShowMobileChat(false)
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Connection Status Header */}
      <ConnectionStatus connectionStatus={connectionStatus} />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile Layout */}
        <div className="md:hidden w-full">
          {!showMobileChat ? (
            /* Groups List - Mobile */
            <div className="h-full p-4">
              <GroupsList
                groups={groups}
                selectedGroupId={selectedGroupId}
                onGroupSelect={handleGroupSelect}
                onCreateGroup={onCreateGroup}
                isLoading={isLoading}
              />
            </div>
          ) : (
            /* Chat Area - Mobile */
            <div className="h-full flex flex-col">
              {/* Mobile Chat Header with Back Button */}
              <div className="border-b p-4 bg-background">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToGroups}
                    className="p-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  {selectedGroup && (
                    <>
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {getGroupInitials(selectedGroup.name)}
                        </span>
                      </div>
                      <div>
                        <h2 className="font-semibold">{selectedGroup.name}</h2>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="w-3 h-3" />
                          <span>{selectedGroup.memberCount} members</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Mobile Chat Content */}
              <div className="flex-1 p-4 bg-muted/