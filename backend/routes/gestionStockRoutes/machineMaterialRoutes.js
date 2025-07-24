const express = require("express")
const {
  allocateStock,
  getAllAllocations,
  getMaterialAllocations,
  getMachineStockHistory,
  updateAllocation,
  deleteAllocation,
  getAllocationsByFactory,
} = require("../../controllers/gestionStockControllers/materialMachineController")
const router = express.Router()

router.post("/", allocateStock)
router.get("/allocates", getAllAllocations)
router.get("/material/:materialId", getMaterialAllocations)
router.get("/machine/:machineId/history", getMachineStockHistory)
router.put("/:id", updateAllocation)
router.delete("/:id", deleteAllocation)
// Add the missing factory route
router.get("/factory/:factoryId", getAllocationsByFactory)

module.exports = router
