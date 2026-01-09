import express from "express"
import Shop from "../models/Shop.js"
import User from "../models/User.js"
import { verifyToken, authorizeRole } from "../middleware/auth.js"

const router = express.Router()

// Create a new shop (by manager)
router.post("/", verifyToken, authorizeRole(["manager"]), async (req, res) => {
  try {
    const { name, address, city, state, postalCode, phone, email, taxId, currency, taxRate } = req.body

    if (!name) {
      return res.status(400).json({ message: "Shop name is required" })
    }

    const shop = new Shop({
      name,
      address,
      city,
      state,
      postalCode,
      phone,
      email,
      owner: req.user.id,
      taxId,
      currency: currency || "USD",
      taxRate: taxRate || 0,
    })

    await shop.save()

    // Update user with shop
    await User.findByIdAndUpdate(req.user.id, { shop: shop._id })

    res.status(201).json({
      message: "Shop created successfully",
      shop,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get shop details (for authenticated users)
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id).populate("owner", "name email")

    if (!shop) {
      return res.status(404).json({ message: "Shop not found" })
    }

    // Check if user has access to this shop
    const user = await User.findById(req.user.id)
    if (user.role !== "admin" && user.shop?.toString() !== shop._id.toString()) {
      return res.status(403).json({ message: "Access denied" })
    }

    res.json(shop)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get all shops (admin only)
router.get("/", verifyToken, authorizeRole(["admin"]), async (req, res) => {
  try {
    const shops = await Shop.find().populate("owner", "name email approvalStatus")

    res.json(shops)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Update shop (owner/admin only)
router.patch("/:id", verifyToken, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id)

    if (!shop) {
      return res.status(404).json({ message: "Shop not found" })
    }

    // Check authorization
    const user = await User.findById(req.user.id)
    if (user.role !== "admin" && shop.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" })
    }

    const { name, address, city, state, postalCode, phone, email, taxId, currency, taxRate, isActive } = req.body

    if (name) shop.name = name
    if (address) shop.address = address
    if (city) shop.city = city
    if (state) shop.state = state
    if (postalCode) shop.postalCode = postalCode
    if (phone) shop.phone = phone
    if (email) shop.email = email
    if (taxId) shop.taxId = taxId
    if (currency) shop.currency = currency
    if (taxRate !== undefined) shop.taxRate = taxRate
    if (isActive !== undefined) shop.isActive = isActive

    await shop.save()

    res.json({ message: "Shop updated successfully", shop })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get manager's shop
router.get("/my-shop", verifyToken, authorizeRole(["manager"]), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("shop")

    if (!user.shop) {
      return res.status(404).json({ message: "No shop found for this manager" })
    }

    res.json(user.shop)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
