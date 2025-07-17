import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Shield, 
  MessageSquare, 
  Activity, 
  Settings, 
  UserPlus, 
  FileText,
  Calendar,
  TrendingUp,
  Lock,
  UserCog,
  ArrowLeft,
  Bell,
  AlertCircle
} from 'lucide-react';

import { AdminEmployeeManagement } from '@/components/admin/admin-employee-management';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { AdminSessions } from '@/components/admin/admin-sessions';
import { AdminSettings } from '@/components/admin/admin-settings';
import { AdminPermissionManagement } from '@/components/admin/admin-permission-management';
import { AdminUserRoles } from '@/components/admin/admin-user-roles';
import { AdminBroadcastNotification } from '@/components/admin/admin-broadcast-notification';
import PushDebugPage from '@/pages/push-debug';

export default function AdminPage() {
  const { employee, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const tabsRef = useRef<HTMLDivElement>(null);

  const handleBackClick = () => {
    setLocation('/');
  };
  
  // Auto-scroll to active tab
  useEffect(() => {
    if (tabsRef.current) {
      const activeTabElement = tabsRef.current.querySelector(`[data-value="${activeTab}"]`);
      if (activeTabElement) {
        activeTabElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [activeTab]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 animate-spin" />
              Loading Admin Panel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300">
              Please wait while we verify your access...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redirect if not admin
  if (!employee || employee.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Shield className="w-5 h-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300">
              You don't have permission to access the admin panel.
            </p>
            <Button 
              variant="outline" 
              onClick={handleBackClick}
              className="mt-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Directory
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile-friendly header */}
      <div className="border-b bg-white dark:bg-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBackClick}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white text-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                  Admin Panel
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300 hidden sm:block">
                  Manage employees, monitor system, and configure settings
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="px-2 py-1 text-xs sm:px-3 sm:py-1 sm:text-sm">
              <Shield className="w-3 h-3 mr-1 sm:w-4 sm:h-4" />
              Admin
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          {/* Scrollable tabs with sticky positioning */}
          <div className="sticky top-[60px] sm:top-[73px] z-20 bg-gray-50 dark:bg-gray-900 pb-2 -mx-2 sm:-mx-4 lg:-mx-8 px-2 sm:px-4 lg:px-8 border-b border-gray-200 dark:border-gray-700">
            <div className="w-full overflow-x-auto scrollbar-hide">
              <TabsList 
                ref={tabsRef}
                className="flex w-max h-auto p-1 bg-muted rounded-lg space-x-1"
                style={{ minWidth: '100%' }}
              >
                <TabsTrigger 
                  value="dashboard" 
                  data-value="dashboard"
                  className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-2"
                >
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                  <span className="sm:hidden">Stats</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="employees" 
                  data-value="employees"
                  className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-2"
                >
                  <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Employees</span>
                  <span className="sm:hidden">Users</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="permissions" 
                  data-value="permissions"
                  className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-2"
                >
                  <Lock className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Permissions</span>
                  <span className="sm:hidden">Perms</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="user-roles" 
                  data-value="user-roles"
                  className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-2"
                >
                  <UserCog className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">User Roles</span>
                  <span className="sm:hidden">Roles</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="sessions" 
                  data-value="sessions"
                  className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-2"
                >
                  <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Sessions</span>
                  <span className="sm:hidden">Active</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="broadcast" 
                  data-value="broadcast"
                  className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-2"
                >
                  <Bell className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Broadcast</span>
                  <span className="sm:hidden">Notify</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="settings" 
                  data-value="settings"
                  className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-2"
                >
                  <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Settings</span>
                  <span className="sm:hidden">Config</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="push-debug" 
                  data-value="push-debug"
                  className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-2"
                >
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Push Debug</span>
                  <span className="sm:hidden">Debug</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="dashboard" className="space-y-4 sm:space-y-6">
            <AdminDashboard />
          </TabsContent>

          <TabsContent value="employees" className="space-y-4 sm:space-y-6">
            <AdminEmployeeManagement />
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4 sm:space-y-6">
            <AdminPermissionManagement />
          </TabsContent>

          <TabsContent value="user-roles" className="space-y-4 sm:space-y-6">
            <AdminUserRoles />
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4 sm:space-y-6">
            <AdminSessions />
          </TabsContent>

          <TabsContent value="broadcast" className="space-y-4 sm:space-y-6">
            <AdminBroadcastNotification />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 sm:space-y-6">
            <AdminSettings />
          </TabsContent>

          <TabsContent value="push-debug" className="space-y-4 sm:space-y-6">
            <PushDebugPage />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}