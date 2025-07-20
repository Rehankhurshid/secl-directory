'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { 
  Phone, 
  Mail, 
  Copy, 
  Share2, 
  QrCode,
  User,
  Hash,
  Briefcase,
  Building,
  MapPin,
  Calendar,
  Heart,
  CheckCircle,
  XCircle,
  Building2,
  GraduationCap,
  Clock,
  UserCheck,
  CreditCard,
  DollarSign,
  Shield,
  Eye,
  EyeOff,
  Banknote,
  FileText,
  Home,
  Users,
  IdCard,
  Award,
  Activity,
  MapPinIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getEmployeeByCode } from '../actions';

// Comprehensive Employee interface with all fields
interface Employee {
  // Primary Key & Unique Identifiers
  id: number;
  empCode: string;
  
  // Basic Personal Information
  name: string;
  fatherName: string | null;
  dob: string | null;
  gender: string | null;
  
  // Contact Information
  emailId: string | null;
  phoneNumber1: string | null;
  phoneNumber2: string | null;
  permanentAddress: string | null;
  presentAddress: string | null;
  
  // Employment Details
  designation: string | null;
  category: string | null;
  grade: string | null;
  discipline: string | null;
  dateOfAppointment: string | null;
  areaJoiningDate: string | null;
  gradeJoiningDate: string | null;
  incrementDate: string | null;
  expectedExitDate: string | null;
  companyPostingDate: string | null;
  
  // Organizational Structure
  areaName: string | null;
  unitCode: string | null;
  unitName: string | null;
  deptCode: string | null;
  department: string | null;
  subDepartment: string | null;
  
  // Personal Details
  bloodGroup: string | null;
  casteCode: string | null;
  religionCode: string | null;
  maritalStatusCode: string | null;
  spouseName: string | null;
  spouseEmpCode: string | null;
  
  // Financial Information
  bankAccountNo: string | null;
  bankName: string | null;
  basicSalary: number | null;
  hra: number | null;
  ncwaBasic: number | null;
  
  // Identity Documents
  aadhaarNo: string | null;
  panNo: string | null;
  
  // System Fields
  isActive: boolean;
  payFlag: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  
  // Optional fields
  profileImage?: string | null;
}

