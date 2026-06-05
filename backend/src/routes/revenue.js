import express from "express"
import { verifyToken } from "../middleware/auth.js"
import { addPreviousCash, getTodayRevenue } from "../controllers/revenue.controller.js"

const router = express.Router()

router.get("/today", verifyToken, getTodayRevenue)
router.post("/today/previous-cash", verifyToken, addPreviousCash)

export default router
