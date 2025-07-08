const mongoose = require("mongoose");

const TipoSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
});

module.exports = mongoose.model("Tipo", TipoSchema);
