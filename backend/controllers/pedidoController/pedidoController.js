const Pedido = require("../../models/pedido/Pedido")
const Material = require("../../models/gestionStockModels/MaterialModel")
const Solicitante = require("../../models/pedido/solicitanteModel")
const Tipo = require("../../models/pedido/tipoModel")
const Supplier = require("../../models/gestionStockModels/SupplierModel")
const TableStatus = require("../../models/pedido/TableStatus")
const mongoose = require("mongoose")

// Create Pedido with existence checks
exports.createPedido = async (req, res) => {
  try {
    const {
      tipo,
      descripcionInterna,
      fabricante,
      referencia,
      descripcionProveedor,
      solicitante,
      cantidad,
      precioUnidad,
      importePedido,
      fechaSolicitud,
      proveedor,
      comentario,
      pedir,
      introducidaSAP,
      aceptado,
      date_receiving,
      direccion,
      days,
      table_status,
      recepcionado,
      qrCode,
      ano,
    } = req.body

    // Check if required references exist
    const [existingTipo, existingMaterial, existingSolicitante] = await Promise.all([
      Tipo.findById(tipo),
      Material.findById(referencia),
      Solicitante.findById(solicitante),
    ])

    if (!existingTipo) return res.status(400).json({ error: "Tipo not found" })
    if (!existingMaterial) return res.status(400).json({ error: "Material not found" })
    if (!existingSolicitante) return res.status(400).json({ error: "Solicitante not found" })

    // Check optional references if provided
    if (proveedor) {
      const existingSupplier = await Supplier.findById(proveedor)
      if (!existingSupplier) return res.status(400).json({ error: "Supplier not found" })
    }

    if (table_status) {
      const existingTableStatus = await TableStatus.findById(table_status)
      if (!existingTableStatus) return res.status(400).json({ error: "Table status not found" })
    }

    // Calculate date_receiving if aceptado is provided
    let calculatedDateReceiving = date_receiving
    if (aceptado) {
      const acceptanceDate = new Date(aceptado)

      if (!date_receiving && days && days > 0) {
        calculatedDateReceiving = new Date(acceptanceDate)
        calculatedDateReceiving.setDate(acceptanceDate.getDate() + days)
      } else if (!date_receiving) {
        calculatedDateReceiving = new Date(acceptanceDate)
      }
    }

    // Set default values
    const newPedidoData = {
      tipo,
      descripcionInterna,
      fabricante,
      referencia,
      descripcionProveedor,
      solicitante,
      cantidad,
      precioUnidad,
      importePedido,
      fechaSolicitud: fechaSolicitud || new Date(),
      proveedor,
      comentario,
      ...(pedir && { pedir }),
      introducidaSAP,
      aceptado,
      date_receiving: calculatedDateReceiving,
      direccion,
      days,
      table_status,
      recepcionado,
      qrCode,
      ano: ano || new Date().getFullYear(),
    }

    // Create and save new Pedido
    const newPedido = new Pedido(newPedidoData)
    await newPedido.save()

    // Fetch the saved pedido with populated fields
    const savedPedido = await Pedido.findById(newPedido._id)
      .populate("tipo", "name")
      .populate("referencia", "description price")
      .populate("solicitante", "name email number")
      .populate("proveedor", "name")
      .populate("table_status", "name")

    res.status(201).json(savedPedido)
  } catch (error) {
    console.error("Error creating pedido:", error)
    res.status(500).json({ message: "Error creating pedido", error: error.message })
  }
}

