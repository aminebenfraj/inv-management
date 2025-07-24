const express = require("express")
const router = express.Router()
const {
  createMachine,
  getAllMachines,
  getMachineById,
  updateMachine,
  deleteMachine,
  getMachineByFactoryAndName,
  getMachinesByFactory,
} = require("../../controllers/gestionStockControllers/machineController")

// Create a new machine
router.post("/", createMachine)

// Get all machines (supports factory filter via query parameter)
router.get("/", getAllMachines)

// Get machines by factory ID
router.get("/factory/:factoryId", getMachinesByFactory)

// Get a machine by factory ID and name
router.get("/factory/:factoryId/name/:name", getMachineByFactoryAndName)

// Get a machine by ID
router.get("/:id", getMachineById)

// Update a machine
router.put("/:id", updateMachine)

// Delete a machine
router.delete("/:id", deleteMachine)

module.exports = router
