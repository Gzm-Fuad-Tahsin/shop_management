import express from "express"
import { verifyToken, authorizeRole } from "../middleware/auth.js"
import { getUserById, getUsers, updateUser } from "../controllers/users.controller.js"

const router = express.Router()

router.get("/", verifyToken, authorizeRole(["admin"]), getUsers)
router.get("/:id", verifyToken, getUserById)
router.put("/:id", verifyToken, updateUser)

export default router
