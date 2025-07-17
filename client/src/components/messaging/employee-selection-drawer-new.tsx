import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Search, X, Filter, Building, MapPin, Award, Users, UserCheck, Droplets, CheckCircle2 } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import type { Employee, EmployeeSearch } from '@shared/schema';

interface EmployeeSelectionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectEmployees: (employees: Employee[]) => void;
  initialSelected?: Employee[];
}

// Filter Drawer Component
function FilterDrawer({ 
  isOpen, 
  onClose, 
  filters, 
  onFilterChange, 
  stats,
  onClearFilters,
  activeFiltersCount 
}: {
  isOpen: boolean;
  onClose: () => void;
  filters: EmployeeSearch;
  onFilterChange: (key: keyof EmployeeSearch, value: string) => void;
  stats?: any;
  onClearFilters: () => void;
  activeFiltersCount: number;
}) {
  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter Employees
          </DrawerTitle>
        </DrawerHeader>
        
        <div className="px-4 pb-4">
          <ScrollArea className="h-[calc(90vh-200px)]">
            <div className="space-y-6">
              {/* Department Filter */}
              <div>
                <Label className="text-sm font-medium">Department</Label>
                <Select 
                  value={filters.department || 'all'} 
                  onValueChange={(value) => onFilterChange('department', value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {stats?.departments?.filter(dept => dept.name && dept.name.trim()).map((dept) => (
                      <SelectItem key={dept.name} value={dept.name}>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          {dept.name} ({dept.count})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location Filter */}
              <div>
                <Label className="text-sm font-medium">Location</Label>
                <Select 
                  value={filters.location || 'all'} 
                  onValueChange={(value) => onFilterChange('location', value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {stats?.locations?.filter(loc => loc.name && loc.name.trim()).map((loc) => (
                      <SelectItem key={loc.name} value={loc.name}>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {loc.name} ({loc.count})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Grade Filter */}
              <div>
                <Label className="text-sm font-medium">Grade</Label>
                <Select 
                  value={filters.grade || 'all'} 
                  onValueChange={(value) => onFilterChange('grade', value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="All Grades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {stats?.grades?.filter(grade => grade.name && grade.name.trim()).map((grade) => (
                      <SelectItem key={grade.name} value={grade.name}>
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4" />
                          {grade.name} ({grade.count})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div>
                <Label className="text-sm font-medium">Category</Label>
                <Select 
                  value={filters.category || 'all'} 
                  onValueChange={(value) => onFilterChange('category', value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {stats?.categories?.filter(cat => cat.name && cat.name.trim()).map((cat) => (
                      <SelectItem key={cat.name} value={cat.name}>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {cat.name} ({cat.count})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Gender Filter */}
              <div>
                <Label className="text-sm font-medium">Gender</Label>
                <Select 
                  value={filters.gender || 'all'} 
                  onValueChange={(value) => onFilterChange('gender', value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="All Genders" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genders</SelectItem>
                    {stats?.genders?.filter(gender => gender.name && gender.name.trim()).map((gender) => (
                      <SelectItem key={gender.name} value={gender.name}>
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4" />
                          {gender.name === 'M' ? 'Male' : gender.name === 'F' ? 'Female' : gender.name} ({gender.count})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Blood Group Filter */}
              <div>
                <Label className="text-sm font-medium">Blood Group</Label>
                <Select 
                  value={filters.bloodGroup || 'all'} 
                  onValueChange={(value) => onFilterChange('bloodGroup', value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="All Blood Groups" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Blood Groups</SelectItem>
                    {stats?.bloodGroups?.filter(bg => bg.name && bg.name.trim()).map((bg) => (
                      <SelectItem key={bg.name} value={bg.name}>
                        <div className="flex items-center gap-2">
                          <Droplets className="w-4 h-4" />
                          {bg.name} ({bg.count})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </ScrollArea>
        </div>

        <DrawerFooter className="flex flex-row gap-2">
          {activeFiltersCount > 0 && (
            <Button 
              variant="outline" 
              onClick={onClearFilters}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Clear Filters ({activeFiltersCount})
            </Button>
          )}
          <Button onClick={onClose} className="flex-1">
            Apply Filters
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export function EmployeeSelectionDrawer({ 
  open, 
  onOpenChange, 
  onSelectEmployees, 
  initialSelected = [] 
}: EmployeeSelectionDrawerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(
    new Set(initialSelected.map(emp => emp.employeeId))
  );
  const [selectedEmployeeObjects, setSelectedEmployeeObjects] = useState<Map<string, Employee>>(
    new Map(initialSelected.map(emp => [emp.employeeId, emp]))
  );
  const [filters, setFilters] = useState<EmployeeSearch>({
    page: 1,
    limit: 10000, // Load all employees for selection
    sortBy: 'name',
  });
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Update filters when search term changes
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      search: debouncedSearchTerm || undefined,
      page: 1,
    }));
  }, [debouncedSearchTerm]);

  // Fetch employees with current filters
  const { data: employeeData, isLoading } = useQuery<{ employees: Employee[]; total: number }>({
    queryKey: ['/api/employees', filters],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      
      if (filters?.search) queryParams.append('search', filters.search);
      if (filters?.department) queryParams.append('department', filters.department);
      if (filters?.location) queryParams.append('location', filters.location);
      if (filters?.grade) queryParams.append('grade', filters.grade);
      if (filters?.category) queryParams.append('category', filters.category);
      if (filters?.gender) queryParams.append('gender', filters.gender);
      if (filters?.bloodGroup) queryParams.append('bloodGroup', filters.bloodGroup);
      if (filters?.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters?.page) queryParams.append('page', filters.page.toString());
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());

      const queryString = queryParams.toString();
      const url = `/api/employees${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }
      return response.json();
    },
    enabled: open,
  });

  // Fetch employee stats for filter options
  const { data: stats } = useQuery({
    queryKey: ['/api/employees/stats'],
    queryFn: async () => {
      const response = await fetch('/api/employees/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch employee stats');
      }
      return response.json();
    },
    enabled: open,
  });

  const employees = employeeData?.employees || [];
  const totalEmployees = employeeData?.total || 0;

  // Filter handlers
  const handleFilterChange = useCallback((key: keyof EmployeeSearch, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
      page: 1,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      page: 1,
      limit: 10000,
      sortBy: 'name',
    });
    setSearchTerm('');
  }, []);

  // Selection handlers
  const handleEmployeeToggle = useCallback((employee: Employee) => {
    setSelectedEmployees(prev => {
      const newSet = new Set(prev);
      if (newSet.has(employee.employeeId)) {
        newSet.delete(employee.employeeId);
      } else {
        newSet.add(employee.employeeId);
      }
      return newSet;
    });
    
    setSelectedEmployeeObjects(prev => {
      const newMap = new Map(prev);
      if (newMap.has(employee.employeeId)) {
        newMap.delete(employee.employeeId);
      } else {
        newMap.set(employee.employeeId, employee);
      }
      return newMap;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedEmployees.size === employees.length) {
      // Deselect all currently visible employees
      setSelectedEmployees(prev => {
        const newSet = new Set(prev);
        employees.forEach(emp => newSet.delete(emp.employeeId));
        return newSet;
      });
      setSelectedEmployeeObjects(prev => {
        const newMap = new Map(prev);
        employees.forEach(emp => newMap.delete(emp.employeeId));
        return newMap;
      });
    } else {
      // Select all currently visible employees
      setSelectedEmployees(prev => {
        const newSet = new Set(prev);
        employees.forEach(emp => newSet.add(emp.employeeId));
        return newSet;
      });
      setSelectedEmployeeObjects(prev => {
        const newMap = new Map(prev);
        employees.forEach(emp => newMap.set(emp.employeeId, emp));
        return newMap;
      });
    }
  }, [employees, selectedEmployees.size]);

  const handleConfirmSelection = useCallback(() => {
    const selectedEmployeeArray = Array.from(selectedEmployeeObjects.values());
    onSelectEmployees(selectedEmployeeArray);
    onOpenChange(false);
  }, [selectedEmployeeObjects, onSelectEmployees, onOpenChange]);

  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.department) count++;
    if (filters.location) count++;
    if (filters.grade) count++;
    if (filters.category) count++;
    if (filters.gender) count++;
    if (filters.bloodGroup) count++;
    return count;
  }, [filters]);

  // Check if all visible employees are selected
  const isAllSelected = employees.length > 0 && employees.every(emp => selectedEmployees.has(emp.employeeId));
  const isPartiallySelected = employees.some(emp => selectedEmployees.has(emp.employeeId)) && !isAllSelected;

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[95vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>Select Employees</DrawerTitle>
            <DrawerDescription>
              Choose employees to add to your group
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="flex flex-col h-[calc(95vh-200px)] px-4">
            {/* Sticky Header with Search and Filter */}
            <div className="flex-shrink-0 space-y-3 pb-4 border-b">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsFiltersOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </div>

              {/* Active Filters & Results */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {totalEmployees} result{totalEmployees !== 1 ? 's' : ''}
                  </Badge>
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Filter className="w-3 h-3" />
                      {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''}
                    </Badge>
                  )}
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-6 px-2 text-xs"
                    >
                      Clear all
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={selectedEmployees.size > 0 ? "default" : "outline"}>
                    {selectedEmployees.size} selected
                  </Badge>
                </div>
              </div>

              {/* Select All Checkbox */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) {
                      el.indeterminate = isPartiallySelected;
                    }
                  }}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all" className="text-sm font-medium">
                  Select all visible employees ({employees.length})
                </Label>
              </div>
            </div>

            {/* Employee List */}
            <ScrollArea className="flex-1 mt-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-sm text-muted-foreground">Loading employees...</div>
                </div>
              ) : employees.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-sm text-muted-foreground">No employees found</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {employees.map((employee) => {
                    const isSelected = selectedEmployees.has(employee.employeeId);
                    return (
                      <Card 
                        key={employee.employeeId} 
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => handleEmployeeToggle(employee)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleEmployeeToggle(employee)}
                            />
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={employee.profileImage || ""} alt={employee.name} />
                              <AvatarFallback className="text-xs">
                                {employee.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium truncate">{employee.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {employee.employeeId} • {employee.designation}
                                  </p>
                                </div>
                                {isSelected && (
                                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {employee.department}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {employee.location}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
          
          <DrawerFooter>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmSelection}
                disabled={selectedEmployees.size === 0}
                className="flex-1"
              >
                Add Selected ({selectedEmployees.size})
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        stats={stats}
        onClearFilters={clearFilters}
        activeFiltersCount={activeFiltersCount}
      />
    </>
  );
}