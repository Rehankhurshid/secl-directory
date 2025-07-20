import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EmployeeService, type Employee } from '@/lib/services/employee-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Phone, 
  Mail, 
  Copy, 
  Share2, 
  QrCode,
  ArrowLeft,
  User,
  Hash,
  Briefcase,
  Building,
  MapPin,
  CalendarDays,
  CreditCard,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Employee interface imported from service

interface EmployeeDetailsPageProps {
  params: { empCode: string };
}

// Using Employee interface from service

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

export const metadata: Metadata = {
  title: 'Employee Details | SECL',
  description: 'View detailed employee information and contact details'
};

async function getEmployee(empCode: string): Promise<Employee | null> {
  try {
    return await EmployeeService.getEmployeeByCode(empCode);
  } catch (error) {
    console.error('Error fetching employee:', error);
    return null;
  }
}

export default async function EmployeeDetailsPage({ params }: EmployeeDetailsPageProps) {
  const employee = await getEmployee(params.empCode);

  if (!employee) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Back Button */}
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/employee-directory">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Directory
          </Link>
        </Button>
      </div>

      {/* Header Profile Section */}
      <Card className="mb-8">
        <CardContent className="pt-8 pb-6">
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Large Avatar */}
            <Avatar className="h-24 w-24">
              <AvatarFallback className="text-2xl font-bold">
                {getInitials(employee.name)}
              </AvatarFallback>
            </Avatar>

            {/* Name and Designation */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">{employee.name}</h1>
              {employee.designation && (
                <p className="text-lg text-muted-foreground">{employee.designation}</p>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {employee.category && (
                <Badge variant={employee.category === 'MONTHLY RATED' ? 'default' : 'secondary'}>
                  {employee.category}
                </Badge>
              )}
              {employee.grade && (
                <Badge variant="outline">
                  {employee.grade}
                </Badge>
              )}
              {employee.department && (
                <Badge className={cn(
                  "text-white",
                  getDepartmentColor(employee.department)
                )}>
                  {employee.department}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Basic Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Employee ID */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center space-x-3">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Employee ID</p>
                  <p className="text-lg font-mono">{employee.empCode}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(employee.empCode)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            {/* Name */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center space-x-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p className="text-lg">{employee.name}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(employee.name)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            {/* Designation */}
            {employee.designation && (
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Designation</p>
                    <p className="text-lg">{employee.designation}</p>
                  </div>
                </div>
                               <Button variant="ghost" size="sm" onClick={() => employee.designation && navigator.clipboard.writeText(employee.designation)}>
                 <Copy className="h-4 w-4" />
               </Button>
              </div>
            )}

            {/* Department */}
            {employee.department && (
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Department</p>
                    <p className="text-lg">{employee.department}</p>
                  </div>
                </div>
                                 <Button variant="ghost" size="sm" onClick={() => employee.department && navigator.clipboard.writeText(employee.department)}>
                   <Copy className="h-4 w-4" />
                 </Button>
              </div>
            )}

            {/* Area */}
            {employee.areaName && (
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Area</p>
                    <p className="text-lg">{employee.areaName}</p>
                  </div>
                </div>
                                 <Button variant="ghost" size="sm" onClick={() => employee.areaName && navigator.clipboard.writeText(employee.areaName)}>
                   <Copy className="h-4 w-4" />
                 </Button>
               </div>
             )}
 
             {/* Grade */}
             {employee.grade && (
               <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                 <div className="flex items-center space-x-3">
                   <CreditCard className="h-4 w-4 text-muted-foreground" />
                   <div>
                     <p className="text-sm font-medium">Grade</p>
                     <p className="text-lg">{employee.grade}</p>
                   </div>
                 </div>
                 <Button variant="ghost" size="sm" onClick={() => employee.grade && navigator.clipboard.writeText(employee.grade)}>
                   <Copy className="h-4 w-4" />
                 </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Call Button */}
        <Button
          variant="default"
          className="h-14 flex-col space-y-1"
          disabled={!employee.phoneNumber1}
          asChild={!!employee.phoneNumber1}
        >
          {employee.phoneNumber1 ? (
            <a href={`tel:${employee.phoneNumber1}`}>
              <Phone className="h-5 w-5" />
              <span className="text-sm">Call</span>
            </a>
          ) : (
            <>
              <Phone className="h-5 w-5" />
              <span className="text-sm">Call</span>
            </>
          )}
        </Button>

        {/* Email Button */}
        <Button
          variant="outline"
          className="h-14 flex-col space-y-1"
          disabled={!employee.emailId}
          asChild={!!employee.emailId}
        >
          {employee.emailId ? (
            <a href={`mailto:${employee.emailId}`}>
              <Mail className="h-5 w-5" />
              <span className="text-sm">Email</span>
            </a>
          ) : (
            <>
              <Mail className="h-5 w-5" />
              <span className="text-sm">Email</span>
            </>
          )}
        </Button>

        {/* QR Code Button */}
        <Button variant="outline" className="h-14 flex-col space-y-1">
          <QrCode className="h-5 w-5" />
          <span className="text-sm">QR Code</span>
        </Button>

        {/* Share Button */}
        <Button variant="outline" className="h-14 flex-col space-y-1">
          <Share2 className="h-5 w-5" />
          <span className="text-sm">Share</span>
        </Button>
      </div>
    </div>
  );
} 