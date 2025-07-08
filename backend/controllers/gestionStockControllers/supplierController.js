const Supplier = require('../../models/gestionStockModels/SupplierModel');
const Material = require("../../models/gestionStockModels/MaterialModel");

// Create a new supplier
exports.createSupplier = async (req, res) => {
  try {
    const supplierData = req.body;

    // Check for existing supplier with the same company name
    const existingSupplier = await Supplier.findOne({ companyName: supplierData.companyName });
    if (existingSupplier) {
      return res.status(400).json({ message: 'Supplier with this company name already exists.' });
    }

    const supplier = new Supplier(supplierData);
    await supplier.save();
    res.status(201).json(supplier);
  } catch (error) {
    res.status(500).json({ message: 'Error creating supplier.', error });
  }
};

// Get all suppliers
exports.getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find();
    res.status(200).json(suppliers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching suppliers.', error });
  }
};

// Get a supplier by ID
exports.getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found.' });
    }
    res.status(200).json(supplier);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching supplier.', error });
  }
};

// Update supplier details
exports.updateSupplier = async (req, res) => {
  try {
    const supplierData = req.body;

    const updatedSupplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      supplierData,
      { new: true, runValidators: true }
    );

    if (!updatedSupplier) {
      return res.status(404).json({ message: 'Supplier not found.' });
    }

    res.status(200).json(updatedSupplier);
  } catch (error) {
    res.status(500).json({ message: 'Error updating supplier.', error });
  }
};

// Delete a supplier
exports.deleteSupplier = async (req, res) => {
  try {
    // Check if any material references this supplier
    const materialWithSupplier = await Material.findOne({ supplier: req.params.id });
    if (materialWithSupplier) {
      return res.status(400).json({ 
        message: 'Cannot delete supplier as it is referenced by one or more materials' 
      });
    }

    const deletedSupplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!deletedSupplier) {
      return res.status(404).json({ message: 'Supplier not found.' });
    }
    res.status(200).json({ message: 'Supplier deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting supplier.', error });
  }
};