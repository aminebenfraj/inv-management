// API utility functions for Pedido
import { apiRequest } from "../api"

const BASE_URL = "api/pedidos"

export const getAllPedidos = async (page = 1, limit = 10, search = "", filters = {}, sort = {}) => {
  // Build query string with all parameters
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })

  // Add search term if provided
  if (search) {
    queryParams.append("search", search)
  }

  // Add sorting parameters if provided
  if (sort.field) {
    queryParams.append("sortBy", sort.field)
    queryParams.append("sortOrder", sort.order || -1)
  }

  // Add all filters - improved to handle different filter types
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      // Handle special case for ObjectId vs string values
      if (key === "tipo" || key === "proveedor" || key === "solicitante" || key === "table_status") {
        // If it's an object with _id, use the _id
        if (typeof value === "object" && value !== null && value._id) {
          queryParams.append(key, value._id)
        } else {
          queryParams.append(key, value.toString())
        }
      } else if (key === "fechaDesde" || key === "fechaHasta") {
        // Format dates for API
        queryParams.append(key, new Date(value).toISOString())
      } else {
        queryParams.append(key, value.toString())
      }
    }
  })

  const url = `${BASE_URL}?${queryParams.toString()}`

  try {
    return await apiRequest("GET", url)
  } catch (error) {
    console.error("Error fetching pedidos:", error)
    throw error
  }
}

// Get filter options for dropdowns
export const getFilterOptions = async (field) => {
  try {
    return await apiRequest("GET", `${BASE_URL}/filters/${field}`)
  } catch (error) {
    console.error(`Error fetching ${field} options:`, error)
    throw error
  }
}

// Get a single pedido by ID
export const getPedidoById = (id) => {
  return apiRequest("GET", `${BASE_URL}/${id}`)
}

// Create a new pedido
export const createPedido = (data) => {
  return apiRequest("POST", BASE_URL, data)
}

// Update an existing pedido
export const updatePedido = (id, data) => {
  return apiRequest("PUT", `${BASE_URL}/${id}`, data)
}

// Delete a pedido
export const deletePedido = (id) => {
  return apiRequest("DELETE", `${BASE_URL}/${id}`)
}

// Generate QR code for a pedido
export const generateQRCode = (id) => {
  return apiRequest("GET", `${BASE_URL}/${id}/qrcode`)
}

// Get pedido by QR code
export const getPedidoByQRCode = (qrCode) => {
  return apiRequest("GET", `${BASE_URL}/qrcode/${qrCode}`)
}
