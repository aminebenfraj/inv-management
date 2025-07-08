const mongoose = require("mongoose");

const SolicitanteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String,  unique: true },
  number: { type: String },
});

module.exports = mongoose.model("Solicitante", SolicitanteSchema);
