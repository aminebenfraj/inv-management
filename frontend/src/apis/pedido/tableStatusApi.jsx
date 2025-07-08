// API utility functions for Table Status
import { apiRequest } from "../api"

const BASE_URL = "api/tableStatus"

// Get all table statuses
export const getAllTableStatuses = async (sortBy = "order", sortOrder = 1) => {
  try {
    const queryParams = new URLSearchParams({
      sortBy: sortBy,
      sortOrder: sortOrder.toString(),
    })

    return await apiRequest("GET", `${BASE_URL}?${queryParams.toString()}`)
  } catch (error) {
    console.error("Error fetching table statuses:", error)
    throw error
  }
}

// Get a single table status by ID
export const getTableStatusById = (id) => {
  return apiRequest("GET", `${BASE_URL}/${id}`)
}

// Create a new table status
export const createTableStatus = (data) => {
  return apiRequest("POST", BASE_URL, data)
}

// Update an existing table status
export const updateTableStatus = (id, data) => {
  return apiRequest("PUT", `${BASE_URL}/${id}`, data)
}

// Delete a table status
export const deleteTableStatus = (id) => {
  return apiRequest("DELETE", `${BASE_URL}/${id}`)
}

// Reorder table statuses
export const reorderTableStatuses = (orders) => {
  return apiRequest("POST", `${BASE_URL}/reorder`, { orders })
}

