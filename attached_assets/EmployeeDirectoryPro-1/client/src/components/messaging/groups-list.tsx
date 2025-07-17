import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { type NotificationGroup } from "@shared/schema";

interface GroupsListProps {
  selectedGroupId: number | null;
  onSelectGroup: (groupId: number) => void;
}

export function GroupsList({ selectedGroupId, onSelectGroup }: GroupsListProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    members: [] as string[],
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: groups, isLoading } = useQuery({
    queryKey: ["/api/notification/groups"],
    queryFn: async () => {
      const response = await fetch("/api/notification/groups", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("sessionToken")}`,
        },
      });
      return response.json();
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async (groupData: any) => {
      const response = await fetch("/api/notification/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("sessionToken")}`,
        },
        body: JSON.stringify(groupData),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification/groups"] });
      setIsCreating(false);
      setNewGroup({ name: "", description: "", members: [] });
      toast({
        title: "Group created",
        description: "Notification group created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create group",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateGroup = () => {
    if (newGroup.name.trim()) {
      createGroupMutation.mutate({
        name: newGroup.name,
        description: newGroup.description,
        members: newGroup.members,
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Groups</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Notification Groups</CardTitle>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <i className="fas fa-plus mr-2"></i>
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Notification Group</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="group-name">Group Name</Label>
                  <Input
                    id="group-name"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                    placeholder="Enter group name"
                  />
                </div>
                <div>
                  <Label htmlFor="group-description">Description</Label>
                  <Textarea
                    id="group-description"
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                    placeholder="Enter group description"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateGroup} disabled={createGroupMutation.isPending}>
                    {createGroupMutation.isPending ? "Creating..." : "Create Group"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {groups?.groups?.map((group: NotificationGroup) => (
            <div
              key={group.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedGroupId === group.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-accent"
              }`}
              onClick={() => onSelectGroup(group.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{group.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {group.members.length} members
                  </p>
                  {group.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {group.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">
                    <i className="fas fa-users mr-1"></i>
                    {group.members.length}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
          
          {(!groups?.groups || groups.groups.length === 0) && (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">
                <i className="fas fa-comments text-2xl"></i>
              </div>
              <p className="text-muted-foreground">
                No notification groups yet. Create your first group to start messaging!
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
