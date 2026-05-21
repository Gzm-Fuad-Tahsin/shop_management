"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { getNavigationItems } from "@/components/navigation"

interface SidebarProps {
  user: {
    role: "admin" | "manager" | "staff"
  }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const navigationItems = getNavigationItems(user.role)

  return (
    <div className="hidden md:block w-full md:w-64 bg-card border-b md:border-b-0 md:border-r border-border">
      <div className="p-6">
        <h1 className="text-xl font-bold text-foreground">ShopManager</h1>
        <p className="text-xs text-muted-foreground">Management System</p>
      </div>

      <nav className="px-4 py-6 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200",
                isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent",
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