// Get all pedidos with pagination, filtering, and search
exports.getAllPedidos = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "fechaSolicitud",
      sortOrder = -1,
      tipo,
      fabricante,
      proveedor,
      solicitante,
      recepcionado,
      pedir,
      anoDesde,
      anoHasta,
      fechaDesde,
      fechaHasta,
      table_status,
      minImporte,
      maxImporte,
    } = req.query

    // Ensure page & limit are valid positive integers
    page = Math.max(Number.parseInt(page, 10) || 1, 1)
    limit = Math.max(Number.parseInt(limit, 10) || 10, 1)

    // Build query filters
    const filter = {}

    // Process reference fields efficiently with Promise.all
    const referencePromises = []

    if (tipo) {
      referencePromises.push(
        (async () => {
          if (mongoose.Types.ObjectId.isValid(tipo)) {
            filter.tipo = tipo
          } else {
            const tipoByName = await Tipo.findOne({
              name: { $regex: new RegExp(tipo, "i") },
            })
            if (tipoByName) filter.tipo = tipoByName._id
          }
        })(),
      )
    }

    if (proveedor) {
      referencePromises.push(
        (async () => {
          if (mongoose.Types.ObjectId.isValid(proveedor)) {
            filter.proveedor = proveedor
          } else {
            const supplierByName = await Supplier.findOne({
              name: { $regex: new RegExp(proveedor, "i") },
            })
            if (supplierByName) filter.proveedor = supplierByName._id
          }
        })(),
      )
    }

    if (solicitante) {
      referencePromises.push(
        (async () => {
          if (mongoose.Types.ObjectId.isValid(solicitante)) {
            filter.solicitante = solicitante
          } else {
            const solicitanteByName = await Solicitante.findOne({
              $or: [
                { name: { $regex: new RegExp(solicitante, "i") } },
                { email: { $regex: new RegExp(solicitante, "i") } },
              ],
            })
            if (solicitanteByName) filter.solicitante = solicitanteByName._id
          }
        })(),
      )
    }

    if (table_status) {
      referencePromises.push(
        (async () => {
          if (mongoose.Types.ObjectId.isValid(table_status)) {
            filter.table_status = table_status
          } else {
            const statusByName = await TableStatus.findOne({
              name: { $regex: new RegExp(table_status, "i") },
            })
            if (statusByName) filter.table_status = statusByName._id
          }
        })(),
      )
    }

    // Wait for all reference field processing to complete
    await Promise.all(referencePromises)

    // Handle text search if provided
    if (search && search.trim() !== "") {
      // First, try to find by exact QR code
      const exactMatch = await Pedido.findOne({ qrCode: search.trim() })

      if (exactMatch) {
        return res.status(200).json({
          total: 1,
          page: 1,
          limit,
          totalPages: 1,
          data: [exactMatch],
        })
      }

      // If no exact match, use text search
      const searchPromises = []
      const searchResults = { tipo: [], solicitante: [], material: [], supplier: [] }

      if (mongoose.Types.ObjectId.isValid(search)) {
        // If search is a valid ObjectId, include it in the search
        searchPromises.push(
          Tipo.find({
            $or: [{ _id: search }, { name: { $regex: search, $options: "i" } }],
          })
            .select("_id")
            .then((results) => {
              searchResults.tipo = results
            }),
        )

        searchPromises.push(
          Solicitante.find({
            $or: [
              { _id: search },
              { name: { $regex: search, $options: "i" } },
              { email: { $regex: search, $options: "i" } },
            ],
          })
            .select("_id")
            .then((results) => {
              searchResults.solicitante = results
            }),
        )

        searchPromises.push(
          Material.find({
            $or: [
              { _id: search },
              { reference: { $regex: search, $options: "i" } },
              { description: { $regex: search, $options: "i" } },
            ],
          })
            .select("_id")
            .then((results) => {
              searchResults.material = results
            }),
        )

        searchPromises.push(
          Supplier.find({
            $or: [{ _id: search }, { name: { $regex: search, $options: "i" } }],
          })
            .select("_id")
            .then((results) => {
              searchResults.supplier = results
            }),
        )
      } else {
        // If search is not a valid ObjectId, search by text fields
        searchPromises.push(
          Tipo.find({ name: { $regex: search, $options: "i" } })
            .select("_id")
            .then((results) => {
              searchResults.tipo = results
            }),
        )

        searchPromises.push(
          Solicitante.find({
            $or: [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }],
          })
            .select("_id")
            .then((results) => {
              searchResults.solicitante = results
            }),
        )

        searchPromises.push(
          Material.find({
            $or: [{ reference: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }],
          })
            .select("_id")
            .then((results) => {
              searchResults.material = results
            }),
        )

        searchPromises.push(
          Supplier.find({ name: { $regex: search, $options: "i" } })
            .select("_id")
            .then((results) => {
              searchResults.supplier = results
            }),
        )
      }

      // Wait for all search promises to complete
      await Promise.all(searchPromises)

      // Build the $or query for search
      filter.$or = [
        { fabricante: { $regex: search, $options: "i" } },
        { descripcionInterna: { $regex: search, $options: "i" } },
        { descripcionProveedor: { $regex: search, $options: "i" } },
        { comentario: { $regex: search, $options: "i" } },
        { qrCode: { $regex: search, $options: "i" } },
      ]

      // Add reference field matches to the $or query
      if (searchResults.tipo.length > 0) {
        filter.$or.push({ tipo: { $in: searchResults.tipo.map((t) => t._id) } })
      }

      if (searchResults.solicitante.length > 0) {
        filter.$or.push({ solicitante: { $in: searchResults.solicitante.map((s) => s._id) } })
      }

      if (searchResults.material.length > 0) {
        filter.$or.push({ referencia: { $in: searchResults.material.map((m) => m._id) } })
      }

      if (searchResults.supplier.length > 0) {
        filter.$or.push({ proveedor: { $in: searchResults.supplier.map((p) => p._id) } })
      }
    } else {
      // If no text search but specific field filters are provided, use them
      if (fabricante) filter.fabricante = { $regex: fabricante, $options: "i" }
    }

    // Apply additional filters
    if (recepcionado) filter.recepcionado = recepcionado
    if (pedir) filter.pedir = pedir

    // Date and year range filters
    if (anoDesde || anoHasta) {
      filter.ano = {}
      if (anoDesde) filter.ano.$gte = Number.parseInt(anoDesde)
      if (anoHasta) filter.ano.$lte = Number.parseInt(anoHasta)
    }

    if (fechaDesde || fechaHasta) {
      filter.fechaSolicitud = {}
      if (fechaDesde) filter.fechaSolicitud.$gte = new Date(fechaDesde)
      if (fechaHasta) filter.fechaSolicitud.$lte = new Date(fechaHasta)
    }

    // Price range filter
    if (minImporte !== undefined || maxImporte !== undefined) {
      filter.importePedido = {}
      if (minImporte !== undefined) filter.importePedido.$gte = Number.parseFloat(minImporte)
      if (maxImporte !== undefined) filter.importePedido.$lte = Number.parseFloat(maxImporte)
    }

    // Prepare sort options
    const sort = {}
    sort[sortBy] = Number.parseInt(sortOrder)

    // Execute count and find queries in parallel for better performance
    const [totalPedidos, pedidos] = await Promise.all([
      Pedido.countDocuments(filter),
      Pedido.find(filter)
        .populate("tipo", "name")
        .populate("referencia", "description price reference")
        .populate("solicitante", "name email number")
        .populate("proveedor", "name")
        .populate("table_status", "name color")
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ])

    const totalPages = Math.ceil(totalPedidos / limit)

    res.json({
      total: totalPedidos,
      page,
      limit,
      totalPages,
      data: pedidos,
    })
  } catch (error) {
    console.error("Error fetching pedidos:", error)
    res.status(500).json({ message: "Error fetching pedidos", error: error.message })
  }
}

