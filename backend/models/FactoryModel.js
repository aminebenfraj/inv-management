const mongoose = require("mongoose")
const { Schema } = mongoose

const factorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: "No description provided.",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "maintenance"],
      default: "active",
    },
    // Users who have access to this factory
    authorizedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Machines in this factory
    machines: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Machine",
      },
    ],
    // Materials in this factory
    materials: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Material",
      },
    ],
    // Factory manager/supervisor
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    
  },
  { timestamps: true },
)

// Index for better query performance
factorySchema.index({ name: 1 })
factorySchema.index({ status: 1 })
factorySchema.index({ authorizedUsers: 1 })

module.exports = mongoose.model("Factory", factorySchema)
