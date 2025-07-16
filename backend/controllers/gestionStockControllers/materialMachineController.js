const MachineMaterial = require("../../models/gestionStockModels/MachineMaterialModel");
const Material = require("../../models/gestionStockModels/MaterialModel");
const Machine = require("../../models/gestionStockModels/MachineModel");
const Factory = require("../../models/FactoryModel");
const mongoose = require("mongoose");
const Joi = require("joi");

// Validation schemas
const allocationSchema = Joi.object({
  materialId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
  userId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
  factory: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
  allocations: Joi.array().items(
    Joi.object({
      machineId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
      allocatedStock: Joi.number().integer().min(1).required(),
    })
  ).min(1).required(),
});

const updateAllocationSchema = Joi.object({
  allocatedStock: Joi.number().integer().min(1).required(),
  userId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
  comment: Joi.string().max(500).allow("").optional(),
  factory: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
});

const querySchema = Joi.object({
  factory: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

// Helper function to validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Allocate stock to machines
exports.allocateStock = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Validate request body
    const { error, value } = allocationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: "Validation error", error: error.details[0].message });
    }

    const { materialId, allocations, userId, factory } = value;

    // Validate material existence
    const material = await Material.findById(materialId).session(session);
    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }

    // Validate factory if provided
    if (factory) {
      const existingFactory = await Factory.findById(factory).session(session);
      if (!existingFactory) {
        return res.status(404).json({ message: "Factory not found" });
      }
    }

    // Check if enough stock is available
    const totalRequestedStock = allocations.reduce((sum, alloc) => sum + alloc.allocatedStock, 0);
    if (totalRequestedStock > material.currentStock) {
      return res.status(400).json({ message: `Total allocated stock (${totalRequestedStock}) exceeds available stock (${material.currentStock}).` });
    }

    // Validate userId if provided
    const validUserId = userId && isValidObjectId(userId) ? mongoose.Types.ObjectId(userId) : null;

    // Validate machines and ensure they belong to the specified factory (if provided)
    for (const { machineId } of allocations) {
      const machine = await Machine.findById(machineId).session(session);
      if (!machine) {
        return res.status(404).json({ message: `Machine ${machineId} not found` });
      }
      if (factory && machine.factory?.toString() !== factory) {
        return res.status(400).json({ message: `Machine ${machineId} does not belong to factory ${factory}` });
      }
    }

    let totalUsedStock = 0;

    for (const { machineId, allocatedStock } of allocations) {
      if (totalUsedStock + allocatedStock > material.currentStock) {
        return res.status(400).json({
          message: `Not enough stock available. Only ${material.currentStock - totalUsedStock} left.`,
        });
      }

      let machineMaterial = await MachineMaterial.findOne({ material: materialId, machine: machineId }).session(session);

      if (machineMaterial) {
        // Update existing allocation
        const historyEntry = {
          previousStock: machineMaterial.allocatedStock,
          newStock: allocatedStock,
          date: new Date(),
          comment: `Stock updated to ${allocatedStock}.`,
          ...(validUserId && { changedBy: validUserId }),
        };
        machineMaterial.history.push(historyEntry);
        machineMaterial.allocatedStock = allocatedStock;
        await machineMaterial.save({ session });
      } else {
        // Create new allocation
        const historyEntry = {
          previousStock: 0,
          newStock: allocatedStock,
          date: new Date(),
          comment: `Initial allocation of ${allocatedStock}.`,
          ...(validUserId && { changedBy: validUserId }),
        };
        machineMaterial = new MachineMaterial({
          material: materialId,
          machine: machineId,
          allocatedStock,
          history: [historyEntry],
        });
        await machineMaterial.save({ session });
      }

      totalUsedStock += allocatedStock;
    }

    // Update material stock
    material.currentStock -= totalUsedStock;
    material.materialHistory.push({
      changeDate: new Date(),
      description: `Allocated ${totalUsedStock} units to machines.`,
      ...(validUserId && { changedBy: validUserId }),
    });
    await material.save({ session });

    await session.commitTransaction();
    return res.status(200).json({
      message: "Stock successfully allocated.",
      updatedStock: material.currentStock,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Allocation error:", { error, requestBody: req.body });
    return res.status(500).json({ message: "Server error while allocating stock.", error: error.message });
  } finally {
    session.endSession();
  }
};

