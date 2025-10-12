import api from './api'

const missionService = {
  // Get all delivery missions for a restaurant
  async getRestaurantMissions(params = {}) {
    const response = await api.get('/restaurant/missions', { params })
    return response.data
  },
  
  // Get a specific mission
  async getMissionById(missionId) {
    const response = await api.get(`/restaurant/missions/${missionId}`)
    return response.data
  },
  
  // Create a new delivery mission
  async createMission(missionData) {
    const response = await api.post('/restaurant/missions', missionData)
    return response.data
  },
  
  // Update mission status
  async updateMissionStatus(missionId, status, note = '') {
    const response = await api.patch(`/restaurant/missions/${missionId}/status`, { status, note })
    return response.data
  },
  
  // Assign drone to mission
  async assignDroneToMission(missionId, droneId) {
    const response = await api.post(`/restaurant/missions/${missionId}/assign-drone`, { droneId })
    return response.data
  },
  
  // Get mission tracking info
  async getMissionTracking(missionId) {
    const response = await api.get(`/restaurant/missions/${missionId}/tracking`)
    return response.data
  },
  
  // Get mission location updates
  async getMissionLocationUpdates(missionId) {
    const response = await api.get(`/restaurant/missions/${missionId}/locations`)
    return response.data
  },
  
  // Complete mission
  async completeMission(missionId, deliveryNote = '') {
    const response = await api.post(`/restaurant/missions/${missionId}/complete`, { deliveryNote })
    return response.data
  },
  
  // Cancel mission
  async cancelMission(missionId, reason = '') {
    const response = await api.post(`/restaurant/missions/${missionId}/cancel`, { reason })
    return response.data
  },
}

export { missionService }