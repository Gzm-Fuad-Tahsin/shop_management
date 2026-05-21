"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, Search, Plus } from "lucide-react"
import { apiCall } from "@/lib/api"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InventoryDialog } from "@/components/inventory-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/use-auth"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface InventoryItem {
  _id: string
  product: {
    _id: string
    name: string
    sku: string
  }
  quantity: number
  reorderLevel: number
  reorderQuantity?: number
  warehouse: string
  batchNumber?: string
  expiryDate?: string
  shop?: { _id: string; name: string }
}

interface Shop {
  _id: string
  name: string
}

export default function InventoryPage() {
  const { user } = useAuth()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [shops, setShops] = useState<Shop[]>([])
  const [selectedShop, setSelectedShop] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [editData, setEditData] = useState({ quantity: 0, reorderLevel: 0, reorderQuantity: 0, warehouse: "", batchNumber: "", expiryDate: "" })

  useEffect(() => {
    if (user?.role === "admin") fetchShops()
  }, [user?.role])

  useEffect(() => {
    fetchInventory()
  }, [selectedShop, user?.role])

  const fetchShops = async () => {
    const response = await apiCall("/api/shops")
    const data = await response.json()
    setShops(data || [])
  }

  const fetchInventory = async () => {
    try {
      setError("")
      setIsLoading(true)
      const query = user?.role === "admin" && selectedShop !== "all" ? `?shopId=${selectedShop}` : ""
      const response = await apiCall(`/api/inventory${query}`)
      const data = await response.json()
      const items = Array.isArray(data) ? data : Array.isArray(data?.inventory) ? data.inventory : []
      setInventory(
        user?.role === "admin" && selectedShop !== "all"
          ? items.filter((item: InventoryItem) => item.shop?._id === selectedShop)
          : items,
      )
    } catch (error) {
      console.error("Failed to fetch inventory:", error)
      setError("Failed to load inventory")
      setInventory([])
    } finally {
      setIsLoading(false)
    }
  }

  const openItemModal = (item: InventoryItem) => {
    setSelectedItem(item)
    setEditData({
      quantity: item.quantity,
      reorderLevel: item.reorderLevel,
      reorderQuantity: item.reorderQuantity || 0,
      warehouse: item.warehouse || "",
      batchNumber: item.batchNumber || "",
      expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().slice(0, 10) : "",
    })
  }

  const handleSaveInventory = async () => {
    if (!selectedItem) return
    setIsSaving(true)
    try {
      const payload = {
        quantity: Number(editData.quantity),
        reorderLevel: Number(editData.reorderLevel),
        reorderQuantity: Number(editData.reorderQuantity),
        warehouse: editData.warehouse,
        batchNumber: editData.batchNumber,
        expiryDate: editData.expiryDate ? new Date(editData.expiryDate).toISOString() : null,
      }
      const response = await apiCall(`/api/inventory/${selectedItem._id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to update inventory")
      }
      setSelectedItem(null)
      fetchInventory()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update inventory")
    } finally {
      setIsSaving(false)
    }
  }

  const lowStockItems = inventory.filter((item) => item.quantity <= item.reorderLevel)

  const filteredInventory = inventory.filter(
    (item) =>
      item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.sku.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory</h1>
          <p className="text-muted-foreground mt-1">Track your stock levels</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Inventory
        </Button>
      </div>

      {lowStockItems.length > 0 && (
        <Alert className="mb-6 border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            You have {lowStockItems.length} items below reorder level
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 flex-wrap">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[220px]"
            />
            {user?.role === "admin" && (
              <Select value={selectedShop} onValueChange={setSelectedShop}>
                <SelectTrigger className="w-[220px]"><SelectValue placeholder="Filter by shop" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Shops</SelectItem>
                  {shops.map((shop) => (
                    <SelectItem key={shop._id} value={shop._id}>{shop.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading inventory...</p>
          ) : error ? (
            <p className="text-destructive">{error}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  {user?.role === "admin" && <TableHead>Shop</TableHead>}
                  <TableHead>SKU</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Reorder Level</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => {
                  const isLowStock = item.quantity <= item.reorderLevel
                  return (
                    <TableRow
                      key={item._id}
                      className={`${isLowStock ? "bg-red-50 dark:bg-red-900/20" : ""} cursor-pointer`}
                      onClick={() => openItemModal(item)}
                    >
                      <TableCell className="font-medium">{item.product.name}</TableCell>
                      {user?.role === "admin" && <TableCell>{item.shop?.name || "-"}</TableCell>}
                      <TableCell>{item.product.sku}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.reorderLevel}</TableCell>
                      <TableCell>{item.warehouse}</TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            isLowStock
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
                              : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                          }`}
                        >
                          {isLowStock ? "Low Stock" : "In Stock"}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inventory Details</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-3">
              <div className="text-sm font-medium">{selectedItem.product.name} ({selectedItem.product.sku})</div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" value={editData.quantity} onChange={(e) => setEditData((p) => ({ ...p, quantity: Number(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <Label>Reorder Level</Label>
                <Input type="number" value={editData.reorderLevel} onChange={(e) => setEditData((p) => ({ ...p, reorderLevel: Number(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <Label>Reorder Quantity</Label>
                <Input type="number" value={editData.reorderQuantity} onChange={(e) => setEditData((p) => ({ ...p, reorderQuantity: Number(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <Label>Warehouse</Label>
                <Input value={editData.warehouse} onChange={(e) => setEditData((p) => ({ ...p, warehouse: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Batch Number</Label>
                <Input value={editData.batchNumber} onChange={(e) => setEditData((p) => ({ ...p, batchNumber: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input type="date" value={editData.expiryDate} onChange={(e) => setEditData((p) => ({ ...p, expiryDate: e.target.value }))} />
              </div>
              <Button className="w-full" onClick={handleSaveInventory} disabled={isSaving}>{isSaving ? "Saving..." : "Save Changes"}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <InventoryDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={() => {
          setIsDialogOpen(false)
          fetchInventory()
        }}
      />
    </div>
  )
}
