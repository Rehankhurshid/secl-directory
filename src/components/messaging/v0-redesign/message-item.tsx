'use client'

import { motion } from 'framer-motion'
import { Message } from './types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Check, CheckCheck, Clock, SmilePlus } from 'lucide-react'

interface MessageItemProps {
  message: Message
  isCurrentUser: boolean
  showAvatar: boolean
}

const ReadStatus = ({ status }: { status: Message['status'] }) => {
  switch (status) {
    case 'sending':
      return <Clock className="h-3 w-3 text-neutral-500" />
    case 'sent':
      return <Check className="h-3 w-3 text-neutral-500" />
    case 'delivered':
      return <CheckCheck className="h-3 w-3 text-neutral-500" />
    case 'read':
      return <CheckCheck className="h-3 w-3 text-green-500" />
    default:
      return null
  }
}

export default function MessageItem({ message, isCurrentUser, showAvatar }: MessageItemProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -50 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`flex items-end gap-2 group ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isCurrentUser && (
        <Avatar className={`h-8 w-8 self-end transition-opacity duration-300 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
          <AvatarImage src={message.sender.avatar} />
          <AvatarFallback>{message.sender.name.charAt(0)}</AvatarFallback>
        </Avatar>
      )}
      <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
        {!isCurrentUser && showAvatar && (
            <span className="text-xs text-neutral-400 mb-1">{message.sender.name}</span>
        )}
        <div
          className={`relative flex items-center p-3 rounded-2xl max-w-sm md:max-w-md lg:max-w-lg break-words
            ${
              isCurrentUser
                ? 'bg-gradient-to-br from-green-500 to-green-600 text-white rounded-br-md'
                : 'bg-neutral-800 text-neutral-200 rounded-bl-md'
            }`}
        >
          <p>{message.text}</p>
          <div className="absolute -bottom-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-neutral-700 p-1 rounded-full cursor-pointer"
             style={isCurrentUser ? {left: '-10px'} : {right: '-10px'}}>
              <SmilePlus className="h-4 w-4 text-neutral-300 hover:text-white" />
          </div>
        </div>
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-xs text-neutral-500">{message.timestamp}</span>
                        {isCurrentUser && <ReadStatus status={message.status} />}
                    </div>
                </TooltipTrigger>
                <TooltipContent className="bg-neutral-800 border-neutral-700 text-neutral-200">
                    <p>{new Date().toLocaleString()}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
      </div>
    </motion.div>
  )
}