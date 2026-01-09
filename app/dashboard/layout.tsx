'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Sidebar } from '@/components/sidebar'
import { Topbar } from '@/components/topbar'
import { ShopDialog } from '@/components/shop-dialog'
import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const [showShopDialog, setShowShopDialog] = useState(false)

  useEffect(() => {
    if (user && user.role === 'manager' && !user.shop) {
      setShowShopDialog(true)
    }
  }, [user])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    redirect('/auth/login')
  }

  const handleShopCreated = () => {
    setShowShopDialog(false)
    // Refresh user data
    window.location.reload()
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar user={user} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar user={user} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
      
      <ShopDialog 
        open={showShopDialog} 
        onOpenChange={setShowShopDialog}
        onSuccess={handleShopCreated}
      />
    </div>
  )
}
