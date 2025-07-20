import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { FilterProvider } from '@/contexts/filter-context';
import { EmployeeService } from '@/lib/services/employee-service';
import { FilterService } from '@/lib/services/filter-service';
import { EmployeeDirectoryClient } from './page-client';

async function getEmployeeData() {
  try {
    const [employeesResult, stats, filterOptions] = await Promise.all([
      EmployeeService.getEmployees(),
      EmployeeService.getStats(),
      EmployeeService.getFilterOptions(),
    ]);

    return {
      employees: employeesResult.employees,
      stats,
      filterOptions,
    };
  } catch (error) {
    console.error('Error fetching employee data:', error);
    throw error;
  }
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <div className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <Skeleton className="h-8 w-48 mx-auto" />
              <Skeleton className="h-4 w-96 mx-auto" />
            </div>
            <Skeleton className="h-12 max-w-2xl mx-auto" />
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-8">
          <div className="w-80 flex-shrink-0 hidden md:block">
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="flex-1 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function EmployeeDirectoryPage() {
  try {
    // Fetch ALL employees without filters for client-side filtering
    // Increase limit to get all employees at once
    const [employeesResult, stats, enhancedFilterOptions] = await Promise.all([
      EmployeeService.getEmployees({}, 1, 5000), // Get all employees without filters
      EmployeeService.getStats(),
      FilterService.getFilterOptions() // Use enhanced filter options with counts
    ]);

    console.log('✅ Employee Directory Page - Data loaded successfully:', {
      employees: employeesResult.employees.length,
      totalEmployees: stats.totalEmployees,
      filterOptionsCounts: {
        departments: enhancedFilterOptions.departments.length,
        areas: enhancedFilterOptions.areas.length,
        designations: enhancedFilterOptions.designations.length,
        categories: enhancedFilterOptions.categories.length,
        grades: enhancedFilterOptions.grades.length,
        genders: enhancedFilterOptions.genders.length,
        bloodGroups: enhancedFilterOptions.bloodGroups.length
      }
    });

    // Convert enhanced filter options to the format expected by existing components
    const filterOptions = {
      departments: enhancedFilterOptions.departments.map(opt => opt.value),
      areas: enhancedFilterOptions.areas.map(opt => opt.value),
      designations: enhancedFilterOptions.designations.map(opt => opt.value),
      categories: enhancedFilterOptions.categories.map(opt => opt.value),
      grades: enhancedFilterOptions.grades.map(opt => opt.value),
      genders: enhancedFilterOptions.genders.map(opt => opt.value),
      bloodGroups: enhancedFilterOptions.bloodGroups.map(opt => opt.value)
    };

    return (
      <EmployeeDirectoryClient
        initialEmployees={employeesResult.employees}
        stats={stats}
        filterOptions={filterOptions}
        enhancedFilterOptions={enhancedFilterOptions} // Pass enhanced options for new components
      />
    );
  } catch (error) {
    console.error('❌ Employee Directory Page - Error loading data:', error);
    
    // Return with empty data on error
    return (
      <EmployeeDirectoryClient
        initialEmployees={[]}
        stats={{ totalEmployees: 0, totalDepartments: 0, totalAreas: 0 }}
        filterOptions={{
          departments: [],
          areas: [],
          designations: [],
          categories: [],
          grades: [],
          genders: [],
          bloodGroups: []
        }}
        enhancedFilterOptions={{
          departments: [],
          areas: [],
          designations: [],
          categories: [],
          grades: [],
          genders: [],
          bloodGroups: []
        }}
      />
    );
  }
}