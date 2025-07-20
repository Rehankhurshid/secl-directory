'use client';

import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { EmployeeCard } from './employee-card';
import { Search, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Employee {
  id: number;
  empCode: string;
  name: string;
  designation: string | null;
  department: string | null;
  areaName: string | null;
  unitName: string | null;
  emailId: string | null;
  phoneNumber1: string | null;
  phoneNumber2: string | null;
  category: string | null;
  grade: string | null;
  discipline: string | null;
  fatherName: string | null;
  dob: string | null;
  gender: string | null;
  bloodGroup: string | null;
  profileImage?: string | null;
  isActive: boolean;
}

interface EmployeeDirectoryGridProps {
  employees: Employee[];
  isLoading?: boolean;
  showEdit?: boolean;
  viewMode?: 'grid' | 'list';
}

function EmployeeCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-[200px] w-full" />
    </div>
  );
}

export function EmployeeDirectoryGrid({ 
  employees, 
  isLoading = false,
  showEdit = false,
  viewMode = 'grid'
}: EmployeeDirectoryGridProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter employees by search
  const filteredEmployees = employees.filter(employee => {
    if (searchQuery === '') return true;
    
    const search = searchQuery.toLowerCase();
    return (
      employee.name.toLowerCase().includes(search) ||
      employee.empCode.toLowerCase().includes(search) ||
      employee.designation?.toLowerCase().includes(search) ||
      employee.department?.toLowerCase().includes(search)
    );
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(8)].map((_, i) => (
            <EmployeeCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mobile Sticky Search */}
      <div className="sticky top-14 z-10 -mx-4 px-4 py-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b md:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
      </div>
      
      {/* Employee Grid/List */}
      {filteredEmployees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No employees found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your search
          </p>
        </div>
      ) : (
        <div className={cn(
          viewMode === 'grid' 
            ? "grid gap-4 grid-cols-1 md:grid-cols-2" 
            : "space-y-4"
        )}>
          {filteredEmployees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              showEdit={showEdit}
              variant={viewMode === 'list' ? 'compact' : 'default'}
            />
          ))}
        </div>
      )}
    </div>
  );
}