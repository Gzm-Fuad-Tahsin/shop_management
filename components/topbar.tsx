"use client"

import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { LogOut, User, Store } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface TopbarProps {
  user: {
    name?: string
    email?: string
    role?: string
    shop?: {
      _id?: string
      name?: string
    } | string | null
  }
}

export function Topbar({ user }: TopbarProps) {
  const { logout } = useAuth()
  const shopName = typeof user.shop === "object" && user.shop?.name ? user.shop.name : null

  if (!user?.name) {
    return (
      <div className="flex items-center justify-between h-16 px-6 bg-card border-b border-border">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between h-16 px-6 bg-card border-b border-border">
      <div>
        <h2 className="text-sm font-medium text-muted-foreground">Welcome back</h2>
        {shopName && user.role === "manager" && (
          <div className="flex items-center gap-1 mt-1 text-xs text-foreground">
            <Store className="w-3 h-3" />
            <span>{shopName}</span>
          </div>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.role}</p>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            <div>{user.name}</div>
            <div className="text-xs font-normal text-muted-foreground">{user.email}</div>
            {shopName && user.role === "manager" && (
              <div className="text-xs font-normal text-muted-foreground flex items-center gap-1 mt-1">
                <Store className="w-3 h-3" /> {shopName}
              </div>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="flex items-center gap-2 cursor-pointer">
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
