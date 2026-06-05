import express from "express"
import { verifyToken, authorizeRole } from "../middleware/auth.js"
import { getCategorySales, getDashboardStats, getRevenueByShop, getShopWiseStats } from "../controllers/dashboard.controller.js"

const router = express.Router()

router.get("/stats", verifyToken, getDashboardStats)
router.get("/shop-wise", verifyToken, authorizeRole(["admin"]), getShopWiseStats)
router.get("/category-sales", verifyToken, getCategorySales)
router.get("/revenue-by-shop", verifyToken, authorizeRole(["admin"]), getRevenueByShop)

export default router
