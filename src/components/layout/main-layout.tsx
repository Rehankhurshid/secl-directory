"use client"

import * as React from "react"
import { TopNavigation } from "./top-navigation"
import { MobileBottomNav } from "./mobile-bottom-nav"
import { cn } from "@/lib/utils"

interface MainLayoutProps {
  children: React.ReactNode
  user?: {
    name: string
    email: string
    avatar?: string
    role?: string
  }
}

export function MainLayout({ children, user }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {user ? <TopNavigation user={user} /> : <TopNavigation />}
      <main className="flex-1">
        {children}
      </main>
      {/* <MobileBottomNav user={user} /> */}
    </div>
  )
}