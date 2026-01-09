import express from "express"
import Category from "../models/Category.js"
import User from "../models/User.js"
import { verifyToken, authorizeRole } from "../middleware/auth.js"

const router = express.Router()

// Get all categories (for current shop)
router.get("/", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("shop role")

    const query = { isActive: true }

    // // Filter by shop
    // if (user.role !== "admin") {
    //   query.shop = user.shop
    // }

    const categories = await Category.find(query)
      .populate("parent")
      .populate("shop", "name")

    res.json(categories)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Create category
router.post("/", verifyToken, authorizeRole(["admin", "manager"]), async (req, res) => {
  try {
    const { name, description, parent } = req.body
    const user = await User.findById(req.user.id).select("shop role")

    if (!user.shop && user.role !== "admin") {
      return res.status(400).json({ message: "You must be assigned to a shop" })
    }

    const shopId = user.role === "admin" ? req.body.shop : user.shop
    if (!shopId) {
      return res.status(400).json({ message: "Shop is required" })
    }

    if (!name) {
      return res.status(400).json({ message: "Category name is required" })
    }

    // Check if category already exists in this shop
    if (await Category.findOne({ shop: shopId, name })) {
      return res.status(409).json({ message: "Category already exists for this shop" })
    }

    const category = new Category({
      shop: shopId,
      name,
      description,
      parent,
    })

    await category.save()
    await category.populate(["parent", "shop"])
    res.status(201).json(category)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Update category
router.put("/:id", verifyToken, authorizeRole(["admin", "manager"]), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("shop role")
    const category = await Category.findById(req.params.id)

    if (!category) {
      return res.status(404).json({ message: "Category not found" })
    }

    // Check access
    if (user.role !== "admin" && category.shop.toString() !== user.shop?.toString()) {
      return res.status(403).json({ message: "Access denied" })
    }

    const updated = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate(["parent", "shop"])

    res.json(updated)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
