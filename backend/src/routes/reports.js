import express from "express"
import { verifyToken } from "../middleware/auth.js"
import { getMonthlyReport } from "../controllers/reports.controller.js"

const router = express.Router()

router.get("/monthly", verifyToken, getMonthlyReport)

export default router
