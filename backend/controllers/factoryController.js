const Factory = require("../../backend/models/FactoryModel")
const User = require("../../backend/models/UserModel")
const Machine = require("../../backend/models/gestionStockModels/MachineModel")
const Material = require("../../backend/models/gestionStockModels/MaterialModel")

// Create a new factory
exports.createFactory = async (req, res) => {
  try {
    const { name, description, status, manager, authorizedUsers } = req.body

    // Check if factory with this name already exists
    const existingFactory = await Factory.findOne({ name })
    if (existingFactory) {
      return res.status(400).json({ message: "Factory with this name already exists." })
    }

    // Validate manager exists if provided
    if (manager) {
      const managerUser = await User.findById(manager)
      if (!managerUser) {
        return res.status(400).json({ message: "Manager user not found." })
      }
    }

    // Validate authorized users if provided
    if (authorizedUsers && authorizedUsers.length > 0) {
      const users = await User.find({ _id: { $in: authorizedUsers } })
      if (users.length !== authorizedUsers.length) {
        return res.status(400).json({ message: "One or more authorized users not found." })
      }
    }

    const factory = new Factory({
      name,
      description,
      status,
      manager,
      authorizedUsers: authorizedUsers || [],
    })

    await factory.save()

    // Populate the response
    const populatedFactory = await Factory.findById(factory._id)
      .populate("manager", "username email roles")
      .populate("authorizedUsers", "username email roles")
      .populate("machines")
      .populate("materials")

    res.status(201).json(populatedFactory)
  } catch (error) {
    console.error("Error creating factory:", error)
    res.status(500).json({ message: "Server error while creating factory.", error: error.message })
  }
}

// Get all factories with filtering and pagination
exports.getAllFactories = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "", status, sortBy = "updatedAt", sortOrder = -1 } = req.query

    // Ensure page & limit are valid positive integers
    page = Math.max(Number.parseInt(page, 10) || 1, 1)
    limit = Math.max(Number.parseInt(limit, 10) || 10, 1)

    // Build query filters
    const filter = {}

    // Text search
    if (search && search.trim() !== "") {
      filter.$or = [{ name: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]
    }

    // Status filter
    if (status) {
      filter.status = status
    }

    // Prepare sort options
    const sort = {}
    sort[sortBy] = Number.parseInt(sortOrder)

    // Count total matching documents
    const totalFactories = await Factory.countDocuments(filter)
    const totalPages = Math.ceil(totalFactories / limit)

    // Execute query with population
    const factories = await Factory.find(filter)
      .populate("manager", "username email roles")
      .populate("authorizedUsers", "username email roles")
      .populate("machines", "name status")
      .populate("materials", "reference description currentStock")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    res.status(200).json({
      total: totalFactories,
      page,
      limit,
      totalPages,
      data: factories,
    })
  } catch (error) {
    console.error("Error fetching factories:", error)
    res.status(500).json({ message: "Server error while fetching factories.", error: error.message })
  }
}

// Get a single factory by ID
exports.getFactoryById = async (req, res) => {
  try {
    const factory = await Factory.findById(req.params.id)
      .populate("manager", "username email roles")
      .populate("authorizedUsers", "username email roles")
      .populate("machines")
      .populate("materials")

    if (!factory) {
      return res.status(404).json({ message: "Factory not found." })
    }

    res.status(200).json(factory)
  } catch (error) {
    console.error("Error fetching factory:", error)
    res.status(500).json({ message: "Server error while fetching factory.", error: error.message })
  }
}

