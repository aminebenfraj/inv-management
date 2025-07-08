const Location = require('../../models/gestionStockModels/LocationModel');
const Material = require('../../models/gestionStockModels/MaterialModel');

// Create a new location
exports.createLocation = async (req, res) => {
  try {
    const { location } = req.body;
    const newLocation = new Location({ location });
    await newLocation.save();
    res.status(201).json(newLocation);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create location', error });
  }
};

// Get all locations
exports.getAllLocations = async (req, res) => {
  try {
    const locations = await Location.find();
    res.status(200).json(locations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch locations', error });
  }
};

// Get a location by ID
exports.getLocationById = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) return res.status(404).json({ message: 'Location not found' });
    res.status(200).json(location);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch location', error });
  }
};

// Update a location
exports.updateLocation = async (req, res) => {
  try {
    const { location } = req.body;
    const updatedLocation = await Location.findByIdAndUpdate(
      req.params.id, 
      { location }, 
      { new: true }
    );
    if (!updatedLocation) return res.status(404).json({ message: 'Location not found' });
    res.status(200).json(updatedLocation);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update location', error });
  }
};

// Delete a location
exports.deleteLocation = async (req, res) => {
  try {
    // Check if any material references this location
    const materialWithLocation = await Material.findOne({ location: req.params.id });
    if (materialWithLocation) {
      return res.status(400).json({ 
        message: 'Cannot delete location as it is referenced by one or more materials' 
      });
    }

    const deletedLocation = await Location.findByIdAndDelete(req.params.id);
    if (!deletedLocation) return res.status(404).json({ message: 'Location not found' });
    res.status(200).json({ message: 'Location deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete location', error });
  }
};