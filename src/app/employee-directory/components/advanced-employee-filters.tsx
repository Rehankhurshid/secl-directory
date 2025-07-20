'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  X, 
  Building, 
  MapPin, 
  Award, 
  Users,
  Download,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/lib/hooks/use-debounce';

interface FilterStats {
  departments: Array<{ name: string; count: number }>;
  locations: Array<{ name: string; count: number }>;
  grades: Array<{ name: string; count: number }>;
  designations: Array<{ name: string; count: number }>;
  totalEmployees: number;
}

interface FilterValues {
  search: string;
  department: string;
  location: string;
  grade: string;
  designation: string;
  page: number;
  limit: number;
}

interface AdvancedEmployeeFiltersProps {
  stats?: FilterStats;
  onFiltersChange?: (filters: Partial<FilterValues>) => void;
  className?: string;
  variant?: 'desktop' | 'mobile';
  isLoading?: boolean;
}

// Mock stats data - replace with actual API call
const mockStats: FilterStats = {
  departments: [
    { name: 'EXCAVATION', count: 450 },
    { name: 'ELECT. & MECH', count: 380 },
    { name: 'MINING/U.G.', count: 320 },
    { name: 'TRANSPORT', count: 280 },
    { name: 'CIVIL', count: 250 },
    { name: 'SECURITY', count: 180 },
    { name: 'ADMINISTRATION', count: 150 }
  ],
  locations: [
    { name: 'Gevra Area', count: 800 },
    { name: 'Dipka Area', count: 600 },
    { name: 'Kusmunda Area', count: 500 },
    { name: 'Korba Area', count: 400 },
    { name: 'Raigarh Area', count: 300 },
    { name: 'Bilaspur Area', count: 200 }
  ],
  grades: [
    { name: 'EXV-B', count: 200 },
    { name: 'EXV-C', count: 180 },
    { name: 'E-8', count: 150 },
    { name: 'E-7', count: 120 },
    { name: 'D1', count: 100 },
    { name: 'O+', count: 80 },
    { name: 'B+', count: 60 }
  ],
  designations: [
    { name: 'MANAGER', count: 50 },
    { name: 'ASSISTANT MANAGER', count: 80 },
    { name: 'ENGINEER', count: 150 },
    { name: 'FOREMAN', count: 200 },
    { name: 'SUPERVISOR', count: 300 },
    { name: 'OPERATOR', count: 400 },
    { name: 'TECHNICIAN', count: 350 }
  ],
  totalEmployees: 2802
};

interface FilterSelectProps {
  icon: React.ElementType;
  label: string;
  value: string;
  options: Array<{ name: string; count: number }>;
  onChange: (value: string) => void;
  placeholder?: string;
}

