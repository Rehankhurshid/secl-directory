'use client'

import { useState } from 'react'
import { Employee } from './types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import EmployeeSelectionDrawer from './employee-selection-drawer'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { X } from 'lucide-react'

interface CreateGroupDialogProps {
  employees: Employee[]
  triggerButton: React.ReactNode;
}

export default function CreateGroupDialog({ employees, triggerButton }: CreateGroupDialogProps) {
  const [selectedMembers, setSelectedMembers] = useState<Employee[]>([])

  return (
    <Dialog>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="sm:max-w-[525px] bg-neutral-900 border-neutral-800 text-neutral-200">
        <DialogHeader>
          <DialogTitle className="text-xl">Create New Group</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" placeholder="Project Alpha Team" className="col-span-3 bg-neutral-800 border-neutral-700" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Description</Label>
            <Textarea id="description" placeholder="Optional description for the group" className="col-span-3 bg-neutral-800 border-neutral-700" />
          </div>
          <div>
            <Label>Members</Label>
             <div className="mt-2 flex flex-wrap gap-2">
              {selectedMembers.map(member => (
                <div key={member.id} className="bg-neutral-800 rounded-full flex items-center p-1 gap-2">
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={member.profileImage} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{member.name}</span>
                    <button onClick={() => setSelectedMembers(selectedMembers.filter(m => m.id !== member.id))} className="mr-1">
                        <X className="h-3 w-3 text-neutral-400 hover:text-white" />
                    </button>
                </div>
              ))}
            </div>
            <EmployeeSelectionDrawer
                employees={employees}
                selectedMembers={selectedMembers}
                setSelectedMembers={setSelectedMembers}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
            Create Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}