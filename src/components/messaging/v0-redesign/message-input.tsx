'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Send, Paperclip, Mic, Smile, Image as ImageIcon, FileText } from 'lucide-react'

export default function MessageInput() {
  const [message, setMessage] = useState('')

  return (
    <div className="p-4 border-t border-neutral-800 bg-neutral-900">
      <div className="relative flex items-end gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Paperclip className="h-5 w-5 text-neutral-400" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40 bg-neutral-800 border-neutral-700 text-neutral-200 p-2">
            <Button variant="ghost" className="w-full justify-start"><ImageIcon className="mr-2 h-4 w-4" /> Image</Button>
            <Button variant="ghost" className="w-full justify-start"><FileText className="mr-2 h-4 w-4" /> Document</Button>
          </PopoverContent>
        </Popover>
        <Textarea
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={1}
          className="flex-1 resize-none bg-neutral-800 border-neutral-700 min-h-[40px] max-h-[120px] focus-visible:ring-1 focus-visible:ring-green-500"
        />
        <Button variant="ghost" size="icon" className="shrink-0">
          <Smile className="h-5 w-5 text-neutral-400" />
        </Button>
        {message ? (
          <Button size="icon" className="shrink-0 bg-green-500 hover:bg-green-600">
            <Send className="h-5 w-5 text-white" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className="shrink-0">
            <Mic className="h-5 w-5 text-neutral-400" />
          </Button>
        )}
      </div>
    </div>
  )
}