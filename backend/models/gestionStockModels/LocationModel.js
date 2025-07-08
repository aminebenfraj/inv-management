const mongoose = require("mongoose");
const { Schema } = mongoose;

const locationSchema = new Schema({
    location: { type: String, required: true },
  }, { timestamps: true });
  
  module.exports = mongoose.model('Location', locationSchema);