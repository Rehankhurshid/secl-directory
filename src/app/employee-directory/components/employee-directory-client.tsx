'use client';

import { EmployeeDirectoryGrid } from './employee-directory-grid';
import { useAuth } from '@/lib/hooks/use-auth';

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

interface EmployeeDirectoryClientProps {
  initialEmployees: Employee[];
  variant: 'desktop' | 'mobile';
  isLoading?: boolean;
  viewMode?: 'grid' | 'list';
}

export function EmployeeDirectoryClient({
  initialEmployees,
  variant,
  isLoading = false,
  viewMode = 'grid'
}: EmployeeDirectoryClientProps) {
  const auth = useAuth();
  const isAdmin = auth?.employee?.role === 'admin';

  return (
    <EmployeeDirectoryGrid 
      employees={initialEmployees}
      isLoading={isLoading}
      showEdit={isAdmin}
      viewMode={viewMode}
    />
  );
} 