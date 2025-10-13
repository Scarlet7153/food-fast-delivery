// Format currency to VND
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0₫'
  }
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(amount)
}

// Format number with commas
export const formatNumber = (number) => {
  return new Intl.NumberFormat('vi-VN').format(number)
}

// Format date
export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  }
  
  return new Intl.DateTimeFormat('vi-VN', defaultOptions).format(new Date(date))
}

// Format date and time
export const formatDateTime = (date) => {
  if (!date) return 'Chưa có'
  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) return 'Không hợp lệ'
  
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj)
}

// Format time only
export const formatTime = (date) => {
  if (!date) return 'Chưa có'
  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) return 'Không hợp lệ'
  
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj)
}

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (date) => {
  const now = new Date()
  const targetDate = new Date(date)
  const diffInSeconds = Math.floor((now - targetDate) / 1000)

  if (diffInSeconds < 60) {
    return 'Vừa xong'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} phút trước`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} giờ trước`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays} ngày trước`
  }

  return formatDate(date)
}

// Format phone number
export const formatPhoneNumber = (phone) => {
  if (!phone) return ''
  
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '')
  
  // Format Vietnamese phone number
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')
  }
  
  if (cleaned.length === 11 && cleaned.startsWith('84')) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{3})(\d{3})/, '+$1 $2 $3 $4')
  }
  
  return phone
}

// Format weight
export const formatWeight = (grams) => {
  if (grams < 1000) {
    return `${grams}g`
  }
  
  const kg = grams / 1000
  return `${kg.toFixed(1)}kg`
}

// Format distance
export const formatDistance = (meters) => {
  if (meters === null || meters === undefined || isNaN(meters)) {
    return '0m'
  }
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  
  const km = meters / 1000
  return `${km.toFixed(1)}km`
}

// Format duration
export const formatDuration = (minutes) => {
  if (minutes < 60) {
    return `${minutes} phút`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (remainingMinutes === 0) {
    return `${hours} giờ`
  }
  
  return `${hours} giờ ${remainingMinutes} phút`
}

// Format order status
export const formatOrderStatus = (status) => {
  const statusMap = {
    PLACED: 'Đã đặt',
    CONFIRMED: 'Đã xác nhận',
    COOKING: 'Đang nấu',
    READY_FOR_PICKUP: 'Sẵn sàng giao',
    IN_FLIGHT: 'Đang giao',
    DELIVERED: 'Đã giao',
    CANCELLED: 'Đã hủy',
    FAILED: 'Thất bại'
  }
  
  return statusMap[status] || status
}

// Format mission status
export const formatMissionStatus = (status) => {
  const statusMap = {
    QUEUED: 'Đang chờ',
    PREPARING: 'Chuẩn bị',
    TAKEOFF: 'Cất cánh',
    CRUISING: 'Bay',
    APPROACHING: 'Tiến gần',
    LANDING: 'Hạ cánh',
    DELIVERED: 'Đã giao',
    RETURNING: 'Quay về',
    COMPLETED: 'Hoàn thành',
    ABORTED: 'Hủy bỏ',
    FAILED: 'Thất bại'
  }
  
  return statusMap[status] || status
}

// Format payment status
export const formatPaymentStatus = (status) => {
  const statusMap = {
    UNPAID: 'Chưa thanh toán',
    PENDING: 'Đang xử lý',
    PAID: 'Đã thanh toán',
    FAILED: 'Thất bại',
    REFUNDED: 'Đã hoàn tiền'
  }
  
  return statusMap[status] || status
}

// Truncate text
export const truncateText = (text, maxLength) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Capitalize first letter
export const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Format drone status
export const formatDroneStatus = (status) => {
  const statusMap = {
    'IDLE': 'Đang Rảnh',
    'CHARGING': 'Đang Sạc',
    'MAINTENANCE': 'Đang Bảo Trì',
    'IN_FLIGHT': 'Đang Bay',
    'ERROR': 'Đang Lỗi'
  }
  
  return statusMap[status] || status
}