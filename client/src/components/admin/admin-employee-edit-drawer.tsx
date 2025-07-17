import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { useToast } from '@/hooks/use-toast';
import { useEmployeeStats } from '@/hooks/use-employees';
import { apiRequest } from '@/lib/queryClient';
import { UserPlus, Edit, X, Save, User, Building, MapPin, Phone, Mail, IdCard, Briefcase, Award, Calendar, Heart, Users } from 'lucide-react';
import type { Employee } from '@shared/schema';

interface Employee {
  id?: number;
  employeeId: string;
  name: string;
  designation: string;
  department: string;
  location: string;
  unitName?: string;
  grade?: string;
  category?: string;
  discipline?: string;
  role: 'admin' | 'employee';
  email?: string;
  phone1?: string;
  phone2?: string;
  dob?: string;
  fatherName?: string;
  spouseName?: string;
  bloodGroup?: string;
  gender?: 'Male' | 'Female';
  presentAddress?: string;
  permanentAddress?: string;
  bankName?: string;
  accountNumber?: string;
  createdAt?: string;
}

interface AdminEmployeeEditDrawerProps {
  employee?: Employee;
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
}

export function AdminEmployeeEditDrawer({ employee, isOpen, onClose, mode }: AdminEmployeeEditDrawerProps) {
  const { data: stats } = useEmployeeStats();
  const [formData, setFormData] = useState<Partial<Employee>>({
    employeeId: '',
    name: '',
    designation: '',
    department: '',
    location: '',
    unitName: '',
    grade: '',
    category: '',
    discipline: '',
    role: 'employee',
    email: '',
    phone1: '',
    phone2: '',
    dob: '',
    fatherName: '',
    spouseName: '',
    bloodGroup: '',
    gender: 'Male',
    presentAddress: '',
    permanentAddress: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (employee && mode === 'edit') {
      setFormData({
        ...employee,
        // Ensure all fields are populated with proper fallbacks
        areaName: employee.areaName || '',
        unitName: employee.unitName || '',
        // Map database fields to form fields
        bankName: employee.bank || '',
        accountNumber: employee.bankAccNo || '',
        presentAddress: employee.presentAddress || '',
        permanentAddress: employee.permanentAddress || '',
        profileImage: employee.profileImage || '',
        // Convert gender to display format
        gender: convertGenderToDisplayFormat(employee.gender || 'M')
      });
    } else {
      setFormData({
        employeeId: '',
        name: '',
        designation: '',
        department: '',
        location: '',
        unitName: '',
        grade: '',
        category: '',
        discipline: '',
        role: 'employee',
        email: '',
        phone1: '',
        phone2: '',
        dob: '',
        fatherName: '',
        spouseName: '',
        bloodGroup: '',
        gender: 'Male',
        presentAddress: '',
        permanentAddress: '',
        bankName: '',
        accountNumber: '',
        areaName: '',
        profileImage: ''
      });
    }
  }, [employee, mode, isOpen]);

  // Helper function to convert gender display to API format
  const convertGenderToApiFormat = (gender: string): string => {
    switch (gender) {
      case 'Male': return 'M';
      case 'Female': return 'F';
      case 'Other': return 'O';
      default: return gender;
    }
  };

  // Helper function to convert gender API format to display
  const convertGenderToDisplayFormat = (gender: string): string => {
    switch (gender) {
      case 'M': return 'Male';
      case 'F': return 'Female';
      case 'O': return 'Other';
      default: return gender;
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<Employee>) => {
      const url = mode === 'add' ? '/api/admin/employees' : `/api/admin/employees/${employee?.employeeId}`;
      const method = mode === 'add' ? 'POST' : 'PUT';
      
      return await apiRequest(url, {
        method,
        body: data
      });
    },
    onSuccess: () => {
      // Only invalidate specific employee queries, don't remove or invalidate all
      queryClient.invalidateQueries({
        queryKey: ['/api/employees']
      });
      
      queryClient.invalidateQueries({
        queryKey: ['/api/employees/stats']
      });
      
      toast({
        title: mode === 'add' ? 'Employee created' : 'Employee updated',
        description: mode === 'add' ? 'Employee has been successfully created.' : 'Employee details have been successfully updated.',
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = [
      { field: 'employeeId', label: 'Employee ID' },
      { field: 'name', label: 'Name' },
      { field: 'designation', label: 'Designation' },
      { field: 'department', label: 'Department' },
      { field: 'location', label: 'Location' },
      { field: 'areaName', label: 'Area Name' },
      { field: 'unitName', label: 'Unit Name' }
    ];
    
    const missingFields = requiredFields.filter(({ field }) => !formData[field as keyof Employee]);
    
    if (missingFields.length > 0) {
      toast({
        title: 'Validation Error',
        description: `Please fill in all required fields: ${missingFields.map(f => f.label).join(', ')}`,
        variant: 'destructive',
      });
      return;
    }
    
    if (!formData.phone1) {
      toast({
        title: 'Validation Error',
        description: 'At least one phone number is required.',
        variant: 'destructive',
      });
      return;
    }
    
    // Convert data to API format
    const apiData = {
      ...formData,
      gender: convertGenderToApiFormat(formData.gender),
      // Map form fields to database fields
      bank: formData.bankName,
      bankAccNo: formData.accountNumber,
      // Remove profileImage if it's empty or just whitespace
      profileImage: formData.profileImage?.trim() || undefined
    };
    
    saveMutation.mutate(apiData);
  };

  const handleInputChange = (field: keyof Employee, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="h-[90vh]">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="flex items-center gap-2">
            {mode === 'add' ? <UserPlus className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
            {mode === 'add' ? 'Add New Employee' : `Edit Employee: ${employee?.name}`}
          </DrawerTitle>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </DrawerHeader>
        
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="w-5 h-5" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employeeId">Employee ID *</Label>
                  <Input
                    id="employeeId"
                    value={formData.employeeId}
                    onChange={(e) => handleInputChange('employeeId', e.target.value)}
                    placeholder="Enter employee ID"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="designation">Designation *</Label>
                  <Input
                    id="designation"
                    value={formData.designation}
                    onChange={(e) => handleInputChange('designation', e.target.value)}
                    placeholder="Enter designation"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="department">Department *</Label>
                  <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {stats?.departments.filter(dept => dept.name && dept.name.trim() !== "").map((dept) => (
                        <SelectItem key={dept.name} value={dept.name}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Select value={formData.location} onValueChange={(value) => handleInputChange('location', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {stats?.locations.filter(location => location.name && location.name.trim() !== "").map((location) => (
                        <SelectItem key={location.name} value={location.name}>{location.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="unitName">Unit Name *</Label>
                  <Input
                    id="unitName"
                    value={formData.unitName}
                    onChange={(e) => handleInputChange('unitName', e.target.value)}
                    placeholder="Enter unit name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="areaName">Area Name *</Label>
                  <Input
                    id="areaName"
                    value={formData.areaName}
                    onChange={(e) => handleInputChange('areaName', e.target.value)}
                    placeholder="Enter area name"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Work Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Work Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="grade">Grade</Label>
                  <Select value={formData.grade} onValueChange={(value) => handleInputChange('grade', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {stats?.grades.filter(grade => grade.name && grade.name.trim() !== "").map((grade) => (
                        <SelectItem key={grade.name} value={grade.name}>{grade.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EXECUTIVE">Executive</SelectItem>
                      <SelectItem value="NON-EXECUTIVE">Non-Executive</SelectItem>
                      <SelectItem value="OFFICER">Officer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="discipline">Discipline</Label>
                  <Input
                    id="discipline"
                    value={formData.discipline}
                    onChange={(e) => handleInputChange('discipline', e.target.value)}
                    placeholder="Enter discipline"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value as 'admin' | 'employee')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="phone1">Primary Phone *</Label>
                  <Input
                    id="phone1"
                    value={formData.phone1}
                    onChange={(e) => handleInputChange('phone1', e.target.value)}
                    placeholder="Enter primary phone"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone2">Secondary Phone</Label>
                  <Input
                    id="phone2"
                    value={formData.phone2}
                    onChange={(e) => handleInputChange('phone2', e.target.value)}
                    placeholder="Enter secondary phone"
                  />
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={formData.dob}
                    onChange={(e) => handleInputChange('dob', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={convertGenderToDisplayFormat(formData.gender)} onValueChange={(value) => handleInputChange('gender', convertGenderToApiFormat(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="fatherName">Father's Name</Label>
                  <Input
                    id="fatherName"
                    value={formData.fatherName}
                    onChange={(e) => handleInputChange('fatherName', e.target.value)}
                    placeholder="Enter father's name"
                  />
                </div>
                <div>
                  <Label htmlFor="spouseName">Spouse Name</Label>
                  <Input
                    id="spouseName"
                    value={formData.spouseName}
                    onChange={(e) => handleInputChange('spouseName', e.target.value)}
                    placeholder="Enter spouse name"
                  />
                </div>
                <div>
                  <Label htmlFor="bloodGroup">Blood Group</Label>
                  <Select value={formData.bloodGroup} onValueChange={(value) => handleInputChange('bloodGroup', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      {stats?.bloodGroups.filter(bloodGroup => bloodGroup.name && bloodGroup.name.trim() !== "").map((bloodGroup) => (
                        <SelectItem key={bloodGroup.name} value={bloodGroup.name}>{bloodGroup.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Banking Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Building className="w-5 h-5" />
                Banking Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={formData.bankName}
                    onChange={(e) => handleInputChange('bankName', e.target.value)}
                    placeholder="Enter bank name"
                  />
                </div>
                <div>
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={formData.accountNumber}
                    onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                    placeholder="Enter account number"
                  />
                </div>

              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Address Information
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="presentAddress">Present Address</Label>
                  <Textarea
                    id="presentAddress"
                    value={formData.presentAddress}
                    onChange={(e) => handleInputChange('presentAddress', e.target.value)}
                    placeholder="Enter present address"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="permanentAddress">Permanent Address</Label>
                  <Textarea
                    id="permanentAddress"
                    value={formData.permanentAddress}
                    onChange={(e) => handleInputChange('permanentAddress', e.target.value)}
                    placeholder="Enter permanent address"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer with actions */}
        <div className="border-t p-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving...' : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {mode === 'add' ? 'Create Employee' : 'Update Employee'}
              </>
            )}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}