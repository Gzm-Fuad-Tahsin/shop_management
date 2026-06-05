import express from "express"
import { verifyToken } from "../middleware/auth.js"
import { createSale, getSales, getSalesRange, updateSale } from "../controllers/sales.controller.js"

const router = express.Router()

router.get("/", verifyToken, getSales)
router.get("/range", verifyToken, getSalesRange)
router.post("/", verifyToken, createSale)
router.put("/:id", verifyToken, updateSale)

export default router
