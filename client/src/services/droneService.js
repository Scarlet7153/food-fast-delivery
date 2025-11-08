import api from './api'

const droneService = {
  // Get all drones for a restaurant
  async getRestaurantDrones(params = {}) {
    // Temporary fix: call drone service directly
    const response = await api.get('/drones', { params })
    return response.data
  },
  
  // Get a specific drone
  async getDroneById(droneId) {
    const response = await api.get(`/restaurant/drones/${droneId}`)
    return response.data
  },
  
  // Create a new drone
  async createDrone(droneData) {
  const response = await api.post('/restaurant/drones', droneData, { headers: { 'x-hide-global-error-toast': true } })
    return response.data
  },
  
  // Update a drone
  async updateDrone(droneId, droneData) {
    // Only allow editable fields to be sent to server
    const allowed = ['name', 'serialNumber', 'model', 'maxPayloadGrams', 'maxRangeMeters']
    const payload = {}
    allowed.forEach(key => {
      if (Object.prototype.hasOwnProperty.call(droneData, key)) payload[key] = droneData[key]
    })

  const response = await api.put(`/restaurant/drones/${droneId}`, payload, { headers: { 'x-hide-global-error-toast': true } })
    return response.data
  },
  
  // Delete a drone
  async deleteDrone(droneId) {
    const response = await api.delete(`/restaurant/drones/${droneId}`, { headers: { 'x-hide-global-error-toast': true } })
    return response.data
  },
  
  // Get drone status and location
  async getDroneStatus(droneId) {
    const response = await api.get(`/restaurant/drones/${droneId}/status`)
    return response.data
  },
  
  // Update drone status
  async updateDroneStatus(droneId, status) {
  const response = await api.patch(`/restaurant/drones/${droneId}/status`, { status }, { headers: { 'x-hide-global-error-toast': true } })
    return response.data
  },
  
  // Get drone location history
  async getDroneLocationHistory(droneId, params = {}) {
    const response = await api.get(`/restaurant/drones/${droneId}/locations`, { params })
    return response.data
  },
}

export { droneService }