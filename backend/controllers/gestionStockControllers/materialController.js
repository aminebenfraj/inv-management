const Material = require("../../models/gestionStockModels/MaterialModel")
const Supplier = require("../../models/gestionStockModels/SupplierModel")
const Machine = require("../../models/gestionStockModels/MachineModel")
const Location = require("../../models/gestionStockModels/LocationModel")
const Category = require("../../models/gestionStockModels/CategoryModel")
const Factory = require("../../models/FactoryModel")

// Create Material with existence checks
exports.createMaterial = async (req, res) => {
  try {
    const {
      supplier,
      manufacturer,
      reference,
      description,
      minimumStock,
      currentStock,
      orderLot,
      location,
      critical,
      consumable,
      machines,
      comment,
      photo,
      price,
      category,
      factory,
    } = req.body

    // Check if Supplier exists
    const existingSupplier = await Supplier.findById(supplier)
    if (!existingSupplier) {
      return res.status(400).json({ error: "Supplier not found" })
    }

    // Check if Location exists
    const existingLocation = await Location.findById(location)
    if (!existingLocation) {
      return res.status(400).json({ error: "Location not found" })
    }

    // Check if Category exists
    const existingCategory = await Category.findById(category)
    if (!existingCategory) {
      return res.status(400).json({ error: "Category not found" })
    }

    // NEW: Check if Factory exists
    const existingFactory = await Factory.findById(factory)
    if (!existingFactory) {
      return res.status(400).json({ error: "Factory not found" })
    }

    // Check if Machines exist
    if (machines && machines.length > 0) {
      const foundMachines = await Machine.find({ _id: { $in: machines } })
      if (foundMachines.length !== machines.length) {
        return res.status(400).json({ error: "One or more machines not found" })
      }
    }

    // Create new Material
    const newMaterial = new Material({
      supplier,
      manufacturer,
      reference,
      description,
      minimumStock,
      currentStock,
      orderLot,
      location,
      critical,
      consumable,
      machines,
      comment,
      photo,
      price,
      category,
      factory,
    })

    await newMaterial.save()
    res.status(201).json(newMaterial)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to create material" })
  }
}

// Get all materials with pagination, filtering, and search
exports.getAllMaterials = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "updatedAt",
      sortOrder = -1,
      manufacturer,
      supplier,
      category,
      location,
      critical,
      consumable,
      stockStatus,
      factory,
    } = req.query

    // Ensure page & limit are valid positive integers
    page = Math.max(Number.parseInt(page, 10) || 1, 1)
    limit = Math.max(Number.parseInt(limit, 10) || 10, 1)

    // Build query filters
    const filter = {}

    // Text search if provided - will search across reference, manufacturer, description
    if (search && search.trim() !== "") {
      // First, try to find by exact reference
      const exactMatch = await Material.findOne({ reference: search.trim() })

      if (exactMatch) {
        return res.status(200).json({
          total: 1,
          page: 1,
          limit,
          totalPages: 1,
          data: [exactMatch],
        })
      }

      // Then, search in reference history
      const historyMatches = await Material.find({
        "referenceHistory.oldReference": search.trim(),
      })

      if (historyMatches.length > 0) {
        const total = historyMatches.length
        const totalPages = Math.ceil(total / limit)
        const paginatedResults = historyMatches.slice((page - 1) * limit, page * limit)

        return res.status(200).json({
          total,
          page,
          limit,
          totalPages,
          data: paginatedResults,
          matchType: "history",
        })
      }

      // If no exact matches, use text search
      filter.$or = [
        { reference: { $regex: search, $options: "i" } },
        { manufacturer: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ]
    }

    // Add specific filters if provided
    if (manufacturer) filter.manufacturer = manufacturer
    if (supplier) filter.supplier = supplier
    if (category) filter.category = category
    if (location) filter.location = location
    if (factory) filter.factory = factory

    if (critical !== undefined) filter.critical = critical === "true"
    if (consumable !== undefined) filter.consumable = consumable === "true"

    // Stock status filter
    if (stockStatus) {
      switch (stockStatus) {
        case "out_of_stock":
          filter.currentStock = { $lte: 0 }
          break
        case "low_stock":
          filter.$and = [{ currentStock: { $gt: 0 } }, { $expr: { $lte: ["$currentStock", "$minimumStock"] } }]
          break
        case "in_stock":
          filter.$expr = { $gt: ["$currentStock", "$minimumStock"] }
          break
      }
    }

    // Prepare sort options
    const sort = {}
    sort[sortBy] = Number.parseInt(sortOrder)

    // Count total matching documents (for pagination)
    const totalMaterials = await Material.countDocuments(filter)
    const totalPages = Math.ceil(totalMaterials / limit)

    // Execute query with all filters, sorting, and pagination
    const materials = await Material.find(filter)
      .populate("supplier")
      .populate("location")
      .populate("machines")
      .populate("category")
      .populate("factory")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean() // Use lean() for better performance

    res.status(200).json({
      total: totalMaterials,
      page,
      limit,
      totalPages,
      data: materials,
    })
  } catch (error) {
    console.error("Error fetching materials:", error)
    res.status(500).json({ message: "Error fetching materials", error: error.message })
  }
}