// Update a factory
exports.updateFactory = async (req, res) => {
  try {
    const { name, description, status, manager, authorizedUsers } = req.body

    // Check if another factory with this name exists (excluding current one)
    if (name) {
      const existingFactory = await Factory.findOne({
        name,
        _id: { $ne: req.params.id },
      })
      if (existingFactory) {
        return res.status(400).json({ message: "Factory with this name already exists." })
      }
    }

    // Validate manager exists if provided
    if (manager) {
      const managerUser = await User.findById(manager)
      if (!managerUser) {
        return res.status(400).json({ message: "Manager user not found." })
      }
    }

    // Validate authorized users if provided
    if (authorizedUsers && authorizedUsers.length > 0) {
      const users = await User.find({ _id: { $in: authorizedUsers } })
      if (users.length !== authorizedUsers.length) {
        return res.status(400).json({ message: "One or more authorized users not found." })
      }
    }

    const updatedFactory = await Factory.findByIdAndUpdate(
      req.params.id,
      { name, description, status, manager, authorizedUsers },
      { new: true, runValidators: true },
    )
      .populate("manager", "username email roles")
      .populate("authorizedUsers", "username email roles")
      .populate("machines")
      .populate("materials")

    if (!updatedFactory) {
      return res.status(404).json({ message: "Factory not found." })
    }

    res.status(200).json(updatedFactory)
  } catch (error) {
    console.error("Error updating factory:", error)
    res.status(500).json({ message: "Server error while updating factory.", error: error.message })
  }
}

// Delete a factory
exports.deleteFactory = async (req, res) => {
  try {
    const factory = await Factory.findById(req.params.id)

    if (!factory) {
      return res.status(404).json({ message: "Factory not found." })
    }

    // Check if factory has associated machines or materials
    if (factory.machines.length > 0 || factory.materials.length > 0) {
      return res.status(400).json({
        message: "Cannot delete factory with associated machines or materials. Please reassign them first.",
      })
    }

    await Factory.findByIdAndDelete(req.params.id)
    res.status(200).json({ message: "Factory deleted successfully." })
  } catch (error) {
    console.error("Error deleting factory:", error)
    res.status(500).json({ message: "Server error while deleting factory.", error: error.message })
  }
}

// Add authorized user to factory
exports.addAuthorizedUser = async (req, res) => {
  try {
    const { userId } = req.body

    // Validate user exists
    const user = await User.findById(userId)
    if (!user) {
      return res.status(400).json({ message: "User not found." })
    }

    const factory = await Factory.findById(req.params.id)
    if (!factory) {
      return res.status(404).json({ message: "Factory not found." })
    }

    // Check if user is already authorized
    if (factory.authorizedUsers.includes(userId)) {
      return res.status(400).json({ message: "User is already authorized for this factory." })
    }

    factory.authorizedUsers.push(userId)
    await factory.save()

    const updatedFactory = await Factory.findById(factory._id).populate("authorizedUsers", "username email roles")

    res.status(200).json({
      message: "User added to authorized users successfully.",
      authorizedUsers: updatedFactory.authorizedUsers,
    })
  } catch (error) {
    console.error("Error adding authorized user:", error)
    res.status(500).json({ message: "Server error while adding authorized user.", error: error.message })
  }
}

// Remove authorized user from factory
exports.removeAuthorizedUser = async (req, res) => {
  try {
    const { userId } = req.params

    const factory = await Factory.findById(req.params.id)
    if (!factory) {
      return res.status(404).json({ message: "Factory not found." })
    }

    // Remove user from authorized users
    factory.authorizedUsers = factory.authorizedUsers.filter((user) => user.toString() !== userId)

    await factory.save()

    const updatedFactory = await Factory.findById(factory._id).populate("authorizedUsers", "username email roles")

    res.status(200).json({
      message: "User removed from authorized users successfully.",
      authorizedUsers: updatedFactory.authorizedUsers,
    })
  } catch (error) {
    console.error("Error removing authorized user:", error)
    res.status(500).json({ message: "Server error while removing authorized user.", error: error.message })
  }
}

