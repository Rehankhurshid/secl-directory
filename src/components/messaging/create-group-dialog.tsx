'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { X, Users } from 'lucide-react'
import EmployeeSelectionDrawer from '@/components/messaging/employee-selection-drawer'

interface Employee {
  id: string
  empCode: string
  name: string
  designation?: string
  department?: string
  profileImage?: string
}

interface CreateGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employees: Employee[]
  onCreateGroup: (data: {
    name: string
    description?: string
    memberIds: string[]
  }) => void
  isCreating?: boolean
}

export default function CreateGroupDialog({
  open,
  onOpenChange,
  employees,
  onCreateGroup,
  isCreating = false
}: CreateGroupDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<Employee[]>([])
  const [showEmployeeDrawer, setShowEmployeeDrawer] = useState(false)

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      setName('')
      setDescription('')
      setSelectedMembers([])
    }
  }, [open])

  const handleEmployeeSelection = (employees: Employee[]) => {
    setSelectedMembers(employees)
  }

  const removeMember = (employeeId: string) => {
    setSelectedMembers(prev => prev.filter(emp => emp.empCode !== employeeId))
  }

  const handleSubmit = () => {
    console.log('Handle submit called');
    console.log('Name:', name);
    console.log('Selected members:', selectedMembers);
    console.log('Member count:', selectedMembers.length);
    
    if (name.trim() && selectedMembers.length >= 1) { // Changed from 2 to 1 since creator is auto-added
      const groupData = {
        name: name.trim(),
        description: description.trim() || undefined,
        memberIds: selectedMembers.map(emp => emp.empCode)
      };
      console.log('Creating group with data:', groupData);
      
      onCreateGroup(groupData);
      
      // Don't reset form immediately - wait for success callback
      // This prevents the form from clearing before the API call completes
    } else {
      console.log('Validation failed:', {
        nameValid: name.trim().length > 0,
        membersValid: selectedMembers.length >= 2
      });
    }
  }

  const isValid = name.trim().length > 0 && selectedMembers.length >= 1 // Changed from 2 to 1

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>
              Add a name and select at least 2 members for your group.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {/* Group Name */}
            <div className="space-y-2">
              <Label htmlFor="group-name">
                Group Name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="group-name"
                  placeholder="Enter group name"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 50))}
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {name.length}/50
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="What's this group about?"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {description.length}/200
              </p>
            </div>

            {/* Team Members */}
            <div className="space-y-2">
              <Label>
                Team Members <span className="text-destructive">*</span>
              </Label>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowEmployeeDrawer(true)}
                className="w-full justify-start"
              >
                <Users className="w-4 h-4 mr-2" />
                {selectedMembers.length > 0 
                  ? `${selectedMembers.length} member${selectedMembers.length !== 1 ? 's' : ''} selected`
                  : 'Select team members'
                }
              </Button>
              
              <p className="text-xs text-muted-foreground">
                Select at least 1 member to create a group (you will be added automatically)
              </p>

              {/* Selected Members Display */}
              {selectedMembers.length > 0 && (
                <div className="mt-3 space-y-2 max-h-[200px] overflow-y-auto">
                  {selectedMembers.map((member) => (
                    <div key={member.empCode} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{member.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {member.empCode} {member.designation && `• ${member.designation}`}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMember(member.empCode)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isValid || isCreating}
            >
              {isCreating ? 'Creating group...' : 'Create Group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Employee Selection Drawer */}
      <EmployeeSelectionDrawer
        open={showEmployeeDrawer}
        onOpenChange={setShowEmployeeDrawer}
        onSelectEmployees={handleEmployeeSelection}
        initialSelected={selectedMembers}
      />
    </>
  )
}