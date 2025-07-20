'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  MoreVertical,
  Info,
  Copy,
  ExternalLink,
  Droplet,
  Users,
  Hash
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmployeeDetailsModalEnhanced } from './employee-details-modal-enhanced';
import { toast } from 'sonner';

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

interface EmployeeCardProps {
  employee: Employee;
  showEdit?: boolean;
  variant?: 'default' | 'compact';
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
  
  if (grade.startsWith('E-')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  if (grade.startsWith('S-')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
  if (grade.startsWith('A-')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
  if (grade.includes('EXV')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
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

const getBloodGroupStyle = (bloodGroup: string | null) => {
  if (!bloodGroup) return {};
  
  // Color scheme for blood groups
  const isRhNegative = bloodGroup.includes('-');
  
  if (isRhNegative) {
    return {
      borderColor: 'rgb(239 68 68)', // red-500
      backgroundColor: 'rgb(254 242 242)', // red-50
      color: 'rgb(220 38 38)', // red-600
      darkBorderColor: 'rgb(153 27 27)', // red-800
      darkBackgroundColor: 'rgb(127 29 29)', // red-900
      darkColor: 'rgb(252 165 165)' // red-300
    };
  }
  
  return {
    borderColor: 'rgb(239 68 68)', // red-500
    backgroundColor: 'rgb(254 242 242)', // red-50
    color: 'rgb(239 68 68)', // red-500
    darkBorderColor: 'rgb(153 27 27)', // red-800
    darkBackgroundColor: 'rgb(127 29 29)', // red-900
    darkColor: 'rgb(248 113 113)' // red-400
  };
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function EmployeeCard({ employee, showEdit = false, variant = 'default' }: EmployeeCardProps) {
  const [isImageError, setIsImageError] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

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

  const handleCopyId = () => {
    navigator.clipboard.writeText(employee.empCode);
    toast.success('Employee ID copied!');
  };

  const handleQRCode = () => {
    // TODO: Implement QR code functionality
    toast.info('QR Code feature coming soon!');
  };

  const handleEdit = () => {
    // TODO: Implement edit functionality
    toast.info('Edit feature coming soon!');
  };
  
  // Compact variant for list view
  if (variant === 'compact') {
    return (
      <>
        <TooltipProvider>
          <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-md">
            <div className={cn("absolute inset-y-0 left-0 w-1", getDepartmentColor(employee.department))} />
            
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <Avatar className="h-10 w-10 border border-background shadow-sm flex-shrink-0">
                  <AvatarImage 
                    src={employee.profileImage || undefined} 
                    alt={employee.name}
                    onError={() => setIsImageError(true)}
                  />
                  <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-primary/10 to-primary/20">
                    {getInitials(employee.name)}
                  </AvatarFallback>
                </Avatar>
                
                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm line-clamp-1">
                        {employee.name}
                        <span className="ml-2 font-mono text-xs text-muted-foreground">
                          #{employee.empCode}
                        </span>
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {employee.designation || 'No designation'}
                      </p>
                    </div>
                    
                    {/* Quick Info Badges */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {employee.bloodGroup && (
                        <Badge variant="outline" className="text-xs font-medium border-red-200 text-red-600 dark:border-red-800 dark:text-red-400">
                          <Droplet className="mr-1 h-3 w-3" />
                          {employee.bloodGroup}
                        </Badge>
                      )}
                      {employee.discipline && (
                        <Badge className={cn("text-xs", getCategoryColor(employee.discipline))}>
                          {employee.discipline}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Contact Info */}
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    {employee.department && (
                      <span className="flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {employee.department}
                      </span>
                    )}
                    {employee.phoneNumber1 && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {employee.phoneNumber1}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleCall}
                        disabled={!employee.phoneNumber1}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Call</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleEmail}
                        disabled={!employee.emailId}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Email</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setShowDetailModal(true)}>
                        <Info className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleCopyId}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy ID
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleQRCode}>
                        <QrCode className="mr-2 h-4 w-4" />
                        Generate QR
                      </DropdownMenuItem>
                      {showEdit && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={handleEdit}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        </TooltipProvider>
        
        {showDetailModal && (
          <EmployeeDetailsModalEnhanced
            empCode={employee.empCode}
            open={showDetailModal}
            onOpenChange={setShowDetailModal}
          />
        )}
      </>
    );
  }

  return (
    <>
      <TooltipProvider>
        <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg">
          {/* Department color indicator */}
          <div className={cn("absolute inset-x-0 top-0 h-1", getDepartmentColor(employee.department))} />
          
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Avatar className="h-12 w-12 cursor-pointer border-2 border-background shadow-sm">
                      <AvatarImage 
                        src={employee.profileImage || undefined} 
                        alt={employee.name}
                        onError={() => setIsImageError(true)}
                      />
                      <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-primary/10 to-primary/20">
                        {getInitials(employee.name)}
                      </AvatarFallback>
                    </Avatar>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80" side="right">
                    <div className="flex justify-between space-x-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={employee.profileImage || undefined} />
                        <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold">{employee.name}</h4>
                        <p className="text-xs text-muted-foreground">{employee.designation}</p>
                        <div className="flex items-center pt-2">
                          <Badge variant="outline" className="text-xs">
                            {employee.empCode}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
                
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base leading-tight line-clamp-1">
                    {employee.name}
                  </CardTitle>
                  <CardDescription className="text-sm line-clamp-1">
                    {employee.designation || 'No designation'}
                  </CardDescription>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowDetailModal(true)}>
                    <Info className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyId}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy ID
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleQRCode}>
                    <QrCode className="mr-2 h-4 w-4" />
                    Generate QR
                  </DropdownMenuItem>
                  {showEdit && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleEdit}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <Badge variant="outline" className="text-xs font-mono px-2 py-0.5">
                <IdCard className="mr-1 h-3 w-3" />
                {employee.empCode}
              </Badge>
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
          </CardHeader>
          
          <CardContent className="py-3">
            <div className="space-y-2.5">
              {/* Department */}
              {employee.department && (
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium truncate">
                    {employee.department}
                  </span>
                </div>
              )}
              
              {/* Contact Info */}
              {employee.phoneNumber1 && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium">{employee.phoneNumber1}</span>
                  {employee.phoneNumber2 && (
                    <span className="text-muted-foreground">• {employee.phoneNumber2}</span>
                  )}
                </div>
              )}
              {employee.emailId && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate text-blue-600 dark:text-blue-400">{employee.emailId}</span>
                </div>
              )}
              
              {/* Additional Details Grid */}
              <div className="grid grid-cols-2 gap-2">
                {/* Blood Group */}
                {employee.bloodGroup && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Droplet className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                    <span className={cn(
                      "font-medium",
                      employee.bloodGroup.includes('-') 
                        ? "text-red-700 dark:text-red-300 font-semibold" 
                        : "text-red-600 dark:text-red-400"
                    )}>
                      {employee.bloodGroup}
                    </span>
                  </div>
                )}
                
                {/* Gender */}
                {employee.gender && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Users className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">
                      {employee.gender === 'M' ? 'Male' : employee.gender === 'F' ? 'Female' : employee.gender}
                    </span>
                  </div>
                )}
                
                {/* Category */}
                {employee.category && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Hash className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground truncate">
                      {employee.category}
                    </span>
                  </div>
                )}
                
                {/* DOB/Age */}
                {employee.dob && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">
                      {new Date().getFullYear() - new Date(employee.dob).getFullYear()}y
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          
          <Separator />
          
          <CardFooter className="pt-2 pb-3">
            <div className="flex w-full gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={handleCall}
                    disabled={!employee.phoneNumber1}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Call</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={handleEmail}
                    disabled={!employee.emailId}
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Email</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setShowDetailModal(true)}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View Details</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardFooter>
        </Card>
      </TooltipProvider>
      
      {showDetailModal && (
        <EmployeeDetailsModalEnhanced
          empCode={employee.empCode}
          open={showDetailModal}
          onOpenChange={setShowDetailModal}
        />
      )}
    </>
  );
}