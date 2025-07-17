import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Users, Plus, Shield, Trash2, Search, UserPlus } from 'lucide-react';

interface Employee {
  id: number;
  employeeId: string;
  name: string;
  department: string;
  designation: string;
  role: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
  isSystem: boolean;
  createdAt: string;
}

interface Permission {
  id: number;
  name: string;
  description: string;
  category: string;
  createdAt: string;
}

const RoleColors: Record<string, string> = {
  system_admin: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  hr_manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  department_head: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  employee: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  read_only: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
};

const AssignRoleDialog: React.FC<{ employee: Employee; onSuccess: () => void }> = ({ employee, onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const { toast } = useToast();

  const { data: rolesData } = useQuery<{ roles: Role[] }>({
    queryKey: ['/api/roles'],
    queryFn: async () => await apiRequest('/api/roles'),
    enabled: open,
  });

  const { data: userRolesData } = useQuery<{ roles: Role[] }>({
    queryKey: ['/api/users', employee.employeeId, 'roles'],
    queryFn: async () => await apiRequest(`/api/users/${employee.employeeId}/roles`),
    enabled: open,
  });

  const roles = rolesData?.roles || [];
  const userRoles = userRolesData?.roles || [];

  const assignRole = useMutation({
    mutationFn: (roleId: number) => apiRequest(`/api/users/${employee.employeeId}/roles`, {
      method: 'POST',
      body: JSON.stringify({ roleId }),
    }),
    onSuccess: () => {
      toast({ title: 'Role assigned successfully' });
      setOpen(false);
      setSelectedRole('');
      onSuccess();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to assign role',
        variant: 'destructive'
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole) {
      assignRole.mutate(parseInt(selectedRole));
    }
  };

  const availableRoles = roles.filter(role => 
    !userRoles.some(userRole => userRole.id === role.id)
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="w-4 h-4 mr-2" />
          Assign Role
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Role to {employee.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-sm text-gray-600">
            <p><strong>Employee:</strong> {employee.name} ({employee.employeeId})</p>
            <p><strong>Department:</strong> {employee.department}</p>
            <p><strong>Designation:</strong> {employee.designation}</p>
          </div>
          
          {userRoles.length > 0 && (
            <div>
              <Label>Current Roles</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {userRoles.map(role => (
                  <Badge key={role.id} className={RoleColors[role.name] || 'bg-gray-100 text-gray-800'}>
                    {role.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <Label htmlFor="role">Select Role to Assign</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a role" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map(role => (
                  <SelectItem key={role.id} value={role.id.toString()}>
                    <div className="flex items-center justify-between w-full">
                      <span>{role.name}</span>
                      {role.isSystem && <Badge variant="secondary" className="ml-2">System</Badge>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button type="submit" disabled={assignRole.isPending || !selectedRole} className="w-full sm:w-auto">
            {assignRole.isPending ? 'Assigning...' : 'Assign Role'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const UserPermissionsDialog: React.FC<{ employee: Employee }> = ({ employee }) => {
  const [open, setOpen] = useState(false);

  const { data: permissionsData } = useQuery<{ permissions: Permission[] }>({
    queryKey: ['/api/users', employee.employeeId, 'permissions'],
    queryFn: async () => await apiRequest(`/api/users/${employee.employeeId}/permissions`),
    enabled: open,
  });

  const permissions = permissionsData?.permissions || [];

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
          <Shield className="w-4 h-4 mr-2" />
          View Permissions
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Permissions for {employee.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {permissions.length === 0 ? (
            <p className="text-center text-gray-500 text-sm">No permissions assigned</p>
          ) : (
            Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
              <div key={category} className="space-y-2">
                <h3 className="font-medium capitalize text-sm sm:text-base">{category} Permissions</h3>
                <div className="grid gap-2">
                  {categoryPermissions.map(permission => (
                    <Card key={permission.id} className="p-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{permission.name}</p>
                          <p className="text-xs text-gray-500">{permission.description}</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800 text-xs self-start sm:self-center">
                          {permission.category}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const AdminUserRoles: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: employeesData, isLoading } = useQuery<{ employees: Employee[] }>({
    queryKey: ['/api/admin/employees', { search: debouncedSearchTerm, limit: 1000 }],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: '1000'
      });
      
      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }

      return await apiRequest(`/api/admin/employees?${params}`);
    },
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
  });

  const employees = employeesData?.employees || [];

  const removeRole = useMutation({
    mutationFn: ({ employeeId, roleId }: { employeeId: string; roleId: number }) => 
      apiRequest(`/api/users/${employeeId}/roles/${roleId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      toast({ title: 'Role removed successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to remove role',
        variant: 'destructive'
      });
    },
  });

  // Filter to show non-employee roles by default if no search term
  const filteredEmployees = employees.filter(employee => {
    // If no search term, show only non-employee roles
    if (!debouncedSearchTerm) {
      return employee.role !== 'employee';
    }
    // If search term exists, show all matching employees
    return employee.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
           employee.employeeId.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
           employee.department.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
  });

  const refetchData = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/admin/employees'] });
    queryClient.invalidateQueries({ queryKey: ['/api/users'] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading employees...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">User Role Management</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full sm:w-64"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Users className="w-4 h-4 mr-2 sm:w-5 sm:h-5" />
            Employee Roles ({filteredEmployees.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          {/* Mobile view - show cards on small screens */}
          <div className="block sm:hidden space-y-4">
            {filteredEmployees.map(employee => (
              <MobileEmployeeRoleCard
                key={employee.id}
                employee={employee}
                onRoleRemove={(roleId) => removeRole.mutate({ employeeId: employee.employeeId, roleId })}
                onSuccess={refetchData}
              />
            ))}
          </div>
          
          {/* Desktop view - show table on larger screens */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Admin Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map(employee => (
                  <EmployeeRoleRow
                    key={employee.id}
                    employee={employee}
                    onRoleRemove={(roleId) => removeRole.mutate({ employeeId: employee.employeeId, roleId })}
                    onSuccess={refetchData}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const MobileEmployeeRoleCard: React.FC<{
  employee: Employee;
  onRoleRemove: (roleId: number) => void;
  onSuccess: () => void;
}> = ({ employee, onRoleRemove, onSuccess }) => {
  const { data: userRolesData } = useQuery<{ roles: Role[] }>({
    queryKey: ['/api/users', employee.employeeId, 'roles'],
  });

  const userRoles = userRolesData?.roles || [];

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-sm">{employee.name}</div>
            <div className="text-xs text-gray-500">{employee.employeeId}</div>
          </div>
          <Badge variant={employee.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
            {employee.role}
          </Badge>
        </div>
        
        <div className="text-xs text-gray-600">
          <div>{employee.department}</div>
          <div>{employee.designation}</div>
        </div>
        
        <div className="flex flex-wrap gap-1">
          {userRoles.map(role => (
            <div key={role.id} className="flex items-center gap-1">
              <Badge className={`${RoleColors[role.name] || 'bg-gray-100 text-gray-800'} text-xs`}>
                {role.name}
              </Badge>
              {!role.isSystem && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRoleRemove(role.id)}
                  className="p-0 h-auto ml-1"
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                </Button>
              )}
            </div>
          ))}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <AssignRoleDialog employee={employee} onSuccess={onSuccess} />
          <UserPermissionsDialog employee={employee} />
        </div>
      </div>
    </Card>
  );
};

const EmployeeRoleRow: React.FC<{
  employee: Employee;
  onRoleRemove: (roleId: number) => void;
  onSuccess: () => void;
}> = ({ employee, onRoleRemove, onSuccess }) => {
  const { data: userRolesData } = useQuery<{ roles: Role[] }>({
    queryKey: ['/api/users', employee.employeeId, 'roles'],
  });

  const userRoles = userRolesData?.roles || [];

  return (
    <TableRow>
      <TableCell>
        <div>
          <div className="font-medium">{employee.name}</div>
          <div className="text-sm text-gray-500">{employee.employeeId}</div>
        </div>
      </TableCell>
      <TableCell>{employee.department}</TableCell>
      <TableCell>{employee.designation}</TableCell>
      <TableCell>
        <Badge variant={employee.role === 'admin' ? 'default' : 'secondary'}>
          {employee.role}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-2 mb-2">
          {userRoles.map(role => (
            <div key={role.id} className="flex items-center gap-1">
              <Badge className={RoleColors[role.name] || 'bg-gray-100 text-gray-800'}>
                {role.name}
              </Badge>
              {!role.isSystem && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRoleRemove(role.id)}
                  className="p-0 h-auto ml-1"
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <div className="flex space-x-2">
          <AssignRoleDialog employee={employee} onSuccess={onSuccess} />
          <UserPermissionsDialog employee={employee} />
        </div>
      </TableCell>
    </TableRow>
  );
};