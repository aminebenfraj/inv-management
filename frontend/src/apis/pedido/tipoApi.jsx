// API utility functions for Tipo
import { apiRequest } from "../api"

const BASE_URL = "api/tipos"

// Get all tipos
export const getAllTipos = async () => {
  try {
    return await apiRequest("GET", BASE_URL)
  } catch (error) {
    console.error("Error fetching tipos:", error)
    throw error
  }
}

// Get a single tipo by ID
export const getTipoById = (id) => {
  return apiRequest("GET", `${BASE_URL}/${id}`)
}

// Create a new tipo
export const createTipo = (data) => {
  return apiRequest("POST", BASE_URL, data)
}

// Update an existing tipo
export const updateTipo = (id, data) => {
  return apiRequest("PUT", `${BASE_URL}/${id}`, data)
}

// Delete a tipo
export const deleteTipo = (id) => {
  return apiRequest("DELETE", `${BASE_URL}/${id}`)
}