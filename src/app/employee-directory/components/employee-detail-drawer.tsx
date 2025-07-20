'use client';

import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Building, 
  User,
  IdCard,
  Briefcase,
  Award,
  Calendar,
  Heart,
  QrCode,
  Share,
  Copy,
  Users,
  Home,
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
  UserPlus,
  MapPinIcon,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';

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

interface EmployeeDetailDrawerProps {
  employee: Employee | null;
  open: boolean;
  onClose: () => void;
}

interface InfoItemProps {
  icon: React.ComponentType<any>;
  label: string;
  value: string | number | null;
  copyable?: boolean;
  sensitive?: boolean;
}

function InfoItem({ icon: Icon, label, value, copyable = false, sensitive = false }: InfoItemProps) {
  const [showSensitive, setShowSensitive] = React.useState(false);
  
  const handleCopy = () => {
    if (value && copyable) {
      navigator.clipboard.writeText(value.toString());
    }
  };

  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return null;
  }

  const displayValue = sensitive && !showSensitive 
    ? '••••••••••' 
    : value.toString();

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

export function EmployeeDetailDrawer({ employee, open, onClose }: EmployeeDetailDrawerProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (!employee) return null;

  const formatDate = (dateString: string | null) => {
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
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return null;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatGender = (gender: string | null) => {
    if (!gender) return null;
    return gender === 'M' ? 'Male' : gender === 'F' ? 'Female' : gender;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleShare = () => {
    const shareData = {
      title: `${employee.name} - Employee Details`,
      text: `Employee: ${employee.name}\nID: ${employee.empCode}\nDepartment: ${employee.department || 'N/A'}`,
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(shareData.text);
    }
  };

  const content = (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="text-center space-y-4 pb-6 border-b border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4">
        <div className="flex justify-center">
          <Avatar className="w-24 h-24 ring-4 ring-primary/20">
            <AvatarImage src={employee.profileImage || undefined} alt={employee.name} />
            <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
              {getInitials(employee.name)}
            </AvatarFallback>
          </Avatar>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">{employee.name}</h2>
          {employee.designation && (
            <p className="text-sm text-muted-foreground font-medium">{employee.designation}</p>
          )}
          
          <div className="flex justify-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs font-medium">
              ID: {employee.empCode}
            </Badge>
            {employee.isActive ? (
              <Badge variant="default" className="text-xs bg-green-100 text-green-800 hover:bg-green-100">
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
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-2">
          {employee.phoneNumber1 && (
            <Button size="sm" variant="outline" onClick={() => window.open(`tel:${employee.phoneNumber1}`, '_self')}>
              <Phone className="w-4 h-4 mr-2" />
              Call
            </Button>
          )}
          {employee.emailId && (
            <Button size="sm" variant="outline" onClick={() => window.open(`mailto:${employee.emailId}`, '_self')}>
              <Mail className="w-4 h-4 mr-2" />
              Email
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={handleShare}>
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* 👤 Basic Personal Information */}
      <div>
        <SectionHeader title="Basic Personal Information" icon={User} colorClass="text-blue-600" />
        <div className="space-y-1 bg-blue-50/50 rounded-lg p-3">
          <InfoItem icon={User} label="Full Name" value={employee.name} />
          <InfoItem icon={User} label="Father's Name" value={employee.fatherName} />
          <InfoItem icon={Calendar} label="Date of Birth" value={formatDate(employee.dob)} />
          <InfoItem icon={Users} label="Gender" value={formatGender(employee.gender)} />
          <InfoItem icon={Heart} label="Blood Group" value={employee.bloodGroup} />
        </div>
      </div>

      <Separator />

      {/* 📧 Contact Information */}
      <div>
        <SectionHeader title="Contact Information" icon={Phone} colorClass="text-green-600" />
        <div className="space-y-1 bg-green-50/50 rounded-lg p-3">
          <InfoItem icon={Mail} label="Email Address" value={employee.emailId} copyable />
          <InfoItem icon={Phone} label="Primary Phone" value={employee.phoneNumber1} copyable />
          <InfoItem icon={Phone} label="Secondary Phone" value={employee.phoneNumber2} copyable />
          <InfoItem icon={Home} label="Present Address" value={employee.presentAddress} />
          <InfoItem icon={MapPin} label="Permanent Address" value={employee.permanentAddress} />
        </div>
      </div>

      <Separator />

      {/* 💼 Employment Details */}
      <div>
        <SectionHeader title="Employment Details" icon={Briefcase} colorClass="text-purple-600" />
        <div className="space-y-1 bg-purple-50/50 rounded-lg p-3">
          <InfoItem icon={IdCard} label="Employee Code" value={employee.empCode} copyable />
          <InfoItem icon={Briefcase} label="Designation" value={employee.designation} />
          <InfoItem icon={Users} label="Category" value={employee.category} />
          <InfoItem icon={Award} label="Grade" value={employee.grade} />
          <InfoItem icon={GraduationCap} label="Discipline" value={employee.discipline} />
          <InfoItem icon={Calendar} label="Date of Appointment" value={formatDate(employee.dateOfAppointment)} />
          <InfoItem icon={Calendar} label="Area Joining Date" value={formatDate(employee.areaJoiningDate)} />
          <InfoItem icon={Calendar} label="Grade Joining Date" value={formatDate(employee.gradeJoiningDate)} />
          <InfoItem icon={Calendar} label="Increment Date" value={formatDate(employee.incrementDate)} />
          <InfoItem icon={Calendar} label="Expected Exit Date" value={formatDate(employee.expectedExitDate)} />
          <InfoItem icon={Calendar} label="Company Posting Date" value={formatDate(employee.companyPostingDate)} />
          <InfoItem 
            icon={UserCheck} 
            label="Employment Status" 
            value={employee.isActive ? "Active" : "Inactive"} 
          />
          <InfoItem icon={Activity} label="Pay Flag" value={employee.payFlag} />
        </div>
      </div>

      <Separator />

      {/* 🏢 Organizational Structure */}
      <div>
        <SectionHeader title="Organizational Structure" icon={Building} colorClass="text-orange-600" />
        <div className="space-y-1 bg-orange-50/50 rounded-lg p-3">
          <InfoItem icon={Building} label="Department" value={employee.department} />
          <InfoItem icon={Building2} label="Sub Department" value={employee.subDepartment} />
          <InfoItem icon={MapPin} label="Area Name" value={employee.areaName} />
          <InfoItem icon={Building2} label="Unit Name" value={employee.unitName} />
          <InfoItem icon={IdCard} label="Department Code" value={employee.deptCode} />
          <InfoItem icon={IdCard} label="Unit Code" value={employee.unitCode} />
        </div>
      </div>

      <Separator />

      {/* 🩸 Personal Details */}
      {(employee.casteCode || employee.religionCode || employee.maritalStatusCode || employee.spouseName || employee.spouseEmpCode) && (
        <>
          <div>
            <SectionHeader title="Personal Details" icon={Users} colorClass="text-pink-600" />
            <div className="space-y-1 bg-pink-50/50 rounded-lg p-3">
              <InfoItem icon={IdCard} label="Caste Code" value={employee.casteCode} />
              <InfoItem icon={IdCard} label="Religion Code" value={employee.religionCode} />
              <InfoItem icon={Heart} label="Marital Status Code" value={employee.maritalStatusCode} />
              <InfoItem icon={User} label="Spouse Name" value={employee.spouseName} />
              <InfoItem icon={IdCard} label="Spouse Employee Code" value={employee.spouseEmpCode} />
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* 💰 Financial Information */}
      {(employee.bankAccountNo || employee.bankName || employee.basicSalary || employee.hra || employee.ncwaBasic) && (
        <>
          <div>
            <SectionHeader title="Financial Information" icon={DollarSign} colorClass="text-emerald-600" />
            <div className="space-y-1 bg-emerald-50/50 rounded-lg p-3">
              <InfoItem icon={CreditCard} label="Bank Account Number" value={employee.bankAccountNo} copyable sensitive />
              <InfoItem icon={Banknote} label="Bank Name" value={employee.bankName} />
              <InfoItem icon={DollarSign} label="Basic Salary" value={formatCurrency(employee.basicSalary)} />
              <InfoItem icon={DollarSign} label="HRA" value={formatCurrency(employee.hra)} />
              <InfoItem icon={DollarSign} label="NCWA Basic" value={formatCurrency(employee.ncwaBasic)} />
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* 🆔 Identity Documents */}
      {(employee.aadhaarNo || employee.panNo) && (
        <>
          <div>
            <SectionHeader title="Identity Documents" icon={Shield} colorClass="text-red-600" />
            <div className="space-y-1 bg-red-50/50 rounded-lg p-3">
              <InfoItem icon={IdCard} label="Aadhaar Number" value={employee.aadhaarNo} copyable sensitive />
              <InfoItem icon={FileText} label="PAN Number" value={employee.panNo} copyable sensitive />
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* ⚙️ System Information */}
      {(employee.createdAt || employee.updatedAt) && (
        <div>
          <SectionHeader title="System Information" icon={Clock} colorClass="text-gray-600" />
          <div className="space-y-1 bg-gray-50/50 rounded-lg p-3">
            <InfoItem icon={Clock} label="Record Created" value={formatDate(employee.createdAt || null)} />
            <InfoItem icon={Clock} label="Last Updated" value={formatDate(employee.updatedAt || null)} />
          </div>
        </div>
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="w-[600px] sm:w-[700px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-lg font-bold">Employee Profile</SheetTitle>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="pb-4">
          <DrawerTitle className="text-lg font-bold">Employee Profile</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6 overflow-y-auto">
          {content}
        </div>
      </DrawerContent>
    </Drawer>
  );
} 