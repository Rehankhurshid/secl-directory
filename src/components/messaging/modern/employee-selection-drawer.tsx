'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
  Search,
  Filter,
  Users,
  Building,
  MapPin,
  Award,
  UserCheck,
  CheckCircle2,
  X,
} from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'

// Types
interface Employee {
  empCode: string
  name: string
  designation?: string
  department?: string
  location?: string
  grade?: string
  category?: string
  gender?: string
  profileImage?: string
}

interface EmployeeSearch {
  search?: string
  department?: string
  location?: string
  grade?: string
  category?: string
  gender?: string
  sortBy?: string
  page?: number
  limit?: number
}

interface EmployeeSelectionDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectEmployees: (employees: Employee[]) => void
  initialSelected?: Employee[]
  employees: Employee[]
  token?: string
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

// Filter Sheet Component
function FilterSheet({
  open,
  onOpenChange,
  filters,
  onFilterChange,
  stats,
  onApply,
  onClear,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: EmployeeSearch
  onFilterChange: (key: keyof EmployeeSearch, value: string) => void
  stats: any
  onApply: () => void
  onClear: () => void
}) {
  // Local state for draft filters
  const [draftFilters, setDraftFilters] = useState<EmployeeSearch>(filters)

  useEffect(() => {
    setDraftFilters(filters)
  }, [filters])

  const handleDraftFilterChange = (key: keyof EmployeeSearch, value: string) => {
    setDraftFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
    }))
  }

  const handleApply = () => {
    Object.keys(draftFilters).forEach(key => {
      const value = draftFilters[key as keyof EmployeeSearch]
      onFilterChange(key as keyof EmployeeSearch, String(value) || 'all')
    })
    onApply()
    onOpenChange(false)
  }

  const handleClear = () => {
    const clearedFilters: EmployeeSearch = {
      page: 1,
      limit: 10000,
      sortBy: 'name',
    }
    setDraftFilters(clearedFilters)
    onClear()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filter Employees</SheetTitle>
          <SheetDescription>
            Narrow down your search with filters
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {/* Department Filter */}
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select
              value={draftFilters.department || 'all'}
              onValueChange={(value) => handleDraftFilterChange('department', value)}
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
              value={draftFilters.location || 'all'}
              onValueChange={(value) => handleDraftFilterChange('location', value)}
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
              value={draftFilters.grade || 'all'}
              onValueChange={(value) => handleDraftFilterChange('grade', value)}
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
              value={draftFilters.category || 'all'}
              onValueChange={(value) => handleDraftFilterChange('category', value)}
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
              value={draftFilters.gender || 'all'}
              onValueChange={(value) => handleDraftFilterChange('gender', value)}
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

        </div>

        <SheetFooter className="mt-6 border-t pt-4">
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={handleClear}
              className="flex-1"
            >
              Clear Filters
            </Button>
            <Button
              onClick={handleApply}
              className="flex-1"
            >
              Apply Filters
            </Button>
          </div>
        </SheetFooter>
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
  employees: allEmployees,
  token,
}: EmployeeSelectionDrawerProps) {
  // State
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<EmployeeSearch>({
    page: 1,
    limit: 50, // Start with 50 for initial load
    sortBy: 'name',
  })
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(
    new Set(initialSelected.map((emp) => emp.empCode))
  )
  const [selectedEmployeeObjects, setSelectedEmployeeObjects] = useState<Map<string, Employee>>(
    new Map(initialSelected.map((emp) => [emp.empCode, emp]))
  )
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [displayedEmployees, setDisplayedEmployees] = useState<Employee[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const selectAllRef = useRef<HTMLButtonElement>(null)

  // Debounced search
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Fetch stats when drawer opens
  useEffect(() => {
    if (open && token && !stats) {
      setIsLoadingStats(true)
      fetch('/api/employees/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then(res => res.json())
        .then(data => {
          console.log('Employee stats:', data); // Debug log
          setStats(data)
          setIsLoadingStats(false)
        })
        .catch(err => {
          console.error('Failed to fetch stats:', err)
          setIsLoadingStats(false)
        })
    }
  }, [open, token, stats])

  // Filter employees locally
  const filteredEmployees = useMemo(() => {
    let filtered = allEmployees

    // Apply search filter
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase()
      filtered = filtered.filter(
        (emp) =>
          emp.name.toLowerCase().includes(searchLower) ||
          emp.empCode.toLowerCase().includes(searchLower) ||
          emp.designation?.toLowerCase().includes(searchLower) ||
          emp.department?.toLowerCase().includes(searchLower)
      )
    }

    // Apply other filters
    if (filters.department) {
      filtered = filtered.filter((emp) => emp.department === filters.department)
    }
    if (filters.location) {
      filtered = filtered.filter((emp) => emp.location === filters.location)
    }
    if (filters.grade) {
      filtered = filtered.filter((emp) => emp.grade === filters.grade)
    }
    if (filters.category) {
      filtered = filtered.filter((emp) => emp.category === filters.category)
    }
    if (filters.gender) {
      filtered = filtered.filter((emp) => emp.gender === filters.gender)
    }

    return filtered
  }, [allEmployees, debouncedSearchTerm, filters])

  // Initialize displayed employees when filtered list changes
  useEffect(() => {
    const initialBatch = filteredEmployees.slice(0, 50)
    setDisplayedEmployees(initialBatch)
    setHasMore(filteredEmployees.length > 50)
    
  }, [filteredEmployees, open, allEmployees, filters])

  // Handle infinite scroll
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || !hasMore) return

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    
    // Load more when user scrolls to bottom (with 100px threshold)
    if (scrollHeight - scrollTop - clientHeight < 100) {
      const currentLength = displayedEmployees.length
      const nextBatch = filteredEmployees.slice(currentLength, currentLength + 50)
      
      if (nextBatch.length > 0) {
        setDisplayedEmployees(prev => [...prev, ...nextBatch])
        setHasMore(currentLength + nextBatch.length < filteredEmployees.length)
      }
    }
  }, [displayedEmployees, filteredEmployees, hasMore])


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
      limit: 50,
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

  // Select all handling - works with all filtered employees, not just displayed
  const isAllSelected = filteredEmployees.length > 0 && filteredEmployees.every((emp) => selectedEmployees.has(emp.empCode))
  const isPartiallySelected = filteredEmployees.some((emp) => selectedEmployees.has(emp.empCode)) && !isAllSelected

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        const newSelectedSet = new Set(selectedEmployees)
        const newSelectedMap = new Map(selectedEmployeeObjects)

        filteredEmployees.forEach((emp) => {
          newSelectedSet.add(emp.empCode)
          newSelectedMap.set(emp.empCode, emp)
        })

        setSelectedEmployees(newSelectedSet)
        setSelectedEmployeeObjects(newSelectedMap)
      } else {
        const newSelectedSet = new Set(selectedEmployees)
        const newSelectedMap = new Map(selectedEmployeeObjects)

        filteredEmployees.forEach((emp) => {
          newSelectedSet.delete(emp.empCode)
          newSelectedMap.delete(emp.empCode)
        })

        setSelectedEmployees(newSelectedSet)
        setSelectedEmployeeObjects(newSelectedMap)
      }
    },
    [filteredEmployees, selectedEmployees, selectedEmployeeObjects]
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
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col h-full">
          <SheetHeader className="pb-0">
            <SheetTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Select Team Members
            </SheetTitle>
            <SheetDescription>
              Search and filter employees to add to your group
            </SheetDescription>
          </SheetHeader>

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
                  <Badge variant="outline">{filteredEmployees.length} results</Badge>
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
              {filteredEmployees.length > 0 && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    ref={selectAllRef}
                    id="select-all"
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                    Select all employees ({filteredEmployees.length})
                  </Label>
                </div>
              )}
            </div>

            {/* Employee List */}
            <div 
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 min-h-0 mt-4 overflow-y-auto overflow-x-hidden"
            >
              <div className="space-y-2 pb-4 px-1 min-h-full">
                {filteredEmployees.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No employees found</p>
                  </div>
                ) : (
                  <>
                    {displayedEmployees.map((employee) => (
                      <EmployeeCard
                        key={employee.empCode}
                        employee={employee}
                        isSelected={selectedEmployees.has(employee.empCode)}
                        onToggle={handleEmployeeToggle}
                      />
                    ))}
                    {hasMore && (
                      <div className="text-center py-4">
                        <Skeleton className="h-20 w-full" />
                        <p className="text-sm text-muted-foreground mt-2">Loading more...</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <SheetFooter className="border-t pt-4">
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
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Filter Sheet */}
      <FilterSheet
        open={isFiltersOpen}
        onOpenChange={setIsFiltersOpen}
        filters={filters}
        onFilterChange={handleFilterChange}
        stats={stats}
        onApply={() => setIsFiltersOpen(false)}
        onClear={clearFilters}
      />
    </>
  )
} 