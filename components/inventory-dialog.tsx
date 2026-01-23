"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiCall } from "@/lib/api";
import { Loader2, Search } from "lucide-react";

interface InventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Product {
  _id: string;
  name: string;
  sku: string;
}

export function InventoryDialog({
  open,
  onOpenChange,
  onSuccess,
}: InventoryDialogProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  const [formData, setFormData] = useState({
    product: "",
    quantity: 0,
    reorderLevel: 10,
    reorderQuantity: 50,
    warehouse: "Main",
    lastRestockDate: "",
    lastRestockQuantity: 0,
    expiryDate: "",
    batchNumber: "",
  });

  const filteredProducts = products.filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.sku.toLowerCase().includes(term)
    );
  });

  // Debounced search effect (only when dialog open)
  useEffect(() => {
    if (!open) return;

    const timeout = setTimeout(() => {
      fetchProducts(searchTerm);
    }, 300);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, searchTerm]);

  // Initial load when dialog opens
  useEffect(() => {
    if (!open) return;
    fetchProducts("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const fetchProducts = async (search?: string) => {
    try {
      setIsLoadingProducts(true);
      const query = search ? `?search=${encodeURIComponent(search)}` : "";
      const response = await apiCall(`/api/products${query}`);
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : data.products || []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product) return alert("Please select a product");

    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        quantity: Number(formData.quantity),
        reorderLevel: Number(formData.reorderLevel),
        reorderQuantity: Number(formData.reorderQuantity),
        lastRestockQuantity: Number(formData.lastRestockQuantity),
        lastRestockDate: formData.lastRestockDate
          ? new Date(formData.lastRestockDate).toISOString()
          : undefined,
        expiryDate: formData.expiryDate
          ? new Date(formData.expiryDate).toISOString()
          : undefined,
      };

      await apiCall("/api/inventory", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error(error);
      alert("Failed to add inventory item");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      product: "",
      quantity: 0,
      reorderLevel: 10,
      reorderQuantity: 50,
      warehouse: "Main",
      lastRestockDate: "",
      lastRestockQuantity: 0,
      expiryDate: "",
      batchNumber: "",
    });
    setSearchTerm("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Inventory</DialogTitle>
          <DialogDescription>
            Link a product to a warehouse and set stock levels.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* Product Selection Group */}
          <div className="space-y-2 p-4 border rounded-lg bg-slate-50/50">
            <Label className="text-sm font-bold">Product Selection *</Label>

            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Product List Below Search */}
            {searchTerm && (
              <div className="border rounded-md p-2 max-h-64 overflow-y-auto bg-slate-50 dark:bg-slate-900/50">
                {isLoadingProducts ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : filteredProducts.length > 0 ? (
                  <div className="space-y-1">
                    {filteredProducts.map((p) => (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, product: p._id }))
                          setSearchTerm("")
                        }}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm"
                      >
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">SKU: {p.sku}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center text-sm text-muted-foreground">
                    No products found
                  </div>
                )}
              </div>
            )}

            {/* Selected Product Display */}
            {formData.product && !searchTerm && (
              <div className="border rounded-md p-3 bg-blue-50 dark:bg-blue-900/20 text-sm">
                <span className="font-medium">Selected: </span>
                {products.find((p) => p._id === formData.product)?.name || "Loading..."}
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, product: "" }))}
                  className="ml-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Change
                </button>
              </div>
            )}
          </div>

          {/* Grid Layout for details */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Current Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    quantity: Number(e.target.value),
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warehouse">Warehouse</Label>
              <Input
                id="warehouse"
                value={formData.warehouse}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, warehouse: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorderLevel">Reorder Level</Label>
              <Input
                id="reorderLevel"
                type="number"
                value={formData.reorderLevel}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    reorderLevel: Number(e.target.value),
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorderQuantity">Reorder Quantity</Label>
              <Input
                id="reorderQuantity"
                type="number"
                value={formData.reorderQuantity}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    reorderQuantity: Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          <hr />

          {/* Batch + Expiry */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <div className="space-y-2">
              <Label htmlFor="batchNumber">Batch Number</Label>
              <Input
                id="batchNumber"
                placeholder="e.g. BATCH-001"
                value={formData.batchNumber}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, batchNumber: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, expiryDate: e.target.value }))
                }
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !formData.product}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Saving..." : "Add to Inventory"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
