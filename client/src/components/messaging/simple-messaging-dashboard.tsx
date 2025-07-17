import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Search, Users, Plus, Bell, BellOff, MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { CreateGroupDialog } from './create-group-dialog';
import { WhatsAppChat } from './whatsapp-chat';
import { apiRequest } from '@/lib/queryClient';
import type { Group, Employee } from '@shared/schema';

interface SimpleMessagingDashboardProps {
  employeeId: string;
  sessionToken: string;
  employees?: Employee[];
  employeesLoading?: boolean;
  onBackToDirectory?: () => void;
}

export function SimpleMessagingDashboard({ 
  employeeId, 
  sessionToken, 
  employees = [], 
  employeesLoading = false, 
  onBackToDirectory 
}: SimpleMessagingDashboardProps) {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showFullscreenChat, setShowFullscreenChat] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Find current user data
  const currentUser = employees.find(emp => emp.employeeId === employeeId);
  
  // Alternative: if we can't find the user, create a minimal user object for testing
  const fallbackUser = currentUser || {
    id: 0,
    employeeId: employeeId,
    name: 'Current User',
    email: '',
    phone: '',
    department: '',
    designation: '',
    grade: '',
    location: '',
    unit: '',
    category: '',
    gender: '',
    bloodGroup: '',
    dateOfBirth: '',
    fatherName: '',
    spouseName: '',
    personalPhone: '',
    personalEmail: '',
    presentAddress: '',
    permanentAddress: '',
    bankName: '',
    bankAccountNumber: '',
    ifscCode: '',
    profileImage: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Fetch user's groups with message previews
  const { data: groups = [], isLoading: groupsLoading } = useQuery<Group[]>({
    queryKey: ['/api/groups'],
    enabled: !!sessionToken
  });

  // Enhance groups with latest message preview
  const enhancedGroups = groups.map(group => {
    return {
      ...group,
      lastMessage: group.lastMessage || 'No recent messages',
      unreadCount: group.unreadCount || 0,
      lastMessageTime: group.lastMessageTime || group.updatedAt
    };
  });

  // Check notification permission on mount
  useEffect(() => {
    const checkNotificationPermission = async () => {
      if ('Notification' in window) {
        const permission = Notification.permission;
        if (permission === 'default') {
          // Show notification prompt after a brief delay
          setTimeout(() => {
            setShowNotificationPrompt(true);
          }, 2000);
        } else if (permission === 'granted') {
          setNotifications(true);
        }
      }
    };
    
    checkNotificationPermission();
  }, []);

  // Fetch unread message count
  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications/unread-count'],
    enabled: !!sessionToken,
    refetchInterval: 10000
  });

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setNotifications(true);
          setShowNotificationPrompt(false);
          toast({ title: 'Notifications enabled! You\'ll receive new message alerts' });
        } else {
          setShowNotificationPrompt(false);
          toast({ title: 'Notifications disabled', description: 'You can enable them later in your browser settings' });
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    }
  };



  // Filter groups based on search
  const filteredGroups = enhancedGroups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (group.description && group.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // If fullscreen chat is open, show it
  if (showFullscreenChat && selectedGroup && fallbackUser) {
    return (
      <WhatsAppChat
        group={selectedGroup}
        currentUser={fallbackUser}
        onBack={() => {
          setShowFullscreenChat(false);
          setSelectedGroup(null);
        }}
      />
    );
  }



  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-900 h-screen flex flex-col">
      {/* WhatsApp-style Header */}
      <div className="flex items-center justify-between p-4 border-b bg-green-600 text-white">
        <div className="flex items-center space-x-3">
          {onBackToDirectory && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToDirectory}
              className="text-white hover:bg-green-500 p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <h1 className="text-xl font-semibold">Chats</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={requestNotificationPermission}
            disabled={notifications}
            className="text-white hover:bg-green-500 p-2"
          >
            {notifications ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
          </Button>
          <CreateGroupDialog
            employees={employees}
            sessionToken={sessionToken}
            trigger={
              <Button variant="ghost" size="sm" className="text-white hover:bg-green-500 p-2">
                <Plus className="w-5 h-5" />
              </Button>
            }
          />
        </div>
      </div>

      {/* Notification Prompt */}
      {showNotificationPrompt && (
        <div className="bg-blue-50 dark:bg-blue-900 border-b border-blue-200 dark:border-blue-800 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Stay updated with new messages
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Enable notifications to get instant alerts
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNotificationPrompt(false)}
                className="text-blue-600 border-blue-300 hover:bg-blue-100"
              >
                Not now
              </Button>
              <Button
                size="sm"
                onClick={requestNotificationPermission}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Enable
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="p-4 border-b bg-gray-50 dark:bg-gray-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-hidden">
        {groupsLoading ? (
          <div className="p-4 text-center text-gray-500">Loading chats...</div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No chats yet</p>
            <p className="text-sm mt-2">Create your first group to start messaging</p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredGroups.map((group) => (
                <div
                  key={group.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors active:bg-gray-100 dark:active:bg-gray-700 ${
                    selectedGroup?.id === group.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('=== CLICK EVENT ===');
                    console.log('Group clicked:', group);
                    console.log('Current user available:', !!currentUser);
                    console.log('Fallback user available:', !!fallbackUser);
                    console.log('Setting selected group and showing chat');
                    setSelectedGroup(group);
                    setShowFullscreenChat(true);
                    console.log('State updated, should show chat now');
                    console.log('=== END CLICK EVENT ===');
                  }}
                  onTouchStart={(e) => {
                    console.log('Touch start event');
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate flex-1 mr-2">
                          {group.name}
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                          {group.lastMessageTime ? format(new Date(group.lastMessageTime), 'h:mm a') : ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate flex-1 mr-2">
                          {group.lastMessage || 'No recent messages'}
                        </p>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <Badge variant="secondary" className="text-xs">
                            {group.memberCount}
                          </Badge>
                          {/* Unread count badge */}
                          {group.unreadCount > 0 && (
                            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="text-xs text-white">{group.unreadCount}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>


    </div>
  );
}