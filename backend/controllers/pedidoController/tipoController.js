const Tipo = require("../../models/pedido/tipoModel")   

// Get all tipos
exports.getAllTipos = async (req, res) => {
  try {
    const tipos = await Tipo.find()
    res.status(200).json(tipos)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get a single tipo by ID
exports.getTipoById = async (req, res) => {
  try {
    const tipo = await Tipo.findById(req.params.id)
    if (!tipo) {
      return res.status(404).json({ message: "Tipo not found" })
    }
    res.status(200).json(tipo)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Create a new tipo
exports.createTipo = async (req, res) => {
  try {
    const tipo = new Tipo(req.body)
    const newTipo = await tipo.save()
    res.status(201).json(newTipo)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Update a tipo
exports.updateTipo = async (req, res) => {
  try {
    const tipo = await Tipo.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!tipo) {
      return res.status(404).json({ message: "Tipo not found" })
    }
    res.status(200).json(tipo)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Delete a tipo
exports.deleteTipo = async (req, res) => {
  try {
    // Check if the tipo is being used by any pedidos
    const Pedido = require("../../models/pedido/Pedido")
    const pedidosUsingTipo = await Pedido.countDocuments({ tipo: req.params.id })

    if (pedidosUsingTipo > 0) {
      return res.status(400).json({
        error: "Cannot delete this tipo because it is being used by pedidos",
        count: pedidosUsingTipo,
      })
    }

    const tipo = await Tipo.findByIdAndDelete(req.params.id)
    if (!tipo) {
      return res.status(404).json({ message: "Tipo not found" })
    }
    res.status(200).json({ message: "Tipo deleted successfully" })
  } catch (error) {
    console.error("Error deleting tipo:", error)
    res.status(500).json({ message: "Error deleting tipo", error: error.message })
  }
}

