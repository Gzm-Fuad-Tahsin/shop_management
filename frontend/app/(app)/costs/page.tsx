"use client"

import { useEffect, useMemo, useState } from "react"
import { redirect } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { apiCall } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BrandLoadingMark, PageLoading } from "@/components/page-loading"

interface Shop {
  _id: string
  name: string
}

interface CostEntry {
  _id: string
  title: string
  amount: number
  date: string
  createdAt: string
  shop?: {
    _id: string
    name: string
  }
}

interface CostListResponse {
  entries: CostEntry[]
  totalAmount: number
  count: number
}

interface CostTodayResponse {
  totalDailyCost: number
  totalSalesRevenue: number
  totalCostPrice: number
  grossProfit: number
  netProfitLoss: number
}

const getTodayString = () => {
  const now = new Date()
  const timezoneOffset = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10)
}

export default function CostsPage() {
  const { user } = useAuth()
  const [shops, setShops] = useState<Shop[]>([])
  const [selectedShop, setSelectedShop] = useState("all")
  const [selectedDate, setSelectedDate] = useState(getTodayString())
  const [costTitle, setCostTitle] = useState("")
  const [costAmount, setCostAmount] = useState("")
  const [costData, setCostData] = useState<CostListResponse | null>(null)
  const [todaySummary, setTodaySummary] = useState<CostTodayResponse | null>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isDataRefreshing, setIsDataRefreshing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editAmount, setEditAmount] = useState("")

  if (user && user.role === "staff") {
    redirect("/dashboard")
  }

  const requiresShopSelection = user?.role === "admin" && selectedShop === "all"

  const fetchShops = async () => {
    if (user?.role !== "admin") return
    const response = await apiCall("/api/shops")
    if (!response.ok) return
    const data = await response.json()
    setShops(data || [])
  }

  const fetchData = async (options?: { initial?: boolean }) => {
    if (!user) return

    if (options?.initial) {
      setIsInitialLoading(true)
    } else {
      setIsDataRefreshing(true)
    }
    try {
      const params = new URLSearchParams({ date: selectedDate })
      if (user.role === "admin" && selectedShop !== "all") {
        params.set("shopId", selectedShop)
      }

      const listPromise = apiCall(`/api/v1/cost?${params.toString()}`)
      const summaryPromise = requiresShopSelection ? null : apiCall(`/api/v1/cost/today?${params.toString()}`)

      const [listRes, summaryRes] = await Promise.all([listPromise, summaryPromise])
      if (listRes.ok) {
        const listData = await listRes.json()
        setCostData(listData)
      } else {
        setCostData(null)
      }

      if (summaryRes && summaryRes.ok) {
        const summaryData = await summaryRes.json()
        setTodaySummary(summaryData)
      } else {
        setTodaySummary(null)
      }
    } catch (error) {
      console.error("Failed to fetch cost data:", error)
      setCostData(null)
      setTodaySummary(null)
    } finally {
      setIsInitialLoading(false)
      setIsDataRefreshing(false)
    }
  }

  useEffect(() => {
    fetchShops()
  }, [user?.role])

  useEffect(() => {
    fetchData({ initial: true })
  }, [user])

  useEffect(() => {
    if (!user) return
    fetchData()
  }, [selectedDate, selectedShop])

  const startEditing = (entry: CostEntry) => {
    setEditingId(entry._id)
    setEditTitle(entry.title)
    setEditAmount(String(entry.amount))
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditTitle("")
    setEditAmount("")
  }

  const handleUpdateCost = async () => {
    if (!editingId) return
    const amount = Number(editAmount)
    if (!editTitle.trim() || Number.isNaN(amount) || amount < 0) return

    setIsSaving(true)
    try {
      const response = await apiCall(`/api/v1/cost/${editingId}`, {
        method: "PUT",
        body: JSON.stringify({
          title: editTitle.trim(),
          amount,
          date: selectedDate,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update cost")
      }

      cancelEditing()
      await fetchData()
    } catch (error) {
      console.error("Failed to update cost:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddCost = async () => {
    const amount = Number(costAmount)
    if (!costTitle.trim() || Number.isNaN(amount) || amount < 0 || !user) return
    if (requiresShopSelection) return

    setIsSaving(true)
    try {
      const body: Record<string, unknown> = {
        title: costTitle.trim(),
        amount,
        date: selectedDate,
      }

      if (user.role === "admin" && selectedShop !== "all") {
        body.shopId = selectedShop
      }

      const response = await apiCall("/api/v1/cost/today", {
        method: "POST",
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error("Failed to add cost")
      }

      setCostTitle("")
      setCostAmount("")
      await fetchData()
    } catch (error) {
      console.error("Failed to add cost:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const summaryCards = useMemo(
    () => [
      { title: "Daily Cost", value: todaySummary?.totalDailyCost ?? costData?.totalAmount ?? 0 },
      { title: "Sales Revenue", value: todaySummary?.totalSalesRevenue ?? 0 },
      { title: "Gross Profit", value: todaySummary?.grossProfit ?? 0 },
      { title: "Net Profit/Loss", value: todaySummary?.netProfitLoss ?? 0 },
    ],
    [costData?.totalAmount, todaySummary],
  )

  if (isInitialLoading) {
    return <PageLoading compact />
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cost Section</h1>
        <p className="text-muted-foreground mt-1">
          {user?.role === "admin"
            ? "Review and add daily cost entries by shop"
            : "Track your daily shop costs and profit impact"}
        </p>
        {isDataRefreshing && (
          <div className="mt-3 inline-flex">
            <BrandLoadingMark compact />
          </div>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="cost-date">Date</Label>
              <Input id="cost-date" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>
            {user?.role === "admin" && (
              <div>
                <Label>Shop</Label>
                <Select value={selectedShop} onValueChange={setSelectedShop}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select shop" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Shops</SelectItem>
                    {shops.map((shop) => (
                      <SelectItem key={shop._id} value={shop._id}>
                        {shop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${Number(card.value || 0).toFixed(2)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[380px_minmax(0,1fr)] gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Add Cost Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cost-title">Title</Label>
              <Input
                id="cost-title"
                value={costTitle}
                onChange={(e) => setCostTitle(e.target.value)}
                placeholder="Transport, electricity, lunch"
                disabled={requiresShopSelection}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost-amount">Amount</Label>
              <Input
                id="cost-amount"
                type="number"
                min="0"
                step="0.01"
                value={costAmount}
                onChange={(e) => setCostAmount(e.target.value)}
                disabled={requiresShopSelection}
              />
            </div>
            <Button className="w-full" onClick={handleAddCost} disabled={isSaving || requiresShopSelection}>
              {isSaving ? "Saving..." : "Add Cost"}
            </Button>
            {requiresShopSelection && (
              <p className="text-sm text-muted-foreground">Select a shop first to add or review shop-specific profit data.</p>
            )}
            {!requiresShopSelection && (
              <div className="rounded-lg border p-3 text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Total Product Cost</span>
                  <span>${(todaySummary?.totalCostPrice ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gross Profit</span>
                  <span>${(todaySummary?.grossProfit ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Net Profit/Loss</span>
                  <span>${(todaySummary?.netProfitLoss ?? 0).toFixed(2)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {costData?.entries?.length ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      {user?.role === "admin" && <TableHead>Shop</TableHead>}
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {costData.entries.map((entry) => (
                      <TableRow key={entry._id}>
                        <TableCell className="font-medium">
                          {editingId === entry._id ? (
                            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                          ) : (
                            entry.title
                          )}
                        </TableCell>
                        {user?.role === "admin" && <TableCell>{entry.shop?.name || "-"}</TableCell>}
                        <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          {editingId === entry._id ? (
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                            />
                          ) : (
                            `$${Number(entry.amount || 0).toFixed(2)}`
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {editingId === entry._id ? (
                            <>
                              <Button size="sm" onClick={handleUpdateCost} disabled={isSaving}>
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={cancelEditing} disabled={isSaving}>
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => startEditing(entry)}>
                              Edit
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No cost entries found for the selected filters.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
