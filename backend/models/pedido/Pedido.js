const mongoose = require("mongoose")

const PedidoSchema = new mongoose.Schema({
  tipo: { type: mongoose.Schema.Types.ObjectId, ref: "Tipo", required: true },
  descripcionInterna: String,
  fabricante: { type: String, index: true },
  referencia: { type: mongoose.Schema.Types.ObjectId, ref: "Material", required: true, default: null }, // Auto-filled from Material description
  descripcionProveedor: { type: String }, // Auto-filled from Material description
  solicitante: { type: mongoose.Schema.Types.ObjectId, ref: "Solicitante", required: true },
  cantidad: Number,
  precioUnidad: Number,
  importePedido: Number,
  fechaSolicitud: { type: Date, index: true },
  proveedor: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" }, // Auto-filled from Material supplier
  comentario: String,
  pedir: { type: String, index: true, deprecated: true }, // Marked as deprecated, will be removed in future versions
  introducidaSAP: Date,
  aceptado: Date,
  date_receiving: Date, // New field for receiving date (2 weeks after acceptance)
  direccion: String,
  days: { type: Number },
  table_status: { type: mongoose.Schema.Types.ObjectId, ref: "TableStatus" },
  recepcionado: { type: String, index: true },
  qrCode: { type: String }, // Will contain a QR code representing the Pedido ID
  ano: { type: Number, index: true },
})



const QRCode = require("qrcode")

PedidoSchema.methods.generateQRCode = async function () {
  try {
    const qrContent = this._id.toString() // You can customize this if needed
    const qrDataURL = await QRCode.toDataURL(qrContent)

    this.qrCode = qrDataURL
    await this.save()
  } catch (error) {
    throw new Error("Failed to generate QR code: " + error.message)
  }
}



// Create a compound index for the most common search fields
PedidoSchema.index({
  referencia: 1,
  solicitante: 1,
  proveedor: 1,
  ano: 1,
})

// Create a text index specifically for the requested search fields
PedidoSchema.index({
  tipo: "text",
  referencia: "text",
  solicitante: "text",
  fabricante: "text",
  proveedor: "text",
})

PedidoSchema.pre("save", async function (next) {
  if (this.referencia) {
    const Material = mongoose.model("Material")
    const material = await Material.findById(this.referencia).populate("supplier")
    if (material) {
      this.precioUnidad = material.price
      this.proveedor = material.supplier
      this.descripcionProveedor = material.description
    }
  }
  if (this.cantidad && this.precioUnidad) {
    this.importePedido = this.cantidad * this.precioUnidad
  }

  // Calculate date_receiving when aceptado is set and days is specified
  if (this.aceptado) {
    const acceptanceDate = new Date(this.aceptado)
    const receivingDate = new Date(acceptanceDate)

    // Only add days if days is specified and is a positive number
    if (this.days && this.days > 0) {
      receivingDate.setDate(acceptanceDate.getDate() + this.days)
      this.date_receiving = receivingDate
    } else if (!this.date_receiving) {
      // If days is not specified but we need a default receiving date
      this.date_receiving = acceptanceDate
    }
  }

  next()
})

module.exports = mongoose.model("Pedido", PedidoSchema)
