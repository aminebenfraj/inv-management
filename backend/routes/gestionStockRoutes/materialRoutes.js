express = require("express")
const {
  createMaterial,
  getAllMaterials,
  getMaterialById,
  updateMaterial,
  deleteMaterial,
  getFilterOptions,
  removeReferenceFromHistory,
  getMaterialsByFactoryId,
  getMaterialsByMachineId,
} = require("../../controllers/gestionStockControllers/materialController")

const router = express.Router()

// CRUD routes
router.post("/", createMaterial)
router.get("/", getAllMaterials)
router.get("/filters/:field", getFilterOptions)
router.get("/:id", getMaterialById)
router.put("/:id", updateMaterial)
router.delete("/:id", deleteMaterial)
router.delete("/:materialId/reference-history/:historyId", removeReferenceFromHistory)
router.get("/machine/:machineId", getMaterialsByMachineId);
router.get("/factory/:factoryId", getMaterialsByFactoryId)

module.exports = router
