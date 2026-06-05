import express from "express"
import { verifyToken } from "../middleware/auth.js"
import {
  createCustomer,
  getCustomerById,
  getCustomers,
  quickCreateCustomer,
  updateCustomer,
} from "../controllers/customers.controller.js"

const router = express.Router()

router.get("/", verifyToken, getCustomers)
router.get("/:id", verifyToken, getCustomerById)
router.post("/quick", verifyToken, quickCreateCustomer)
router.post("/", verifyToken, createCustomer)
router.put("/:id", verifyToken, updateCustomer)

export default router
