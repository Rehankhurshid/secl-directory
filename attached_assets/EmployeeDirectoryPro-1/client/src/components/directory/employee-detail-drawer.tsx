import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { X, Phone, Envelope, MapPin, Calendar, User, BankAccount, CreditCard, Heart } from "@phosphor-icons/react";
import type { Employee } from "@shared/schema";

interface EmployeeDetailDrawerProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EmployeeDetailDrawer({ employee, isOpen, onClose }: EmployeeDetailDrawerProps) {
  if (!employee) return null;

  const handleCall = () => {
    window.open(`tel:${employee.phone}`, "_self");
  };

  const handleEmail = () => {
    window.open(`mailto:${employee.email}`, "_self");
  };

  const handleMessage = () => {
    // TODO: Implement messaging functionality
    console.log("Message employee:", employee.employeeId);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Employee Details</DrawerTitle>
            <DrawerDescription>
              Complete information for {employee.name}
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="p-4 pb-0">
            <ScrollArea className="h-96">
              <div className="space-y-6">
                {/* Profile Section */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={employee.profileImage} alt={employee.name} />
                        <AvatarFallback>
                          {employee.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{employee.name}</CardTitle>
                        <CardDescription>{employee.designation}</CardDescription>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{employee.employeeId}</Badge>
                          <Badge variant={employee.category === "Monthly Rated" ? "default" : "secondary"}>
                            {employee.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Phone size={16} />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-muted-foreground" />
                        <span className="text-sm">{employee.phone}</span>
                      </div>
                      <Button size="sm" variant="outline" onClick={handleCall}>
                        Call
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Envelope size={16} className="text-muted-foreground" />
                        <span className="text-sm">{employee.email}</span>
                      </div>
                      <Button size="sm" variant="outline" onClick={handleEmail}>
                        Email
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-muted-foreground" />
                      <span className="text-sm">{employee.location}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Work Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <User size={16} />
                      Work Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Department</p>
                        <p className="text-sm">{employee.department}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Grade</p>
                        <p className="text-sm">{employee.grade}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Shift</p>
                        <p className="text-sm">{employee.shift}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Status</p>
                        <Badge variant={employee.status === "Active" ? "default" : "secondary"}>
                          {employee.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Date of Joining</p>
                      <p className="text-sm flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(employee.dateOfJoining)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Personal Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Heart size={16} />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Gender</p>
                        <p className="text-sm">{employee.gender}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Blood Group</p>
                        <p className="text-sm">{employee.bloodGroup}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                      <p className="text-sm flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(employee.dateOfBirth)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Address</p>
                      <p className="text-sm">{employee.address}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Financial Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <BankAccount size={16} />
                      Financial Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Bank Account</p>
                      <p className="text-sm">{employee.bankAccount}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">PAN Number</p>
                      <p className="text-sm flex items-center gap-1">
                        <CreditCard size={14} />
                        {employee.panNumber}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Emergency Contact */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Phone size={16} />
                      Emergency Contact
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Name</p>
                      <p className="text-sm">{employee.emergencyContactName}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Phone</p>
                      <p className="text-sm">{employee.emergencyContactPhone}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Relationship</p>
                      <p className="text-sm">{employee.emergencyContactRelationship}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </div>

          <DrawerFooter>
            <div className="flex gap-2">
              <Button onClick={handleCall} className="flex-1">
                <Phone size={16} className="mr-2" />
                Call
              </Button>
              <Button onClick={handleEmail} variant="outline" className="flex-1">
                <Envelope size={16} className="mr-2" />
                Email
              </Button>
            </div>
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}