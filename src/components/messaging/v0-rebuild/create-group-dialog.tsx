'use client'

import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Users, Loader2 } from 'lucide-react';
import { Employee } from './types';
import { getInitials } from './utils';
import EmployeeSelectionDrawer from './employee-selection-drawer';

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  onCreateGroup: (data: { name: string; description?: string; memberIds: string[] }) => void;
  isCreating?: boolean;
  isLoadingEmployees?: boolean;
}

export default function CreateGroupDialog({
  open, onOpenChange, employees, onCreateGroup, isCreating = false, isLoadingEmployees = false
}: CreateGroupDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Employee[]>([]);
  const [showEmployeeDrawer, setShowEmployeeDrawer] = useState(false);

  useEffect(() => {
    if (!open) {
      // Reset form on close
      setName('');
      setDescription('');
      setSelectedMembers([]);
    }
  }, [open]);

  const removeMember = (employeeId: string) => {
    setSelectedMembers(prev => prev.filter(emp => emp.empCode !== employeeId));
  };

  const handleSubmit = () => {
    if (name.trim() && selectedMembers.length > 0) {
      onCreateGroup({
        name: name.trim(),
        ...(description.trim() && { description: description.trim() }),
        memberIds: selectedMembers.map(emp => emp.empCode),
      });
    }
  };

  const isValid = name.trim().length > 2 && selectedMembers.length > 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Create a New Group</DialogTitle>
            <DialogDescription>
              Give your group a name and add members to start collaborating.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 py-4 space-y-6 overflow-y-auto px-1">
            <div className="space-y-2">
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                placeholder="e.g., Q3 Project Team"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="What is this group for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Members</Label>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEmployeeDrawer(true)}
                className="w-full justify-start text-muted-foreground"
                disabled={isLoadingEmployees}
              >
                {isLoadingEmployees ? (
                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                   <Users className="mr-2 h-4 w-4" />
                )}
               
                {selectedMembers.length > 0
                  ? `${selectedMembers.length} member${selectedMembers.length > 1 ? 's' : ''} selected`
                  : 'Select members'}
              </Button>
              
              {selectedMembers.length > 0 && (
                <ScrollArea className="mt-3 max-h-48">
                  <div className="space-y-2 pr-4">
                    {selectedMembers.map(member => (
                      <div key={member.empCode} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{member.name}</span>
                        </div>
                        <Button
                          type="button" variant="ghost" size="icon"
                          className="h-7 w-7" onClick={() => removeMember(member.empCode)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!isValid || isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isCreating ? 'Creating...' : 'Create Group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <EmployeeSelectionDrawer
        open={showEmployeeDrawer}
        onOpenChange={setShowEmployeeDrawer}
        onSelectEmployees={setSelectedMembers}
        initialSelected={selectedMembers}
        employees={employees}
        token={typeof window !== 'undefined' ? localStorage.getItem('sessionToken') || 'test-token' : 'test-token'}
      />
    </>
  );
}