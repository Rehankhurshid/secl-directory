import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SimpleMessagingDashboard } from '@/components/messaging/simple-messaging-dashboard';
import { CreateGroupDialog } from '@/components/messaging/create-group-dialog';
import { MessageSquare } from 'lucide-react';
import type { Employee } from '@shared/schema';

export function MessagingPage() {
  const { employee, isAuthenticated } = useAuth();
  const sessionToken = localStorage.getItem("sessionToken");
  const [, setLocation] = useLocation();

  // Fetch all employees for group creation
  const { data: employeesData, isLoading: employeesLoading } = useQuery<{ employees: Employee[] }>({
    queryKey: ['/api/employees', { limit: 1000 }],
    enabled: !!sessionToken && isAuthenticated
  });

  if (!employee || !sessionToken || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-6 h-6" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400">
              You need to be logged in to access messaging features.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SimpleMessagingDashboard
      employeeId={employee.employeeId}
      sessionToken={sessionToken}
      employees={employeesData?.employees || []}
      employeesLoading={employeesLoading}
      onBackToDirectory={() => setLocation('/directory')}
    />
  );
}