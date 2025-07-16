const Machine = require("../../models/gestionStockModels/MachineModel");
const Factory = require("../../models/FactoryModel");
const Joi = require("joi");

// Validation schemas
const machineSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).allow("").optional(),
  status: Joi.string().valid("active", "inactive", "maintenance").optional(),
  factory: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
});

const querySchema = Joi.object({
  factory: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
  status: Joi.string().valid("active", "inactive", "maintenance").optional(),
  search: Joi.string().max(100).allow("").optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

// Create a new machine
exports.createMachine = async (req, res) => {
  try {
    // Validate request body
    const { error } = machineSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: "Validation error", error: error.details[0].message });
    }

    const { name, description, status, factory } = req.body;

    // Check if the machine already exists
    const existingMachine = await Machine.findOne({ name });
    if (existingMachine) {
      return res.status(400).json({ message: "Machine with this name already exists." });
    }

    // Validate factory if provided
    if (factory) {
      const existingFactory = await Factory.findById(factory);
      if (!existingFactory) {
        return res.status(400).json({ message: "Factory not found." });
      }
    }

    const session = await Machine.startSession();
    session.startTransaction();

    try {
      // Create new machine
      const machine = new Machine({ name, description, status, factory });
      await machine.save({ session });

      // If factory is provided, add machine to factory's machines array
      if (factory) {
        await Factory.findByIdAndUpdate(
          factory,
          { $addToSet: { machines: machine._id } },
          { session }
        );
      }

      await session.commitTransaction();
      const populatedMachine = await Machine.findById(machine._id).populate("factory").session(null);
      res.status(201).json(populatedMachine);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error("Error creating machine:", { error, requestBody: req.body });
    res.status(500).json({ message: "Server error while creating machine.", error: error.message });
  }
};

// Get all machines with pagination
exports.getAllMachines = async (req, res) => {
  try {
    // Validate query parameters
    const { error, value } = querySchema.validate(req.query);
    if (error) {
      return res.status(400).json({ message: "Validation error", error: error.details[0].message });
    }

    const { factory, status, search, page, limit } = value;

    // Build query filters
    const filter = {};
    if (factory) filter.factory = factory;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Count total documents for pagination
    const totalMachines = await Machine.countDocuments(filter);
    const totalPages = Math.ceil(totalMachines / limit);

    // Fetch machines with pagination
    const machines = await Machine.find(filter)
      .populate("factory")
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.status(200).json({
      total: totalMachines,
      page,
      limit,
      totalPages,
      data: machines,
    });
  } catch (error) {
    console.error("Error fetching machines:", { error, query: req.query });
    res.status(500).json({ message: "Server error while fetching machines.", error: error.message });
  }
};

// Get a specific machine by ID
exports.getMachineById = async (req, res) => {
  try {
    // Validate ID
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid machine ID format." });
    }

    const machine = await Machine.findById(req.params.id).populate("factory");
    if (!machine) {
      return res.status(404).json({ message: "Machine not found." });
    }
    res.status(200).json(machine);
  } catch (error) {
    console.error("Error fetching machine by ID:", { error, machineId: req.params.id });
    res.status(500).json({ message: "Server error while fetching machine.", error: error.message });
  }
};

// Update a machine
exports.updateMachine = async (req, res) => {
  try {
    // Validate request body
    const { error } = machineSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: "Validation error", error: error.details[0].message });
    }

    const { name, description, status, factory } = req.body;

    const existingMachine = await Machine.findById(req.params.id);
    if (!existingMachine) {
      return res.status(404).json({ message: "Machine not found." });
    }

    // Validate factory if provided
    if (factory) {
      const existingFactory = await Factory.findById(factory);
      if (!existingFactory) {
        return res.status(400).json({ message: "Factory not found." });
      }
    }

    const session = await Machine.startSession();
    session.startTransaction();

    try {
      // Remove from old factory if factory is changing
      if (existingMachine.factory && existingMachine.factory.toString() !== factory) {
        await Factory.findByIdAndUpdate(
          existingMachine.factory,
          { $pull: { machines: req.params.id } },
          { session }
        );
      }

      // Add to new factory if factory is provided
      if (factory && existingMachine.factory?.toString() !== factory) {
        await Factory.findByIdAndUpdate(
          factory,
          { $addToSet: { machines: req.params.id } },
          { session }
        );
      }

      // Update machine
      const updatedMachine = await Machine.findByIdAndUpdate(
        req.params.id,
        { name, description, status, factory },
        { new: true, runValidators: true, session }
      ).populate("factory");

      await session.commitTransaction();
      res.status(200).json(updatedMachine);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error("Error updating machine:", { error, machineId: req.params.id, requestBody: req.body });
    res.status(500).json({ message: "Server error while updating machine.", error: error.message });
  }
};

// Delete a machine
exports.deleteMachine = async (req, res) => {
  try {
    // Validate ID
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid machine ID format." });
    }

    const machine = await Machine.findById(req.params.id);
    if (!machine) {
      return res.status(404).json({ message: "Machine not found." });
    }

    const session = await Machine.startSession();
    session.startTransaction();

    try {
      // Remove machine from factory if assigned
      if (machine.factory) {
        await Factory.findByIdAndUpdate(
          machine.factory,
          { $pull: { machines: req.params.id } },
          { session }
        );
      }

      await Machine.findByIdAndDelete(req.params.id, { session });
      await session.commitTransaction();
      res.status(200).json({ message: "Machine deleted successfully." });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error("Error deleting machine:", { error, machineId: req.params.id });
    res.status(500).json({ message: "Server error while deleting machine.", error: error.message });
  }
};

exports.getMachineByFactoryAndName = async (req, res) => {
  try {
    // Validate query parameters
    const { error, value } = getMachineByFactoryAndNameSchema.validate({
      factoryId: req.params.factoryId,
      name: req.params.name,
    });
    if (error) {
      return res.status(400).json({ message: "Validation error", error: error.details[0].message });
    }

    const { factoryId, name } = value;

    // Validate factory existence
    const existingFactory = await Factory.findById(factoryId);
    if (!existingFactory) {
      return res.status(404).json({ message: "Factory not found." });
    }

    // Find machine by factory and name
    const machine = await Machine.findOne({ factory: factoryId, name }).populate("factory");
    if (!machine) {
      return res.status(404).json({ message: "Machine not found in this factory." });
    }

    res.status(200).json(machine);
  } catch (error) {
    console.error("Error fetching machine by factory and name:", {
      error,
      factoryId: req.params.factoryId,
      name: req.params.name,
    });
    res.status(500).json({ message: "Server error while fetching machine.", error: error.message });
  }
};