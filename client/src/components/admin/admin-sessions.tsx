import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { apiRequest } from '@/lib/queryClient';
import { 
  Activity, 
  Search, 
  RefreshCw,
  Clock,
  User,
  Building,
  Shield,
  Calendar,
  Smartphone
} from 'lucide-react';

interface AuthSession {
  id: number;
  employeeId: string;
  sessionToken: string;
  createdAt: string;
  expiresAt: string;
  employee?: {
    name: string;
    department: string;
    designation: string;
    role: string;
  };
}

export function AdminSessions() {
  const [searchTerm, setSearchTerm] = useState('');

  // Define helper functions first
  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const { data: sessionsData, isLoading, refetch } = useQuery<{ sessions: AuthSession[] }>({
    queryKey: ['/api/admin/sessions'],
    queryFn: async () => {
      return await apiRequest('/api/admin/sessions?limit=100');
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  const sessions = sessionsData?.sessions || [];
  const filteredSessions = sessions.filter(session => 
    session.employee?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.employee?.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate active sessions
  const activeSessions = sessions.filter(session => !isExpired(session.expiresAt));
  const activeCount = activeSessions.length;
  const totalCount = sessions.length;

  const getSessionStatus = (expiresAt: string) => {
    if (isExpired(expiresAt)) {
      return { status: 'Expired', variant: 'destructive' as const };
    }
    
    const timeUntilExpiry = new Date(expiresAt).getTime() - Date.now();
    const hoursUntilExpiry = timeUntilExpiry / (1000 * 60 * 60);
    
    if (hoursUntilExpiry < 24) {
      return { status: 'Expiring Soon', variant: 'secondary' as const };
    }
    
    return { status: 'Active', variant: 'default' as const };
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Active Sessions
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Monitor and manage user authentication sessions
          </p>
        </div>
        <Button onClick={() => refetch()} className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Search and Stats */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-4">
          <Badge variant="outline" className="px-3 py-1">
            <Activity className="w-4 h-4 mr-1" />
            Active: {sessions.filter(s => !isExpired(s.expiresAt)).length}
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            <Clock className="w-4 h-4 mr-1" />
            Total: {sessions.length}
          </Badge>
        </div>
      </div>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Sessions ({filteredSessions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Session ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((session) => {
                  const sessionStatus = getSessionStatus(session.expiresAt);
                  return (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium">
                              {session.employee?.name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {session.employeeId}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Building className="w-4 h-4 text-gray-400" />
                          {session.employee?.department || 'Unknown'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={session.employee?.role === 'admin' ? 'default' : 'secondary'}>
                          {session.employee?.role === 'admin' ? (
                            <Shield className="w-3 h-3 mr-1" />
                          ) : (
                            <User className="w-3 h-3 mr-1" />
                          )}
                          {session.employee?.role || 'unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {formatDate(session.createdAt)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {formatDate(session.expiresAt)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={sessionStatus.variant}>
                          {sessionStatus.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Smartphone className="w-4 h-4 text-gray-400" />
                          <span className="text-xs font-mono">
                            {session.sessionToken.substring(0, 8)}...
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}