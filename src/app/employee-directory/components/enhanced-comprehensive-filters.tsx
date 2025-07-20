'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  User,
  Heart,
  RefreshCw,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFilters } from '@/contexts/filter-context';
import { FilterChips } from './filter-chips';
import { FilterOptions, FilterOption } from '@/lib/services/filter-service';

interface EnhancedComprehensiveFiltersProps {
  totalEmployees: number;
  filteredCount: number;
  enhancedFilterOptions: FilterOptions;
  className?: string;
}

interface FilterSectionProps {
  icon: React.ComponentType<any>; // Use more flexible type for Lucide icons
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  placeholder?: string;
}

function FilterSection({ icon: Icon, label, value, options, onChange, placeholder }: FilterSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">{label}</span>
        {value !== 'all' && (
          <Badge variant="secondary" className="text-xs px-1 py-0">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        )}
      </div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder || `All ${label}s`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            All {label}s
            <span className="ml-2 text-xs text-muted-foreground">
              ({options.reduce((sum, opt) => sum + opt.count, 0)})
            </span>
          </SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center justify-between w-full">
                <span>{option.label}</span>
                <Badge variant="outline" className="ml-2 text-xs">
                  {option.count}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function EnhancedComprehensiveFilters({
  totalEmployees,
  filteredCount,
  enhancedFilterOptions,
  className
}: EnhancedComprehensiveFiltersProps) {
  const { filters, setFilter, clearFilters, hasActiveFilters } = useFilters();
  const [isOpen, setIsOpen] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<string>('');

  // Get cache status for debugging
  useEffect(() => {
    const totalOptions = Object.values(enhancedFilterOptions).reduce(
      (sum, options) => sum + options.length, 
      0
    );
    setCacheStatus(`${totalOptions} filter options loaded`);
  }, [enhancedFilterOptions]);

  const handleClearFilters = () => {
    clearFilters();
    setIsOpen(false);
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Search</span>
          {filters.search && (
            <Badge variant="secondary" className="text-xs px-1 py-0">
              <CheckCircle className="w-3 h-3 mr-1" />
              Active
            </Badge>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, ID, designation..."
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filter Sections */}
      <FilterSection
        icon={Building}
        label="Department"
        value={filters.department}
        options={enhancedFilterOptions.departments}
        onChange={(value) => setFilter('department', value)}
      />

      <FilterSection
        icon={MapPin}
        label="Location"
        value={filters.area}
        options={enhancedFilterOptions.areas}
        onChange={(value) => setFilter('area', value)}
      />

      <FilterSection
        icon={Award}
        label="Grade"
        value={filters.grade}
        options={enhancedFilterOptions.grades}
        onChange={(value) => setFilter('grade', value)}
      />

      <FilterSection
        icon={Users}
        label="Designation"
        value={filters.designation}
        options={enhancedFilterOptions.designations}
        onChange={(value) => setFilter('designation', value)}
      />

      <FilterSection
        icon={Building}
        label="Category"
        value={filters.category}
        options={enhancedFilterOptions.categories}
        onChange={(value) => setFilter('category', value)}
      />

      <FilterSection
        icon={User}
        label="Gender"
        value={filters.gender}
        options={enhancedFilterOptions.genders}
        onChange={(value) => setFilter('gender', value)}
      />

      <FilterSection
        icon={Heart}
        label="Blood Group"
        value={filters.bloodGroup}
        options={enhancedFilterOptions.bloodGroups}
        onChange={(value) => setFilter('bloodGroup', value)}
      />

      {/* Cache Status */}
      <div className="text-xs text-muted-foreground border-t pt-2">
        {cacheStatus}
      </div>
    </div>
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Desktop Filters */}
      <div className="hidden lg:block">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {filteredCount.toLocaleString()} / {totalEmployees.toLocaleString()}
              </Badge>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8 px-2 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {/* Active Filter Chips */}
          <FilterChips compact={true} />

          {/* Filter Content */}
          <FilterContent />
        </div>
      </div>

      {/* Mobile Filter Sheet */}
      <div className="lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full"
              size="lg"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">
                  {Object.values(filters).filter(v => v && v !== 'all').length}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter Employees
              </SheetTitle>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{filteredCount.toLocaleString()} / {totalEmployees.toLocaleString()} employees</span>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="h-6 px-2 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Active Filter Chips */}
              <FilterChips compact={true} showClearAll={false} />
              
              {/* Filter Content */}
              <FilterContent />
              
              {/* Apply Button */}
              <Button 
                onClick={() => setIsOpen(false)} 
                className="w-full"
                size="lg"
              >
                Apply Filters
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
} 