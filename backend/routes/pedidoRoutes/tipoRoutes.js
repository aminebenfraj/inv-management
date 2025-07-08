const express = require("express")
const { getAllTipos, getTipoById, createTipo, updateTipo, deleteTipo } = require("../../controllers/pedidoController/tipoController")
const router = express.Router()

// GET all tipos
router.get("/", getAllTipos)

// GET a single tipo by ID
router.get("/:id", getTipoById)

// POST a new tipo
router.post("/", createTipo)

// PUT (update) a tipo
router.put("/:id", updateTipo)

// DELETE a tipo
router.delete("/:id", deleteTipo)

module.exports = router

