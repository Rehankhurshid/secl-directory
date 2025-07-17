import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Users, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EmployeeSelectionDrawer } from './employee-selection-drawer-new';
import type { Employee } from '@shared/schema';

interface CreateGroupDialogProps {
  employees: Employee[];
  sessionToken: string;
  trigger?: React.ReactNode;
}

export function CreateGroupDialog({ employees, sessionToken, trigger }: CreateGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Employee[]>([]);
  const [showEmployeeDrawer, setShowEmployeeDrawer] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createGroupMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; memberIds: string[] }) => {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to create group');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
      setOpen(false);
      setName('');
      setDescription('');
      setSelectedMembers([]);
      toast({ title: 'Group created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to create group', description: error.message, variant: 'destructive' });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && selectedMembers.length > 0) {
      createGroupMutation.mutate({
        name: name.trim(),
        description: description.trim(),
        memberIds: selectedMembers.map(emp => emp.employeeId)
      });
    }
  };

  const handleEmployeeSelection = (employees: Employee[]) => {
    console.log('Received employees in dialog:', employees);
    setSelectedMembers(employees);
  };

  const removeMember = (employeeId: string) => {
    setSelectedMembers(prev => prev.filter(emp => emp.employeeId !== employeeId));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Create New Group
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Create New Group
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                placeholder="Enter group name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="group-description">Description (optional)</Label>
              <Textarea
                id="group-description"
                placeholder="Enter group description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Group Members</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEmployeeDrawer(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Members
                </Button>
              </div>
              
              {selectedMembers.length > 0 ? (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedMembers.map((employee) => (
                    <div key={employee.employeeId} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={employee.profileImage || ""} alt={employee.name} />
                        <AvatarFallback className="text-xs">
                          {employee.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{employee.name}</p>
                        <p className="text-xs text-muted-foreground">{employee.employeeId}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMember(employee.employeeId)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No members selected</p>
                  <p className="text-xs">Click "Add Members" to select employees</p>
                </div>
              )}
              
              {selectedMembers.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">
                    {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
                  </Badge>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!name.trim() || selectedMembers.length === 0 || createGroupMutation.isPending}
              >
                {createGroupMutation.isPending ? 'Creating...' : 'Create Group'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <EmployeeSelectionDrawer
        open={showEmployeeDrawer}
        onOpenChange={setShowEmployeeDrawer}
        onSelectEmployees={handleEmployeeSelection}
        initialSelected={selectedMembers}
      />
    </>
  );
}