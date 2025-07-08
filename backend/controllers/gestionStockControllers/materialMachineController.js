const MachineMaterial = require("../../models/gestionStockModels/MachineMaterialModel")
const Material = require("../../models/gestionStockModels/MaterialModel")
const mongoose = require("mongoose")

// Helper function to validate ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id)
}

exports.allocateStock = async (req, res) => {
  try {
    const { materialId, allocations, userId } = req.body

    // Validate material existence
    const material = await Material.findById(materialId)
    if (!material) {
      return res.status(404).json({ error: "Material not found" })
    }

    // Check if enough stock is available
    const totalRequestedStock = allocations.reduce((sum, alloc) => sum + Number.parseInt(alloc.allocatedStock), 0)

    if (totalRequestedStock > material.currentStock) {
      return res.status(400).json({ error: "Total allocated stock exceeds available stock." })
    }

    let totalUsedStock = 0 // Track how much stock has been allocated

    // Validate userId if provided
    let validUserId = null
    if (userId && isValidObjectId(userId)) {
      validUserId = mongoose.Types.ObjectId(userId)
    }

    for (const { machineId, allocatedStock } of allocations) {
      if (allocatedStock <= 0) {
        return res.status(400).json({ error: "Allocated stock must be greater than 0." })
      }

      // Check if there's enough stock remaining to allocate
      if (totalUsedStock + Number.parseInt(allocatedStock) > material.currentStock) {
        return res.status(400).json({
          error: `Not enough stock available. Only ${material.currentStock - totalUsedStock} left.`,
        })
      }

      let machineMaterial = await MachineMaterial.findOne({ material: materialId, machine: machineId })

      if (machineMaterial) {
        // Create history entry without changedBy first
        const historyEntry = {
          previousStock: machineMaterial.allocatedStock,
          newStock: Number.parseInt(allocatedStock),
          date: new Date(),
          comment: `Stock updated manually.`,
        }

        // Only add changedBy if we have a valid userId
        if (validUserId) {
          historyEntry.changedBy = validUserId
        }

        // Add to history
        machineMaterial.history.push(historyEntry)
        machineMaterial.allocatedStock = Number.parseInt(allocatedStock)
        await machineMaterial.save()
      } else {
        // Create history entry without changedBy first
        const historyEntry = {
          previousStock: 0,
          newStock: Number.parseInt(allocatedStock),
          date: new Date(),
          comment: `Initial allocation.`,
        }

        // Only add changedBy if we have a valid userId
        if (validUserId) {
          historyEntry.changedBy = validUserId
        }

        // Create new allocation with history
        machineMaterial = new MachineMaterial({
          material: materialId,
          machine: machineId,
          allocatedStock: Number.parseInt(allocatedStock),
          history: [historyEntry],
        })
        await machineMaterial.save()
      }

      totalUsedStock += Number.parseInt(allocatedStock) // Update used stock
    }

    // Update the material's current stock by subtracting the total allocated stock
    material.currentStock -= totalUsedStock

    // Add a record to material history
    const materialHistoryEntry = {
      changeDate: new Date(),
      description: `Allocated ${totalUsedStock} units to machines.`,
    }

    // Only add changedBy if we have a valid userId
    if (validUserId) {
      materialHistoryEntry.changedBy = validUserId
    }

    material.materialHistory.push(materialHistoryEntry)
    await material.save()

    return res.status(200).json({
      message: "Stock successfully allocated with validation.",
      updatedStock: material.currentStock,
    })
  } catch (error) {
    console.error("Allocation error:", error)
    return res.status(500).json({ error: error.message })
  }
}

// Get all stock allocations
exports.getAllAllocations = async (req, res) => {
  try {
    const allocations = await MachineMaterial.find().populate("machine material")
    return res.status(200).json(allocations)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

// Get stock allocation for a specific material
exports.getMaterialAllocations = async (req, res) => {
  try {
    const { materialId } = req.params
    const allocations = await MachineMaterial.find({ material: materialId }).populate("machine")
    return res.status(200).json(allocations)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

// Get stock allocation history for a machine
exports.getMachineStockHistory = async (req, res) => {
  try {
    const { machineId } = req.params
    const history = await MachineMaterial.find({ machine: machineId }).populate("material").select("history material")
    return res.status(200).json(history)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

// Update a specific allocation
exports.updateAllocation = async (req, res) => {
  try {
    const { id } = req.params
    const { allocatedStock, userId, comment } = req.body

    // Find the allocation
    const allocation = await MachineMaterial.findById(id)
    if (!allocation) {
      return res.status(404).json({ error: "Allocation not found" })
    }

    // Get material to check stock availability
    const material = await Material.findById(allocation.material)
    if (!material) {
      return res.status(404).json({ error: "Material not found" })
    }

    // Calculate stock difference
    const stockDifference = Number.parseInt(allocatedStock) - allocation.allocatedStock

    // Check if enough stock is available if increasing allocation
    if (stockDifference > 0 && stockDifference > material.currentStock) {
      return res.status(400).json({
        error: `Not enough stock available. Only ${material.currentStock} units available.`,
      })
    }

    // Create history entry without changedBy first
    const historyEntry = {
      previousStock: allocation.allocatedStock,
      newStock: Number.parseInt(allocatedStock),
      date: new Date(),
      comment: comment || `Stock updated from ${allocation.allocatedStock} to ${allocatedStock}.`,
    }

    // Validate userId if provided
    if (userId && isValidObjectId(userId)) {
      historyEntry.changedBy = mongoose.Types.ObjectId(userId)
    }

    // Add to history
    allocation.history.push(historyEntry)

    // Update allocation
    allocation.allocatedStock = Number.parseInt(allocatedStock)
    await allocation.save()

    // Update material stock based on the difference
    if (stockDifference !== 0) {
      // If stockDifference is positive, we're adding more to the machine, so subtract from material stock
      // If stockDifference is negative, we're removing from the machine, so add back to material stock
      material.currentStock -= stockDifference

      // Add a record to material history
      const materialHistoryEntry = {
        changeDate: new Date(),
        description:
          stockDifference > 0
            ? `Allocated ${stockDifference} additional units to machine ${allocation.machine}.`
            : `Returned ${Math.abs(stockDifference)} units from machine ${allocation.machine}.`,
      }

      // Only add changedBy if we have a valid userId
      if (userId && isValidObjectId(userId)) {
        materialHistoryEntry.changedBy = mongoose.Types.ObjectId(userId)
      }

      material.materialHistory.push(materialHistoryEntry)
      await material.save()
    }

    return res.status(200).json({
      message: "Allocation updated successfully",
      allocation,
      updatedMaterialStock: material.currentStock,
    })
  } catch (error) {
    console.error("Update allocation error:", error)
    return res.status(500).json({ error: error.message })
  }
}

exports.deleteAllocation = async (req, res) => {
  try {
    const deletedAllocation = await MachineMaterial.findByIdAndDelete(req.params.id)

    if (!deletedAllocation) {
      return res.status(404).json({ message: "Allocation not found." })
    }

    res.status(200).json({ message: "Allocation deleted successfully." })
  } catch (error) {
    res.status(500).json({ message: "Error deleting allocation.", error })
  }
}


