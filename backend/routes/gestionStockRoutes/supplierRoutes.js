const express = require('express');
const { createSupplier, getAllSuppliers, getSupplierById, updateSupplier, deleteSupplier } = require('../../controllers/gestionStockControllers/supplierController');
const router = express.Router();

// CRUD Routes for Supplier
router.post('/', createSupplier);          // Create Supplier
router.get('/', getAllSuppliers);          // Get All Suppliers
router.get('/:id', getSupplierById);       // Get Supplier by ID
router.put('/:id', updateSupplier);        // Update Supplier
router.delete('/:id', deleteSupplier);     // Delete Supplier

module.exports = router;
