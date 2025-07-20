'use client';

import React from 'react';
import { FilterProvider } from '@/contexts/filter-context';
import { Employee } from '@/lib/services/employee-service';
import { FilterOptions } from '@/lib/services/filter-service';
import { FilteredContent } from './components/filtered-content';

interface EmployeeDirectoryClientProps {
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
  enhancedFilterOptions?: FilterOptions; // New prop for enhanced filter options with counts
}

export function EmployeeDirectoryClient({ 
  initialEmployees, 
  stats, 
  filterOptions,
  enhancedFilterOptions
}: EmployeeDirectoryClientProps) {
  return (
    <FilterProvider>
      <div className="container mx-auto px-4 py-6">
        <FilteredContent 
          initialEmployees={initialEmployees}
          stats={stats}
          filterOptions={filterOptions}
          enhancedFilterOptions={enhancedFilterOptions} // Pass enhanced options
        />
      </div>
    </FilterProvider>
  );
}