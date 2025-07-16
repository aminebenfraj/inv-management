const mongoose = require("mongoose");
const { Schema } = mongoose;

const machineSchema = new Schema({
  name: { type: String, required: true, unique: true }, 
  description: { type: String, default: "No description provided." },
  status: { type: String, enum: ['active', 'inactive', 'maintenance'], default: 'active' }, 
  factory: { type: mongoose.Schema.Types.ObjectId, ref: "Factory" },
}, { timestamps: true });
machineSchema.index({ factory: 1 })
module.exports = mongoose.model('Machine', machineSchema);
