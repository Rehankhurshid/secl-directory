'use client';

import { useState, useEffect, useRef } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { 
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  MapPinIcon,
  Droplet,
  Contact,
  Wallet,
  ShieldCheck,
  Settings
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

// Section Card Component
function SectionCard({ 
  title, 
  icon: Icon, 
  children,
  className
}: { 
  title: string; 
  icon: React.ComponentType<any>; 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      <div className="bg-muted/50 rounded-lg p-4">
        {children}
      </div>
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
}

function InfoItem({ icon: Icon, label, value, copyable = false, sensitive = false }: InfoItemProps) {
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

export function EmployeeDetailsModalEnhanced({ empCode, open, onOpenChange }: EmployeeDetailsModalProps) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    if (open && empCode) {
      loadEmployee();
    } else {
      setEmployee(null);
    }
  }, [open, empCode]);

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

  const content = (
    <>
      {loading ? (
        <div className="space-y-6 p-6">
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
          {/* Header Section */}
          <div className="text-center space-y-4 pb-6 border-b bg-gradient-to-br from-primary/5 via-primary/10 to-transparent rounded-xl p-6">
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
                {employee.bloodGroup && (
                  <Badge variant="outline" className="text-xs border-red-200 text-red-600 dark:border-red-800 dark:text-red-400">
                    <Droplet className="w-3 h-3 mr-1" />
                    {employee.bloodGroup}
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

          {/* All Sections in Single Scroll */}
          <div className="space-y-6">
            {/* Basic Personal Information */}
            <SectionCard title="Basic Personal Information" icon={User}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <InfoItem icon={User} label="Full Name" value={employee.name} />
                <InfoItem icon={User} label="Father's Name" value={employee.fatherName} />
                <InfoItem icon={Calendar} label="Date of Birth" value={formatDate(employee.dob)} />
                <InfoItem icon={Users} label="Gender" value={formatGender(employee.gender)} />
                <InfoItem icon={Heart} label="Blood Group" value={employee.bloodGroup} />
              </div>
            </SectionCard>

            <Separator />

            {/* Contact Information */}
            <SectionCard title="Contact Information" icon={Phone}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InfoItem icon={Mail} label="Email Address" value={employee.emailId} copyable />
                  <InfoItem icon={Phone} label="Primary Phone" value={employee.phoneNumber1} copyable />
                  <InfoItem icon={Phone} label="Secondary Phone" value={employee.phoneNumber2} copyable />
                </div>
                
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
            </SectionCard>

            <Separator />

            {/* Employment Details */}
            <SectionCard title="Employment Details" icon={Briefcase}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <InfoItem icon={IdCard} label="Employee Code" value={employee.empCode} copyable />
                  <InfoItem icon={Briefcase} label="Designation" value={employee.designation} />
                  <InfoItem icon={Users} label="Category" value={employee.category} />
                  <InfoItem icon={Award} label="Grade" value={employee.grade} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <InfoItem icon={GraduationCap} label="Discipline" value={employee.discipline} />
                  <InfoItem icon={UserCheck} label="Status" value={employee.isActive ? "Active" : "Inactive"} />
                  <InfoItem icon={Activity} label="Pay Flag" value={employee.payFlag} />
                </div>

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
            </SectionCard>

            <Separator />

            {/* Organizational Structure */}
            <SectionCard title="Organizational Structure" icon={Building}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <InfoItem icon={Building} label="Department" value={employee.department} />
                <InfoItem icon={Building2} label="Sub Department" value={employee.subDepartment} />
                <InfoItem icon={MapPin} label="Area Name" value={employee.areaName} />
                <InfoItem icon={Building2} label="Unit Name" value={employee.unitName} />
                <InfoItem icon={IdCard} label="Department Code" value={employee.deptCode} />
                <InfoItem icon={IdCard} label="Unit Code" value={employee.unitCode} />
              </div>
            </SectionCard>

            {/* Personal Details */}
            {(employee.casteCode || employee.religionCode || employee.maritalStatusCode || employee.spouseName || employee.spouseEmpCode) && (
              <>
                <Separator />
                <SectionCard title="Personal Details" icon={Users}>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <InfoItem icon={IdCard} label="Caste Code" value={employee.casteCode} />
                    <InfoItem icon={IdCard} label="Religion Code" value={employee.religionCode} />
                    <InfoItem icon={Heart} label="Marital Status" value={employee.maritalStatusCode} />
                    <InfoItem icon={User} label="Spouse Name" value={employee.spouseName} />
                    <InfoItem icon={IdCard} label="Spouse Emp Code" value={employee.spouseEmpCode} />
                  </div>
                </SectionCard>
              </>
            )}

            {/* Financial Information */}
            {(employee.bankAccountNo || employee.bankName || employee.basicSalary || employee.hra || employee.ncwaBasic) && (
              <>
                <Separator />
                <SectionCard title="Financial Information" icon={DollarSign}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InfoItem icon={CreditCard} label="Bank Account Number" value={employee.bankAccountNo} copyable sensitive />
                      <InfoItem icon={Banknote} label="Bank Name" value={employee.bankName} />
                    </div>
                    
                    {(employee.basicSalary || employee.hra || employee.ncwaBasic) && (
                      <div className="border-t pt-3">
                        <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5" />
                          Salary Components
                        </p>
                        <div className="grid grid-cols-3 gap-4">
                          <InfoItem icon={DollarSign} label="Basic Salary" value={formatCurrency(employee.basicSalary)} />
                          <InfoItem icon={DollarSign} label="HRA" value={formatCurrency(employee.hra)} />
                          <InfoItem icon={DollarSign} label="NCWA Basic" value={formatCurrency(employee.ncwaBasic)} />
                        </div>
                      </div>
                    )}
                  </div>
                </SectionCard>
              </>
            )}

            {/* Identity Documents */}
            {(employee.aadhaarNo || employee.panNo) && (
              <>
                <Separator />
                <SectionCard title="Identity Documents" icon={Shield}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoItem icon={IdCard} label="Aadhaar Number" value={employee.aadhaarNo} copyable sensitive />
                    <InfoItem icon={FileText} label="PAN Number" value={employee.panNo} copyable sensitive />
                  </div>
                </SectionCard>
              </>
            )}

            {/* System Information */}
            {(employee.createdAt || employee.updatedAt) && (
              <>
                <Separator />
                <SectionCard title="System Information" icon={Clock}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoItem icon={Clock} label="Record Created" value={formatDate(employee.createdAt || null)} />
                    <InfoItem icon={Clock} label="Last Updated" value={formatDate(employee.updatedAt || null)} />
                  </div>
                </SectionCard>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );

  const modalContent = (
    <>
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-6">
          {content}
        </div>
      </div>
      
      {/* Fixed Footer with Action Buttons */}
      {employee && !loading && (
        <div className="flex-shrink-0 bg-background border-t p-4">
          <div className="flex justify-center gap-2">
            {/* Desktop: Show text and icon, Mobile: Icon only */}
            <Button 
              variant="default" 
              size={isDesktop ? "default" : "icon"}
              onClick={handleCall} 
              disabled={!employee.phoneNumber1}
              className={cn(
                isDesktop ? "gap-2" : "h-10 w-10"
              )}
            >
              <Phone className="h-4 w-4" />
              {isDesktop && "Call"}
            </Button>
            
            <Button 
              variant="outline" 
              size={isDesktop ? "default" : "icon"}
              onClick={handleEmail} 
              disabled={!employee.emailId}
              className={cn(
                isDesktop ? "gap-2" : "h-10 w-10"
              )}
            >
              <Mail className="h-4 w-4" />
              {isDesktop && "Email"}
            </Button>
            
            <Button 
              variant="outline" 
              size={isDesktop ? "default" : "icon"}
              className={cn(
                isDesktop ? "gap-2" : "h-10 w-10"
              )}
              disabled
            >
              <QrCode className="h-4 w-4" />
              {isDesktop && "QR Code"}
            </Button>
            
            <Button 
              variant="outline" 
              size={isDesktop ? "default" : "icon"}
              onClick={handleShare}
              className={cn(
                isDesktop ? "gap-2" : "h-10 w-10"
              )}
            >
              <Share2 className="h-4 w-4" />
              {isDesktop && "Share"}
            </Button>
          </div>
        </div>
      )}
    </>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
          {modalContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] p-0 overflow-hidden">
        <DrawerHeader className="px-6">
          <DrawerTitle>Employee Details</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col h-full overflow-hidden">
          {modalContent}
        </div>
      </DrawerContent>
    </Drawer>
  );
}