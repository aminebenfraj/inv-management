const express = require("express")
const router = express.Router()
const { getAllTableStatuses, getTableStatusById, createTableStatus, updateTableStatus, reorderTableStatuses, deleteTableStatus } = require("../../controllers/pedidoController/tableStatusController")

// GET all table statuses
router.get("/", getAllTableStatuses)

// GET a single table status by ID
router.get("/:id", getTableStatusById)

// POST a new table status
router.post("/", createTableStatus)

// PUT (update) a table status
router.put("/:id", updateTableStatus)

// DELETE a table status
router.delete("/:id", deleteTableStatus)

// POST to reorder table statuses
router.post("/reorder", reorderTableStatuses)

module.exports = router

