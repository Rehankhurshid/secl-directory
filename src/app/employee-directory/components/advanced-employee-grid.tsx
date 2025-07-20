'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  User,
  IdCard,
  Briefcase,
  Award,
  Calendar,
  Heart,
  QrCode,
  Edit,
  MoreHorizontal
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { EmployeeDetailsModal } from './employee-details-modal';

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

interface AdvancedEmployeeGridProps {
  employees: Employee[];
  isLoading?: boolean;
  className?: string;
  variant?: 'desktop' | 'mobile';
  showEdit?: boolean;
}

// Color coding system from design document
const getCategoryColor = (category: string | null): string => {
  if (!category) return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  
  switch (category.toUpperCase()) {
    case 'EXECUTIVE':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    case 'NON-EXECUTIVE':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'OFFICER':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    case 'MONTHLY RATED':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'DAILY RATED':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }
};

const getGradeColor = (grade: string | null): string => {
  if (!grade) return 'bg-gray-100 text-gray-800';
  
  if (grade.startsWith('E-')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'; // Executive
  if (grade.startsWith('S-')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'; // Senior  
  if (grade.startsWith('A-')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'; // Associate
  if (grade.includes('EXV')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'; // Excavation
  if (grade.includes('D') || grade.includes('O+') || grade.includes('B+')) {
    return 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300';
  }
  
  return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
};

const getDepartmentColor = (department: string | null): string => {
  if (!department) return 'bg-gray-500';
  
  const colors: Record<string, string> = {
    'EXCAVATION': 'bg-green-500',
    'ELECT. & MECH': 'bg-blue-500', 
    'MINING/U.G.': 'bg-cyan-500',
    'TRANSPORT': 'bg-yellow-500',
    'CIVIL': 'bg-purple-500',
    'SECURITY': 'bg-red-500',
    'MEDICAL': 'bg-pink-500',
    'ADMINISTRATION': 'bg-indigo-500',
    'FINANCE & ACCOUNTS': 'bg-orange-500',
    'HUMAN RESOURCE': 'bg-teal-500',
    'SAFETY & COLM': 'bg-amber-500'
  };
  
  return colors[department] || 'bg-gray-500';
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

interface InfoItemProps {
  icon: React.ElementType;
  label: string;
  value: string | null;
  className?: string;
}

function InfoItem({ icon: Icon, label, value, className }: InfoItemProps) {
  if (!value) return null;
  
  return (
    <div className={cn("flex items-center space-x-1", className)}>
      <Icon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <span className="text-xs text-muted-foreground block truncate" title={`${label}: ${value}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ElementType;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
}

function ActionButton({ icon: Icon, onClick, disabled = false, variant = 'ghost' }: ActionButtonProps) {
  return (
    <Button
      variant={variant}
      size="sm"
      className="h-8 w-8 p-0"
      onClick={onClick}
      disabled={disabled}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}

function EmployeeCardSkeleton() {
  return (
    <Card className="p-3">
      <div className="flex items-start space-x-4">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex space-x-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </div>
    </Card>
  );
}

function EmployeeCard({ employee, showEdit = false }: { employee: Employee; showEdit?: boolean }) {
  const [isImageError, setIsImageError] = useState(false);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);

  const handleCall = () => {
    if (employee.phoneNumber1) {
      window.open(`tel:${employee.phoneNumber1}`, '_self');
    }
  };

  const handleEmail = () => {
    if (employee.emailId) {
      window.open(`mailto:${employee.emailId}`, '_self');
    }
  };

  const handleQRCode = () => {
    // TODO: Implement QR code functionality
    console.log('Generate QR code for:', employee.empCode);
  };

  const handleEdit = () => {
    // TODO: Implement edit functionality
    console.log('Edit employee:', employee.empCode);
  };

  const handleViewDetails = () => {
    setShowDetailDrawer(true);
  };

  // Wrapper functions for ActionButton (no parameters)
  const handleCallWrapper = () => {
    handleCall();
  };

  const handleEmailWrapper = () => {
    handleEmail();
  };

  const handleQRCodeWrapper = () => {
    handleQRCode();
  };

  const handleEditWrapper = () => {
    handleEdit();
  };

  return (
    <>
      <Card 
        className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-l-4 border-l-primary"
        onClick={handleViewDetails}
      >
        <CardContent className="p-3">
          {/* Header: Avatar + ID + Badges */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage 
                  src={employee.profileImage || undefined} 
                  alt={employee.name}
                  onError={() => setIsImageError(true)}
                />
                <AvatarFallback className="text-sm font-medium">
                  {getInitials(employee.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <IdCard className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-xs text-muted-foreground font-mono truncate">
                    {employee.empCode}
                  </span>
                </div>
                <h3 className="text-base font-semibold leading-tight line-clamp-2">
                  {employee.name}
                </h3>
              </div>
            </div>
            
            {/* Category & Grade Badges */}
            <div className="flex flex-col items-end space-y-1">
              {employee.discipline && (
                <Badge className={cn("text-xs", getCategoryColor(employee.discipline))}>
                  {employee.discipline}
                </Badge>
              )}
              {employee.grade && (
                <Badge className={cn("text-xs", getGradeColor(employee.grade))}>
                  {employee.grade}
                </Badge>
              )}
            </div>
          </div>

          {/* Designation */}
          {employee.designation && (
            <div className="mb-3">
              <div className="flex items-center space-x-1">
                <Briefcase className="w-3 h-3 text-muted-foreground" />
                <span className="text-sm text-muted-foreground truncate">
                  {employee.designation}
                </span>
              </div>
            </div>
          )}

          {/* 2-Column Info Grid */}
          <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
            <InfoItem icon={Building} label="Department" value={employee.department} />
            <InfoItem icon={MapPin} label="Location" value={employee.areaName} />
            <InfoItem icon={Award} label="Unit" value={employee.unitName} />
            <InfoItem icon={Phone} label="Phone" value={employee.phoneNumber1} />
            <InfoItem icon={Mail} label="Email" value={employee.emailId} />
            <InfoItem icon={Calendar} label="DOB" value={formatDate(employee.dob)} />
            <InfoItem icon={User} label="Father" value={employee.fatherName} />
            <InfoItem icon={Heart} label="Blood Group" value={employee.bloodGroup} />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <div onClick={(e) => e.stopPropagation()}>
                <ActionButton 
                  icon={Phone} 
                  onClick={handleCallWrapper}
                  disabled={!employee.phoneNumber1}
                />
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <ActionButton 
                  icon={Mail} 
                  onClick={handleEmailWrapper}
                  disabled={!employee.emailId}
                />
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <ActionButton 
                  icon={QrCode} 
                  onClick={handleQRCodeWrapper}
                />
              </div>
              {showEdit && (
                <div onClick={(e) => e.stopPropagation()}>
                  <ActionButton 
                    icon={Edit} 
                    onClick={handleEditWrapper}
                  />
                </div>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleViewDetails();
              }}
            >
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Employee Details Modal */}
      <EmployeeDetailsModal
        empCode={employee.empCode}
        open={showDetailDrawer}
        onOpenChange={setShowDetailDrawer}
      />
    </>
  );
}

export function AdvancedEmployeeGrid({ 
  employees, 
  isLoading = false, 
  className,
  variant = 'desktop',
  showEdit = false
}: AdvancedEmployeeGridProps) {
  if (isLoading) {
    return (
      <div className={cn(
        variant === 'mobile' ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 gap-4",
        className
      )}>
        {Array.from({ length: 6 }).map((_, i) => (
          <EmployeeCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 mb-4 text-muted-foreground">
          <User className="w-full h-full" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No employees found</h3>
        <p className="text-muted-foreground mb-4">
          Try adjusting your search criteria or filters
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      variant === 'mobile' ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 gap-4",
      className
    )}>
      {employees.map((employee) => (
        <EmployeeCard 
          key={employee.id} 
          employee={employee} 
          showEdit={showEdit}
        />
      ))}
    </div>
  );
} 