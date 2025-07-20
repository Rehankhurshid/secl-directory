'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface EmployeeFiltersProps {
  initialDepartment?: string;
  initialArea?: string;
  initialDesignation?: string;
}

export function EmployeeFilters({
  initialDepartment = '',
  initialArea = '',
  initialDesignation = ''
}: EmployeeFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    // Reset to first page when filtering
    params.delete('page');
    
    router.push(`/employee-directory?${params.toString()}`);
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('department');
    params.delete('area');
    params.delete('designation');
    params.delete('page');
    
    router.push(`/employee-directory?${params.toString()}`);
  };

  const hasActiveFilters = initialDepartment || initialArea || initialDesignation;

  return (
    <div className="space-y-4">
      {/* Department Filter */}
      <div className="space-y-2">
        <Label htmlFor="department-filter">Department</Label>
        <Select
          value={initialDepartment || 'all'}
          onValueChange={(value) => updateFilter('department', value)}
        >
          <SelectTrigger id="department-filter">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            <SelectItem value="ELECT. & MECH">ELECT. & MECH</SelectItem>
            <SelectItem value="MINING/U.G.">MINING/U.G.</SelectItem>
            <SelectItem value="EXCAVATION">EXCAVATION</SelectItem>
            <SelectItem value="TRANSPORT">TRANSPORT</SelectItem>
            <SelectItem value="CIVIL">CIVIL</SelectItem>
            <SelectItem value="SECURITY">SECURITY</SelectItem>
            <SelectItem value="MEDICAL">MEDICAL</SelectItem>
            <SelectItem value="ADMINISTRATION">ADMINISTRATION</SelectItem>
            <SelectItem value="FINANCE & ACCOUNTS">FINANCE & ACCOUNTS</SelectItem>
            <SelectItem value="HUMAN RESOURCE">HUMAN RESOURCE</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Area Filter */}
      <div className="space-y-2">
        <Label htmlFor="area-filter">Area</Label>
        <Select
          value={initialArea || 'all'}
          onValueChange={(value) => updateFilter('area', value)}
        >
          <SelectTrigger id="area-filter">
            <SelectValue placeholder="All Areas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Areas</SelectItem>
            <SelectItem value="Gevra Area">Gevra Area</SelectItem>
            <SelectItem value="Dipka Area">Dipka Area</SelectItem>
            <SelectItem value="Kusmunda Area">Kusmunda Area</SelectItem>
            <SelectItem value="Korba Area">Korba Area</SelectItem>
            <SelectItem value="Raigarh Area">Raigarh Area</SelectItem>
            <SelectItem value="Bilaspur Area">Bilaspur Area</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Designation Filter */}
      <div className="space-y-2">
        <Label htmlFor="designation-filter">Designation</Label>
        <Select
          value={initialDesignation || 'all'}
          onValueChange={(value) => updateFilter('designation', value)}
        >
          <SelectTrigger id="designation-filter">
            <SelectValue placeholder="All Designations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Designations</SelectItem>
            <SelectItem value="MANAGER">MANAGER</SelectItem>
            <SelectItem value="ASSISTANT MANAGER">ASSISTANT MANAGER</SelectItem>
            <SelectItem value="DEPUTY MANAGER">DEPUTY MANAGER</SelectItem>
            <SelectItem value="ENGINEER">ENGINEER</SelectItem>
            <SelectItem value="ASSISTANT ENGINEER">ASSISTANT ENGINEER</SelectItem>
            <SelectItem value="JUNIOR ENGINEER">JUNIOR ENGINEER</SelectItem>
            <SelectItem value="FOREMAN">FOREMAN</SelectItem>
            <SelectItem value="SUPERVISOR">SUPERVISOR</SelectItem>
            <SelectItem value="OPERATOR">OPERATOR</SelectItem>
            <SelectItem value="TECHNICIAN">TECHNICIAN</SelectItem>
            <SelectItem value="HELPER">HELPER</SelectItem>
            <SelectItem value="CLERK">CLERK</SelectItem>
            <SelectItem value="OFFICER">OFFICER</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clear All Filters */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearAllFilters}
          className="w-full"
        >
          <X className="h-4 w-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  );
} 