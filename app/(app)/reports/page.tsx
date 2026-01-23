"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { apiCall } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { Download, Loader2 } from "lucide-react"

interface SalesData {
  date: string
  amount: number
  count: number
}

interface CategoryData {
  name: string
  value: number
  quantity?: number
}

export default function ReportsPage() {
  const { user } = useAuth()
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  )
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0])
  const [salesData, setSalesData] = useState<SalesData[]>([])
  const [categorySalesData, setCategorySalesData] = useState<CategoryData[]>([])
  const [revenueByShop, setRevenueByShop] = useState<CategoryData[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"]

  useEffect(() => {
    fetchReportData()
  }, [startDate, endDate])

  const fetchReportData = async () => {
    try {
      setIsLoading(true)

      // Fetch category sales
      const categoryResponse = await apiCall("/api/dashboard/category-sales")
      const categoryData = await categoryResponse.json()
      setCategorySalesData(categoryData)

      // Fetch revenue by shop if admin
      if (user?.role === "admin") {
        const revenueResponse = await apiCall("/api/dashboard/revenue-by-shop")
        const revenueData = await revenueResponse.json()
        setRevenueByShop(revenueData)
      }

      // Fetch sales data
      const salesResponse = await apiCall(`/api/sales/range?startDate=${startDate}&endDate=${endDate}`)
      const sales = await salesResponse.json()

      // Process sales by date
      const salesByDate: Record<string, { amount: number; count: number }> = {}
      sales.forEach((sale: { totalAmount: number; createdAt: string }) => {
        const date = new Date(sale.createdAt).toLocaleDateString()
        if (!salesByDate[date]) {
          salesByDate[date] = { amount: 0, count: 0 }
        }
        salesByDate[date].amount += sale.totalAmount
        salesByDate[date].count += 1
      })

      const processedSalesData = Object.entries(salesByDate)
        .map(([date, { amount, count }]) => ({
          date,
          amount: Math.round(amount),
          count,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      setSalesData(processedSalesData)
    } catch (error) {
      console.error("Failed to fetch report data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const totalSales = salesData.reduce((sum, item) => sum + item.amount, 0)
  const totalTransactions = salesData.reduce((sum, item) => sum + item.count, 0)
  const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0

  const handleExport = () => {
    const csv = [
      ["Date", "Sales Amount", "Transactions"],
      ...salesData.map((item) => [item.date, item.amount, item.count]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "sales-report.csv"
    a.click()
  }

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
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground mt-1">
          {user?.role === "admin" ? "All Shops Analytics" : "Your Shop Analytics"}
        </p>
      </div>

      {/* Date Range Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button onClick={handleExport} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSales.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${averageTransaction.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts for Manager: One pie chart for category sales */}
      {user?.role === "manager" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value}`} />
                  <Legend />
                  <Line type="monotone" dataKey="amount" stroke="#3b82f6" name="Sales Amount" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sales by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {categorySalesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categorySalesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name} $${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categorySalesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">No sales data available</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts for Admin: Two pie charts (category sales and revenue by shop) */}
      {user?.role === "admin" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {categorySalesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categorySalesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name} $${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categorySalesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">No sales data available</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue by Shop</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueByShop.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={revenueByShop}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name} $${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {revenueByShop.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transactions Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#10b981" name="Transactions" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