// Get filter options for dropdowns
exports.getFilterOptions = async (req, res) => {
  try {
    const { field } = req.params

    // Only allow specific fields to be queried
    const allowedFields = ["manufacturer", "supplier", "category", "location", "factory"]

    if (!allowedFields.includes(field)) {
      return res.status(400).json({ message: "Invalid field for filter options" })
    }

    let options = []

    if (field === "manufacturer") {
      options = await Material.distinct(field)
    } else {
      // For reference fields, we need to get the actual documents
      const distinctIds = await Material.distinct(field)

      switch (field) {
        case "supplier":
          options = await Supplier.find({ _id: { $in: distinctIds } })
          break
        case "category":
          options = await Category.find({ _id: { $in: distinctIds } })
          break
        case "location":
          options = await Location.find({ _id: { $in: distinctIds } })
          break
        case "factory": // NEW: Handle factory
          options = await Factory.find({ _id: { $in: distinctIds } })
          break
      }
    }

    res.status(200).json(options)
  } catch (error) {
    res.status(500).json({ message: "Error fetching filter options", error: error.message })
  }
}

// Get a single material by ID
exports.getMaterialById = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id)
      .populate("supplier")
      .populate("location")
      .populate("machines")
      .populate("category")
      .populate("factory")

    if (!material) {
      return res.status(404).json({ message: "Material not found" })
    }

    res.status(200).json(material)
  } catch (error) {
    console.error("Error fetching material by ID:", error)
    res.status(500).json({
      message: "Error fetching material details",
      error: error.message,
    })
  }
}

// Update a material
exports.updateMaterial = async (req, res) => {
  try {
    // Find the material first to check if reference has changed
    const existingMaterial = await Material.findById(req.params.id)

    if (!existingMaterial) {
      return res.status(404).json({ message: "Material not found" })
    }

    // Check if the reference is being updated and handle reference history
    if (req.body.reference && req.body.reference !== existingMaterial.reference) {
      // If referenceHistory is not provided in the request but reference is changing,
      // we need to add it automatically
      if (!req.body.referenceHistory) {
        req.body.referenceHistory = existingMaterial.referenceHistory || []
        req.body.referenceHistory.push({
          oldReference: existingMaterial.reference,
          changedDate: new Date(),
          changedBy: req.user ? req.user._id : null,
          comment: `Reference changed from ${existingMaterial.reference} to ${req.body.reference}`,
        })
      }
    }

    // NEW: If factory is being updated, ensure it exists
    if (req.body.factory) {
      const existingFactory = await Factory.findById(req.body.factory)
      if (!existingFactory) {
        return res.status(400).json({ error: "Factory not found" })
      }
    }

    const material = await Material.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    })

    res.status(200).json(material)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Delete a material
