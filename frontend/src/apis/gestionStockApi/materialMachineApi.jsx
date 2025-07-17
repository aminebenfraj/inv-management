import { apiRequest } from "../api"

const BASE_URL = "api/allocate"

// Get all allocations
export const getAllAllocations = (page = 1, limit = 100) => {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })

  return apiRequest("GET", `${BASE_URL}/allocates?${queryParams.toString()}`)
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

// Get allocations by factory ID
export const getAllocationsByFactory = async (factoryId, page = 1, limit = 10) => {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })

  const url = `${BASE_URL}/factory/${factoryId}?${queryParams.toString()}`

  try {
    return await apiRequest("GET", url)
  } catch (error) {
    console.error(`Error fetching allocations for factory ${factoryId}:`, error)
    throw error
  }
}