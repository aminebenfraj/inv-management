const TableStatus = require("../../models/pedido/TableStatus")

// Get all table statuses
exports.getAllTableStatuses = async (req, res) => {
  try {
    // Get sorting parameters from query
    const { sortBy = "order", sortOrder = 1 } = req.query

    // Prepare sort options
    const sort = {}
    sort[sortBy] = Number.parseInt(sortOrder)

    const tableStatuses = await TableStatus.find().sort(sort).lean()

    res.status(200).json(tableStatuses)
  } catch (error) {
    console.error("Error fetching table statuses:", error)
    res.status(500).json({ message: "Error fetching table statuses", error: error.message })
  }
}

// Get a single table status by ID
exports.getTableStatusById = async (req, res) => {
  try {
    const tableStatus = await TableStatus.findById(req.params.id).lean()

    if (!tableStatus) {
      return res.status(404).json({ message: "Table status not found" })
    }

    res.status(200).json(tableStatus)
  } catch (error) {
    console.error("Error fetching table status:", error)
    res.status(500).json({ message: "Error fetching table status", error: error.message })
  }
}

// Create a new table status
exports.createTableStatus = async (req, res) => {
  try {
    const { name, color, order } = req.body

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: "Name is required" })
    }

    // Check if a table status with the same name already exists
    const existingTableStatus = await TableStatus.findOne({ name })
    if (existingTableStatus) {
      return res.status(400).json({ error: "A table status with this name already exists" })
    }

    // If order is not provided, get the highest order and add 1
    let statusOrder = order
    if (statusOrder === undefined) {
      const highestOrder = await TableStatus.findOne().sort({ order: -1 }).select("order")
      statusOrder = highestOrder ? highestOrder.order + 1 : 1
    }

    // Create new table status
    const newTableStatus = new TableStatus({
      name,
      color: color || "#808080", // Default to gray if no color is provided
      order: statusOrder,
    })

    await newTableStatus.save()
    res.status(201).json(newTableStatus)
  } catch (error) {
    console.error("Error creating table status:", error)
    res.status(500).json({ message: "Error creating table status", error: error.message })
  }
}

// Update a table status
exports.updateTableStatus = async (req, res) => {
  try {
    const { name, color, order } = req.body

    // Find the table status first to check if it exists
    const existingTableStatus = await TableStatus.findById(req.params.id)
    if (!existingTableStatus) {
      return res.status(404).json({ message: "Table status not found" })
    }

    // If name is being changed, check if the new name already exists
    if (name && name !== existingTableStatus.name) {
      const duplicateName = await TableStatus.findOne({ name, _id: { $ne: req.params.id } })
      if (duplicateName) {
        return res.status(400).json({ error: "A table status with this name already exists" })
      }
    }

    // Update the table status fields
    if (name) existingTableStatus.name = name
    if (color) existingTableStatus.color = color
    if (order !== undefined) existingTableStatus.order = order

    await existingTableStatus.save()
    res.status(200).json(existingTableStatus)
  } catch (error) {
    console.error("Error updating table status:", error)
    res.status(400).json({ message: "Error updating table status", error: error.message })
  }
}

exports.deleteTableStatus = async (req, res) => {
  try {
    // Check if the table status is being used by any pedidos
    const Pedido = require("../../models/pedido/Pedido")
    const pedidosUsingStatus = await Pedido.countDocuments({ table_status: req.params.id })

    if (pedidosUsingStatus > 0) {
      return res.status(400).json({
        error: "Cannot delete this table status because it is being used by orders",
        count: pedidosUsingStatus,
      })
    }

    const tableStatus = await TableStatus.findByIdAndDelete(req.params.id)
    if (!tableStatus) {
      return res.status(404).json({ message: "Table status not found" })
    }
    res.status(200).json({ message: "Table status deleted successfully" })
  } catch (error) {
    console.error("Error deleting table status:", error)
    res.status(500).json({ message: "Error deleting table status", error: error.message })
  }
}
// Reorder table statuses
exports.reorderTableStatuses = async (req, res) => {
  try {
    const { orders } = req.body

    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({ error: "Invalid order data" })
    }

    // Validate that all IDs exist
    const statusIds = orders.map((item) => item.id)
    const existingStatuses = await TableStatus.find({ _id: { $in: statusIds } })

    if (existingStatuses.length !== statusIds.length) {
      return res.status(400).json({ error: "One or more table statuses not found" })
    }

    // Update the order of each table status
    const updatePromises = orders.map((item) => {
      return TableStatus.updateOne({ _id: item.id }, { $set: { order: item.order } })
    })

    await Promise.all(updatePromises)

    // Get the updated table statuses
    const updatedStatuses = await TableStatus.find({ _id: { $in: statusIds } })
      .sort({ order: 1 })
      .lean()

    res.status(200).json(updatedStatuses)
  } catch (error) {
    console.error("Error reordering table statuses:", error)
    res.status(500).json({ message: "Error reordering table statuses", error: error.message })
  }
}

