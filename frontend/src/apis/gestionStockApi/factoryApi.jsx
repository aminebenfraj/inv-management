import { apiRequest } from "../api"

const BASE_URL = "api/factories"

export const getAllFactories = async (page = 1, limit = 10, search = "", filters = {}, sort = {}) => {
  const queryParams = new URLSearchParams({
    page: page.toString(), // Fixed: Changed toStringAtomic to toString
    limit: limit.toString(),
  });

  if (search) {
    queryParams.append("search", search);
  }

  if (sort.field) {
    queryParams.append("sortBy", sort.field);
    queryParams.append("sortOrder", sort.order || -1);
  }

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, value.toString());
    }
  });

  const url = `${BASE_URL}?${queryParams.toString()}`;

  try {
    return await apiRequest("GET", url);
  } catch (error) {
    console.error("Error fetching factories:", error);
    throw error;
  }
};

export const getFactoryById = (id) => {
  return apiRequest("GET", `${BASE_URL}/${id}`)
}

export const createFactory = (data) => {
  return apiRequest("POST", BASE_URL, data)
}

export const updateFactory = (id, data) => {
  return apiRequest("PUT", `${BASE_URL}/${id}`, data)
}

export const deleteFactory = (id) => {
  return apiRequest("DELETE", `${BASE_URL}/${id}`)
}

export const addAuthorizedUser = (factoryId, userId) => {
  return apiRequest("POST", `${BASE_URL}/${factoryId}/authorized-users`, { userId })
}

export const removeAuthorizedUser = (factoryId, userId) => {
  return apiRequest("DELETE", `${BASE_URL}/${factoryId}/authorized-users/${userId}`)
}

export const assignMachine = (factoryId, machineId) => {
  return apiRequest("POST", `${BASE_URL}/${factoryId}/machines`, { machineId })
}

export const removeMachine = (factoryId, machineId) => {
  return apiRequest("DELETE", `${BASE_URL}/${factoryId}/machines/${machineId}`)
}

export const assignMaterial = (factoryId, materialId) => {
  return apiRequest("POST", `${BASE_URL}/${factoryId}/materials`, { materialId })
}

export const removeMaterial = (factoryId, materialId) => {
  return apiRequest("DELETE", `${BASE_URL}/${factoryId}/materials/${materialId}`)
}

export const getUserFactories = () => {
  return apiRequest("GET", `${BASE_URL}/user-factories`)
}