// Get all stock allocations with factory filter
exports.getAllAllocations = async (req, res) => {
  try {
    // Validate query parameters
    const { error, value } = querySchema.validate(req.query);
    if (error) {
      return res.status(400).json({ message: "Validation error", error: error.details[0].message });
    }

    const { factory, page, limit } = value;

    // Build query
    const match = {};
    if (factory) {
      match["machine.factory"] = mongoose.Types.ObjectId(factory);
    }

    // Aggregate to join with Machine for factory filtering
    const allocations = await MachineMaterial.aggregate([
      {
        $lookup: {
          from: "machines",
          localField: "machine",
          foreignField: "_id",
          as: "machine",
        },
      },
      { $unwind: "$machine" },
      ...(factory ? [{ $match: match }] : []),
      {
        $lookup: {
          from: "materials",
          localField: "material",
          foreignField: "_id",
          as: "material",
        },
      },
      { $unwind: "$material" },
      {
        $lookup: {
          from: "factories",
          localField: "machine.factory",
          foreignField: "_id",
          as: "machine.factory",
        },
      },
      { $unwind: { path: "$machine.factory", preserveNullAndEmptyArrays: true } },
      { $sort: { updatedAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ]);

    // Count total documents for pagination
    const total = await MachineMaterial.aggregate([
      {
        $lookup: {
          from: "machines",
          localField: "machine",
          foreignField: "_id",
          as: "machine",
        },
      },
      { $unwind: "$machine" },
      ...(factory ? [{ $match: match }] : []),
      { $count: "total" },
    ]).then(result => result[0]?.total || 0);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      total,
      page,
      limit,
      totalPages,
      data: allocations,
    });
  } catch (error) {
    console.error("Error fetching allocations:", { error, query: req.query });
    return res.status(500).json({ message: "Server error while fetching allocations.", error: error.message });
  }
};

// Get stock allocations for a specific material with factory filter
exports.getMaterialAllocations = async (req, res) => {
  try {
    const { materialId } = req.params;
    const { factory } = req.query;

    // Validate materialId and factory
    if (!isValidObjectId(materialId)) {
      return res.status(400).json({ message: "Invalid material ID format." });
    }
    if (factory && !isValidObjectId(factory)) {
      return res.status(400).json({ message: "Invalid factory ID format." });
    }

    // Build query
    const match = { material: mongoose.Types.ObjectId(materialId) };
    if (factory) {
      match["machine.factory"] = mongoose.Types.ObjectId(factory);
    }

    const allocations = await MachineMaterial.aggregate([
      {
        $lookup: {
          from: "machines",
          localField: "machine",
          foreignField: "_id",
          as: "machine",
        },
      },
      { $unwind: "$machine" },
      { $match: match },
      {
        $lookup: {
          from: "factories",
          localField: "machine.factory",
          foreignField: "_id",
          as: "machine.factory",
        },
      },
      { $unwind: { path: "$machine.factory", preserveNullAndEmptyArrays: true } },
    ]);

    return res.status(200).json(allocations);
  } catch (error) {
    console.error("Error fetching material allocations:", { error, materialId: req.params.materialId, query: req.query });
    return res.status(500).json({ message: "Server error while fetching material allocations.", error: error.message });
  }
};

// Get stock allocation history for a machine with factory filter
exports.getMachineStockHistory = async (req, res) => {
  try {
    const { machineId } = req.params;
    const { factory } = req.query;

    // Validate machineId and factory
    if (!isValidObjectId(machineId)) {
      return res.status(400).json({ message: "Invalid machine ID format." });
    }
    if (factory && !isValidObjectId(factory)) {
      return res.status(400).json({ message: "Invalid factory ID format." });
    }

    // Validate machine and factory
    const machine = await Machine.findById(machineId);
    if (!machine) {
      return res.status(404).json({ message: "Machine not found." });
    }
    if (factory && machine.factory?.toString() !== factory) {
      return res.status(400).json({ message: "Machine does not belong to the specified factory." });
    }

    const history = await MachineMaterial.find({ machine: machineId })
      .populate("material")
      .select("history material")
      .lean();

    return res.status(200).json(history);
  } catch (error) {
    console.error("Error fetching machine stock history:", { error, machineId: req.params.machineId, query: req.query });
    return res.status(500).json({ message: "Server error while fetching machine stock history.", error: error.message });
  }
};

