import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type Employee } from "@shared/schema";

interface EmployeeDetailModalProps {
  employee: Employee | null;
  onClose: () => void;
}

export function EmployeeDetailModal({ employee, onClose }: EmployeeDetailModalProps) {
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
    <Dialog open={!!employee} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Employee Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex items-center space-x-6">
            <img
              src={employee.profileImage ? `/uploads/${employee.profileImage}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=3B82F6&color=fff&size=128`}
              alt={`${employee.name} profile`}
              className="w-24 h-24 rounded-full object-cover"
            />
            <div>
              <h3 className="text-2xl font-bold text-card-foreground">{employee.name}</h3>
              <p className="text-muted-foreground">{employee.designation}</p>
              <p className="text-muted-foreground">{employee.department}</p>
              <div className="flex items-center space-x-4 mt-3">
                <Button onClick={handleCall}>
                  <i className="fas fa-phone mr-2"></i>
                  Call
                </Button>
                <Button variant="outline" onClick={handleEmail}>
                  <i className="fas fa-envelope mr-2"></i>
                  Email
                </Button>
                <Button variant="outline" onClick={handleMessage}>
                  <i className="fas fa-comment mr-2"></i>
                  Message
                </Button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-card-foreground mb-3">Contact Information</h4>
              <div className="space-y-2">
                <p><span className="font-medium">Email:</span> {employee.email}</p>
                <p><span className="font-medium">Phone:</span> {employee.phone}</p>
                <p><span className="font-medium">Location:</span> {employee.location}</p>
                {employee.address && (
                  <p><span className="font-medium">Address:</span> {employee.address}</p>
                )}
                {employee.emergencyContact && (
                  <p><span className="font-medium">Emergency Contact:</span> {employee.emergencyContact}</p>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-card-foreground mb-3">Employment Details</h4>
              <div className="space-y-2">
                <p><span className="font-medium">Employee ID:</span> {employee.employeeId}</p>
                <p><span className="font-medium">Join Date:</span> {formatDate(employee.joiningDate)}</p>
                <p><span className="font-medium">Department:</span> {employee.department}</p>
                <p><span className="font-medium">Category:</span> {employee.category}</p>
                <p><span className="font-medium">Grade:</span> {employee.grade}</p>
                {employee.manager && (
                  <p><span className="font-medium">Manager:</span> {employee.manager}</p>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-card-foreground mb-3">Personal Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <p><span className="font-medium">Gender:</span> {employee.gender}</p>
              {employee.bloodGroup && (
                <p><span className="font-medium">Blood Group:</span> {employee.bloodGroup}</p>
              )}
            </div>
          </div>
          
          {employee.skills && employee.skills.length > 0 && (
            <div>
              <h4 className="font-semibold text-card-foreground mb-3">Skills & Expertise</h4>
              <div className="flex flex-wrap gap-2">
                {employee.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
