import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, Mail, User, MapPin, Building, IdCard, Briefcase, Award, QrCode, Calendar, Heart, Edit } from "lucide-react";
import { QRCodeModal } from "./qr-code-modal";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import type { Employee } from "@shared/schema";

interface EmployeeCardProps {
  employee: Employee;
  onViewDetails: (employee: Employee) => void;
  onEditEmployee?: (employee: Employee) => void;
  showEditButton?: boolean;
}

export function EmployeeCard({ employee, onViewDetails, onEditEmployee, showEditButton = false }: EmployeeCardProps) {
  const [showQRCode, setShowQRCode] = useState(false);
  const { employee: currentUser } = useAuth();
  const [, setLocation] = useLocation();

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (employee.phone1) {
      window.open(`tel:${employee.phone1}`);
    }
  };

  const handleEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (employee.email) {
      window.open(`mailto:${employee.email}`);
    }
  };

  const handleQRCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowQRCode(true);
  };

  const handleAdminEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEditEmployee) {
      onEditEmployee(employee);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category?.toUpperCase()) {
      case 'EXECUTIVE':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 border border-purple-200 dark:border-purple-800';
      case 'NON-EXECUTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border border-green-200 dark:border-green-800';
      case 'OFFICER':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 border border-orange-200 dark:border-orange-800';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700';
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade?.startsWith('E-')) {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border border-red-200 dark:border-red-800';
    } else if (grade?.startsWith('S-')) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
    } else if (grade?.startsWith('A-')) {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800';
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700';
  };

  const getDepartmentColor = (department: string) => {
    const colors = [
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
      'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
      'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
      'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
      'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300',
    ];
    
    const hash = department.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <Card className="group cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-l-4 border-l-primary">
      <CardContent className="p-3" onClick={() => onViewDetails(employee)}>
        {/* Header with profile image, ID and badges */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={employee.profileImage || ""} alt={employee.name} />
              <AvatarFallback className="text-sm font-medium">
                {employee.name.split(" ").map(n => n[0]).join("").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <IdCard className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-xs text-muted-foreground font-mono">{employee.employeeId}</span>
              </div>
              <h3 className="text-base font-semibold text-foreground leading-tight">{employee.name}</h3>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(employee.discipline)}`}>
              {employee.discipline || 'N/A'}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getGradeColor(employee.grade)}`}>
              {employee.grade || 'N/A'}
            </span>
          </div>
        </div>

        {/* Designation */}
        <div className="mb-3">
          <div className="flex items-center space-x-1">
            <Briefcase className="w-3 h-3 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{employee.designation}</span>
          </div>
        </div>

        {/* Info grid with icons - All details */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
          <div className="flex items-center space-x-2">
            <Building className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <div className={`text-xs font-medium px-1.5 py-0.5 rounded inline-block ${getDepartmentColor(employee.department)}`}>
                {employee.department.length > 12 ? `${employee.department.substring(0, 12)}...` : employee.department}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-foreground truncate">{employee.location}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Award className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-foreground truncate">{employee.unitName}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Phone className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-foreground truncate">{employee.phone1 || "-"}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Mail className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-foreground truncate">{employee.email || "-"}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-foreground truncate">{employee.dob || "-"}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <User className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-foreground truncate">{employee.fatherName || "-"}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Heart className="w-3 h-3 text-red-500 flex-shrink-0" />
            <span className="text-xs text-foreground font-semibold">{employee.bloodGroup || "-"}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {employee.phone1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCall}
                className="h-7 w-7 p-0"
              >
                <Phone className="w-3 h-3" />
              </Button>
            )}
            {employee.email && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEmail}
                className="h-7 w-7 p-0"
              >
                <Mail className="w-3 h-3" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleQRCode}
              className="h-7 w-7 p-0"
            >
              <QrCode className="w-3 h-3" />
            </Button>
            {showEditButton && currentUser?.role === 'admin' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAdminEdit}
                className="h-7 w-7 p-0"
                title="Edit Employee"
              >
                <Edit className="w-3 h-3" />
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(employee);
            }}
            className="text-primary hover:text-primary/80 text-xs px-2 py-1 h-7"
          >
            View Details
          </Button>
        </div>
      </CardContent>
      
      {/* QR Code Modal */}
      <QRCodeModal
        employee={employee}
        open={showQRCode}
        onClose={() => setShowQRCode(false)}
      />
    </Card>
  );
}
