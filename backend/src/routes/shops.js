import express from "express"
import { verifyToken, authorizeRole } from "../middleware/auth.js"
import { createShop, getMyShop, getShopById, getShops, updateShop } from "../controllers/shops.controller.js"

const router = express.Router()

router.post("/", verifyToken, authorizeRole(["manager"]), createShop)
router.get("/my-shop", verifyToken, authorizeRole(["manager"]), getMyShop)
router.get("/:id", verifyToken, getShopById)
router.get("/", verifyToken, authorizeRole(["admin"]), getShops)
router.patch("/:id", verifyToken, updateShop)

export default router
