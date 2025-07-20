'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  User,
  Eye,
  Copy,
  MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmployeeDetailsModal } from './employee-details-modal';

interface Employee {
  id: number;
  empCode: string;
  name: string;
  designation: string | null;
  department: string | null;
  areaName: string | null;
  emailId: string | null;
  phoneNumber1: string | null;
  category: string | null;
  grade: string | null;
  isActive: boolean;
}

interface EmployeeGridProps {
  employees: Employee[];
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getDepartmentColor(department: string | null): string {
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
}

function getCategoryBadge(category: string | null, grade: string | null) {
  if (!category) return null;
  
  const variant = category === 'MONTHLY RATED' ? 'default' : 'secondary';
  const text = grade ? `${grade}` : category.replace('RATED', '').trim();
  
  return (
    <Badge variant={variant} className="text-xs">
      {text}
    </Badge>
  );
}

function getGradeColor(grade: string | null): string {
  if (!grade) return 'border-gray-300';
  
  const gradeColors: Record<string, string> = {
    'EXV-B': 'border-green-400',
    'EXV-C': 'border-blue-400',
    'EXV-D': 'border-yellow-400',
    'E-8': 'border-red-400',
    'E-7': 'border-purple-400',
    'E-6': 'border-pink-400',
    'E-5': 'border-indigo-400',
    'E-4': 'border-orange-400',
    'D1': 'border-teal-400',
    'O+': 'border-emerald-400',
    'B+': 'border-violet-400'
  };
  
  return gradeColors[grade] || 'border-gray-300';
}

export function EmployeeGrid({ employees, className }: EmployeeGridProps) {
  const [selectedEmployeeCode, setSelectedEmployeeCode] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleViewDetails = (empCode: string) => {
    setSelectedEmployeeCode(empCode);
    setModalOpen(true);
  };

  const handleModalClose = (open: boolean) => {
    setModalOpen(open);
    if (!open) {
      setSelectedEmployeeCode(null);
    }
  };

  if (employees.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="flex flex-col items-center space-y-4">
          <User className="h-16 w-16 text-muted-foreground" />
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">No employees found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or filters
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
        className
      )}>
        {employees.map((employee) => (
        <Card 
          key={employee.id}
          className={cn(
            "group hover:shadow-lg transition-all duration-200 border-l-4",
            getGradeColor(employee.grade)
          )}
        >
          <CardContent className="p-6 space-y-4">
            {/* Header with Avatar and Badges */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="font-semibold text-sm">
                    {getInitials(employee.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <Badge 
                    variant="outline" 
                    className="text-xs font-mono"
                  >
                    {employee.empCode}
                  </Badge>
                  {employee.grade && (
                    <Badge variant="outline" className="text-xs">
                      {employee.grade}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-col space-y-1">
                {getCategoryBadge(employee.category, employee.grade)}
              </div>
            </div>

            {/* Employee Name & Designation */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg leading-tight">
                {employee.name}
              </h3>
              {employee.designation && (
                <p className="text-sm text-muted-foreground">
                  {employee.designation}
                </p>
              )}
            </div>

            {/* Department & Area */}
            <div className="space-y-2">
              {employee.department && (
                <Badge 
                  className={cn(
                    "text-white text-xs",
                    getDepartmentColor(employee.department)
                  )}
                >
                  {employee.department}
                </Badge>
              )}
              {employee.areaName && (
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{employee.areaName}</span>
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div className="space-y-2">
              {employee.emailId && (
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{employee.emailId}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => navigator.clipboard.writeText(employee.emailId || '')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {employee.phoneNumber1 && (
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span>{employee.phoneNumber1}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => navigator.clipboard.writeText(employee.phoneNumber1 || '')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                {employee.phoneNumber1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    asChild
                  >
                    <a href={`tel:${employee.phoneNumber1}`}>
                      <Phone className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {employee.emailId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    asChild
                  >
                    <a href={`mailto:${employee.emailId}`}>
                      <Mail className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => handleViewDetails(employee.empCode)}
              >
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
    
    {/* Employee Details Modal */}
    {selectedEmployeeCode && (
      <EmployeeDetailsModal
        empCode={selectedEmployeeCode}
        open={modalOpen}
        onOpenChange={handleModalClose}
      />
    )}
  </>
  );
} 