'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, FilterX } from 'lucide-react';
import { useFilters } from '@/contexts/filter-context';
import { cn } from '@/lib/utils';

interface FilterChipsProps {
  className?: string;
  showClearAll?: boolean;
  compact?: boolean;
}

export function FilterChips({ className, showClearAll = true, compact = false }: FilterChipsProps) {
  const { filters, setFilter, clearFilters, hasActiveFilters } = useFilters();

  // Don't render anything if no filters are active
  if (!hasActiveFilters) {
    return null;
  }

  const activeFilters = [
    {
      key: 'search',
      label: 'Search',
      value: filters.search,
      displayValue: `"${filters.search}"`,
    },
    {
      key: 'department',
      label: 'Department',
      value: filters.department,
      displayValue: filters.department,
    },
    {
      key: 'area',
      label: 'Location', 
      value: filters.area,
      displayValue: filters.area,
    },
    {
      key: 'designation',
      label: 'Designation',
      value: filters.designation,
      displayValue: filters.designation,
    },
    {
      key: 'category',
      label: 'Category',
      value: filters.category,
      displayValue: filters.category,
    },
    {
      key: 'grade',
      label: 'Grade',
      value: filters.grade,
      displayValue: filters.grade,
    },
    {
      key: 'gender',
      label: 'Gender',
      value: filters.gender,
      displayValue: filters.gender === 'M' ? 'Male' : filters.gender === 'F' ? 'Female' : filters.gender,
    },
    {
      key: 'bloodGroup',
      label: 'Blood Group',
      value: filters.bloodGroup,
      displayValue: filters.bloodGroup,
    },
  ].filter(filter => filter.value && filter.value !== 'all' && filter.value.trim() !== '');

  const handleRemoveFilter = (filterKey: string) => {
    if (filterKey === 'search') {
      setFilter('search', '');
    } else {
      setFilter(filterKey as any, 'all');
    }
  };

  // Determine if we should use compact styling
  const isCompact = compact || className?.includes('bg-transparent');

  return (
    <div className={cn(
      "flex flex-wrap items-start gap-2",
      !isCompact && "p-3 bg-muted/30 rounded-lg border border-dashed",
      className
    )}>
      {!isCompact && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-fit">
          <FilterX className="h-4 w-4" />
          <span className="font-medium">Active Filters:</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {activeFilters.map(filter => (
          <Badge
            key={filter.key}
            variant="secondary"
            className={cn(
              "flex items-center gap-1.5 pr-1 pl-3 py-1.5",
              isCompact ? "text-xs" : "text-xs",
              "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20",
              "transition-colors cursor-pointer group"
            )}
          >
            <span className="font-medium">{filter.label}:</span>
            <span className="text-muted-foreground">{filter.displayValue}</span>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-4 w-4 p-0 ml-1 rounded-full",
                "hover:bg-primary/30 group-hover:bg-primary/30",
                "transition-colors"
              )}
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFilter(filter.key);
              }}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Remove {filter.label} filter</span>
            </Button>
          </Badge>
        ))}

        {showClearAll && activeFilters.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-7 px-3 text-xs border-dashed",
              "hover:bg-destructive hover:text-destructive-foreground hover:border-destructive",
              "transition-colors"
            )}
            onClick={clearFilters}
          >
            <FilterX className="h-3 w-3 mr-1" />
            Clear All
          </Button>
        )}
      </div>
    </div>
  );
} 