// Get a single pedido by ID
exports.getPedidoById = async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id)
      .populate("tipo", "name")
      .populate("referencia", "description price reference manufacturer")
      .populate("solicitante", "name email number")
      .populate("proveedor", "name contact email phone address")
      .populate("table_status", "name color")
      .lean()

    if (!pedido) return res.status(404).json({ message: "Pedido not found" })
    res.status(200).json(pedido)
  } catch (error) {
    console.error("Error fetching pedido by ID:", error)
    res.status(500).json({
      message: "Error fetching pedido details",
      error: error.message,
    })
  }
}

// Update a pedido
exports.updatePedido = async (req, res) => {
  try {
    // Find the pedido first to check if it exists
    const existingPedido = await Pedido.findById(req.params.id)
    if (!existingPedido) {
      return res.status(404).json({ message: "Pedido not found" })
    }

    // Validate reference fields in parallel
    const validationPromises = []

    if (req.body.referencia && req.body.referencia !== existingPedido.referencia.toString()) {
      validationPromises.push(
        Material.findById(req.body.referencia).then((material) => {
          if (!material) throw new Error("Material not found")
        }),
      )
    }

    if (req.body.tipo && req.body.tipo !== existingPedido.tipo.toString()) {
      validationPromises.push(
        Tipo.findById(req.body.tipo).then((tipo) => {
          if (!tipo) throw new Error("Tipo not found")
        }),
      )
    }

    if (req.body.solicitante && req.body.solicitante !== existingPedido.solicitante.toString()) {
      validationPromises.push(
        Solicitante.findById(req.body.solicitante).then((solicitante) => {
          if (!solicitante) throw new Error("Solicitante not found")
        }),
      )
    }

    if (
      req.body.proveedor &&
      req.body.proveedor !== (existingPedido.proveedor ? existingPedido.proveedor.toString() : null)
    ) {
      validationPromises.push(
        Supplier.findById(req.body.proveedor).then((proveedor) => {
          if (!proveedor) throw new Error("Supplier not found")
        }),
      )
    }

    if (
      req.body.table_status &&
      req.body.table_status !== (existingPedido.table_status ? existingPedido.table_status.toString() : null)
    ) {
      validationPromises.push(
        TableStatus.findById(req.body.table_status).then((tableStatus) => {
          if (!tableStatus) throw new Error("Table status not found")
        }),
      )
    }

    // Wait for all validation promises to complete
    try {
      await Promise.all(validationPromises)
    } catch (error) {
      return res.status(400).json({ error: error.message })
    }

    // Calculate date_receiving if aceptado is updated
    if (req.body.aceptado && req.body.aceptado !== existingPedido.aceptado?.toString()) {
      const acceptanceDate = new Date(req.body.aceptado)
      const days = req.body.days !== undefined ? req.body.days : existingPedido.days

      if (days && days > 0 && !req.body.date_receiving) {
        req.body.date_receiving = new Date(acceptanceDate)
        req.body.date_receiving.setDate(acceptanceDate.getDate() + days)
      } else if (!req.body.date_receiving) {
        req.body.date_receiving = new Date(acceptanceDate)
      }
    }

    // Update the pedido fields
    Object.keys(req.body).forEach((key) => {
      existingPedido[key] = req.body[key]
    })

    // Save the updated pedido
    await existingPedido.save()

    // Fetch the updated pedido with populated fields
    const updatedPedido = await Pedido.findById(req.params.id)
      .populate("tipo", "name")
      .populate("referencia", "description price reference")
      .populate("solicitante", "name email number")
      .populate("proveedor", "name")
      .populate("table_status", "name color")

    res.status(200).json(updatedPedido)
  } catch (error) {
    console.error("Error updating pedido:", error)
    res.status(400).json({ message: "Error updating pedido", error: error.message })
  }
}

