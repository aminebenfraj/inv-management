// models/Material.js
const mongoose = require("mongoose")
const { Schema } = mongoose

const materialSchema = new Schema(
  {
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
    manufacturer: { type: String, required: true },
    reference: { type: String, required: true, unique: true },
    referenceHistory: [
      {
        oldReference: { type: String, required: true },
        changedDate: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        comment: { type: String },
      },
    ],
    description: { type: String, default: "No description provided." },
    minimumStock: { type: Number, required: true },
    currentStock: { type: Number, required: true, default: 0 },
    orderLot: { type: Number, default: 0 },
    location: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true },
    critical: { type: Boolean, default: false },
    consumable: { type: Boolean, default: false },
    machines: [{ type: mongoose.Schema.Types.ObjectId, ref: "Machine" }],
    comment: { type: String },
    photo: { type: String },
    price: { type: Number, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    materialHistory: [
      {
        changeDate: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        description: String,
      },
    ],
  },
  { timestamps: true },
)

module.exports = mongoose.model("Material", materialSchema)

