import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { AdminEmployeeEditDrawer } from './admin-employee-edit-drawer';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  Shield,
  User,
  Phone,
  Mail,
  Building,
  MapPin,
  ChevronLeft,
  ChevronRight,
  IdCard,
  Briefcase
} from 'lucide-react';

interface Employee {
  id: number;
  employeeId: string;
  name: string;
  designation: string;
  department: string;
  location: string;
  email?: string;
  phone1?: string;
  phone2?: string;
  role: 'admin' | 'employee';
  profileImage?: string;
  createdAt: string;
}

export function AdminEmployeeManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [editMode, setEditMode] = useState<'add' | 'edit'>('edit');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when searching
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: employeesData, isLoading } = useQuery<{ employees: Employee[]; total: number }>({
    queryKey: ['/api/admin/employees', {
      page: currentPage,
      search: debouncedSearchTerm,
      department: selectedDepartment,
      location: selectedLocation,
      role: selectedRole
    }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50'
      });
      
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (selectedDepartment && selectedDepartment !== 'all') params.append('department', selectedDepartment);
      if (selectedLocation && selectedLocation !== 'all') params.append('location', selectedLocation);
      if (selectedRole && selectedRole !== 'all') params.append('role', selectedRole);

      return await apiRequest(`/api/admin/employees?${params}`);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      return await apiRequest(`/api/admin/employees/${employeeId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/employees'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/employees/stats'] });
      toast({
        title: "Employee deleted",
        description: "Employee has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const employees = employeesData?.employees || [];
  const totalEmployees = employeesData?.total || 0;
  const totalPages = Math.ceil(totalEmployees / 50);

  // Get unique values for filters
  const { data: stats } = useQuery<any>({
    queryKey: ['/api/employees/stats'],
    queryFn: async () => {
      return await apiRequest('/api/employees/stats');
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const handleDeleteEmployee = (employeeId: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      deleteEmployeeMutation.mutate(employeeId);
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEditMode('edit');
    setIsEditDrawerOpen(true);
  };

  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setEditMode('add');
    setIsAddDrawerOpen(true);
  };

  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEditMode('edit');
    setIsEditDrawerOpen(true);
  };



  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Employee Management
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Manage employee records, roles, and permissions
          </p>
        </div>
        <Button className="flex items-center gap-2" onClick={handleAddEmployee}>
          <UserPlus className="w-4 h-4" />
          Add Employee
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger>
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {stats?.departments?.map((dept: any) => (
                <SelectItem key={dept.name} value={dept.name}>
                  {dept.name} ({dept.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger>
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {stats?.locations?.map((loc: any) => (
                <SelectItem key={loc.name} value={loc.name}>
                  {loc.name} ({loc.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger>
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="employee">Employee</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            onClick={() => {
              setSearchTerm('');
              setSelectedDepartment('all');
              setSelectedLocation('all');
              setSelectedRole('all');
              setCurrentPage(1);
            }}
          >
            Clear
          </Button>
        </div>
        
        <div className="flex gap-4">
          <Badge variant="outline" className="px-3 py-1">
            <Users className="w-4 h-4 mr-1" />
            Total: {totalEmployees}
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            <Shield className="w-4 h-4 mr-1" />
            Showing: {employees.length} of {totalEmployees}
          </Badge>
        </div>
      </div>

      {/* Employee Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Employees ({employees.length})
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {employees.map((employee) => (
            <Card key={employee.id} className="group cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-l-4 border-l-primary">
              <CardContent className="p-3">
                {/* Header with profile image, ID and badges */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={employee.profileImage || ""} alt={employee.name} />
                      <AvatarFallback className="text-sm font-medium">
                        {employee.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2">
                        <IdCard className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-xs text-muted-foreground font-mono">{employee.employeeId}</span>
                      </div>
                      <h3 className="text-base font-semibold text-foreground leading-tight">{employee.name}</h3>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Badge variant={employee.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                      {employee.role === 'admin' ? (
                        <Shield className="w-3 h-3 mr-1" />
                      ) : (
                        <User className="w-3 h-3 mr-1" />
                      )}
                      {employee.role}
                    </Badge>
                  </div>
                </div>

                {/* Designation */}
                <div className="mb-3">
                  <div className="flex items-center space-x-1">
                    <Briefcase className="w-3 h-3 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{employee.designation}</span>
                  </div>
                </div>

                {/* Info grid with icons */}
                <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <Building className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-foreground truncate">{employee.department}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-foreground truncate">{employee.location}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-foreground truncate">{employee.phone1 || "-"}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-foreground truncate">{employee.email || "-"}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditEmployee(employee)}
                      className="h-7 w-7 p-0"
                      title="Edit Employee"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteEmployee(employee.employeeId)}
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                      title="Delete Employee"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewEmployee(employee)}
                    className="text-primary hover:text-primary/80 text-xs px-2 py-1 h-7"
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              );
            })}
            
            {totalPages > 5 && (
              <>
                <span className="text-gray-500">...</span>
                <Button
                  variant={currentPage === totalPages ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  className="w-8 h-8 p-0"
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Edit Employee Drawer */}
      <AdminEmployeeEditDrawer
        employee={selectedEmployee}
        isOpen={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        mode="edit"
      />

      {/* Add Employee Drawer */}
      <AdminEmployeeEditDrawer
        employee={null}
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        mode="add"
      />
    </div>
  );
}