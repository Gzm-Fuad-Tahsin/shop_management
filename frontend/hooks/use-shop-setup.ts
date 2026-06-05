import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { apiCall } from "@/lib/api"

export function useShopSetup() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [shop, setShop] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showShopDialog, setShowShopDialog] = useState(false)

  useEffect(() => {
    const checkShopSetup = async () => {
      try {
        const userStr = localStorage.getItem("user")
        if (!userStr) {
          router.push("/auth/login")
          return
        }

        const userData = JSON.parse(userStr)
        setUser(userData)

        // If user is a manager and has no shop, show shop creation dialog
        if (userData.role === "manager" && !userData.shop) {
          setShowShopDialog(true)
        } else if (userData.shop) {
          setShop(userData.shop)
        }
      } catch (error) {
        console.error("Failed to check shop setup:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkShopSetup()
  }, [router])

  const handleShopCreated = async () => {
    try {
      // Refresh user data with the new shop
      const token = localStorage.getItem("token")
      const response = await apiCall("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const updatedUser = await response.json()
      localStorage.setItem("user", JSON.stringify(updatedUser))
      setUser(updatedUser)
      setShop(updatedUser.shop)
      setShowShopDialog(false)
    } catch (error) {
      console.error("Failed to refresh user data:", error)
    }
  }

  return {
    user,
    shop,
    isLoading,
    showShopDialog,
    setShowShopDialog,
    handleShopCreated,
  }
}