interface EmployeeDetailsModalProps {
  empCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Helper functions
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateString: string | null): string | null {
  if (!dateString) return null;
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

function formatCurrency(amount: number | null): string | null {
  if (!amount) return null;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
}

function formatGender(gender: string | null): string | null {
  if (!gender) return null;
  return gender === 'M' ? 'Male' : gender === 'F' ? 'Female' : gender;
}

function getDepartmentColor(department: string | null): string {
  if (!department) return 'bg-gray-500';
  
  const colors: Record<string, string> = {
    'EXCAVATION': 'bg-gradient-to-r from-green-500 to-green-600',
    'ELECT. & MECH': 'bg-gradient-to-r from-blue-500 to-blue-600', 
    'MINING/U.G.': 'bg-gradient-to-r from-cyan-500 to-cyan-600',
    'TRANSPORT': 'bg-gradient-to-r from-yellow-500 to-yellow-600',
    'CIVIL': 'bg-gradient-to-r from-purple-500 to-purple-600',
    'SECURITY': 'bg-gradient-to-r from-red-500 to-red-600',
    'MEDICAL': 'bg-gradient-to-r from-pink-500 to-pink-600',
    'ADMINISTRATION': 'bg-gradient-to-r from-indigo-500 to-indigo-600',
    'FINANCE & ACCOUNTS': 'bg-gradient-to-r from-orange-500 to-orange-600',
    'HUMAN RESOURCE': 'bg-gradient-to-r from-teal-500 to-teal-600',
    'SAFETY & COLM': 'bg-gradient-to-r from-amber-500 to-amber-600'
  };
  
  return colors[department] || 'bg-gradient-to-r from-gray-500 to-gray-600';
}

// Section Header Component
function SectionHeader({ 
  title, 
  icon: Icon, 
  colorClass = "text-primary" 
}: { 
  title: string; 
  icon: React.ComponentType<any>; 
  colorClass?: string; 
}) {
  return (
    <div className={cn("flex items-center gap-2 mb-4 pb-2 border-b", colorClass)}>
      <Icon className="w-5 h-5" />
      <h3 className="text-base font-semibold">{title}</h3>
    </div>
  );
}

// Info Item Component - Compact Version
interface InfoItemProps {
  icon: React.ComponentType<any>;
  label: string;
  value: string | number | null;
  copyable?: boolean;
  sensitive?: boolean;
  compact?: boolean;
}

function InfoItem({ icon: Icon, label, value, copyable = false, sensitive = false, compact = false }: InfoItemProps) {
  const [showSensitive, setShowSensitive] = useState(false);
  const { toast } = useToast();
  
  const handleCopy = async () => {
    if (value && copyable) {
      try {
        await navigator.clipboard.writeText(value.toString());
        toast({
          title: "Copied!",
          description: `${label} copied to clipboard`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to copy to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return null;
  }

  const displayValue = sensitive && !showSensitive 
    ? '••••••••••' 
    : value.toString();

  if (compact) {
    return (
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5" />
          {label}
        </p>
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-foreground">{displayValue}</p>
          {sensitive && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => setShowSensitive(!showSensitive)}
            >
              {showSensitive ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
          )}
          {copyable && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={handleCopy}
            >
              <Copy className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 py-2">
      <div className="flex-shrink-0 w-5 h-5 mt-0.5">
        <Icon className="w-full h-full text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <p className="text-sm text-foreground break-words">{displayValue}</p>
          {sensitive && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={() => setShowSensitive(!showSensitive)}
            >
              {showSensitive ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              <span className="sr-only">Toggle visibility</span>
            </Button>
          )}
          {copyable && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={handleCopy}
            >
              <Copy className="h-3 w-3" />
              <span className="sr-only">Copy {label}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function EmployeeDetailsModal({ empCode, open, onOpenChange }: EmployeeDetailsModalProps) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && empCode) {
      loadEmployee();
    } else {
      setEmployee(null);
      setShowStickyHeader(false);
    }
  }, [open, empCode]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    const header = headerRef.current;
    
    if (!scrollContainer || !header) return;

    const handleScroll = () => {
      const headerBottom = header.getBoundingClientRect().bottom;
      const containerTop = scrollContainer.getBoundingClientRect().top;
      setShowStickyHeader(headerBottom < containerTop);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [employee]);

  const loadEmployee = async () => {
    setLoading(true);
    try {
      const result = await getEmployeeByCode(empCode);
      if (result.success && result.data) {
        setEmployee(result.data);
      } else {
        throw new Error(result.error || 'Failed to load employee');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load employee details",
        variant: "destructive",
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (!employee) return;
    
    const shareData = {
      title: `${employee.name} - Employee Profile`,
      text: `${employee.name}\n${employee.designation || ''}\n${employee.department || ''}\n${employee.emailId || ''}\n${employee.phoneNumber1 || ''}`,
      url: window.location.origin + `/employee-directory/${employee.empCode}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await copyToClipboard(shareData.url, 'Profile link');
      }
    } catch (error) {
      // User cancelled share
    }
  };

  const handleCall = () => {
    if (employee?.phoneNumber1) {
      window.open(`tel:${employee.phoneNumber1}`, '_self');
    }
  };

  const handleEmail = () => {
    if (employee?.emailId) {
      window.open(`mailto:${employee.emailId}`, '_self');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        {/* Sticky Header */}
        <div className={cn(
          "sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b transition-all duration-200",
          showStickyHeader ? "py-3 px-6 shadow-sm" : "p-0 border-transparent"
        )}>
          {showStickyHeader && employee && (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={employee.profileImage || undefined} alt={employee.name} />
                <AvatarFallback className="text-xs font-semibold">
                  {getInitials(employee.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-sm">{employee.name}</h3>
                <p className="text-xs text-muted-foreground">{employee.designation || employee.empCode}</p>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div ref={scrollContainerRef} className="overflow-y-auto flex-1">
          <div className="p-6">
            {loading ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <Skeleton className="h-32 w-32 rounded-full" />
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-6 w-48" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-32" />
                  </div>
                </div>
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i}>
                      <Skeleton className="h-6 w-48 mb-3" />
                      <div className="space-y-2">
                        <Skeleton className="h-16" />
                        <Skeleton className="h-16" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : employee ? (
              <div className="space-y-6">
                {/* Main Header Section */}
                <div ref={headerRef} className="text-center space-y-4 pb-6 border-b border-primary/20 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent rounded-xl p-6">
                  <div className="flex justify-center">
                    <Avatar className="w-32 h-32 ring-4 ring-primary/20 shadow-xl">
                      <AvatarImage src={employee.profileImage || undefined} alt={employee.name} />
                      <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                        {getInitials(employee.name)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="space-y-3">
                    <h2 className="text-2xl font-bold text-foreground">{employee.name}</h2>
                    {employee.designation && (
                      <p className="text-lg text-muted-foreground font-medium">{employee.designation}</p>
                    )}
                    
                    <div className="flex justify-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs font-medium">
                        <Hash className="w-3 h-3 mr-1" />
                        {employee.empCode}
                      </Badge>
                      {employee.isActive ? (
                        <Badge className="text-xs bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          <XCircle className="w-3 h-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                      {employee.category && (
                        <Badge variant="outline" className="text-xs">
                          {employee.category}
                        </Badge>
                      )}
                      {employee.grade && (
                        <Badge className="text-xs" variant="outline">
                          {employee.grade}
                        </Badge>
                      )}
                      {employee.department && (
                        <Badge className={cn("text-white border-0 text-xs", getDepartmentColor(employee.department))}>
                          {employee.department}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* 👤 Basic Personal Information */}
                <div>
                  <SectionHeader title="Basic Personal Information" icon={User} colorClass="text-blue-600" />
                  <div className="bg-gradient-to-r from-blue-50/50 to-blue-50/30 dark:from-blue-950/20 dark:to-blue-950/10 rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <InfoItem icon={User} label="Full Name" value={employee.name} compact />
                      <InfoItem icon={User} label="Father's Name" value={employee.fatherName} compact />
                      <InfoItem icon={Calendar} label="Date of Birth" value={formatDate(employee.dob)} compact />
                      <InfoItem icon={Users} label="Gender" value={formatGender(employee.gender)} compact />
                      <InfoItem icon={Heart} label="Blood Group" value={employee.bloodGroup} compact />
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* 📧 Contact Information */}
                <div>
                  <SectionHeader title="Contact Information" icon={Phone} colorClass="text-green-600" />
                  <div className="bg-gradient-to-r from-green-50/50 to-green-50/30 dark:from-green-950/20 dark:to-green-950/10 rounded-lg p-4">
                    {/* Contact Methods */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <InfoItem icon={Mail} label="Email Address" value={employee.emailId} copyable compact />
                      <InfoItem icon={Phone} label="Primary Phone" value={employee.phoneNumber1} copyable compact />
                      <InfoItem icon={Phone} label="Secondary Phone" value={employee.phoneNumber2} copyable compact />
                    </div>
                    
                    {/* Addresses */}
                    {(employee.presentAddress || employee.permanentAddress) && (
                      <div className="border-t pt-3">
                        <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" />
                          Addresses
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {employee.presentAddress && (
                            <div>
                              <p className="text-[11px] text-muted-foreground mb-1">Present Address</p>
                              <p className="text-sm">{employee.presentAddress}</p>
                            </div>
                          )}
                          {employee.permanentAddress && (
                            <div>
                              <p className="text-[11px] text-muted-foreground mb-1">Permanent Address</p>
                              <p className="text-sm">{employee.permanentAddress}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="my-6" />

                {/* 💼 Employment Details */}
                <div>
                  <SectionHeader title="Employment Details" icon={Briefcase} colorClass="text-purple-600" />
                  <div className="bg-gradient-to-r from-purple-50/50 to-purple-50/30 dark:from-purple-950/20 dark:to-purple-950/10 rounded-lg p-4">
                    {/* Primary Info Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          <IdCard className="w-3.5 h-3.5" />
                          Employee Code
                        </p>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-foreground">{employee.empCode}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => copyToClipboard(employee.empCode, 'Employee Code')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5" />
                          Designation
                        </p>
                        <p className="text-sm font-medium text-foreground">{employee.designation || '-'}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          Category
                        </p>
                        <p className="text-sm font-medium text-foreground">{employee.category || '-'}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5" />
                          Grade
                        </p>
                        <p className="text-sm font-medium text-foreground">{employee.grade || '-'}</p>
                      </div>
                    </div>

                    {/* Secondary Info */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5" />
                          Discipline
                        </p>
                        <p className="text-sm font-medium text-foreground">{employee.discipline || '-'}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5" />
                          Status
                        </p>
                        <Badge variant={employee.isActive ? "default" : "destructive"} className="text-xs">
                          {employee.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5" />
                          Pay Flag
                        </p>
                        <p className="text-sm font-medium text-foreground">{employee.payFlag || '-'}</p>
                      </div>
                    </div>

                    {/* Dates Grid */}
                    <div className="border-t pt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        Important Dates
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
                        <div>
                          <p className="text-[11px] text-muted-foreground">Appointment</p>
                          <p className="text-sm font-medium">{formatDate(employee.dateOfAppointment) || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-muted-foreground">Area Joining</p>
                          <p className="text-sm font-medium">{formatDate(employee.areaJoiningDate) || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-muted-foreground">Grade Joining</p>
                          <p className="text-sm font-medium">{formatDate(employee.gradeJoiningDate) || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-muted-foreground">Increment</p>
                          <p className="text-sm font-medium">{formatDate(employee.incrementDate) || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-muted-foreground">Expected Exit</p>
                          <p className="text-sm font-medium">{formatDate(employee.expectedExitDate) || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-muted-foreground">Company Posting</p>
                          <p className="text-sm font-medium">{formatDate(employee.companyPostingDate) || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* 🏢 Organizational Structure */}
                <div>
                  <SectionHeader title="Organizational Structure" icon={Building} colorClass="text-orange-600" />
                  <div className="bg-gradient-to-r from-orange-50/50 to-orange-50/30 dark:from-orange-950/20 dark:to-orange-950/10 rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <InfoItem icon={Building} label="Department" value={employee.department} compact />
                      <InfoItem icon={Building2} label="Sub Department" value={employee.subDepartment} compact />
                      <InfoItem icon={MapPin} label="Area Name" value={employee.areaName} compact />
                      <InfoItem icon={Building2} label="Unit Name" value={employee.unitName} compact />
                      <InfoItem icon={IdCard} label="Department Code" value={employee.deptCode} compact />
                      <InfoItem icon={IdCard} label="Unit Code" value={employee.unitCode} compact />
                    </div>
                  </div>
                </div>

                {/* 👨‍👩‍👧‍👦 Personal Details */}
                {(employee.casteCode || employee.religionCode || employee.maritalStatusCode || employee.spouseName || employee.spouseEmpCode) && (
                  <>
                    <Separator className="my-6" />
                    <div>
                      <SectionHeader title="Personal Details" icon={Users} colorClass="text-pink-600" />
                      <div className="bg-gradient-to-r from-pink-50/50 to-pink-50/30 dark:from-pink-950/20 dark:to-pink-950/10 rounded-lg p-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <InfoItem icon={IdCard} label="Caste Code" value={employee.casteCode} compact />
                          <InfoItem icon={IdCard} label="Religion Code" value={employee.religionCode} compact />
                          <InfoItem icon={Heart} label="Marital Status" value={employee.maritalStatusCode} compact />
                          <InfoItem icon={User} label="Spouse Name" value={employee.spouseName} compact />
                          <InfoItem icon={IdCard} label="Spouse Emp Code" value={employee.spouseEmpCode} compact />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* 💰 Financial Information */}
                {(employee.bankAccountNo || employee.bankName || employee.basicSalary || employee.hra || employee.ncwaBasic) && (
                  <>
                    <Separator className="my-6" />
                    <div>
                      <SectionHeader title="Financial Information" icon={DollarSign} colorClass="text-emerald-600" />
                      <div className="bg-gradient-to-r from-emerald-50/50 to-emerald-50/30 dark:from-emerald-950/20 dark:to-emerald-950/10 rounded-lg p-4">
                        {/* Banking Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <InfoItem icon={CreditCard} label="Bank Account Number" value={employee.bankAccountNo} copyable sensitive compact />
                          <InfoItem icon={Banknote} label="Bank Name" value={employee.bankName} compact />
                        </div>
                        
                        {/* Salary Components */}
                        {(employee.basicSalary || employee.hra || employee.ncwaBasic) && (
                          <div className="border-t pt-3">
                            <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
                              <DollarSign className="w-3.5 h-3.5" />
                              Salary Components
                            </p>
                            <div className="grid grid-cols-3 gap-4">
                              <InfoItem icon={DollarSign} label="Basic Salary" value={formatCurrency(employee.basicSalary)} compact />
                              <InfoItem icon={DollarSign} label="HRA" value={formatCurrency(employee.hra)} compact />
                              <InfoItem icon={DollarSign} label="NCWA Basic" value={formatCurrency(employee.ncwaBasic)} compact />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* 🆔 Identity Documents */}
                {(employee.aadhaarNo || employee.panNo) && (
                  <>
                    <Separator className="my-6" />
                    <div>
                      <SectionHeader title="Identity Documents" icon={Shield} colorClass="text-red-600" />
                      <div className="bg-gradient-to-r from-red-50/50 to-red-50/30 dark:from-red-950/20 dark:to-red-950/10 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <InfoItem icon={IdCard} label="Aadhaar Number" value={employee.aadhaarNo} copyable sensitive compact />
                          <InfoItem icon={FileText} label="PAN Number" value={employee.panNo} copyable sensitive compact />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* ⚙️ System Information */}
                {(employee.createdAt || employee.updatedAt) && (
                  <>
                    <Separator className="my-6" />
                    <div>
                      <SectionHeader title="System Information" icon={Clock} colorClass="text-gray-600" />
                      <div className="bg-gradient-to-r from-gray-50/50 to-gray-50/30 dark:from-gray-950/20 dark:to-gray-950/10 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <InfoItem icon={Clock} label="Record Created" value={formatDate(employee.createdAt || null)} compact />
                          <InfoItem icon={Clock} label="Last Updated" value={formatDate(employee.updatedAt || null)} compact />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Sticky Footer with Action Buttons */}
        {employee && !loading && (
          <div className="sticky bottom-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t p-4">
            <div className="flex justify-center gap-3">
              <Button 
                variant="default" 
                onClick={handleCall} 
                disabled={!employee.phoneNumber1}
                className="flex-1 max-w-[140px]"
              >
                <Phone className="h-4 w-4 mr-2" />
                Call
              </Button>
              <Button 
                variant="outline" 
                onClick={handleEmail} 
                disabled={!employee.emailId}
                className="flex-1 max-w-[140px]"
              >
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 max-w-[140px]"
                disabled
              >
                <QrCode className="h-4 w-4 mr-2" />
                QR Code
              </Button>
              <Button 
                variant="outline" 
                onClick={handleShare}
                className="flex-1 max-w-[140px]"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}