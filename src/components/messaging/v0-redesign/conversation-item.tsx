'use client'

import { motion } from 'framer-motion'
import { Group } from './types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Archive } from 'lucide-react'

interface ConversationItemProps {
  group: Group
  onSelect: (group: Group) => void
  isSelected: boolean
}

export default function ConversationItem({ group, onSelect, isSelected }: ConversationItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(event, info) => {
          if (info.offset.x < -100) {
            console.log(`Archiving ${group.name}`) // Add archive logic here
          }
        }}
        className={`w-full px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors duration-200 z-10 bg-neutral-900/80 ${
          isSelected
            ? 'bg-green-500/10'
            : 'hover:bg-neutral-800/70'
        }`}
        onClick={() => onSelect(group)}
      >
        <Avatar className="h-12 w-12 border-2 border-neutral-700">
          <AvatarImage src={group.avatar} alt={group.name} />
          <AvatarFallback>{group.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 truncate">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-neutral-100 truncate">{group.name}</h3>
            <span className="text-xs text-neutral-400">{group.lastMessageTime}</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <p className="text-sm text-neutral-400 truncate">{group.lastMessage}</p>
            {group.unreadCount > 0 && (
              <Badge className="bg-green-500 text-neutral-900 font-bold hover:bg-green-600">
                {group.unreadCount}
              </Badge>
            )}
          </div>
        </div>
      </motion.div>
      <div className="absolute top-0 right-0 h-full flex items-center bg-neutral-700 px-6 text-neutral-200 z-0">
        <Archive className="h-5 w-5" />
      </div>
    </motion.div>
  )
}