// Delete a pedido
exports.deletePedido = async (req, res) => {
  try {
    const deletedPedido = await Pedido.findByIdAndDelete(req.params.id)
    if (!deletedPedido) return res.status(404).json({ message: "Pedido not found" })
    res.status(200).json({ message: "Pedido deleted successfully" })
  } catch (error) {
    console.error("Error deleting pedido:", error)
    res.status(500).json({ message: "Error deleting pedido", error: error.message })
  }
}

// Get filter options for dropdown menus
exports.getFilterOptions = async (req, res) => {
  try {
    const { field } = req.params

    // Only allow specific fields to be queried
    const allowedFields = [
      "tipo",
      "fabricante",
      "proveedor",
      "solicitante",
      "recepcionado",
      "pedir",
      "ano",
      "table_status",
    ]

    if (!allowedFields.includes(field)) {
      return res.status(400).json({ message: "Invalid field for filter options" })
    }

    let options = []

    // For non-reference fields, use distinct
    if (field === "fabricante" || field === "recepcionado" || field === "pedir" || field === "ano") {
      options = await Pedido.distinct(field)
    } else {
      // For reference fields, get the actual documents
      const distinctIds = await Pedido.distinct(field)

      // Filter out null/undefined values
      const validIds = distinctIds.filter((id) => id != null)

      if (validIds.length === 0) {
        return res.status(200).json([])
      }

      switch (field) {
        case "tipo":
          options = await Tipo.find({ _id: { $in: validIds } })
            .select("name")
            .lean()
          break
        case "solicitante":
          options = await Solicitante.find({ _id: { $in: validIds } })
            .select("name email")
            .lean()
          break
        case "proveedor":
          options = await Supplier.find({ _id: { $in: validIds } })
            .select("name")
            .lean()
          break
        case "table_status":
          options = await TableStatus.find({ _id: { $in: validIds } })
            .select("name color")
            .lean()
          break
      }
    }

    res.status(200).json(options)
  } catch (error) {
    console.error("Error fetching filter options:", error)
    res.status(500).json({ message: "Error fetching filter options", error: error.message })
  }
}

// Generate QR code for a pedido
exports.generateQRCode = async (req, res) => {
  try {
    const { id } = req.params

    // Find the pedido
    const pedido = await Pedido.findById(id)
    if (!pedido) {
      return res.status(404).json({ message: "Pedido not found" })
    }

    // If QR code already exists, return it
    if (pedido.qrCode) {
      return res.status(200).json({
        qrCode: pedido.qrCode,
        pedidoId: pedido._id,
      })
    }

    // Generate a new QR code
    await pedido.generateQRCode()

    res.status(200).json({
      qrCode: pedido.qrCode,
      pedidoId: pedido._id,
    })
  } catch (error) {
    console.error("Error generating QR code:", error)
    res.status(500).json({ message: "Error generating QR code", error: error.message })
  }
}

// Get pedido by QR code
exports.getPedidoByQRCode = async (req, res) => {
  try {
    const { qrCode } = req.params

    const pedido = await Pedido.findOne({ qrCode })
      .populate("tipo", "name")
      .populate("referencia", "description price reference manufacturer")
      .populate("solicitante", "name email number")
      .populate("proveedor", "name contact email phone address")
      .populate("table_status", "name color")
      .lean()

    if (!pedido) {
      return res.status(404).json({ message: "Pedido not found" })
    }

    res.status(200).json(pedido)
  } catch (error) {
    console.error("Error fetching pedido by QR code:", error)
    res.status(500).json({ message: "Error fetching pedido", error: error.message })
  }
}
