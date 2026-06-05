import User from "../models/User.js"

export const getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await User.find({ approvalStatus: "pending" }).select("-password").sort({ createdAt: -1 })
    res.json(pendingUsers)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
    if (!user) return res.status(404).json({ message: "User not found" })
    user.approvalStatus = "approved"
    user.approvedBy = req.user.id
    user.approvalDate = new Date()
    await user.save()
    res.json({ message: "User approved successfully", user })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const rejectUser = async (req, res) => {
  try {
    const { reason } = req.body
    const user = await User.findById(req.params.userId)
    if (!user) return res.status(404).json({ message: "User not found" })
    user.approvalStatus = "rejected"
    user.approvedBy = req.user.id
    user.rejectionReason = reason
    user.approvalDate = new Date()
    await user.save()
    res.json({ message: "User rejected", user })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
