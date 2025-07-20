'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Search,
  Filter,
  Users,
  Building,
  MapPin,
  Award,
  UserCheck,
  Droplets,
  CheckCircle2,
  X,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useDebounce } from '@/lib/hooks/use-debounce'

// Types
interface Employee {
  id: string
  empCode: string
  name: string
  designation?: string
  department?: string
  location?: string
  grade?: string
  category?: string
  gender?: string
  bloodGroup?: string
  profileImage?: string
}

interface EmployeeSearch {
  search?: string
  department?: string
  location?: string
  grade?: string
  category?: string
  gender?: string
  bloodGroup?: string
  sortBy?: string
  page?: number
  limit?: number
}

interface EmployeeSelectionDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectEmployees: (employees: Employee[]) => void
  initialSelected?: Employee[]
}

// Employee Card Component
function EmployeeCard({
  employee,
  isSelected,
  onToggle,
}: {
  employee: Employee
  isSelected: boolean
  onToggle: (employee: Employee) => void
}) {
  return (
    <Card
      className={`cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'bg-primary/10 border-primary shadow-sm'
          : 'hover:bg-muted/50 hover:shadow-sm'
      }`}
      onClick={() => onToggle(employee)}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggle(employee)}
            onClick={(e) => e.stopPropagation()}
            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />

          <Avatar className="w-10 h-10 flex-shrink-0">
            <AvatarImage src={employee.profileImage} alt={employee.name} />
            <AvatarFallback className="text-xs bg-primary/10">
              {employee.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{employee.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {employee.empCode} {employee.designation && `• ${employee.designation}`}
                </p>
              </div>
              {isSelected && (
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 ml-2" />
              )}
            </div>

            <div className="flex items-center gap-2 mt-1.5">
              {employee.department && (
                <Badge variant="outline" className="text-xs py-0 h-5">
                  {employee.department}
                </Badge>
              )}
              {employee.location && (
                <Badge variant="outline" className="text-xs py-0 h-5">
                  {employee.location}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Filter Drawer Component
function FilterDrawer({
  open,
  onOpenChange,
  filters,
  onFilterChange,
  stats,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: EmployeeSearch
  onFilterChange: (key: keyof EmployeeSearch, value: string) => void
  stats: any
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[85vw] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Filter Employees</SheetTitle>
          <SheetDescription>
            Narrow down your search with filters
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Department Filter */}
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select
              value={filters.department || 'all'}
              onValueChange={(value) => onFilterChange('department', value)}
            >
              <SelectTrigger id="department">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {stats?.departments
                  ?.filter((dept: any) => dept.name && dept.name.trim())
                  .map((dept: any) => (
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
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Select
              value={filters.location || 'all'}
              onValueChange={(value) => onFilterChange('location', value)}
            >
              <SelectTrigger id="location">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {stats?.locations?.map((loc: any) => (
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
          <div className="space-y-2">
            <Label htmlFor="grade">Grade</Label>
            <Select
              value={filters.grade || 'all'}
              onValueChange={(value) => onFilterChange('grade', value)}
            >
              <SelectTrigger id="grade">
                <SelectValue placeholder="All Grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {stats?.grades?.map((grade: any) => (
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
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={filters.category || 'all'}
              onValueChange={(value) => onFilterChange('category', value)}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {stats?.categories?.map((cat: any) => (
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
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={filters.gender || 'all'}
              onValueChange={(value) => onFilterChange('gender', value)}
            >
              <SelectTrigger id="gender">
                <SelectValue placeholder="All Genders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                {stats?.genders?.map((gender: any) => (
                  <SelectItem key={gender.name} value={gender.name}>
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4" />
                      {gender.name === 'M'
                        ? 'Male'
                        : gender.name === 'F'
                        ? 'Female'
                        : gender.name}{' '}
                      ({gender.count})
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Blood Group Filter */}
          <div className="space-y-2">
            <Label htmlFor="bloodGroup">Blood Group</Label>
            <Select
              value={filters.bloodGroup || 'all'}
              onValueChange={(value) => onFilterChange('bloodGroup', value)}
            >
              <SelectTrigger id="bloodGroup">
                <SelectValue placeholder="All Blood Groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Blood Groups</SelectItem>
                {stats?.bloodGroups?.map((bg: any) => (
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
      </SheetContent>
    </Sheet>
  )
}

// Main Component
export default function EmployeeSelectionDrawer({
  open,
  onOpenChange,
  onSelectEmployees,
  initialSelected = [],
}: EmployeeSelectionDrawerProps) {
  // State
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<EmployeeSearch>({
    page: 1,
    limit: 10000,
    sortBy: 'name',
  })
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(
    new Set(initialSelected.map((emp) => emp.empCode))
  )
  const [selectedEmployeeObjects, setSelectedEmployeeObjects] = useState<Map<string, Employee>>(
    new Map(initialSelected.map((emp) => [emp.empCode, emp]))
  )
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const selectAllRef = useRef<HTMLButtonElement>(null)

  // Debounced search
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Update filters when search term changes
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      search: debouncedSearchTerm || undefined,
      page: 1,
    }))
  }, [debouncedSearchTerm])

  // Fetch employees
  const { data: employeeData, isLoading } = useQuery<{
    employees: Employee[]
    total: number
  }>({
    queryKey: ['/api/employees', filters],
    queryFn: async () => {
      const queryParams = new URLSearchParams()

      if (filters?.search) queryParams.append('search', filters.search)
      if (filters?.department) queryParams.append('department', filters.department)
      if (filters?.location) queryParams.append('location', filters.location)
      if (filters?.grade) queryParams.append('grade', filters.grade)
      if (filters?.category) queryParams.append('category', filters.category)
      if (filters?.gender) queryParams.append('gender', filters.gender)
      if (filters?.bloodGroup) queryParams.append('bloodGroup', filters.bloodGroup)
      if (filters?.sortBy) queryParams.append('sortBy', filters.sortBy)
      if (filters?.page) queryParams.append('page', filters.page.toString())
      if (filters?.limit) queryParams.append('limit', filters.limit.toString())

      const queryString = queryParams.toString()
      const url = `/api/employees${queryString ? `?${queryString}` : ''}`

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch employees')
      }
      return response.json()
    },
    enabled: open,
  })

  // Fetch stats for filters
  const { data: stats } = useQuery({
    queryKey: ['/api/employees/stats'],
    queryFn: async () => {
      const response = await fetch('/api/employees/stats')
      if (!response.ok) {
        throw new Error('Failed to fetch employee stats')
      }
      return response.json()
    },
    enabled: open,
  })

  const employees = employeeData?.employees || []
  const totalEmployees = employeeData?.total || 0

  // Filter handling
  const handleFilterChange = useCallback((key: keyof EmployeeSearch, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
      page: 1,
    }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({
      page: 1,
      limit: 10000,
      sortBy: 'name',
    })
    setSearchTerm('')
  }, [])

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    const filterKeys: (keyof EmployeeSearch)[] = [
      'department',
      'location',
      'grade',
      'category',
      'gender',
      'bloodGroup',
    ]
    return filterKeys.reduce((count, key) => {
      return count + (filters[key] ? 1 : 0)
    }, 0)
  }, [filters])

  // Selection handling
  const handleEmployeeToggle = useCallback((employee: Employee) => {
    setSelectedEmployees((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(employee.empCode)) {
        newSet.delete(employee.empCode)
      } else {
        newSet.add(employee.empCode)
      }
      return newSet
    })

    setSelectedEmployeeObjects((prev) => {
      const newMap = new Map(prev)
      if (newMap.has(employee.empCode)) {
        newMap.delete(employee.empCode)
      } else {
        newMap.set(employee.empCode, employee)
      }
      return newMap
    })
  }, [])

  // Select all handling
  const isAllSelected = employees.length > 0 && employees.every((emp) => selectedEmployees.has(emp.empCode))
  const isPartiallySelected = employees.some((emp) => selectedEmployees.has(emp.empCode)) && !isAllSelected

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        const newSelectedSet = new Set(selectedEmployees)
        const newSelectedMap = new Map(selectedEmployeeObjects)

        employees.forEach((emp) => {
          newSelectedSet.add(emp.empCode)
          newSelectedMap.set(emp.empCode, emp)
        })

        setSelectedEmployees(newSelectedSet)
        setSelectedEmployeeObjects(newSelectedMap)
      } else {
        const newSelectedSet = new Set(selectedEmployees)
        const newSelectedMap = new Map(selectedEmployeeObjects)

        employees.forEach((emp) => {
          newSelectedSet.delete(emp.empCode)
          newSelectedMap.delete(emp.empCode)
        })

        setSelectedEmployees(newSelectedSet)
        setSelectedEmployeeObjects(newSelectedMap)
      }
    },
    [employees, selectedEmployees, selectedEmployeeObjects]
  )

  // Update indeterminate state
  useEffect(() => {
    if (selectAllRef.current) {
      const checkbox = selectAllRef.current.querySelector('button[role="checkbox"]')
      if (checkbox) {
        ;(checkbox as any).indeterminate = isPartiallySelected
      }
    }
  }, [isPartiallySelected])

  // Confirm selection
  const handleConfirmSelection = useCallback(() => {
    const selectedArray = Array.from(selectedEmployeeObjects.values())
    onSelectEmployees(selectedArray)
    onOpenChange(false)
  }, [selectedEmployeeObjects, onSelectEmployees, onOpenChange])

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[95vh] flex flex-col">
          <DrawerHeader className="flex-shrink-0 pb-0">
            <DrawerTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Select Team Members
            </DrawerTitle>
            <DrawerDescription>
              Search and filter employees to add to your group
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 px-4 overflow-hidden flex flex-col">
            {/* Search and Filter Bar */}
            <div className="flex-shrink-0 space-y-3 py-4 border-b">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search by name, ID, designation..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsFiltersOpen(true)}
                  className="relative"
                >
                  <Filter className="w-4 h-4" />
                  {activeFiltersCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                    >
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </div>

              {/* Filter Summary */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{totalEmployees} results</Badge>
                  {activeFiltersCount > 0 && (
                    <>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Filter className="w-3 h-3" />
                        {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-6 px-2 text-xs"
                      >
                        Clear all
                      </Button>
                    </>
                  )}
                </div>
                <Badge variant={selectedEmployees.size > 0 ? 'default' : 'outline'}>
                  {selectedEmployees.size} selected
                </Badge>
              </div>

              {/* Select All */}
              {employees.length > 0 && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    ref={selectAllRef}
                    id="select-all"
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                    Select all visible employees ({employees.length})
                  </Label>
                </div>
              )}
            </div>

            {/* Employee List */}
            <ScrollArea className="flex-1 mt-4">
              <div className="space-y-2 pb-4">
                {isLoading ? (
                  // Loading skeletons
                  Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-5 h-5 rounded" />
                          <Skeleton className="w-10 h-10 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-48" />
                            <div className="flex gap-2">
                              <Skeleton className="h-5 w-20" />
                              <Skeleton className="h-5 w-16" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : employees.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No employees found</p>
                  </div>
                ) : (
                  employees.map((employee) => (
                    <EmployeeCard
                      key={employee.empCode}
                      employee={employee}
                      isSelected={selectedEmployees.has(employee.empCode)}
                      onToggle={handleEmployeeToggle}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <DrawerFooter className="flex-shrink-0 border-t">
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
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
        open={isFiltersOpen}
        onOpenChange={setIsFiltersOpen}
        filters={filters}
        onFilterChange={handleFilterChange}
        stats={stats}
      />
    </>
  )
}