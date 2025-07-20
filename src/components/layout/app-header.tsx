'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  WifiOff,
  Shield,
  Plus,
  RefreshCw,
  MessageSquare,
  Camera,
  HelpCircle,
  Download,
  RotateCcw,
  LogOut,
  Sun,
  Moon,
  Settings,
  Users,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth, useLogout } from '@/lib/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
  onInstall?: () => void;
  showInstallButton?: boolean;
  onProfileImageClick?: () => void;
  onShowTutorial?: () => void;
  onShowInstallDialog?: () => void;
  user?: {
    name: string;
    employeeId: string;
    designation: string;
    role?: string;
    profileImage?: string;
  };
  isOnline?: boolean;
  isInstallable?: boolean;
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      className="h-8 w-8 px-0"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

function NavigationActions({
  onInstall,
  isInstallable,
}: Pick<AppHeaderProps, 'onInstall' | 'isInstallable'>) {
  const router = useRouter();

  return (
    <>
      {/* Install App Button - Mobile Only */}
      {isInstallable && onInstall && (
        <Button
          variant="outline"
          size="sm"
          onClick={onInstall}
          className="md:hidden h-8 w-8 px-0"
          title="Install App"
        >
          <Plus className="h-4 w-4" />
        </Button>
      )}
      
      {/* Refresh Button - REMOVED: Moved to profile dropdown */}
    </>
  );
}

function UserProfileMenu({
  user,
  onProfileImageClick,
  onShowTutorial,
  onShowInstallDialog,
  onRefresh,
  isLoading,
}: {
  user: NonNullable<AppHeaderProps['user']>;
  onProfileImageClick?: AppHeaderProps['onProfileImageClick'];
  onShowTutorial?: AppHeaderProps['onShowTutorial'];
  onShowInstallDialog?: AppHeaderProps['onShowInstallDialog'];
  onRefresh: AppHeaderProps['onRefresh'];
  isLoading: AppHeaderProps['isLoading'];
}) {
  const router = useRouter();
  const logout = useLogout();

  const handleLogout = async () => {
    await logout.mutateAsync();
    router.push('/login');
  };

  const hardRefresh = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.profileImage || ''} alt={user.name} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-56" align="end" forceMount>
        {/* User Info Header */}
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            <div className="flex items-center gap-2">
              <p className="font-medium">{user.name}</p>
              {user.role === 'admin' && (
                <Badge variant="destructive" className="text-xs">Admin</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {user.employeeId} • {user.designation}
            </p>
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        {/* Navigation Actions */}
        {user.role === 'admin' && (
          <DropdownMenuItem onClick={() => router.push('/admin')}>
            <Shield className="mr-2 h-4 w-4" />
            Admin Panel
          </DropdownMenuItem>
        )}
        
        {/* Profile Actions */}
        {onProfileImageClick && (
          <DropdownMenuItem onClick={onProfileImageClick}>
            <Camera className="mr-2 h-4 w-4" />
            Update Picture
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem onClick={() => router.push('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        
        {onShowTutorial && (
          <DropdownMenuItem onClick={onShowTutorial}>
            <HelpCircle className="mr-2 h-4 w-4" />
            Show Tutorial
          </DropdownMenuItem>
        )}
        
        {onShowInstallDialog && (
          <DropdownMenuItem onClick={onShowInstallDialog}>
            <Download className="mr-2 h-4 w-4" />
            Install App
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        {/* System Actions */}
        <DropdownMenuItem onClick={onRefresh} disabled={isLoading}>
          <RefreshCw className={cn('mr-2 h-4 w-4', isLoading && 'animate-spin')} />
          {isLoading ? 'Refreshing...' : 'Refresh Data'}
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={hardRefresh}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Hard Refresh
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleLogout} disabled={logout.isPending}>
          <LogOut className="mr-2 h-4 w-4" />
          {logout.isPending ? 'Signing out...' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getCurrentVersion() {
  return new Date().toLocaleString('en-US', { 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  });
}

export function AppHeader(props: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuth();
  const rawUser = props.user || auth?.employee;
  
  // Normalize user object to match expected interface
  const user = rawUser ? {
    name: rawUser.name,
    employeeId: 'employeeId' in rawUser ? rawUser.employeeId : (rawUser as any).empCode,
    designation: rawUser.designation || '',
    ...(rawUser.role && { role: rawUser.role }),
    ...(rawUser.profileImage && { profileImage: rawUser.profileImage })
  } : undefined;
  
  const isOnline = props.isOnline ?? true;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Offline Indicator */}
      {!isOnline && (
        <div className="bg-yellow-600 text-white px-4 py-2 text-center text-sm">
          <WifiOff className="w-4 h-4 inline mr-2" />
          You're offline - showing cached data
        </div>
      )}

      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left Section: Brand & Navigation */}
          <div className="flex items-center space-x-6">
            {/* Brand Title */}
            <div className="flex flex-col">
              <h1 className="text-xl font-bold">SECL</h1>
              <span className="text-xs text-muted-foreground">
                v{getCurrentVersion()}
              </span>
            </div>
            
            {/* Navigation Tabs */}
            <nav className="flex items-center space-x-1">
              <Button
                variant={pathname === '/employee-directory' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => router.push('/employee-directory')}
                className="flex items-center gap-2 px-2 sm:px-3"
                title="Employee Directory"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Employee Directory</span>
              </Button>
              
              <Button
                variant={pathname === '/messaging' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => router.push('/messaging')}
                className="flex items-center gap-2 px-2 sm:px-3"
                title="Messaging"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Messaging</span>
              </Button>
              
              {user?.role === 'admin' && (
                <Button
                  variant={pathname === '/admin' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => router.push('/admin')}
                  className="flex items-center gap-2 px-2 sm:px-3"
                  title="Admin Panel"
                >
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              )}
            </nav>
          </div>

          {/* Right Section: Actions & User Menu */}
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            {props.onInstall && (
              <NavigationActions 
                onInstall={props.onInstall}
                isInstallable={props.isInstallable || false}
              />
            )}
            {user && (
              <UserProfileMenu 
                user={user}
                onProfileImageClick={props.onProfileImageClick}
                onShowTutorial={props.onShowTutorial}
                onShowInstallDialog={props.onShowInstallDialog}
                onRefresh={props.onRefresh}
                isLoading={props.isLoading}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}