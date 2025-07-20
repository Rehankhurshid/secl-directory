"use client"

import * as React from "react"
import { Users, MessageSquare, Shield, Search, Bell, Menu, LogOut, Settings, RefreshCw, Download, Moon, Sun, Info, Smartphone } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useOfflineStatus } from "@/lib/hooks/use-offline-status"
import { useRefresh } from "@/lib/hooks/use-refresh"
import { installPWA } from "@/lib/utils/pwa"
import { useLogout } from "@/lib/hooks/use-auth"

interface TopNavigationProps {
  user?: {
    name: string
    email: string
    avatar?: string
    role?: string
  }
}

const navigationItems = [
  {
    title: "Directory",
    href: "/employee-directory",
    icon: Users,
  },
  {
    title: "Messages",
    href: "/messaging",
    icon: MessageSquare,
  },
]

export function TopNavigation({ user }: TopNavigationProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const isOffline = useOfflineStatus()
  const { refresh, isRefreshing } = useRefresh()
  const [canInstall, setCanInstall] = React.useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const logout = useLogout()

  React.useEffect(() => {
    const checkInstallable = () => {
      setCanInstall('deferredPrompt' in window && window.deferredPrompt !== null)
    }

    checkInstallable()
    window.addEventListener('beforeinstallprompt', checkInstallable)

    return () => {
      window.removeEventListener('beforeinstallprompt', checkInstallable)
    }
  }, [])

  const handleInstall = async () => {
    try {
      await installPWA()
      setCanInstall(false)
    } catch (error) {
      console.error('Failed to install:', error)
    }
  }

  const handleLogout = () => {
    logout.mutate()
  }

  const handleTestNotification = async () => {
    router.push('/test-notifications')
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === href
    return pathname.startsWith(href)
  }

  const isAdmin = user?.role === 'admin'

  const NavItems = ({ mobile = false, onItemClick }: { mobile?: boolean; onItemClick?: () => void }) => (
    <nav className={cn(
      "flex",
      mobile ? "flex-col space-y-1" : "items-center space-x-1"
    )}>
      {navigationItems.map((item) => {
        const Icon = item.icon
        const active = isActive(item.href)

        return (
          <Button
            key={item.href}
            variant={active ? "secondary" : "ghost"}
            size={mobile ? "default" : "sm"}
            className={cn(
              mobile && "w-full justify-start",
              "relative"
            )}
            onClick={() => {
              router.push(item.href)
              onItemClick?.()
            }}
          >
            <Icon className="h-4 w-4 mr-2" />
            <span className={cn(!mobile && "hidden lg:inline")}>
              {item.title}
            </span>
            {('badge' in item && item.badge) ? (
              <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs">
                {String(item.badge)}
              </Badge>
            ) : null}
          </Button>
        )
      })}
      {isAdmin && (
        <Button
          variant={pathname.startsWith('/admin') ? "secondary" : "ghost"}
          size={mobile ? "default" : "sm"}
          className={cn(
            mobile && "w-full justify-start",
            "relative"
          )}
          onClick={() => {
            router.push('/admin')
            onItemClick?.()
          }}
        >
          <Shield className="h-4 w-4 mr-2" />
          <span className={cn(!mobile && "hidden lg:inline")}>
            Admin
          </span>
        </Button>
      )}
    </nav>
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-lg font-bold">S</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold leading-tight">SECL Directory</h1>
              </div>
            </button>
            
            {isOffline && (
              <Badge variant="secondary" className="hidden sm:flex">
                Offline
              </Badge>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex">
            <NavItems />
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Search Button - Hidden on mobile, shown on desktop */}
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Search className="h-4 w-4" />
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* Notifications - Mobile */}
            <Button variant="ghost" size="icon" className="relative md:hidden">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
                3
              </span>
            </Button>

            {/* Profile Dropdown - Desktop */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="hidden md:flex">
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar} alt={user?.name} />
                    <AvatarFallback>
                      {user?.name
                        ?.split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel className="flex flex-col">
                  <span>{user?.name || 'User'}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {user?.email || 'user@example.com'}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => router.push('/admin')}>
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={refresh} disabled={isRefreshing}>
                  <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
                  Refresh Data
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/notifications')}>
                  <Bell className="mr-2 h-4 w-4" />
                  Manage Notifications
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleTestNotification}>
                  <Bell className="mr-2 h-4 w-4" />
                  Test Notification
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/debug/notifications')}>
                  <Info className="mr-2 h-4 w-4" />
                  Debug Notifications
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/debug/pwa')}>
                  <Smartphone className="mr-2 h-4 w-4" />
                  Debug PWA Install
                </DropdownMenuItem>
                {canInstall && (
                  <DropdownMenuItem onClick={handleInstall}>
                    <Download className="mr-2 h-4 w-4" />
                    Install App
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  {/* User Info */}
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                      <AvatarFallback>
                        {user?.name
                          ?.split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user?.name || 'User'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.email || 'user@example.com'}
                      </p>
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="space-y-1">
                    <h3 className="text-xs font-medium text-muted-foreground mb-2">Navigation</h3>
                    <NavItems mobile onItemClick={() => setMobileMenuOpen(false)} />
                  </div>

                  {/* Actions */}
                  <div className="space-y-1">
                    <h3 className="text-xs font-medium text-muted-foreground mb-2">Actions</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        router.push('/profile')
                        setMobileMenuOpen(false)
                      }}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Profile Settings
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={refresh}
                      disabled={isRefreshing}
                    >
                      <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
                      Refresh Data
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        router.push('/notifications')
                        setMobileMenuOpen(false)
                      }}
                    >
                      <Bell className="mr-2 h-4 w-4" />
                      Manage Notifications
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        handleTestNotification()
                        setMobileMenuOpen(false)
                      }}
                    >
                      <Bell className="mr-2 h-4 w-4" />
                      Test Notification
                    </Button>
                    {canInstall && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={handleInstall}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Install App
                      </Button>
                    )}
                  </div>

                  {/* Status */}
                  {isOffline && (
                    <div className="space-y-1">
                      <Badge variant="secondary" className="w-full justify-center">
                        Currently Offline
                      </Badge>
                    </div>
                  )}

                  {/* Logout */}
                  <div className="pt-4 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}