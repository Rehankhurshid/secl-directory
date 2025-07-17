import React, { useState } from 'react';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Phone, Mail, Share2, User, MapPin, Building, IdCard, Briefcase, 
  Award, QrCode, Calendar, Heart, Copy, CreditCard, Home, Users,
  Building2, Hash, FileText, UserCheck, Banknote, PhoneCall
} from 'lucide-react';
import { QRCodeModal } from './qr-code-modal';
import type { Employee } from "@shared/schema";

interface EmployeeModalProps {
  employee: Employee | null;
  open: boolean;
  onClose: () => void;
}

export function EmployeeModal({ employee, open, onClose }: EmployeeModalProps) {
  const { toast } = useToast();
  const [showQRCode, setShowQRCode] = useState(false);

  if (!employee) return null;

  const initials = employee.name
    .split(' ')
    .map(n => n.charAt(0))
    .join('')
    .substring(0, 2);

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

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleCall = () => {
    if (employee.phone1) {
      window.open(`tel:${employee.phone1}`);
    }
  };

  const handleEmail = () => {
    if (employee.email) {
      window.open(`mailto:${employee.email}`);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `${employee.name} - Employee Directory`,
      text: `${employee.name} - ${employee.designation} at ${employee.department}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(
          `${employee.name} - ${employee.designation}\n${employee.department}\nID: ${employee.employeeId}`
        );
        toast({
          title: "Copied to clipboard",
          description: "Employee details copied to clipboard",
        });
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const InfoRow = ({ icon: Icon, label, value, copyable = false }: { 
    icon: any, 
    label: string, 
    value: string, 
    copyable?: boolean 
  }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex items-center space-x-3">
        <Icon className="w-5 h-5 text-primary" />
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">{value || "-"}</p>
        </div>
      </div>
      {copyable && value && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => copyToClipboard(value, label)}
          className="h-8 w-8 p-0"
        >
          <Copy className="w-4 h-4" />
        </Button>
      )}
    </div>
  );

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent className="max-h-[90vh] flex flex-col">
        <DrawerHeader className="flex-shrink-0">
          <DrawerTitle>Employee Details</DrawerTitle>
        </DrawerHeader>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Employee Header */}
          <div className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
              <span className="text-2xl font-semibold text-primary-foreground">{initials}</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold">{employee.name}</h3>
              <p className="text-lg text-muted-foreground mt-1">{employee.designation}</p>
              <div className="flex items-center justify-center space-x-2 mt-3">
                <Badge className={getCategoryColor(employee.category)}>
                  {employee.category || 'N/A'}
                </Badge>
                <Badge className={getGradeColor(employee.grade)}>
                  {employee.grade || 'N/A'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <IdCard className="w-5 h-5" />
                <span>Basic Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow icon={Hash} label="Employee ID" value={employee.employeeId} copyable />
              <InfoRow icon={User} label="Name" value={employee.name} copyable />
              <InfoRow icon={Briefcase} label="Designation" value={employee.designation} copyable />
              <InfoRow icon={Building} label="Department" value={employee.department} copyable />
              <InfoRow icon={Award} label="Discipline" value={employee.discipline} copyable />
              <InfoRow icon={FileText} label="Grade" value={employee.grade} copyable />
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Phone className="w-5 h-5" />
                <span>Contact Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow icon={Mail} label="Email" value={employee.email} copyable />
              <InfoRow icon={Phone} label="Phone 1" value={employee.phone1} copyable />
              <InfoRow icon={PhoneCall} label="Phone 2" value={employee.phone2} copyable />
            </CardContent>
          </Card>

          {/* Work Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="w-5 h-5" />
                <span>Work Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow icon={MapPin} label="Location" value={employee.location} copyable />
              <InfoRow icon={Building} label="Area Name" value={employee.areaName} copyable />
              <InfoRow icon={Building2} label="Unit Name" value={employee.unitName} copyable />
              <InfoRow icon={Hash} label="Department Code" value={employee.deptCode} copyable />
              <InfoRow icon={FileText} label="Sub Department" value={employee.subDept} copyable />
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Personal Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow icon={Calendar} label="Date of Birth" value={employee.dob} copyable />
              <InfoRow icon={User} label="Father's Name" value={employee.fatherName} copyable />
              <InfoRow icon={Users} label="Spouse Name" value={employee.spouseName} copyable />
              <InfoRow icon={UserCheck} label="Gender" value={employee.gender} copyable />
              <InfoRow icon={Heart} label="Blood Group" value={employee.bloodGroup} copyable />
            </CardContent>
          </Card>

          {/* Banking Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>Banking Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow icon={Hash} label="Account Number" value={employee.bankAccNo} copyable />
              <InfoRow icon={Banknote} label="Bank Name" value={employee.bank} copyable />
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Home className="w-5 h-5" />
                <span>Address Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Present Address</label>
                  {employee.presentAddress && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(employee.presentAddress, "Present Address")}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {employee.presentAddress || "-"}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Permanent Address</label>
                  {employee.permanentAddress && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(employee.permanentAddress, "Permanent Address")}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {employee.permanentAddress || "-"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Action Buttons - Sticky at bottom */}
        <div className="flex-shrink-0 border-t border-border p-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              className="flex-1 min-w-0"
              onClick={handleCall}
              disabled={!employee.phone1}
            >
              <Phone className="w-4 h-4 mr-2" />
              Call
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1 min-w-0"
              onClick={handleEmail}
              disabled={!employee.email}
            >
              <Mail className="w-4 h-4 mr-2" />
              Email
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowQRCode(true)}
            >
              <QrCode className="w-4 h-4 mr-2" />
              QR Code
            </Button>
            <Button 
              variant="ghost"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </DrawerContent>
      
      {/* QR Code Modal */}
      <QRCodeModal
        employee={employee}
        open={showQRCode}
        onClose={() => setShowQRCode(false)}
      />
    </Drawer>
  );
}