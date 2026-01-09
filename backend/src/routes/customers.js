import express from "express"
import Customer from "../models/Customer.js"
import User from "../models/User.js"
import { verifyToken } from "../middleware/auth.js"

const router = express.Router()

// Get all customers (for current shop)
router.get("/", verifyToken, async (req, res) => {
  try {
    const { search, type } = req.query
    const user = await User.findById(req.user.id).select("shop role")

    const query = { isActive: true }

    // Filter by shop
    if (user.role !== "admin") {
      query.shop = user.shop
    }

    if (search) {
      query.$or = [
        { name: new RegExp(search, "i") },
        { phone: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
      ]
    }

    if (type) {
      query.customerType = type
    }

    const customers = await Customer.find(query)
      .populate("shop", "name")
      .sort({ createdAt: -1 })

    res.json(customers)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get customer by ID
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("shop role")
    const customer = await Customer.findById(req.params.id).populate("shop", "name")

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" })
    }

    // Check access
    if (user.role !== "admin" && customer.shop.toString() !== user.shop?.toString()) {
      return res.status(403).json({ message: "Access denied" })
    }

    res.json(customer)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Create or get customer (for POS)
router.post("/quick", verifyToken, async (req, res) => {
  try {
    const { name, phone, email } = req.body
    const user = await User.findById(req.user.id).select("shop")

    if (!user.shop) {
      return res.status(400).json({ message: "You must be assigned to a shop" })
    }

    // Try to find existing customer by phone or email in this shop
    if (phone) {
      const existing = await Customer.findOne({ shop: user.shop, phone })
      if (existing) {
        return res.json(existing)
      }
    }

    // Create new customer
    const customer = new Customer({
      shop: user.shop,
      name: name || "Walk-in Customer",
      phone,
      email,
      customerType: "retail",
    })

    await customer.save()
    res.status(201).json(customer)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Create customer
router.post("/", verifyToken, async (req, res) => {
  try {
    const { name, phone, email, address, city, customerType, notes } = req.body
    const user = await User.findById(req.user.id).select("shop")

    if (!user.shop) {
      return res.status(400).json({ message: "You must be assigned to a shop" })
    }

    if (!name) {
      return res.status(400).json({ message: "Customer name is required" })
    }

    const customer = new Customer({
      shop: user.shop,
      name,
      phone,
      email,
      address,
      city,
      customerType,
      notes,
    })

    await customer.save()
    await customer.populate("shop", "name")
    res.status(201).json(customer)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})


// Update customer
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true })

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" })
    }

    res.json(customer)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
