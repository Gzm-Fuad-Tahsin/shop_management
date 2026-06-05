import express from "express"
import { verifyToken, authorizeRole } from "../middleware/auth.js"
import { login, register } from "../controllers/auth.controller.js"
import { approveUser, getPendingUsers, rejectUser } from "../controllers/auth.admin.controller.js"

const router = express.Router()

router.post("/register", register)
router.post("/login", login)
router.get("/pending-users", verifyToken, authorizeRole(["admin"]), getPendingUsers)
router.post("/approve-user/:userId", verifyToken, authorizeRole(["admin"]), approveUser)
router.post("/reject-user/:userId", verifyToken, authorizeRole(["admin"]), rejectUser)

export default router
