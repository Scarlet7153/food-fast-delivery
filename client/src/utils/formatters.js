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
    PENDING_PAYMENT: 'Chờ thanh toán',
    PLACED: 'Đã đặt',
    CONFIRMED: 'Đang chuẩn bị',
    COOKING: 'Đang chuẩn bị',
    READY_FOR_PICKUP: 'Đang giao',
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
    PENDING: 'Đang giao',
    ASSIGNED: 'Đang giao',
    QUEUED: 'Đang giao',
    PREPARING: 'Đang giao',
    TAKEOFF: 'Đang giao',
    CRUISING: 'Đang giao',
    IN_FLIGHT: 'Đang giao',
    APPROACHING: 'Đang giao',
    LANDING: 'Đang giao',
    DELIVERED: 'Hoàn thành',
    RETURNING: 'Hoàn thành',
    COMPLETED: 'Hoàn thành',
    ABORTED: 'Thất bại',
    CANCELLED: 'Đã hủy',
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
    'IDLE': 'Rảnh',
    'BUSY': 'Bận'
  }
  
  return statusMap[status] || status
}

// Remove Vietnamese diacritics (accents)
export const removeVietnameseAccents = (str) => {
  if (!str) return ''
  
  // Map of accented characters to their non-accented equivalents
  const accents = {
    'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a', 'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a',
    'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
    'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
    'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
    'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o', 'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o',
    'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
    'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u', 'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
    'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
    'đ': 'd',
    'À': 'A', 'Á': 'A', 'Ạ': 'A', 'Ả': 'A', 'Ã': 'A', 'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ậ': 'A', 'Ẩ': 'A', 'Ẫ': 'A',
    'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ặ': 'A', 'Ẳ': 'A', 'Ẵ': 'A',
    'È': 'E', 'É': 'E', 'Ẹ': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ệ': 'E', 'Ể': 'E', 'Ễ': 'E',
    'Ì': 'I', 'Í': 'I', 'Ị': 'I', 'Ỉ': 'I', 'Ĩ': 'I',
    'Ò': 'O', 'Ó': 'O', 'Ọ': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ộ': 'O', 'Ổ': 'O', 'Ỗ': 'O',
    'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ợ': 'O', 'Ở': 'O', 'Ỡ': 'O',
    'Ù': 'U', 'Ú': 'U', 'Ụ': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ự': 'U', 'Ử': 'U', 'Ữ': 'U',
    'Ỳ': 'Y', 'Ý': 'Y', 'Ỵ': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y',
    'Đ': 'D'
  }
  
  return str.split('').map(char => accents[char] || char).join('')
}