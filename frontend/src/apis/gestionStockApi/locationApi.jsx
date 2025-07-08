import { apiRequest } from "../api"

const BASE_URL = "api/location"

// Get all locations
export const getAllLocations = () => {
  return apiRequest("GET", BASE_URL)
}

// Get a single location by ID
export const getLocationById = (id) => {
  return apiRequest("GET", `${BASE_URL}/${id}`)
}

// Create a new location
export const createLocation = (data) => {
  return apiRequest("POST", BASE_URL, data)
}

// Update an existing location
export const updateLocation = (id, data) => {
  return apiRequest("PUT", `${BASE_URL}/${id}`, data)
}

// Delete a location
export const deleteLocation = (id) => {
  return apiRequest("DELETE", `${BASE_URL}/${id}`)
}