exports.deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findByIdAndDelete(req.params.id)
    if (!material) {
      return res.status(404).json({ message: "Material not found" })
    }
    res.status(200).json({ message: "Material deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Remove a reference from history
exports.removeReferenceFromHistory = async (req, res) => {
  try {
    const { materialId, historyId } = req.params

    const material = await Material.findById(materialId)

    if (!material) {
      return res.status(404).json({ message: "Material not found" })
    }

    // Find the index of the history item to remove
    const historyIndex = material.referenceHistory.findIndex((item) => item._id.toString() === historyId)

    if (historyIndex === -1) {
      return res.status(404).json({ message: "History item not found" })
    }

    // Remove the history item
    material.referenceHistory.splice(historyIndex, 1)

    // Save the updated material
    await material.save()

    res.status(200).json({
      message: "Reference history item removed successfully",
      material,
    })
  } catch (error) {
    console.error("Error removing reference history:", error)
    res.status(500).json({
      message: "Error removing reference history item",
      error: error.message,
    })
  }
}

// NEW FUNCTION: Get materials by factory ID with pagination, filtering, and search
exports.getMaterialsByFactoryId = async (req, res) => {
  try {
    const { factoryId } = req.params // Get factoryId from URL parameters
    let {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "updatedAt",
      sortOrder = -1,
      manufacturer,
      supplier,
      category,
      location,
      critical,
      consumable,
      stockStatus,
    } = req.query

    // Validate factoryId
    const existingFactory = await Factory.findById(factoryId)
    if (!existingFactory) {
      return res.status(404).json({ error: "Factory not found" })
    }

    // Ensure page & limit are valid positive integers
    page = Math.max(Number.parseInt(page, 10) || 1, 1)
    limit = Math.max(Number.parseInt(limit, 10) || 10, 1)

    // Build query filters, starting with the required factoryId
    const filter = { factory: factoryId }

    // Text search if provided - will search across reference, manufacturer, description
    if (search && search.trim() !== "") {
      // First, try to find by exact reference within this factory
      const exactMatch = await Material.findOne({ reference: search.trim(), factory: factoryId })

      if (exactMatch) {
        return res.status(200).json({
          total: 1,
          page: 1,
          limit,
          totalPages: 1,
          data: [exactMatch],
        })
      }

      // Then, search in reference history within this factory
      const historyMatches = await Material.find({
        "referenceHistory.oldReference": search.trim(),
        factory: factoryId,
      })

      if (historyMatches.length > 0) {
        const total = historyMatches.length
        const totalPages = Math.ceil(total / limit)
        const paginatedResults = historyMatches.slice((page - 1) * limit, page * limit)

        return res.status(200).json({
          total,
          page,
          limit,
          totalPages,
          data: paginatedResults,
          matchType: "history",
        })
      }

      // If no exact matches, use text search
      filter.$or = [
        { reference: { $regex: search, $options: "i" } },
        { manufacturer: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ]
    }

    // Add specific filters if provided
    if (manufacturer) filter.manufacturer = manufacturer
    if (supplier) filter.supplier = supplier
    if (category) filter.category = category
    if (location) filter.location = location

    if (critical !== undefined) filter.critical = critical === "true"
    if (consumable !== undefined) filter.consumable = consumable === "true"

    // Stock status filter
    if (stockStatus) {
      switch (stockStatus) {
        case "out_of_stock":
          filter.currentStock = { $lte: 0 }
          break
        case "low_stock":
          filter.$and = [{ currentStock: { $gt: 0 } }, { $expr: { $lte: ["$currentStock", "$minimumStock"] } }]
          break
        case "in_stock":
          filter.$expr = { $gt: ["$currentStock", "$minimumStock"] }
          break
      }
    }

    // Prepare sort options
    const sort = {}
    sort[sortBy] = Number.parseInt(sortOrder)

    // Count total matching documents (for pagination)
    const totalMaterials = await Material.countDocuments(filter)
    const totalPages = Math.ceil(totalMaterials / limit)

    // Execute query with all filters, sorting, and pagination
    const materials = await Material.find(filter)
      .populate("supplier")
      .populate("location")
      .populate("machines")
      .populate("category")
      .populate("factory")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean() // Use lean() for better performance

    res.status(200).json({
      total: totalMaterials,
      page,
      limit,
      totalPages,
      data: materials,
    })
  } catch (error) {
    console.error("Error fetching materials by factory ID:", error)
    res.status(500).json({ message: "Error fetching materials by factory ID", error: error.message })
  }
}
// In materialController.js
exports.getMaterialsByMachineId = async (req, res) => {
  try {
    const { machineId } = req.params;
    const { factory } = req.query;

    if (!mongoose.Types.ObjectId.isValid(machineId)) {
      return res.status(400).json({ message: "Invalid machine ID format." });
    }
    if (factory && !mongoose.Types.ObjectId.isValid(factory)) {
      return res.status(400).json({ message: "Invalid factory ID format." });
    }

    const machine = await Machine.findById(machineId);
    if (!machine) {
      return res.status(404).json({ message: "Machine not found." });
    }
    if (factory && machine.factory?.toString() !== factory) {
      return res.status(400).json({ message: "Machine does not belong to the specified factory." });
    }

    const materials = await Material.find({ machines: machineId })
      .populate("supplier location category factory")
      .lean();

    res.status(200).json(materials);
  } catch (error) {
    console.error("Error fetching materials by machine ID:", { error, machineId: req.params.machineId });
    res.status(500).json({ message: "Server error while fetching materials.", error: error.message });
  }
};