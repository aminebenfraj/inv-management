const mongoose = require("mongoose");
const { Schema } = mongoose;

const machineMaterialSchema = new Schema({
  machine: { type: mongoose.Schema.Types.ObjectId, ref: "Machine", required: true },
  material: { type: mongoose.Schema.Types.ObjectId, ref: "Material", required: true },
  allocatedStock: { type: Number, required: true, default: 0 }, // Stock assigned to this machine
  history: [
    {
      date: { type: Date, default: Date.now }, // Timestamp of the change
      changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // User who made the change
      previousStock: { type: Number }, // Old allocated stock
      newStock: { type: Number }, // New allocated stock
      comment: { type: String }, // Optional comment
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("MachineMaterial", machineMaterialSchema);
