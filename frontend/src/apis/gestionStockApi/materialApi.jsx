import { apiRequest } from "../api"

const BASE_URL = "api/materials"

export const getAllMaterials = async (page = 1, limit = 10, search = "", filters = {}, sort = {}) => {
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

  // Add all filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, value.toString())
    }
  })

  const url = `${BASE_URL}?${queryParams.toString()}`

  try {
    return await apiRequest("GET", url)
  } catch (error) {
    console.error("Error fetching materials:", error)
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

// Get a single material by ID
export const getMaterialById = (id) => {
  return apiRequest("GET", `${BASE_URL}/${id}`)
}

// Create a new material
export const createMaterial = (data) => {
  return apiRequest("POST", BASE_URL, data)
}

// Update an existing material
export const updateMaterial = (id, data) => {
  return apiRequest("PUT", `${BASE_URL}/${id}`, data)
}

// Delete a material
export const deleteMaterial = (id) => {
  return apiRequest("DELETE", `${BASE_URL}/${id}`)
}

// Remove a reference from history
export const removeReferenceFromHistory = (materialId, historyId) => {
  return apiRequest("DELETE", `${BASE_URL}/${materialId}/reference-history/${historyId}`)
}

// Get materials by factory ID
export const getMaterialsByFactoryId = async (factoryId, page = 1, limit = 10, search = "", filters = {}, sort = {}) => {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })

  if (search) {
    queryParams.append("search", search)
  }

  if (sort.field) {
    queryParams.append("sortBy", sort.field)
    queryParams.append("sortOrder", sort.order || -1)
  }

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, value.toString())
    }
  })

  const url = `${BASE_URL}/factory/${factoryId}?${queryParams.toString()}`

  try {
    return await apiRequest("GET", url)
  } catch (error) {
    console.error(`Error fetching materials for factory ${factoryId}:`, error)
    throw error
  }
}

// Get materials by machine ID
export const getMaterialsByMachineId = async (machineId, filters = {}) => {
  const queryParams = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, value.toString())
    }
  })

  const url = `${BASE_URL}/machine/${machineId}?${queryParams.toString()}`

  try {
    return await apiRequest("GET", url)
  } catch (error) {
    console.error(`Error fetching materials for machine ${machineId}:`, error)
    throw error
  }
}