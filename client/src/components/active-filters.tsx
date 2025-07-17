import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { EmployeeSearch } from "@shared/schema";

interface ActiveFiltersProps {
  filters: EmployeeSearch;
  onFiltersChange: (filters: EmployeeSearch) => void;
  className?: string;
}

export function ActiveFilters({ filters, onFiltersChange, className }: ActiveFiltersProps) {
  const activeFilters = [];

  // Add active filters to the array
  if (filters.search) {
    activeFilters.push({
      key: 'search',
      label: `Search: "${filters.search}"`,
      value: filters.search,
      remove: () => onFiltersChange({ ...filters, search: undefined })
    });
  }

  if (filters.department) {
    activeFilters.push({
      key: 'department',
      label: `Department: ${filters.department}`,
      value: filters.department,
      remove: () => onFiltersChange({ ...filters, department: undefined })
    });
  }

  if (filters.location) {
    activeFilters.push({
      key: 'location',
      label: `Location: ${filters.location}`,
      value: filters.location,
      remove: () => onFiltersChange({ ...filters, location: undefined })
    });
  }

  if (filters.grade) {
    activeFilters.push({
      key: 'grade',
      label: `Grade: ${filters.grade}`,
      value: filters.grade,
      remove: () => onFiltersChange({ ...filters, grade: undefined })
    });
  }

  if (filters.category) {
    activeFilters.push({
      key: 'category',
      label: `Category: ${filters.category}`,
      value: filters.category,
      remove: () => onFiltersChange({ ...filters, category: undefined })
    });
  }

  if (filters.gender) {
    activeFilters.push({
      key: 'gender',
      label: `Gender: ${filters.gender}`,
      value: filters.gender,
      remove: () => onFiltersChange({ ...filters, gender: undefined })
    });
  }

  if (filters.bloodGroup) {
    activeFilters.push({
      key: 'bloodGroup',
      label: `Blood Group: ${filters.bloodGroup}`,
      value: filters.bloodGroup,
      remove: () => onFiltersChange({ ...filters, bloodGroup: undefined })
    });
  }

  const handleClearAll = () => {
    onFiltersChange({ page: filters.page, limit: filters.limit, sortBy: filters.sortBy });
  };

  if (activeFilters.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-sm text-muted-foreground">Active filters:</span>
      {activeFilters.map((filter) => (
        <Badge
          key={filter.key}
          variant="secondary"
          className="flex items-center gap-1 pr-1"
        >
          <span className="text-xs">{filter.label}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={filter.remove}
            className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
      {activeFilters.length > 1 && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearAll}
          className="h-6 px-2 text-xs"
        >
          Clear all
        </Button>
      )}
    </div>
  );
}