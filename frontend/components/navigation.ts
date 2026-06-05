import { BarChart3, LayoutDashboard, Package, ReceiptText, Settings, ShoppingCart, Users, Zap } from "lucide-react"

export type AppRole = "admin" | "manager" | "staff"

export type NavigationItem = {
  href: string
  label: string
  icon: typeof LayoutDashboard
}

export function getNavigationItems(role: AppRole): NavigationItem[] {
  return [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/products", label: "Products", icon: Package },
    { href: "/inventory", label: "Inventory", icon: ShoppingCart },
    { href: "/sales", label: "Sales", icon: ShoppingCart },
    { href: "/pos", label: "POS", icon: Zap },
    { href: "/reports", label: "Reports", icon: BarChart3 },
    ...(role === "admin" || role === "manager"
      ? [{ href: "/costs", label: "Costs", icon: ReceiptText }]
      : []),
    ...(role === "admin"
      ? [
          { href: "/users", label: "User Approvals", icon: Users },
          { href: "/admin", label: "Admin Panel", icon: Settings },
        ]
      : []),
  ]
}
