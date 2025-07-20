'use client';

import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { EmployeeDirectoryClient } from './employee-directory-client';
import { ComprehensiveFilters } from './comprehensive-filters';
import { SearchIcon } from 'lucide-react';
import { useFilters } from '@/contexts/filter-context';
import { useEmployeeSearch } from '@/hooks/use-employee-search';
import { Employee } from '@/lib/services/employee-service';
import { FilterOptions } from '@/lib/services/filter-service';
import { ClientOnly } from '@/components/client-only';
import { Button } from '@/components/ui/button';
import { Grid3X3, List } from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEMS_PER_BATCH = 20;

interface FilteredContentProps {
  initialEmployees: Employee[];
  stats: {
    totalEmployees: number;
    totalDepartments: number;
    totalAreas: number;
  };
  filterOptions: {
    departments: string[];
    areas: string[];
    designations: string[];
    categories: string[];
    grades: string[];
    genders: string[];
    bloodGroups: string[];
  };
  enhancedFilterOptions?: FilterOptions | undefined; // New prop for enhanced filter options with counts
}

export function FilteredContent({ 
  initialEmployees, 
  stats, 
  filterOptions,
  enhancedFilterOptions 
}: FilteredContentProps) {
  const { filters, hasActiveFilters } = useFilters();
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [displayCount, setDisplayCount] = React.useState(ITEMS_PER_BATCH);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { filteredEmployees, totalResults, isSearching } = useEmployeeSearch(initialEmployees, filters);
  
  // Calculate dynamic filter options based on current filtered results
  const dynamicFilterOptions = React.useMemo(() => {
    if (!enhancedFilterOptions) return null;

    // Helper function to count occurrences in filtered results
    const countOccurrences = (field: string) => {
      const counts = new Map<string, number>();
      filteredEmployees.forEach(emp => {
        const value = (emp as any)[field];
        if (value && typeof value === 'string') {
          counts.set(value, (counts.get(value) || 0) + 1);
        }
      });
      return counts;
    };

    // Calculate counts for each filter type
    const departmentCounts = countOccurrences('department');
    const areaCounts = countOccurrences('areaName');
    const gradeCounts = countOccurrences('grade');
    const designationCounts = countOccurrences('designation');
    const categoryCounts = countOccurrences('category');
    const genderCounts = countOccurrences('gender');
    const bloodGroupCounts = countOccurrences('bloodGroup');

    // Update original options with new counts, keeping all options visible
    const updateOptionsWithCounts = (
      originalOptions: Array<{ value: string; label: string; count: number }>,
      counts: Map<string, number>
    ) => {
      return originalOptions.map(option => ({
        ...option,
        count: counts.get(option.value) || 0
      }));
    };

    return {
      departments: updateOptionsWithCounts(enhancedFilterOptions.departments, departmentCounts),
      areas: updateOptionsWithCounts(enhancedFilterOptions.areas, areaCounts),
      grades: updateOptionsWithCounts(enhancedFilterOptions.grades, gradeCounts),
      designations: updateOptionsWithCounts(enhancedFilterOptions.designations, designationCounts),
      categories: updateOptionsWithCounts(enhancedFilterOptions.categories, categoryCounts),
      genders: updateOptionsWithCounts(enhancedFilterOptions.genders, genderCounts),
      bloodGroups: updateOptionsWithCounts(enhancedFilterOptions.bloodGroups, bloodGroupCounts)
    };
  }, [filteredEmployees, enhancedFilterOptions]);
  
  // Debug log
  React.useEffect(() => {
    console.log('FilteredContent - filters:', filters, 'totalResults:', totalResults);
    if (dynamicFilterOptions) {
      console.log('Dynamic filter options:', dynamicFilterOptions);
    }
  }, [filters, totalResults, dynamicFilterOptions]);

  // Get displayed employees for lazy loading
  const displayedEmployees = React.useMemo(() => {
    return filteredEmployees.slice(0, displayCount);
  }, [filteredEmployees, displayCount]);

  // Reset display count when filters change
  React.useEffect(() => {
    setDisplayCount(ITEMS_PER_BATCH);
  }, [filters]);

  // Intersection Observer for lazy loading
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && displayCount < filteredEmployees.length) {
          setDisplayCount(prev => Math.min(prev + ITEMS_PER_BATCH, filteredEmployees.length));
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [displayCount, filteredEmployees.length]);

  // Memoized loading overlay wrapped in ClientOnly to prevent hydration issues
  const loadingOverlay = useMemo(() => {
    return (
      <ClientOnly>
        {isSearching && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
            <div className="flex items-center space-x-3 text-muted-foreground">
              <SearchIcon className="h-5 w-5 animate-spin" />
              <span>Filtering employees...</span>
            </div>
          </div>
        )}
      </ClientOnly>
    );
  }, [isSearching]);

  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-8">
      {/* Sidebar Filters - Sticky on desktop */}
      <div className="hidden lg:block">
        <div className="sticky top-20 space-y-6 max-h-[calc(100vh-6rem)] overflow-y-auto">
          <ComprehensiveFilters
            totalEmployees={stats.totalEmployees}
            filteredCount={filteredEmployees.length}
            filterOptions={filterOptions} // Use the old format for backward compatibility
            enhancedFilterOptions={dynamicFilterOptions || enhancedFilterOptions} // Use dynamic options when available
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6 relative">
        {loadingOverlay}
        
        {/* Desktop Sticky View Mode Toggle - Top Right */}
        <div className="hidden md:block fixed top-20 right-6 z-30">
          <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg shadow-lg border p-1">
            <div className="flex gap-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
                className="h-8 w-8"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
                className="h-8 w-8"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <EmployeeDirectoryClient
          initialEmployees={displayedEmployees}
          isLoading={isSearching}
          variant="desktop"
          viewMode={viewMode}
        />
        
        {/* Load More Trigger */}
        {displayCount < filteredEmployees.length && (
          <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
            <span className="text-sm text-muted-foreground">Loading more...</span>
          </div>
        )}
        
        {/* Mobile Filtered Count - Bottom Left */}
        <div className="fixed bottom-4 left-4 z-30 md:hidden">
          <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-full shadow-lg border px-3 py-1.5">
            <span className="text-xs font-medium">{filteredEmployees.length}</span>
          </div>
        </div>
      </div>
      
      {/* Mobile filters */}
      <div className="lg:hidden">
        <ComprehensiveFilters
          totalEmployees={stats.totalEmployees}
          filteredCount={filteredEmployees.length}
          filterOptions={filterOptions}
          enhancedFilterOptions={dynamicFilterOptions || enhancedFilterOptions}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </div>
    </div>
  );
}