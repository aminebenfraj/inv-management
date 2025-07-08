import { apiRequest } from "../api"

const BASE_URL = "api/suppliers"

// Get all suppliers
export const getAllSuppliers = () => {
  return apiRequest("GET", BASE_URL)
}

// Get a single supplier by ID
export const getSupplierById = (id) => {
  return apiRequest("GET", `${BASE_URL}/${id}`)
}

// Create a new supplier
export const createSupplier = (data) => {
  return apiRequest("POST", BASE_URL, data)
}

// Update an existing supplier
export const updateSupplier = (id, data) => {
  return apiRequest("PUT", `${BASE_URL}/${id}`, data)
}

// Delete a supplier
export const deleteSupplier = (id) => {
  return apiRequest("DELETE", `${BASE_URL}/${id}`)
}

