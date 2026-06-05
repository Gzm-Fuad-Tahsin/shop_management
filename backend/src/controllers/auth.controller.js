import jwt from "jsonwebtoken"
import User from "../models/User.js"

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" })
    }

    const user = new User({
      name,
      email,
      password,
      role: role || "staff",
      approvalStatus: role === "manager" ? "pending" : "pending",
    })

    await user.save()

    res.status(201).json({
      message: "Registration successful. Please wait for admin approval to login.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        approvalStatus: user.approvalStatus,
      },
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }

    const user = await User.findOne({ email }).populate("shop")
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    if (user.approvalStatus !== "approved") {
      return res.status(403).json({
        message: `Your account is ${user.approvalStatus}. Please wait for admin approval.`,
        approvalStatus: user.approvalStatus,
      })
    }

    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    user.lastLogin = new Date()
    await user.save()

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, shopId: user.shop?._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE },
    )

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        approvalStatus: user.approvalStatus,
        shop: user.shop,
      },
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
