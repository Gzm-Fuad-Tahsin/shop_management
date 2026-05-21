"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { apiCall } from "@/lib/api"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DashboardStats {
  totalSales: number
  transactions: number
  productsCount: number
  inventoryValue: number
  lowStockItems: number
}

interface RevenueToday {
  totalRevenue: number
  totalCostPrice: number
  totalSellingPrice: number
  totalProfit: number
  previousCash: number
  totalCashAmount: number
  totalBankAmount: number
  grandTotal: number
}

interface CostToday {
  totalDailyCost: number
  netProfitLoss: number
  entries: Array<{ _id: string; title: string; amount: number }>
}

interface Shop { _id: string; name: string }
interface ShopStat { _id: string; shopName: string; totalSales: number; count: number; avgTransaction: number }

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [revenueToday, setRevenueToday] = useState<RevenueToday | null>(null)
  const [costToday, setCostToday] = useState<CostToday | null>(null)
  const [shops, setShops] = useState<Shop[]>([])
  const [shopStats, setShopStats] = useState<ShopStat[]>([])
  const [selectedShop, setSelectedShop] = useState("all")
  const [previousCashAmount, setPreviousCashAmount] = useState("")
  const [costTitle, setCostTitle] = useState("")
  const [costAmount, setCostAmount] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const fetchShops = async () => {
    if (user?.role !== "admin") return
    const response = await apiCall("/api/shops")
    const data = await response.json()
    setShops(data || [])
  }

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const shopQuery = user?.role === "admin" && selectedShop !== "all" ? `?shopId=${selectedShop}` : ""
      const [statsRes, revenueRes, costRes] = await Promise.all([
        apiCall(`/api/dashboard/stats${shopQuery}`),
        apiCall(`/api/v1/revenue/today${shopQuery}`),
        apiCall(`/api/v1/cost/today${shopQuery}`),
      ])

      const [statsData, revenueData, costData] = await Promise.all([statsRes.json(), revenueRes.json(), costRes.json()])
      setStats(statsData)
      setRevenueToday(revenueData)
      setCostToday(costData)

      if (user?.role === "admin") {
        const shopWiseRes = await apiCall("/api/dashboard/shop-wise")
        const shopWiseData = await shopWiseRes.json()
        setShopStats(shopWiseData || [])
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchShops()
  }, [user?.role])

  useEffect(() => {
    fetchData()
  }, [selectedShop, user?.role])

  const handleAddPreviousCash = async () => {
    const amount = Number(previousCashAmount)
    if (Number.isNaN(amount) || amount < 0) return

    setIsSaving(true)
    try {
      const body: Record<string, unknown> = { amount }
      if (user?.role === "admin" && selectedShop !== "all") body.shopId = selectedShop
      await apiCall("/api/v1/revenue/today/previous-cash", {
        method: "POST",
        body: JSON.stringify(body),
      })
      setPreviousCashAmount("")
      await fetchData()
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddCost = async () => {
    const amount = Number(costAmount)
    if (!costTitle || Number.isNaN(amount) || amount < 0) return

    setIsSaving(true)
    try {
      const body: Record<string, unknown> = { title: costTitle, amount }
      if (user?.role === "admin" && selectedShop !== "all") body.shopId = selectedShop
      await apiCall("/api/v1/cost/today", {
        method: "POST",
        body: JSON.stringify(body),
      })
      setCostTitle("")
      setCostAmount("")
      await fetchData()
    } finally {
      setIsSaving(false)
    }
  }

  const cards = useMemo(
    () => [
      { title: "Today Revenue", value: revenueToday?.totalRevenue ?? 0 },
      { title: "Today Cost", value: costToday?.totalDailyCost ?? 0 },
      { title: "Cash Total", value: revenueToday?.totalCashAmount ?? 0 },
      { title: "Bank Total", value: revenueToday?.totalBankAmount ?? 0 },
      { title: "Net Profit", value: costToday?.netProfitLoss ?? 0 },
    ],
    [revenueToday, costToday],
  )

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">{user?.role === "admin" ? "All Shops Overview" : "Your Shop Overview"}</p>
      </div>

      {user?.role === "admin" && (
        <Card>
          <CardContent className="pt-6">
            <div className="max-w-[280px]">
              <Label>Shop Filter</Label>
              <Select value={selectedShop} onValueChange={setSelectedShop}>
                <SelectTrigger><SelectValue placeholder="All shops" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Shops</SelectItem>
                  {shops.map((shop) => (<SelectItem key={shop._id} value={shop._id}>{shop.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${card.value.toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {user?.role === "admin" && shopStats.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Shop-wise Sales Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Shop</th>
                    <th className="text-right py-2">Total Sales</th>
                    <th className="text-right py-2">Transactions</th>
                    <th className="text-right py-2">Avg Transaction</th>
                  </tr>
                </thead>
                <tbody>
                  {shopStats.map((row) => (
                    <tr key={row._id} className="border-b">
                      <td className="py-2">{row.shopName}</td>
                      <td className="py-2 text-right">${Number(row.totalSales || 0).toFixed(2)}</td>
                      <td className="py-2 text-right">{row.count}</td>
                      <td className="py-2 text-right">${Number(row.avgTransaction || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Selling Price</span><span>${(revenueToday?.totalSellingPrice ?? 0).toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Cost Price</span><span>${(revenueToday?.totalCostPrice ?? 0).toFixed(2)}</span></div>
            <div className="flex justify-between font-semibold"><span>Profit</span><span>${(revenueToday?.totalProfit ?? 0).toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Previous Cash</span><span>${(revenueToday?.previousCash ?? 0).toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Total Cash Amount</span><span>${(revenueToday?.totalCashAmount ?? 0).toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Total Bank Amount</span><span>${(revenueToday?.totalBankAmount ?? 0).toFixed(2)}</span></div>
            <div className="border-t pt-2 flex justify-between font-bold"><span>Grand Total</span><span>${(revenueToday?.grandTotal ?? 0).toFixed(2)}</span></div>
            <div className="pt-3 space-y-2">
              <Label htmlFor="previousCash">Add Previous Day Cash</Label>
              <div className="flex gap-2">
                <Input id="previousCash" type="number" min="0" step="0.01" value={previousCashAmount} onChange={(e) => setPreviousCashAmount(e.target.value)} />
                <Button onClick={handleAddPreviousCash} disabled={isSaving}>Add</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Cost Section</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="costTitle">Title</Label>
              <Input id="costTitle" value={costTitle} onChange={(e) => setCostTitle(e.target.value)} placeholder="Transport, electricity, staff meal" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costAmount">Amount</Label>
              <Input id="costAmount" type="number" min="0" step="0.01" value={costAmount} onChange={(e) => setCostAmount(e.target.value)} />
            </div>
            <Button className="w-full" onClick={handleAddCost} disabled={isSaving}>Add Daily Cost</Button>
            <div className="text-sm pt-2 border-t">
              <div className="flex justify-between"><span>Total Daily Cost</span><span>${(costToday?.totalDailyCost ?? 0).toFixed(2)}</span></div>
              <div className="flex justify-between font-semibold"><span>Net Profit/Loss</span><span>${(costToday?.netProfitLoss ?? 0).toFixed(2)}</span></div>
            </div>
            <div className="space-y-1 max-h-40 overflow-auto">
              {costToday?.entries?.map((entry) => (
                <div key={entry._id} className="text-sm flex justify-between rounded border px-2 py-1">
                  <span>{entry.title}</span><span>${entry.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Sales</CardTitle></CardHeader><CardContent>${stats?.totalSales.toLocaleString()}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Transactions</CardTitle></CardHeader><CardContent>{stats?.transactions}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Products</CardTitle></CardHeader><CardContent>{stats?.productsCount}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Low Stock Items</CardTitle></CardHeader><CardContent>{stats?.lowStockItems}</CardContent></Card>
      </div>
    </div>
  )
}
