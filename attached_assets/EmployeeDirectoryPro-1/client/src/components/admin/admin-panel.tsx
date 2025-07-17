import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      // Mock stats for demo - in real app this would be an API call
      return {
        totalEmployees: 1234,
        activeUsers: 987,
        activeGroups: 56,
        messagesToday: 2345,
      };
    },
  });

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-500/10 rounded-full">
                    <i className="fas fa-users text-blue-500"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                    <p className="text-2xl font-bold">{stats?.totalEmployees || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-500/10 rounded-full">
                    <i className="fas fa-user-check text-green-500"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                    <p className="text-2xl font-bold">{stats?.activeUsers || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-500/10 rounded-full">
                    <i className="fas fa-comments text-purple-500"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Active Groups</p>
                    <p className="text-2xl font-bold">{stats?.activeGroups || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-500/10 rounded-full">
                    <i className="fas fa-envelope text-orange-500"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Messages Today</p>
                    <p className="text-2xl font-bold">{stats?.messagesToday || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <i className="fas fa-user-plus mr-3 text-green-500"></i>
                  Add New Employee
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <i className="fas fa-upload mr-3 text-blue-500"></i>
                  Bulk Import
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <i className="fas fa-download mr-3 text-purple-500"></i>
                  Export All Data
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <i className="fas fa-shield-alt mr-3 text-orange-500"></i>
                  User Permissions
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center">
                    <i className="fas fa-user-plus text-green-500 text-sm"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New employee added</p>
                    <p className="text-xs text-muted-foreground">Alice Johnson joined Engineering</p>
                  </div>
                  <span className="text-xs text-muted-foreground">2 hours ago</span>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <i className="fas fa-edit text-blue-500 text-sm"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Profile updated</p>
                    <p className="text-xs text-muted-foreground">John Smith updated contact info</p>
                  </div>
                  <span className="text-xs text-muted-foreground">4 hours ago</span>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-purple-500/10 rounded-full flex items-center justify-center">
                    <i className="fas fa-users text-purple-500 text-sm"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New group created</p>
                    <p className="text-xs text-muted-foreground">Marketing Team group by Sarah Lee</p>
                  </div>
                  <span className="text-xs text-muted-foreground">1 day ago</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="employees">
          <Card>
            <CardHeader>
              <CardTitle>Employee Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Employee management features will be implemented here, including:
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>• Add/Edit/Delete employees</li>
                <li>• Bulk import from CSV/Excel</li>
                <li>• Profile image management</li>
                <li>• Role assignments</li>
                <li>• Access control</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups">
          <Card>
            <CardHeader>
              <CardTitle>Group Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Group management features will be implemented here, including:
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>• Create/Edit/Delete groups</li>
                <li>• Manage group members</li>
                <li>• Group permissions</li>
                <li>• Message moderation</li>
                <li>• Group analytics</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Reports & Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Reporting features will be implemented here, including:
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>• Employee statistics</li>
                <li>• Usage analytics</li>
                <li>• Message volume reports</li>
                <li>• User engagement metrics</li>
                <li>• Export capabilities</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
