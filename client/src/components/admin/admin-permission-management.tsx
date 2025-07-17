import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Shield, Plus, Edit, Trash2, Users, Lock, Eye } from 'lucide-react';

interface Permission {
  id: number;
  name: string;
  description: string;
  category: string;
  createdAt: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
  isSystem: boolean;
  createdAt: string;
}

interface UserRole {
  id: number;
  employeeId: string;
  roleId: number;
  assignedBy: string;
  assignedAt: string;
}

const CategoryColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  employee: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  messaging: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  system: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
};

const PermissionCard: React.FC<{ permission: Permission }> = ({ permission }) => (
  <Card className="p-3 sm:p-4">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
      <div className="flex items-center space-x-3">
        <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
        <div className="flex-1">
          <p className="font-medium text-sm sm:text-base">{permission.name}</p>
          <p className="text-xs sm:text-sm text-gray-500">{permission.description}</p>
        </div>
      </div>
      <Badge className={`${CategoryColors[permission.category] || 'bg-gray-100 text-gray-800'} text-xs sm:text-sm`}>
        {permission.category}
      </Badge>
    </div>
  </Card>
);

const CreatePermissionDialog: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
  });
  const { toast } = useToast();

  const createPermission = useMutation({
    mutationFn: (data: typeof formData) => apiRequest('/api/permissions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      toast({ title: 'Permission created successfully' });
      setOpen(false);
      setFormData({ name: '', description: '', category: '' });
      onSuccess();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to create permission',
        variant: 'destructive'
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPermission.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Permission
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Permission</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Permission Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., view_reports"
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="What this permission allows users to do"
              required
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="messaging">Messaging</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={createPermission.isPending} className="w-full sm:w-auto">
            {createPermission.isPending ? 'Creating...' : 'Create Permission'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const CreateRoleDialog: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const { toast } = useToast();

  const createRole = useMutation({
    mutationFn: (data: typeof formData) => apiRequest('/api/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      toast({ title: 'Role created successfully' });
      setOpen(false);
      setFormData({ name: '', description: '' });
      onSuccess();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to create role',
        variant: 'destructive'
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRole.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Role
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Role</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Role Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., department_manager"
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="What this role is for"
              required
            />
          </div>
          <Button type="submit" disabled={createRole.isPending} className="w-full sm:w-auto">
            {createRole.isPending ? 'Creating...' : 'Create Role'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const RolePermissionsDialog: React.FC<{ role: Role; onSuccess: () => void }> = ({ role, onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: permissionsData } = useQuery<{ permissions: Permission[] }>({
    queryKey: ['/api/permissions'],
    enabled: open,
  });

  const { data: rolePermissionsData } = useQuery<{ permissions: Permission[] }>({
    queryKey: ['/api/roles', role.id, 'permissions'],
    enabled: open,
  });

  const permissions = permissionsData?.permissions || [];
  const rolePermissions = rolePermissionsData?.permissions || [];

  React.useEffect(() => {
    if (rolePermissions.length > 0) {
      setSelectedPermissions(rolePermissions.map(p => p.id));
    }
  }, [rolePermissions]);

  const updatePermissions = useMutation({
    mutationFn: (permissionIds: number[]) => apiRequest(`/api/roles/${role.id}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissionIds }),
    }),
    onSuccess: () => {
      toast({ title: 'Role permissions updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/roles', role.id, 'permissions'] });
      setOpen(false);
      onSuccess();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to update permissions',
        variant: 'destructive'
      });
    },
  });

  const handlePermissionToggle = (permissionId: number) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSubmit = () => {
    updatePermissions.mutate(selectedPermissions);
  };

  const permissionsByCategory = permissions.reduce((acc, permission) => {
    const category = permission.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="w-4 h-4 mr-2" />
          Edit Permissions
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Edit Permissions for {role.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
            <div key={category} className="space-y-2">
              <h3 className="font-medium capitalize text-sm sm:text-base">{category} Permissions</h3>
              <div className="space-y-2">
                {categoryPermissions.map(permission => (
                  <div key={permission.id} className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      id={`permission-${permission.id}`}
                      checked={selectedPermissions.includes(permission.id)}
                      onChange={() => handlePermissionToggle(permission.id)}
                      className="rounded border-gray-300 mt-1"
                    />
                    <label htmlFor={`permission-${permission.id}`} className="flex-1 cursor-pointer">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{permission.name}</p>
                          <p className="text-xs text-gray-500">{permission.description}</p>
                        </div>
                        <Badge className={`${CategoryColors[permission.category]} text-xs`}>
                          {permission.category}
                        </Badge>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="sm:order-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={updatePermissions.isPending} className="sm:order-2">
            {updatePermissions.isPending ? 'Updating...' : 'Update Permissions'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const AdminPermissionManagement: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: permissionsData, isLoading: permissionsLoading } = useQuery<{ permissions: Permission[] }>({
    queryKey: ['/api/permissions'],
  });

  const { data: rolesData, isLoading: rolesLoading } = useQuery<{ roles: Role[] }>({
    queryKey: ['/api/roles'],
  });

  const permissions = permissionsData?.permissions || [];
  const roles = rolesData?.roles || [];

  const refetchData = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/permissions'] });
    queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
  };

  const permissionsByCategory = permissions.reduce((acc, permission) => {
    const category = permission.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (permissionsLoading || rolesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading permissions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">Permission Management</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <CreatePermissionDialog onSuccess={refetchData} />
          <CreateRoleDialog onSuccess={refetchData} />
        </div>
      </div>

      <Tabs defaultValue="permissions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="permissions" className="text-sm">Permissions</TabsTrigger>
          <TabsTrigger value="roles" className="text-sm">Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Shield className="w-4 h-4 mr-2 sm:w-5 sm:h-5" />
                System Permissions ({permissions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
                <div key={category} className="mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 capitalize">{category} Permissions</h3>
                  <div className="grid gap-2">
                    {categoryPermissions.map(permission => (
                      <PermissionCard key={permission.id} permission={permission} />
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Users className="w-4 h-4 mr-2 sm:w-5 sm:h-5" />
                System Roles ({roles.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <div className="grid gap-3 sm:gap-4">
                {roles.map(role => (
                  <Card key={role.id} className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-sm sm:text-base">{role.name}</p>
                            {role.isSystem && (
                              <Badge variant="secondary" className="text-xs">System</Badge>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-500">{role.description}</p>
                        </div>
                      </div>
                      <RolePermissionsDialog role={role} onSuccess={refetchData} />
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};