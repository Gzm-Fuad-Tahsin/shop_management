
import express from "express"
import Product from "../models/Product.js"
import User from "../models/User.js"
import { verifyToken, authorizeRole } from "../middleware/auth.js"

const router = express.Router()

// Get all products with pagination (for current user's shop)
router.get("/", verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, search, category } = req.query
    const skip = (page - 1) * limit

    // Get user's shop
    const user = await User.findById(req.user.id).select("shop role")
    if (!user.shop && user.role !== "admin") {
      return res.status(403).json({ message: "You don't have a shop assigned" })
    }

    const query = { isActive: true }
    
    // Filter by shop (admin can see all, others see only their shop)
    if (user.role !== "admin") {
      query.shop = user.shop
    }

    if (search) {
      query.$or = [{ name: new RegExp(search, "i") }, { sku: new RegExp(search, "i") }, { barcode: search }]
    }
    if (category) {
      query.category = category
    }

    const products = await Product.find(query)
      .populate("category")
      .populate("shop", "name")
      .populate("createdBy", "name email")
      .skip(skip)
      .limit(limit)

    const total = await Product.countDocuments(query)

    res.json({ products, total, page, pages: Math.ceil(total / limit) })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get product by barcode (for POS)
router.get("/barcode/:barcode", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("shop role")
    
    const query = { barcode: req.params.barcode, isActive: true }
    if (user.role !== "admin") {
      query.shop = user.shop
    }

    const product = await Product.findOne(query)
      .populate("category", "name")
      .populate("shop", "name")

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    res.json(product)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get product by ID
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("shop role")
    
    const product = await Product.findById(req.params.id)
      .populate("category")
      .populate("shop", "name")
      .populate("createdBy", "name email")

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    // Check access
    if (user.role !== "admin" && product.shop.toString() !== user.shop?.toString()) {
      return res.status(403).json({ message: "Access denied" })
    }

    res.json(product)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Create product (admin/manager only)
router.post("/", verifyToken, authorizeRole(["admin", "manager"]), async (req, res) => {
  try {
    const {
      name,
      sku,
      barcode,
      description,
      category,
      supplier,
      costPrice,
      retailPrice,
      wholesalePrice,
      color,
      specifications,
      warranty,
      weight,
      dimensions,
      images,
      manufacturer,
      unit,
      batchTrackingEnabled,
      expiryTrackingEnabled,
      minStock,
      maxStock,
    } = req.body

    // Validate required fields
    if (!name || !sku || !category || !costPrice || !retailPrice) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    // Get user's shop
    const user = await User.findById(req.user.id).select("shop role")
    if (!user.shop && user.role !== "admin") {
      return res.status(400).json({ message: "You must be assigned to a shop first" })
    }

    const shopId = user.role === "admin" ? req.body.shop : user.shop
    if (!shopId) {
      return res.status(400).json({ message: "Shop is required" })
    }

    // Check if SKU already exists within this shop
    if (await Product.findOne({ shop: shopId, sku })) {
      return res.status(409).json({ message: "SKU already exists for this shop" })
    }
    if (barcode && (await Product.findOne({ shop: shopId, barcode }))) {
      return res.status(409).json({ message: "Barcode already exists for this shop" })
    }

    const product = new Product({
      shop: shopId,
      name,
      sku,
      barcode,
      description,
      category,
      supplier,
      costPrice,
      retailPrice,
      wholesalePrice,
      color,
      specifications,
      weight,
      dimensions,
      images,
      manufacturer,
      unit,
      batchTrackingEnabled,
      expiryTrackingEnabled,
      minStock,
      maxStock,
      createdBy: req.user.id,
    })

    await product.save()
    await product.populate(["category", "createdBy", "shop"])

    res.status(201).json(product)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Update product
router.put("/:id", verifyToken, authorizeRole(["admin", "manager"]), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate(
      "supplier category createdBy",
    )

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    res.json(product)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Delete product (soft delete)
router.delete("/:id", verifyToken, authorizeRole(["admin", "manager"]), async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false })
    res.json({ message: "Product deleted" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
