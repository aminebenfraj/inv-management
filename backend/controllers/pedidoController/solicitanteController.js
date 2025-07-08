const Solicitante = require("../../models/pedido/solicitanteModel")

// Get all solicitantes
exports.getAllSolicitantes = async (req, res) => {
  try {
    const solicitantes = await Solicitante.find()
    res.status(200).json(solicitantes)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get a single solicitante by ID
exports.getSolicitanteById = async (req, res) => {
  try {
    const solicitante = await Solicitante.findById(req.params.id)
    if (!solicitante) {
      return res.status(404).json({ message: "Solicitante not found" })
    }
    res.status(200).json(solicitante)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Create a new solicitante
exports.createSolicitante = async (req, res) => {
  try {
    const solicitante = new Solicitante(req.body)
    const newSolicitante = await solicitante.save()
    res.status(201).json(newSolicitante)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Update a solicitante
exports.updateSolicitante = async (req, res) => {
  try {
    const solicitante = await Solicitante.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!solicitante) {
      return res.status(404).json({ message: "Solicitante not found" })
    }
    res.status(200).json(solicitante)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Delete a solicitante
exports.deleteSolicitante = async (req, res) => {
  try {
    // Check if the solicitante is being used by any pedidos
    const Pedido = require("../../models/pedido/Pedido")
    const pedidosUsingSolicitante = await Pedido.countDocuments({ solicitante: req.params.id })

    if (pedidosUsingSolicitante > 0) {
      return res.status(400).json({
        error: "Cannot delete this solicitante because it is being used by pedidos",
        count: pedidosUsingSolicitante,
      })
    }

    const solicitante = await Solicitante.findByIdAndDelete(req.params.id)
    if (!solicitante) {
      return res.status(404).json({ message: "Solicitante not found" })
    }
    res.status(200).json({ message: "Solicitante deleted successfully" })
  } catch (error) {
    console.error("Error deleting solicitante:", error)
    res.status(500).json({ message: "Error deleting solicitante", error: error.message })
  }
}
