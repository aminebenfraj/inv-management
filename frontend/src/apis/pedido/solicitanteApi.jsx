// API utility functions for Solicitante
import { apiRequest } from "../api"

const BASE_URL = "api/solicitantes"

// Get all solicitantes
export const getAllSolicitantes = async () => {
  try {
    return await apiRequest("GET", BASE_URL)
  } catch (error) {
    console.error("Error fetching solicitantes:", error)
    throw error
  }
}

// Get a single solicitante by ID
export const getSolicitanteById = (id) => {
  return apiRequest("GET", `${BASE_URL}/${id}`)
}

// Create a new solicitante
export const createSolicitante = (data) => {
  return apiRequest("POST", BASE_URL, data)
}

// Update an existing solicitante
export const updateSolicitante = (id, data) => {
  return apiRequest("PUT", `${BASE_URL}/${id}`, data)
}

// Delete a solicitante
export const deleteSolicitante = (id) => {
  return apiRequest("DELETE", `${BASE_URL}/${id}`)
}