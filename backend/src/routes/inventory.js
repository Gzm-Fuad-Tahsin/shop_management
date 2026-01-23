import express from "express"
import Inventory from "../models/Inventory.js"
import User from "../models/User.js"
import Product from "../models/Product.js"
import { verifyToken, authorizeRole } from "../middleware/auth.js"

const router = express.Router()

// Get all inventory (for current shop)
router.get("/", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("shop role")
    
    const query = {}
    if (user.role !== "admin") {
      query.shop = user.shop
    }

    const inventory = await Inventory.find(query)
      .populate("product")
      .populate("shop", "name")

    res.json(inventory)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get inventory by product
router.get("/product/:productId", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("shop role")
    const product = await Product.findById(req.params.productId)

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    // Check access
    if (user.role !== "admin" && product.shop.toString() !== user.shop?.toString()) {
      return res.status(403).json({ message: "Access denied" })
    }

    const inventory = await Inventory.findOne({ product: req.params.productId })
      .populate("product")
      .populate("shop", "name")

    res.json(inventory)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Update inventory
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id)
    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found" })
    }

    const user = await User.findById(req.user.id).select("shop role")
    if (user.role !== "admin" && inventory.shop.toString() !== user.shop?.toString()) {
      return res.status(403).json({ message: "Access denied" })
    }

    const updated = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("product")
      .populate("shop", "name")

    res.json(updated)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Create inventory entry
router.post("/", verifyToken, authorizeRole(["admin", "manager"]), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("shop role")
    if (!user.shop && user.role !== "admin") {
      return res.status(400).json({ message: "You must be assigned to a shop first" })
    }

    const shopId = user.role === "admin" ? req.body.shop : user.shop
    if (!shopId) {
      return res.status(400).json({ message: "Shop is required" })
    }

    // Verify product belongs to the shop
    const product = await Product.findById(req.body.product)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }
    if (product.shop.toString() !== shopId.toString()) {
      return res.status(403).json({ message: "Product does not belong to your shop" })
    }

    // Check if inventory already exists for this product in this shop
    const existing = await Inventory.findOne({ shop: shopId, product: req.body.product })
    if (existing) {
      const count = existing.quantity + req.body.quantity
      existing.quantity = count
      await existing.save()
      await existing.populate(["product", "shop"])
      return res.status(200).json(existing)
    }

    const inventory = new Inventory({
      ...req.body,
      shop: shopId,
    })

    await inventory.save()
    await inventory.populate(["product", "shop"])

    res.status(201).json(inventory)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
})

export default router
