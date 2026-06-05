import Product from "../models/Product.js"
import User from "../models/User.js"

export const getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 50, search, category, shopId } = req.query
    const skip = (page - 1) * limit

    const user = await User.findById(req.user.id).select("shop role")
    if (!user.shop && user.role !== "admin") {
      return res.status(403).json({ message: "You don't have a shop assigned" })
    }

    const query = { isActive: true }

    if (user.role !== "admin") {
      query.shop = user.shop
    } else if (shopId) {
      query.shop = shopId
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
}

export const getProductByBarcode = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("shop role")

    const query = { barcode: req.params.barcode, isActive: true }
    if (user.role !== "admin") {
      query.shop = user.shop
    }

    const product = await Product.findOne(query).populate("category", "name").populate("shop", "name")

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    res.json(product)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getProductById = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("shop role")

    const product = await Product.findById(req.params.id)
      .populate("category")
      .populate("shop", "name")
      .populate("createdBy", "name email")

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    if (user.role !== "admin" && product.shop.toString() !== user.shop?.toString()) {
      return res.status(403).json({ message: "Access denied" })
    }

    res.json(product)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const createProduct = async (req, res) => {
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

    if (!name || !sku || !category || !costPrice || !retailPrice) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    const user = await User.findById(req.user.id).select("shop role")
    if (!user.shop && user.role !== "admin") {
      return res.status(400).json({ message: "You must be assigned to a shop first" })
    }

    const shopId = user.role === "admin" ? req.body.shop : user.shop
    if (!shopId) {
      return res.status(400).json({ message: "Shop is required" })
    }

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
}

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate(
      "category createdBy",
    )

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    res.json(product)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false })
    res.json({ message: "Product deleted" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
