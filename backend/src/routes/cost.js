import express from "express"
import { verifyToken } from "../middleware/auth.js"
import { createCostToday, getCostToday, getCosts, updateCost } from "../controllers/cost.controller.js"

const router = express.Router()

router.post("/today", verifyToken, createCostToday)
router.get("/today", verifyToken, getCostToday)
router.get("/", verifyToken, getCosts)
router.put("/:id", verifyToken, updateCost)

export default router
