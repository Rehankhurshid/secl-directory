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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Search, X, Filter, Building, MapPin, Award, Users, UserCheck, Droplets, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { useEmployeeStats } from '@/hooks/use-employees';
import { useDebounce } from '@/hooks/use-debounce';
import type { Employee, EmployeeSearch } from '@shared/schema';

interface EmployeeSelectionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectEmployees: (employees: Employee[]) => void;
  initialSelected?: Employee[];
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
    console.log('Selected employees:', selectedEmployeeArray);
    console.log('Selected employee IDs:', Array.from(selectedEmployees));
    onSelectEmployees(selectedEmployeeArray);
    onOpenChange(false);
  }, [selectedEmployeeObjects, selectedEmployees, onSelectEmployees, onOpenChange]);

  // Filter counts
  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(value => 
      value !== undefined && value !== 'all' && value !== 1 && value !== 1000 && value !== 'name'
    ).length;
  }, [filters]);

  const isAllSelected = employees.length > 0 && selectedEmployees.size === employees.length;
  const isPartiallySelected = selectedEmployees.size > 0 && selectedEmployees.size < employees.length;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[95vh] max-h-[95vh] flex flex-col">
        <DrawerHeader className="flex-shrink-0">
          <DrawerTitle>Select Group Members</DrawerTitle>
          <DrawerDescription>
            Choose employees to add to your group. Use filters and search to find specific members.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-3 px-4 flex-1 overflow-hidden">
          {/* Sticky Search Bar and Filter Toggle */}
          <div className="sticky top-0 z-10 bg-background pb-3 pt-3 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search employees by name, ID, or designation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Toggle Button - Always Visible */}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-between"
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            >
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFiltersCount}
                  </Badge>
                )}
              </div>
              {isFiltersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>

          {/* Collapsible Filters */}
          <Collapsible open={isFiltersOpen}>
            <CollapsibleContent className="space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">Department</Label>
                  <Select 
                    value={filters.department || 'all'} 
                    onValueChange={(value) => handleFilterChange('department', value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {stats?.departments?.filter(dept => dept.name && dept.name.trim()).map((dept) => (
                        <SelectItem key={dept.name} value={dept.name}>
                          <div className="flex items-center gap-2">
                            <Building className="w-3 h-3" />
                            {dept.name} ({dept.count})
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-medium">Location</Label>
                  <Select 
                    value={filters.location || 'all'} 
                    onValueChange={(value) => handleFilterChange('location', value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {stats?.locations?.filter(loc => loc.name && loc.name.trim()).map((loc) => (
                        <SelectItem key={loc.name} value={loc.name}>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3" />
                            {loc.name} ({loc.count})
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-medium">Grade</Label>
                  <Select 
                    value={filters.grade || 'all'} 
                    onValueChange={(value) => handleFilterChange('grade', value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Grades</SelectItem>
                      {stats?.grades?.filter(grade => grade.name && grade.name.trim()).map((grade) => (
                        <SelectItem key={grade.name} value={grade.name}>
                          <div className="flex items-center gap-2">
                            <Award className="w-3 h-3" />
                            {grade.name} ({grade.count})
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-medium">Category</Label>
                  <Select 
                    value={filters.category || 'all'} 
                    onValueChange={(value) => handleFilterChange('category', value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {stats?.categories?.filter(cat => cat.name && cat.name.trim()).map((cat) => (
                        <SelectItem key={cat.name} value={cat.name}>
                          <div className="flex items-center gap-2">
                            <Users className="w-3 h-3" />
                            {cat.name} ({cat.count})
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-medium">Gender</Label>
                  <Select 
                    value={filters.gender || 'all'} 
                    onValueChange={(value) => handleFilterChange('gender', value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Genders</SelectItem>
                      {stats?.genders?.filter(gender => gender.name && gender.name.trim()).map((gender) => (
                        <SelectItem key={gender.name} value={gender.name}>
                          <div className="flex items-center gap-2">
                            <UserCheck className="w-3 h-3" />
                            {gender.name === 'M' ? 'Male' : gender.name === 'F' ? 'Female' : gender.name} ({gender.count})
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-medium">Blood Group</Label>
                  <Select 
                    value={filters.bloodGroup || 'all'} 
                    onValueChange={(value) => handleFilterChange('bloodGroup', value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Blood Groups</SelectItem>
                      {stats?.bloodGroups?.filter(bg => bg.name && bg.name.trim()).map((bg) => (
                        <SelectItem key={bg.name} value={bg.name}>
                          <div className="flex items-center gap-2">
                            <Droplets className="w-3 h-3" />
                            {bg.name} ({bg.count})
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Clear Filters Button */}
              {activeFiltersCount > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearFilters}
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters ({activeFiltersCount})
                </Button>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Active Filters & Results */}
          <div className="flex items-center justify-between flex-shrink-0 pb-2">
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
          <div className="flex items-center gap-2 py-2">
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

          <Separator />

          {/* Employee List */}
          <ScrollArea className="flex-1 w-full min-h-0">
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
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm truncate">{employee.name}</p>
                              {isSelected && (
                                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="font-mono bg-muted px-1 py-0.5 rounded">
                                {employee.employeeId}
                              </span>
                              <span>•</span>
                              <span>{employee.designation}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {employee.department}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
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

        <DrawerFooter className="sticky bottom-0 bg-background border-t">
          <div className="flex gap-2">
            <Button
              onClick={handleConfirmSelection}
              disabled={selectedEmployees.size === 0}
              className="flex-1"
              size="lg"
            >
              Save {selectedEmployees.size} Member{selectedEmployees.size !== 1 ? 's' : ''}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" size="lg">Cancel</Button>
            </DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}