function FilterSelect({ icon: Icon, label, value, options, onChange, placeholder }: FilterSelectProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder || `All ${label}s`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All {label}s</SelectItem>
          {options.map(option => (
            <SelectItem key={option.name} value={option.name}>
              {option.name} ({option.count})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface FilterSectionProps {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

function FilterSection({ label, icon: Icon, children }: FilterSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Icon className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-medium">{label}</h4>
      </div>
      {children}
    </div>
  );
}

interface ActiveFiltersProps {
  filters: Partial<FilterValues>;
  onRemoveFilter: (key: string) => void;
}

function ActiveFilters({ filters, onRemoveFilter }: ActiveFiltersProps) {
  const activeFilters = Object.entries(filters).filter(([key, value]) => 
    value && value !== 'all' && key !== 'page' && key !== 'limit'
  );

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {activeFilters.map(([key, value]) => (
        <Badge key={key} variant="secondary" className="px-2 py-1">
          {key}: {value}
          <Button
            variant="ghost"
            size="sm"
            className="ml-1 h-auto p-0 w-4 h-4"
            onClick={() => onRemoveFilter(key)}
          >
            <X className="w-3 h-3" />
          </Button>
        </Badge>
      ))}
    </div>
  );
}

// Desktop Filter Bar Component
function DesktopFilterBar({ 
  stats = mockStats, 
  onFiltersChange, 
  isLoading 
}: AdvancedEmployeeFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [filters, setFilters] = useState<Partial<FilterValues>>({
    search: searchParams.get('search') || '',
    department: searchParams.get('department') || 'all',
    location: searchParams.get('location') || 'all',
    grade: searchParams.get('grade') || 'all',
    designation: searchParams.get('designation') || 'all'
  });

  const debouncedSearch = useDebounce(filters.search || '', 300);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        params.set(key, String(value));
      } else {
        params.delete(key);
      }
    });
    
    // Reset page when filters change
    params.delete('page');
    
    router.push(`/employee-directory?${params.toString()}`);
    onFiltersChange?.(filters);
  }, [debouncedSearch, filters.department, filters.location, filters.grade, filters.designation]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      search: '',
      department: 'all',
      location: 'all',
      grade: 'all',
      designation: 'all'
    };
    setFilters(clearedFilters);
  };

  const handleRemoveFilter = (key: string) => {
    const value = key === 'search' ? '' : 'all';
    handleFilterChange(key, value);
  };

  const hasActiveFilters = Object.values(filters).some(value => value && value !== 'all');

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Search Employees</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or employee ID..."
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filters</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {stats.totalEmployees} total employees
              </Badge>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FilterSelect
              icon={Building}
              label="Department"
              value={filters.department || 'all'}
              options={stats.departments}
              onChange={(value) => handleFilterChange('department', value)}
            />
            <FilterSelect
              icon={MapPin}
              label="Location"
              value={filters.location || 'all'}
              options={stats.locations}
              onChange={(value) => handleFilterChange('location', value)}
            />
            <FilterSelect
              icon={Award}
              label="Grade"
              value={filters.grade || 'all'}
              options={stats.grades}
              onChange={(value) => handleFilterChange('grade', value)}
            />
            <FilterSelect
              icon={Users}
              label="Designation"
              value={filters.designation || 'all'}
              options={stats.designations}
              onChange={(value) => handleFilterChange('designation', value)}
            />
          </div>

          {/* Active Filters & Clear Button */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between">
              <ActiveFilters filters={filters} onRemoveFilter={handleRemoveFilter} />
              <Button variant="outline" onClick={handleClearFilters}>
                <X className="w-4 h-4 mr-2" />
                Clear All Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Mobile Filter Drawer Component  
function MobileFilterDrawer({ 
  stats = mockStats, 
  onFiltersChange, 
  isLoading 
}: AdvancedEmployeeFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  
  const [filters, setFilters] = useState<Partial<FilterValues>>({
    search: searchParams.get('search') || '',
    department: searchParams.get('department') || 'all',
    location: searchParams.get('location') || 'all', 
    grade: searchParams.get('grade') || 'all',
    designation: searchParams.get('designation') || 'all'
  });

  const hasActiveFilters = Object.values(filters).some(value => value && value !== 'all');
  const filteredCount = Math.floor(stats.totalEmployees * 0.7); // Mock filtered count

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams);
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        params.set(key, String(value));
      } else {
        params.delete(key);
      }
    });
    
    params.delete('page');
    router.push(`/employee-directory?${params.toString()}`);
    onFiltersChange?.(filters);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      department: 'all',
      location: 'all',
      grade: 'all',
      designation: 'all'
    });
  };

  return (
    <>
      {/* Floating Action Button */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button className="fixed bottom-4 right-4 z-40 rounded-full w-12 h-12 p-0 shadow-lg">
            <Filter className="w-5 h-5" />
            {hasActiveFilters && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">!</span>
              </div>
            )}
          </Button>
        </SheetTrigger>
        
        <SheetContent side="bottom" className="max-h-[90vh] flex flex-col">
          <SheetHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle>Filter Employees</SheetTitle>
              <Badge variant="outline">
                {filteredCount} of {stats.totalEmployees}
              </Badge>
            </div>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Search */}
            <FilterSection label="Search" icon={Search}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name or ID..." 
                  value={filters.search || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </FilterSection>
            
            {/* Department */}
            <FilterSection label="Department" icon={Building}>
              <Select 
                value={filters.department || 'all'} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, department: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {stats.departments.map(dept => (
                    <SelectItem key={dept.name} value={dept.name}>
                      {dept.name} ({dept.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>
            
            {/* Location */}
            <FilterSection label="Location" icon={MapPin}>
              <Select 
                value={filters.location || 'all'} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, location: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {stats.locations.map(location => (
                    <SelectItem key={location.name} value={location.name}>
                      {location.name} ({location.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>
            
            {/* Grade */}
            <FilterSection label="Grade" icon={Award}>
              <Select 
                value={filters.grade || 'all'} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, grade: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Grades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {stats.grades.map(grade => (
                    <SelectItem key={grade.name} value={grade.name}>
                      {grade.name} ({grade.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>
          </div>
          
          <div className="p-4 border-t flex-shrink-0">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClearFilters} className="flex-1">
                Clear All
              </Button>
              <Button onClick={handleApplyFilters} className="flex-1">
                Apply Filters
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function AdvancedEmployeeFilters(props: AdvancedEmployeeFiltersProps) {
  const { variant = 'desktop', className } = props;
  
  if (variant === 'mobile') {
    return <MobileFilterDrawer {...props} />;
  }
  
  return (
    <div className={className}>
      <DesktopFilterBar {...props} />
    </div>
  );
} 