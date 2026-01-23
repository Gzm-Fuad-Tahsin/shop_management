"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { useAuth } from "@/hooks/use-auth"
import { apiCall } from "@/lib/api"
import { Loader2 } from "lucide-react"

interface DashboardStats {
  totalSales: number
  transactions: number
  productsCount: number
  inventoryValue: number
  lowStockItems: number
}

interface ShopStats {
  _id: string
  shopName: string
  totalSales: number
  count: number
  avgTransaction: number
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [shopStats, setShopStats] = useState<ShopStats[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch stats
      const statsResponse = await apiCall("/api/dashboard/stats")
      const statsData = await statsResponse.json()
      setStats(statsData)

      // Fetch shop-wise stats if admin
      if (user?.role === "admin") {
        const shopResponse = await apiCall("/api/dashboard/shop-wise")
        const shopData = await shopResponse.json()
        setShopStats(shopData)
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"]

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          {user?.role === "admin" ? "All Shops Overview" : "Your Shop Overview"}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.totalSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{stats?.transactions} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.productsCount}</div>
            <p className="text-xs text-muted-foreground">Active products</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(stats?.inventoryValue || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total stock value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">Needs reordering</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin: Shop-wise sales chart */}
      {user?.role === "admin" && shopStats.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Shop-wise Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={shopStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="shopName" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value}`} />
                <Legend />
                <Bar dataKey="totalSales" fill="#3b82f6" name="Total Sales" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="text-center text-muted-foreground">Data loads from real sales records</div>
    </div>
  )
}
