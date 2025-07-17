import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { RefreshCw, Plus, WifiOff, LogOut, Camera, RotateCcw, MessageSquare, HelpCircle, Download, Shield } from "lucide-react";
import { usePWA } from "@/hooks/use-pwa";
import { useAuth, useLogout } from "@/hooks/use-auth";
import { useLocation } from "wouter";

interface AppHeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
  onInstall?: () => void;
  showInstallButton?: boolean;
  onProfileImageClick?: () => void;
  onShowTutorial?: () => void;
  onShowInstallDialog?: () => void;
}

export function AppHeader({
  onRefresh,
  isLoading,
  onInstall,
  showInstallButton = false,
  onProfileImageClick,
  onShowTutorial,
  onShowInstallDialog
}: AppHeaderProps) {
  const { isOnline, isInstallable, installApp, hardRefresh } = usePWA();
  const { employee } = useAuth();
  const logout = useLogout();
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    logout.mutate();
  };

  const handleMessagingClick = () => {
    setLocation('/messaging');
  };

  const handleAdminClick = () => {
    setLocation('/admin');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Offline Indicator */}
      {!isOnline && (
        <div className="bg-yellow-600 text-white px-4 py-2 text-center text-sm">
          <WifiOff className="w-4 h-4 inline mr-2" />
          You're offline - showing cached data
        </div>
      )}

      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold">Employee Directory</h1>
                <span className="text-xs text-muted-foreground">
                  v{new Date().toLocaleString('en-US', { 
                    month: '2-digit', 
                    day: '2-digit', 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false
                  })}
                </span>
              </div>
            </div>
            
            {/* Admin Panel button for desktop */}
            {employee?.role === 'admin' && (
              <Button
                variant={location === '/admin' ? 'default' : 'outline'}
                size="sm"
                onClick={handleAdminClick}
                className="hidden md:flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Admin Panel
              </Button>
            )}
            
            {/* Install button for desktop */}
            {isInstallable && (
              <Button
                variant="outline"
                size="sm"
                onClick={installApp}
                className="hidden md:flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Install App
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <ThemeToggle />
            
            {/* Install button for mobile */}
            {isInstallable && (
              <Button
                variant="outline"
                size="sm"
                onClick={installApp}
                className="md:hidden"
                title="Install App"
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMessagingClick}
              title="Group Messaging"
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
            
            {/* Admin Panel button - only show for admin users */}
            {employee?.role === 'admin' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAdminClick}
                title="Admin Panel"
                className="relative"
              >
                <Shield className="w-4 h-4" />
                <Badge variant="secondary" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs">
                  A
                </Badge>
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            
            {employee && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={employee.profileImage || ""} alt={employee.name} />
                      <AvatarFallback className="text-xs">
                        {employee.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{employee.name}</p>
                        {employee.role === 'admin' && (
                          <Badge variant="destructive" className="text-xs">
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {employee.employeeId} • {employee.designation}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  {employee.role === 'admin' && (
                    <DropdownMenuItem onClick={handleAdminClick}>
                      <Shield className="mr-2 h-4 w-4" />
                      Admin Panel
                    </DropdownMenuItem>
                  )}
                  {onProfileImageClick && (
                    <DropdownMenuItem onClick={onProfileImageClick}>
                      <Camera className="mr-2 h-4 w-4" />
                      Update Picture
                    </DropdownMenuItem>
                  )}
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
                  <DropdownMenuItem onClick={hardRefresh}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Hard Refresh
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} disabled={logout.isPending}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {logout.isPending ? "Signing out..." : "Sign out"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}