// Update a specific allocation
exports.updateAllocation = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Validate request body
    const { error, value } = updateAllocationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: "Validation error", error: error.details[0].message });
    }

    const { id } = req.params;
    const { allocatedStock, userId, comment, factory } = value;

    // Validate allocation ID
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid allocation ID format." });
    }

    // Find the allocation
    const allocation = await MachineMaterial.findById(id).session(session);
    if (!allocation) {
      return res.status(404).json({ message: "Allocation not found." });
    }

    // Validate material
    const material = await Material.findById(allocation.material).session(session);
    if (!material) {
      return res.status(404).json({ message: "Material not found." });
    }

    // Validate factory if provided
    if (factory) {
      const machine = await Machine.findById(allocation.machine).session(session);
      if (!machine) {
        return res.status(404).json({ message: "Machine not found." });
      }
      if (machine.factory?.toString() !== factory) {
        return res.status(400).json({ message: "Machine does not belong to the specified factory." });
      }
    }

    // Calculate stock difference
    const stockDifference = allocatedStock - allocation.allocatedStock;

    // Check stock availability
    if (stockDifference > 0 && stockDifference > material.currentStock) {
      return res.status(400).json({
        message: `Not enough stock available. Only ${material.currentStock} units available.`,
      });
    }

    // Update allocation history
    const historyEntry = {
      previousStock: allocation.allocatedStock,
      newStock: allocatedStock,
      date: new Date(),
      comment: comment || `Stock updated from ${allocation.allocatedStock} to ${allocatedStock}.`,
      ...(userId && isValidObjectId(userId) ? { changedBy: mongoose.Types.ObjectId(userId) } : {}),
    };
    allocation.history.push(historyEntry);
    allocation.allocatedStock = allocatedStock;
    await allocation.save({ session });

    // Update material stock
    if (stockDifference !== 0) {
      material.currentStock -= stockDifference;
      material.materialHistory.push({
        changeDate: new Date(),
        description:
          stockDifference > 0
            ? `Allocated ${stockDifference} additional units to machine ${allocation.machine}.`
            : `Returned ${Math.abs(stockDifference)} units from machine ${allocation.machine}.`,
        ...(userId && isValidObjectId(userId) ? { changedBy: mongoose.Types.ObjectId(userId) } : {}),
      });
      await material.save({ session });
    }

    await session.commitTransaction();
    return res.status(200).json({
      message: "Allocation updated successfully.",
      allocation,
      updatedMaterialStock: material.currentStock,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Update allocation error:", { error, allocationId: req.params.id, requestBody: req.body });
    return res.status(500).json({ message: "Server error while updating allocation.", error: error.message });
  } finally {
    session.endSession();
  }
};

// Delete a specific allocation
exports.deleteAllocation = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;

    // Validate allocation ID
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid allocation ID format." });
    }

    const allocation = await MachineMaterial.findById(id).session(session);
    if (!allocation) {
      return res.status(404).json({ message: "Allocation not found." });
    }

    // Restore stock to material
    const material = await Material.findById(allocation.material).session(session);
    if (!material) {
      return res.status(404).json({ message: "Material not found." });
    }

    material.currentStock += allocation.allocatedStock;
    material.materialHistory.push({
      changeDate: new Date(),
      description: `Returned ${allocation.allocatedStock} units from machine ${allocation.machine} due to allocation deletion.`,
    });
    await material.save({ session });

    await MachineMaterial.findByIdAndDelete(id, { session });
    await session.commitTransaction();
    return res.status(200).json({ message: "Allocation deleted successfully." });
  } catch (error) {
    await session.abortTransaction();
    console.error("Delete allocation error:", { error, allocationId: req.params.id });
    return res.status(500).json({ message: "Server error while deleting allocation.", error: error.message });
  } finally {
    session.endSession();
  }
};

// Get all stock allocations for a specific factory
exports.getAllocationsByFactory = async (req, res) => {
  try {
    const { factoryId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Validate factoryId and query parameters
    const { error, value } = querySchema.validate({ factory: factoryId, page, limit });
    if (error) {
      return res.status(400).json({ message: "Validation error", error: error.details[0].message });
    }

    // Validate factory existence
    const factory = await Factory.findById(factoryId);
    if (!factory) {
      return res.status(404).json({ message: "Factory not found." });
    }

    // Aggregate to filter allocations by factory
    const allocations = await MachineMaterial.aggregate([
      {
        $lookup: {
          from: "machines",
          localField: "machine",
          foreignField: "_id",
          as: "machine",
        },
      },
      { $unwind: "$machine" },
      { $match: { "machine.factory": mongoose.Types.ObjectId(factoryId) } },
      {
        $lookup: {
          from: "materials",
          localField: "material",
          foreignField: "_id",
          as: "material",
        },
      },
      { $unwind: "$material" },
      {
        $lookup: {
          from: "factories",
          localField: "machine.factory",
          foreignField: "_id",
          as: "machine.factory",
        },
      },
      { $unwind: { path: "$machine.factory", preserveNullAndEmptyArrays: true } },
      { $sort: { updatedAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ]);

    // Count total documents
    const total = await MachineMaterial.aggregate([
      {
        $lookup: {
          from: "machines",
          localField: "machine",
          foreignField: "_id",
          as: "machine",
        },
      },
      { $unwind: "$machine" },
      { $match: { "machine.factory": mongoose.Types.ObjectId(factoryId) } },
      { $count: "total" },
    ]).then(result => result[0]?.total || 0);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      total,
      page,
      limit,
      totalPages,
      data: allocations,
    });
  } catch (error) {
    console.error("Error fetching allocations by factory:", { error, factoryId: req.params.factoryId, query: req.query });
    return res.status(500).json({ message: "Server error while fetching allocations by factory.", error: error.message });
  }
};