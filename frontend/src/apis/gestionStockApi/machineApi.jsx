import { apiRequest } from "../api"

const BASE_URL = "api/machines"

// Get all machines with pagination, search, and filters
export const getAllMachines = async (page = 1, limit = 10, search = "", filters = {}, sort = {}) => {
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

  const url = `${BASE_URL}?${queryParams.toString()}`

  try {
    return await apiRequest("GET", url)
  } catch (error) {
    console.error("Error fetching machines:", error)
    throw error
  }
}

// Get a single machine by ID
export const getMachineById = (id) => {
  return apiRequest("GET", `${BASE_URL}/${id}`)
}

// Create a new machine
export const createMachine = (data) => {
  return apiRequest("POST", BASE_URL, data)
}

// Update an existing machine
export const updateMachine = (id, data) => {
  return apiRequest("PUT", `${BASE_URL}/${id}`, data)
}

// Delete a machine
export const deleteMachine = (id) => {
  return apiRequest("DELETE", `${BASE_URL}/${id}`)
}

// Get a machine by factory ID and name
export const getMachineByFactoryAndName = async (factoryId, name) => {
  try {
    return await apiRequest("GET", `${BASE_URL}/factory/${factoryId}/name/${name}`)
  } catch (error) {
    console.error(`Error fetching machine by factory ${factoryId} and name ${name}:`, error)
    throw error
  }
}