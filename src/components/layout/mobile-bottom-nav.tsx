"use client"

import * as React from "react"
import { Users, MessageSquare, Shield, Home } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface MobileBottomNavProps {
  user?: {
    role?: string
  }
}

const navigationItems = [
  {
    title: "Home",
    href: "/",
    icon: Home,
  },
  {
    title: "Directory",
    href: "/employee-directory",
    icon: Users,
  },
  {
    title: "Messages",
    href: "/messages",
    icon: MessageSquare,
    badge: "Soon",
  },
]

export function MobileBottomNav({ user }: MobileBottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isAdmin = user?.role === 'admin'

  const isActive = (href: string) => {
    if (href === '/') return pathname === href
    return pathname.startsWith(href)
  }

  const allItems = [
    ...navigationItems,
    ...(isAdmin ? [{
      title: "Admin",
      href: "/admin",
      icon: Shield,
    }] : [])
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
      <div className="grid grid-cols-4 h-16">
        {allItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 relative transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.title}</span>
              {item.badge && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-1 -right-2 h-4 px-1 text-[10px]"
                >
                  {item.badge}
                </Badge>
              )}
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}