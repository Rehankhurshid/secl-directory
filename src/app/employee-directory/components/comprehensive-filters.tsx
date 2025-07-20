'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Filter, 
  X,
  Building,
  MapPin,
  Award,
  Users,
  User,
  Heart,
  Search,
  Grid3X3,
  List
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFilters } from '@/contexts/filter-context';
import { FilterChips } from './filter-chips';
import { Input } from '@/components/ui/input';
import { FilterOptions as EnhancedFilterOptions } from '@/lib/services/filter-service';

interface FilterOptions {
  departments: string[];
  areas: string[];
  designations: string[];
  categories: string[];
  grades: string[];
  genders: string[];
  bloodGroups: string[];
}

interface ComprehensiveFiltersProps {
  totalEmployees: number;
  filteredCount: number;
  filterOptions: FilterOptions;
  enhancedFilterOptions?: EnhancedFilterOptions | undefined;
  className?: string | undefined;
  viewMode?: 'grid' | 'list' | undefined;
  onViewModeChange?: ((mode: 'grid' | 'list') => void) | undefined;
}

// Memoized search component to prevent re-renders
const SearchSection = React.memo(function SearchSection() {
  const { filters, setFilter } = useFilters();
  
  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">Search</span>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by name, ID, designation..."
          value={filters.search || ''}
          onChange={(e) => setFilter('search', e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  );
});

// Memoized filter section component
const FilterSection = React.memo(function FilterSection({
  icon: Icon,
  label,
  value,
  options,
  enhancedOptions,
  onChange,
  placeholder
}: {
  icon: React.ComponentType<any>; // More flexible type for Lucide icons
  label: string;
  value: string;
  options: string[];
  enhancedOptions?: Array<{ value: string; label: string; count: number }> | undefined;
  onChange: (value: string) => void;
  placeholder?: string | undefined;
}) {
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
          {enhancedOptions ? (
            enhancedOptions.map((option) => (
              <SelectItem 
                key={option.value} 
                value={option.value}
                disabled={option.count === 0}
              >
                <div className={cn(
                  "flex items-center justify-between w-full",
                  option.count === 0 && "opacity-50"
                )}>
                  <span>{option.label}</span>
                  <span className="text-xs text-muted-foreground ml-2">({option.count})</span>
                </div>
              </SelectItem>
            ))
          ) : (
            options.map((option) => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
});

export function ComprehensiveFilters({
  totalEmployees,
  filteredCount,
  filterOptions,
  enhancedFilterOptions,
  className,
  viewMode = 'grid',
  onViewModeChange
}: ComprehensiveFiltersProps) {
  const { filters, setFilter, clearFilters, hasActiveFilters } = useFilters();
  const [isOpen, setIsOpen] = useState(false);

  const handleClearFilters = useCallback(() => {
    clearFilters();
    setIsOpen(false);
  }, [clearFilters]);

  // Memoized filter content to prevent unnecessary re-renders
  const FilterContent = useMemo(() => (
    <div className="space-y-6">
      {/* Search Input - Now using the dedicated HighPerformanceSearch component */}
      <SearchSection />
      
      {/* Department Filter */}
      <FilterSection
        icon={Building}
        label="Department"
        value={filters.department}
        options={filterOptions.departments}
        enhancedOptions={enhancedFilterOptions?.departments}
        onChange={(value) => setFilter('department', value)}
      />

      {/* Area/Location Filter */}
      <FilterSection
        icon={MapPin}
        label="Location"
        value={filters.area}
        options={filterOptions.areas}
        enhancedOptions={enhancedFilterOptions?.areas}
        onChange={(value) => setFilter('area', value)}
      />

      {/* Grade Filter */}
      <FilterSection
        icon={Award}
        label="Grade"
        value={filters.grade}
        options={filterOptions.grades}
        enhancedOptions={enhancedFilterOptions?.grades}
        onChange={(value) => setFilter('grade', value)}
      />

      {/* Designation Filter */}
      <FilterSection
        icon={Users}
        label="Designation"
        value={filters.designation}
        options={filterOptions.designations}
        enhancedOptions={enhancedFilterOptions?.designations}
        onChange={(value) => setFilter('designation', value)}
      />

      {/* Category Filter */}
      <FilterSection
        icon={Building}
        label="Category"
        value={filters.category}
        options={filterOptions.categories}
        enhancedOptions={enhancedFilterOptions?.categories}
        onChange={(value) => setFilter('category', value)}
      />

      {/* Gender Filter */}
      <FilterSection
        icon={User}
        label="Gender"
        value={filters.gender}
        options={filterOptions.genders}
        enhancedOptions={enhancedFilterOptions?.genders}
        onChange={(value) => setFilter('gender', value)}
      />

      {/* Blood Group Filter */}
      <FilterSection
        icon={Heart}
        label="Blood Group"
        value={filters.bloodGroup}
        options={filterOptions.bloodGroups}
        enhancedOptions={enhancedFilterOptions?.bloodGroups}
        onChange={(value) => setFilter('bloodGroup', value)}
      />
    </div>
  ), [filters, filterOptions, enhancedFilterOptions, setFilter]);

  // Desktop filters component
  const DesktopFilters = useMemo(() => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters
        </h3>
        <div className="text-sm text-muted-foreground">
          {filteredCount} / {totalEmployees} employees
        </div>
      </div>

      {/* Active Filter Chips */}
      <FilterChips compact={true} />

      {/* Filter Content */}
      {FilterContent}

      {/* Clear All Button */}
      {hasActiveFilters && (
        <Button variant="outline" className="w-full" onClick={clearFilters}>
          <X className="h-4 w-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  ), [FilterContent, filteredCount, totalEmployees, hasActiveFilters, clearFilters]);

  // Mobile filter sheet component
  const MobileFilters = useMemo(() => (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          className="md:hidden fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg"
        >
          <Filter className="h-5 w-5" />
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] max-h-[85vh] flex flex-col rounded-t-lg">
        <SheetHeader className="pb-4 flex-shrink-0">
          <SheetTitle>Filters</SheetTitle>
          
          {/* Active Filter Chips for Mobile */}
          {hasActiveFilters && (
            <div className="space-y-2">
              <FilterChips showClearAll={false} compact={true} />
            </div>
          )}
          
           <div className="text-sm text-muted-foreground">
            {filteredCount} of {totalEmployees} employees
           </div>
         </SheetHeader>
        
        <div className="flex-1 overflow-y-auto">
           <div className="pb-24">
             {FilterContent}
           </div>
        </div>
        
        {/* Fixed bottom buttons */}
        <div className="flex-shrink-0 border-t bg-background p-4 space-y-2">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
            >
              Clear All
            </Button>
            <Button 
              className="flex-1" 
              onClick={() => setIsOpen(false)}
            >
              Apply Filters
            </Button>
          </div>
          {hasActiveFilters && (
            <p className="text-xs text-center text-muted-foreground">
              {Object.keys(filters).filter(key => filters[key as keyof typeof filters]).length} filters active
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  ), [isOpen, hasActiveFilters, filteredCount, totalEmployees, FilterContent, handleClearFilters]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Desktop Filters */}
      <div className="hidden md:block">
        {DesktopFilters}
      </div>
      
      {/* Mobile Filters */}
      {MobileFilters}
    </div>
  );
}