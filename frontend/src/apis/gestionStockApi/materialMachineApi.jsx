import { apiRequest } from "../api"

const BASE_URL = "api/allocate"

// Get all allocations
export const getAllAllocations = () => {
  return apiRequest("GET", `${BASE_URL}/allocates`)
}

// Update an existing allocation
export const updateAllocation = (id, data) => {
  return apiRequest("PUT", `${BASE_URL}/${id}`, data)
}

// Get allocations for a specific material
export const getMaterialAllocations = (materialId) => {
  return apiRequest("GET", `${BASE_URL}/material/${materialId}`)
}

// Get stock history for a machine
export const getMachineStockHistory = (machineId) => {
  return apiRequest("GET", `${BASE_URL}/machine/${machineId}/history`)
}

// Allocate stock to machines
export const allocateStock = (data) => {
  return apiRequest("POST", BASE_URL, data)
}
// Delete an allocation
export const deleteAllocation = (id) => {
  return apiRequest("DELETE", `${BASE_URL}/${id}`)
}