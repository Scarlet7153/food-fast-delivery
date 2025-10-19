import { io } from 'socket.io-client'

class SocketService {
  constructor() {
    this.socket = null
    this.isConnected = false
  }

  connect(token) {
    if (this.socket?.connected) {
      return this.socket
    }

    this.socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3007', {
      auth: {
        token
      },
      transports: ['websocket', 'polling']
    })

    this.socket.on('connect', () => {
      this.isConnected = true
    })

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false
    })

    this.socket.on('error', (error) => {
      console.error('Socket error:', error)
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  // Join order tracking room
  joinOrderRoom(orderId) {
    if (this.socket) {
      this.socket.emit('join:order', orderId)
    }
  }

  // Join mission tracking room
  joinMissionRoom(missionId) {
    if (this.socket) {
      this.socket.emit('join:mission', missionId)
    }
  }

  // Join restaurant dashboard room
  joinRestaurantDashboard() {
    if (this.socket) {
      this.socket.emit('join:restaurant:dashboard')
    }
  }

  // Join admin dashboard room
  joinAdminDashboard() {
    if (this.socket) {
      this.socket.emit('join:admin:dashboard')
    }
  }

  // Update drone location
  updateDroneLocation(data) {
    if (this.socket) {
      this.socket.emit('drone:location', data)
    }
  }

  // Update order status
  updateOrderStatus(data) {
    if (this.socket) {
      this.socket.emit('order:status:update', data)
    }
  }

  // Update mission status
  updateMissionStatus(data) {
    if (this.socket) {
      this.socket.emit('mission:status:update', data)
    }
  }

  // Update mission path
  updateMissionPath(data) {
    if (this.socket) {
      this.socket.emit('mission:path:update', data)
    }
  }

  // Listen for order updates
  onOrderUpdate(callback) {
    if (this.socket) {
      this.socket.on('order:updated', callback)
      this.socket.on('order:status:updated', callback)
      this.socket.on('order:tracking', callback)
    }
  }

  // Listen for mission updates
  onMissionUpdate(callback) {
    if (this.socket) {
      this.socket.on('mission:updated', callback)
      this.socket.on('mission:status:updated', callback)
      this.socket.on('mission:path:updated', callback)
    }
  }

  // Listen for drone location updates
  onDroneLocationUpdate(callback) {
    if (this.socket) {
      this.socket.on('drone:location:update', callback)
    }
  }

  // Listen for restaurant updates
  onRestaurantUpdate(callback) {
    if (this.socket) {
      this.socket.on('restaurant:order:updated', callback)
    }
  }

  // Listen for payment updates
  onPaymentUpdate(callback) {
    if (this.socket) {
      this.socket.on('payment:updated', callback)
    }
  }

  // Remove listeners
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners()
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id
    }
  }
}

export default new SocketService()
