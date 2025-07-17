import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SignOut, UserCircle, Sun, Moon, Users, GearSix, Bell, CaretDown, ArrowClockwise } from "@phosphor-icons/react";

export function Navigation() {
  const { user, logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    // Clear all caches
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      } catch (error) {
        console.error('Failed to clear caches:', error);
      }
    }

    // Force reload
    window.location.reload();
  };

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="text-primary" size={32} />
            </div>
            <div className="hidden md:block ml-4">
              <h1 className="text-xl font-semibold text-card-foreground">Employee Directory</h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Refresh Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh app and clear cache"
            >
              <ArrowClockwise 
                size={20} 
                className={isRefreshing ? "animate-spin" : ""} 
              />
            </Button>

            {/* Theme Toggle */}
            <Button variant="ghost" size="sm" onClick={toggleTheme}>
              {isDarkMode ? (
                <Sun size={20} />
              ) : (
                <Moon size={20} />
              )}
            </Button>

            {/* Notification Bell */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell size={20} />
              <Badge className="absolute -top-1 -right-1 w-5 h-5 text-xs flex items-center justify-center">
                3
              </Badge>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage 
                      src={user?.profileImage ? `/uploads/${user.profileImage}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || '')}&background=3B82F6&color=fff&size=32`}
                      alt={user?.name}
                    />
                    <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm font-medium">{user?.name}</span>
                  <CaretDown size={12} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <UserCircle size={16} className="mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <GearSix size={16} className="mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => logout()}>
                  <SignOut size={16} className="mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
