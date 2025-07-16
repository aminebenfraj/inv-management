const express = require("express")
const router = express.Router()
const {
  createFactory,
  getAllFactories,
  getFactoryById,
  updateFactory,
  deleteFactory,
  addAuthorizedUser,
  removeAuthorizedUser,
  assignMachine,
  removeMachine,
  assignMaterial,
  removeMaterial,
  getUserFactories,
} = require("../../backend/controllers/factoryController")

const { protect, verifyAdmin } = require("../../backend/middlewares/authMiddleware")

// Basic CRUD routes
router.post("/", protect, verifyAdmin, createFactory)
router.get("/", protect, getAllFactories)
router.get("/user-factories", protect, getUserFactories)
router.get("/:id", protect, getFactoryById)
router.put("/:id", protect, verifyAdmin, updateFactory)
router.delete("/:id", protect, verifyAdmin, deleteFactory)

// User management routes
router.post("/:id/authorized-users", protect, verifyAdmin, addAuthorizedUser)
router.delete("/:id/authorized-users/:userId", protect, verifyAdmin, removeAuthorizedUser)

// Machine management routes
router.post("/:id/machines", protect, verifyAdmin, assignMachine)
router.delete("/:id/machines/:machineId", protect, verifyAdmin, removeMachine)

// Material management routes
router.post("/:id/materials", protect, verifyAdmin, assignMaterial)
router.delete("/:id/materials/:materialId", protect, verifyAdmin, removeMaterial)

module.exports = router
