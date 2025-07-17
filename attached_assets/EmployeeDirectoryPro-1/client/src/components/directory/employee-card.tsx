import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type Employee } from "@shared/schema";
import { Phone, EnvelopeSimple, ChatCircle } from "@phosphor-icons/react";

interface EmployeeCardProps {
  employee: Employee;
  onClick?: () => void;
}

export function EmployeeCard({ employee, onClick }: EmployeeCardProps) {
  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (employee.phoneNumber) {
      window.open(`tel:${employee.phoneNumber}`, "_self");
    }
  };

  const handleEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (employee.email) {
      window.open(`mailto:${employee.email}`, "_self");
    }
  };

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement messaging functionality
    console.log("Message employee:", employee.employeeId);
  };

  const getStatusColor = () => {
    // Random status for demo - in real app this would come from presence data
    const statuses = ["online", "away", "offline"];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = () => {
    const statusColor = getStatusColor();
    switch (statusColor) {
      case "bg-green-500":
        return "Online";
      case "bg-yellow-500":
        return "Away";
      default:
        return "Offline";
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardContent className="p-6" onClick={onClick}>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <img
              src={employee.profileImage ? `/uploads/${employee.profileImage}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=3B82F6&color=fff&size=64`}
              alt={`${employee.name} profile`}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div className={`absolute bottom-0 right-0 w-4 h-4 ${getStatusColor()} rounded-full border-2 border-white`}></div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-card-foreground truncate">
              {employee.name}
            </h3>
            <p className="text-muted-foreground text-sm truncate">
              {employee.designation}
            </p>
            <p className="text-muted-foreground text-sm truncate">
              {employee.department}
            </p>
          </div>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="ghost"
              className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
              onClick={handleCall}
            >
              <Phone size={16} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
              onClick={handleEmail}
            >
              <EnvelopeSimple size={16} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
              onClick={handleMessage}
            >
              <ChatCircle size={16} />
            </Button>
          </div>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 ${getStatusColor()} rounded-full`}></div>
            <span className="text-xs text-muted-foreground">{getStatusText()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
