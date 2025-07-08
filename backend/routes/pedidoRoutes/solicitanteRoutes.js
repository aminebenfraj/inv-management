const express = require("express")
const router = express.Router()
const { getAllSolicitantes, getSolicitanteById, createSolicitante, updateSolicitante, deleteSolicitante } = require("../../controllers/pedidoController/solicitanteController")

// GET all solicitantes
router.get("/", getAllSolicitantes)

// GET a single solicitante by ID
router.get("/:id", getSolicitanteById)

// POST a new solicitante
router.post("/", createSolicitante)

// PUT (update) a solicitante
router.put("/:id", updateSolicitante)

// DELETE a solicitante
router.delete("/:id", deleteSolicitante)

module.exports = router

