'use client'

import { Group } from './types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Search, Phone, Video, MoreVertical, Pin, BellOff, Archive, PanelLeft } from 'lucide-react'

interface ChatHeaderProps {
  group: Group,
  onSidebarToggle: () => void
}

export default function ChatHeader({ group, onSidebarToggle }: ChatHeaderProps) {
  return (
    <header className="flex items-center p-4 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
      <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={onSidebarToggle}>
        <PanelLeft className="h-5 w-5" />
      </Button>
      <Avatar className="h-10 w-10 border-2 border-neutral-700">
        <AvatarImage src={group.avatar} alt={group.name} />
        <AvatarFallback>{group.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="ml-3">
        <h2 className="font-semibold text-neutral-100">{group.name}</h2>
        <p className="text-sm text-neutral-400">{group.memberCount} members</p>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Search className="h-5 w-5 text-neutral-400" />
        </Button>
        <Button variant="ghost" size="icon">
          <Phone className="h-5 w-5 text-neutral-400" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5 text-neutral-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 bg-neutral-800 border-neutral-700 text-neutral-200">
            <DropdownMenuItem><Pin className="mr-2 h-4 w-4" /> Pin Conversation</DropdownMenuItem>
            <DropdownMenuItem><BellOff className="mr-2 h-4 w-4" /> Mute Notifications</DropdownMenuItem>
            <DropdownMenuItem><Archive className="mr-2 h-4 w-4" /> Archive</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}