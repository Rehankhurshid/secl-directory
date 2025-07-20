'use client';

import React from 'react';
import { FilterProvider } from '@/contexts/filter-context';
import { EmployeeDirectoryClient } from './page-client';
import { Employee } from '@/lib/services/employee-service';

interface EmployeeDirectoryWrapperProps {
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
}

export function EmployeeDirectoryWrapper({
  initialEmployees,
  stats,
  filterOptions
}: EmployeeDirectoryWrapperProps) {
  return (
    <FilterProvider>
      <EmployeeDirectoryClient
        initialEmployees={initialEmployees}
        stats={stats}
        filterOptions={filterOptions}
      />
    </FilterProvider>
  );
}