// Assign machine to factory
exports.assignMachine = async (req, res) => {
  try {
    const { machineId } = req.body

    // Validate machine exists
    const machine = await Machine.findById(machineId)
    if (!machine) {
      return res.status(400).json({ message: "Machine not found." })
    }

    const factory = await Factory.findById(req.params.id)
    if (!factory) {
      return res.status(404).json({ message: "Factory not found." })
    }

    // Check if machine is already assigned to this factory
    if (factory.machines.includes(machineId)) {
      return res.status(400).json({ message: "Machine is already assigned to this factory." })
    }

    // Update machine's factory reference
    machine.factory = factory._id
    await machine.save()

    // Add machine to factory's machines array
    factory.machines.push(machineId)
    await factory.save()

    const updatedFactory = await Factory.findById(factory._id).populate("machines")

    res.status(200).json({
      message: "Machine assigned to factory successfully.",
      machines: updatedFactory.machines,
    })
  } catch (error) {
    console.error("Error assigning machine:", error)
    res.status(500).json({ message: "Server error while assigning machine.", error: error.message })
  }
}

// Remove machine from factory
exports.removeMachine = async (req, res) => {
  try {
    const { machineId } = req.params

    const factory = await Factory.findById(req.params.id)
    if (!factory) {
      return res.status(404).json({ message: "Factory not found." })
    }

    const machine = await Machine.findById(machineId)
    if (machine) {
      // Remove factory reference from machine
      machine.factory = null
      await machine.save()
    }

    // Remove machine from factory's machines array
    factory.machines = factory.machines.filter((machine) => machine.toString() !== machineId)

    await factory.save()

    const updatedFactory = await Factory.findById(factory._id).populate("machines")

    res.status(200).json({
      message: "Machine removed from factory successfully.",
      machines: updatedFactory.machines,
    })
  } catch (error) {
    console.error("Error removing machine:", error)
    res.status(500).json({ message: "Server error while removing machine.", error: error.message })
  }
}

// Assign material to factory
exports.assignMaterial = async (req, res) => {
  try {
    const { materialId } = req.body

    // Validate material exists
    const material = await Material.findById(materialId)
    if (!material) {
      return res.status(400).json({ message: "Material not found." })
    }

    const factory = await Factory.findById(req.params.id)
    if (!factory) {
      return res.status(404).json({ message: "Factory not found." })
    }

    // Check if material is already assigned to this factory
    if (factory.materials.includes(materialId)) {
      return res.status(400).json({ message: "Material is already assigned to this factory." })
    }

    // Update material's factory reference
    material.factory = factory._id
    await material.save()

    // Add material to factory's materials array
    factory.materials.push(materialId)
    await factory.save()

    const updatedFactory = await Factory.findById(factory._id).populate("materials")

    res.status(200).json({
      message: "Material assigned to factory successfully.",
      materials: updatedFactory.materials,
    })
  } catch (error) {
    console.error("Error assigning material:", error)
    res.status(500).json({ message: "Server error while assigning material.", error: error.message })
  }
}

// Remove material from factory
exports.removeMaterial = async (req, res) => {
  try {
    const { materialId } = req.params

    const factory = await Factory.findById(req.params.id)
    if (!factory) {
      return res.status(404).json({ message: "Factory not found." })
    }

    const material = await Material.findById(materialId)
    if (material) {
      // Remove factory reference from material
      material.factory = null
      await material.save()
    }

    // Remove material from factory's materials array
    factory.materials = factory.materials.filter((material) => material.toString() !== materialId)

    await factory.save()

    const updatedFactory = await Factory.findById(factory._id).populate("materials")

    res.status(200).json({
      message: "Material removed from factory successfully.",
      materials: updatedFactory.materials,
    })
  } catch (error) {
    console.error("Error removing material:", error)
    res.status(500).json({ message: "Server error while removing material.", error: error.message })
  }
}

// Get factories accessible by current user
exports.getUserFactories = async (req, res) => {
  try {
    const userId = req.user._id

    const factories = await Factory.find({
      $or: [{ manager: userId }, { authorizedUsers: userId }],
    })
      .populate("manager", "username email roles")
      .populate("machines", "name status")
      .populate("materials", "reference description currentStock")
      .sort({ updatedAt: -1 })

    res.status(200).json(factories)
  } catch (error) {
    console.error("Error fetching user factories:", error)
    res.status(500).json({ message: "Server error while fetching user factories.", error: error.message })
  }
}
