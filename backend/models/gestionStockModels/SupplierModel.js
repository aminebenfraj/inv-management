const mongoose = require("mongoose");
const { Schema } = mongoose;

const supplierSchema = new Schema({
  companyName: { type: String, required: true, unique: true, trim: true },
  commercialContact: { type: String,trim: true },
  companyContact: { type: String,trim: true },
  technicalContact: { type: String,trim: true },
  name: { type: String,trim: true },
  businessPhone: { type: String, trim: true},
  officePhone: { type: String, trim: true },
  technicalPhone: { type: String,trim: true},
  companyEmail: { type: String, trim: true},
  businessEmail: { type: String,trim: true },
  technicalEmail: { type: String,trim: true},
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);
