"use client"

import * as React from "react"
import { Users, MessageSquare, Shield, Home, Settings, LogOut, RefreshCw, Download, Menu } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { useOfflineStatus } from "@/lib/hooks/use-offline-status"
import { useRefresh } from "@/lib/hooks/use-refresh"
import { installPWA } from "@/lib/utils/pwa"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name: string
    email: string
    avatar?: string
    role?: string
  }
}

const navigationItems = [
  {
    title: "Dashboard",
    items: [
      {
        title: "Overview",
        url: "/",
        icon: Home,
      },
    ],
  },
  {
    title: "Main",
    items: [
      {
        title: "Employee Directory",
        url: "/employee-directory",
        icon: Users,
      },
      {
        title: "Messages",
        url: "/messaging",
        icon: MessageSquare,
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        title: "Admin Panel",
        url: "/admin",
        icon: Shield,
        requiresAdmin: true,
      },
      {
        title: "Settings",
        url: "/settings",
        icon: Settings,
      },
    ],
  },
]

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const isOffline = useOfflineStatus()
  const { refresh, isRefreshing } = useRefresh()
  const { isMobile } = useSidebar()
  const [canInstall, setCanInstall] = React.useState(false)

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

  const handleLogout = () => {
    // Handle logout
    console.log('Logout clicked')
  }

  const handleInstall = async () => {
    try {
      await installPWA()
      setCanInstall(false)
    } catch (error) {
      console.error('Failed to install:', error)
    }
  }

  const isActive = (url: string) => {
    if (url === '/') return pathname === url
    return pathname.startsWith(url)
  }

  const isAdmin = user?.role === 'admin'

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="group">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-lg font-bold">S</span>
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">SECL Directory</span>
                <span className="text-xs text-muted-foreground">v1.0.0</span>
              </div>
              {isOffline && (
                <Badge variant="secondary" className="ml-auto">
                  Offline
                </Badge>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navigationItems.map((group) => {
          const visibleItems = group.items.filter(
            (item) => !('requiresAdmin' in item) || !item.requiresAdmin || isAdmin
          )

          if (visibleItems.length === 0) return null

          return (
            <SidebarGroup key={group.title}>
              <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive(item.url)}
                          tooltip={item.title}
                        >
                          <a href={item.url}>
                            <Icon className="size-4" />
                            <span>{item.title}</span>
                            {('badge' in item && item.badge) ? (
                              <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs">
                                {String(item.badge)}
                              </Badge>
                            ) : null}
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
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
                  <div className="flex flex-col gap-0.5 leading-none text-left">
                    <span className="font-medium">{user?.name || 'User'}</span>
                    <span className="text-xs text-muted-foreground">
                      {user?.email || 'user@example.com'}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side={isMobile ? "top" : "right"}
                align="end"
                className="w-56"
              >
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
                {canInstall && (
                  <DropdownMenuItem onClick={handleInstall}>
                    <Download className="mr-2 h-4 w-4" />
                    Install App
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  {theme === 'dark' ? (
                    <Sun className="mr-2 h-4 w-4" />
                  ) : (
                    <Moon className="mr-2 h-4 w-4" />
                  )}
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}