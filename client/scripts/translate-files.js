const fs = require('fs')
const path = require('path')

// Translation mappings
const translations = {
  // Navigation & Menu
  'Home': 'Trang Chủ',
  'Restaurants': 'Nhà Hàng', 
  'Orders': 'Đơn Hàng',
  'Cart': 'Giỏ Hàng',
  'Profile': 'Hồ Sơ',
  'Login': 'Đăng Nhập',
  'Register': 'Đăng Ký',
  'Logout': 'Đăng Xuất',
  
  // Restaurant Console
  'Dashboard': 'Bảng Điều Khiển',
  'Menu': 'Thực Đơn',
  'Drones': 'Drone',
  'Missions': 'Nhiệm Vụ',
  'Settings': 'Cài Đặt',
  
  // Admin Panel
  'User Management': 'Quản Lý Người Dùng',
  'Restaurant Management': 'Quản Lý Nhà Hàng',
  'Order Management': 'Quản Lý Đơn Hàng',
  'Drone Fleet Management': 'Quản Lý Đội Drone',
  'Delivery Missions': 'Nhiệm Vụ Giao Hàng',
  'System Settings': 'Cài Đặt Hệ Thống',
  
  // Common UI Text
  'Search': 'Tìm kiếm',
  'Filter': 'Lọc',
  'View All': 'Xem Tất Cả',
  'Order Now': 'Đặt Ngay',
  'Add to Cart': 'Thêm Vào Giỏ',
  'Go to Cart': 'Đến Giỏ Hàng',
  'Checkout': 'Thanh Toán',
  'Continue': 'Tiếp Tục',
  'Back': 'Quay Lại',
  'Next': 'Tiếp Theo',
  'Previous': 'Trước Đó',
  'Save': 'Lưu',
  'Cancel': 'Hủy',
  'Edit': 'Sửa',
  'Delete': 'Xóa',
  'View': 'Xem',
  'Create': 'Tạo',
  'Update': 'Cập Nhật',
  'Submit': 'Gửi',
  'Confirm': 'Xác Nhận',
  'Close': 'Đóng',
  'Loading...': 'Đang tải...',
  'No data found': 'Không tìm thấy dữ liệu',
  'Error occurred': 'Đã xảy ra lỗi',
  'Success': 'Thành công',
  'Warning': 'Cảnh báo',
  'Info': 'Thông tin',
  
  // Food & Restaurant
  'Restaurant': 'Nhà hàng',
  'Restaurants': 'Nhà hàng',
  'Menu Items': 'Món ăn',
  'Price': 'Giá',
  'Quantity': 'Số lượng',
  'Total': 'Tổng',
  'Subtotal': 'Tạm tính',
  'Delivery Fee': 'Phí giao hàng',
  'Tax': 'Thuế',
  'Discount': 'Giảm giá',
  'Featured Restaurants': 'Nhà Hàng Nổi Bật',
  'Browse by Category': 'Duyệt Theo Danh Mục',
  'All Categories': 'Tất Cả Danh Mục',
  'Search restaurants, cuisines, or dishes...': 'Tìm kiếm nhà hàng, món ăn...',
  'restaurants found': 'nhà hàng',
  'Search Results for': 'Kết quả tìm kiếm cho',
  
  // Drone & Delivery
  'Drone': 'Drone',
  'Mission': 'Nhiệm vụ',
  'Delivery': 'Giao hàng',
  'Estimated Time': 'Thời gian ước tính',
  'Distance': 'Khoảng cách',
  'Weight': 'Trọng lượng',
  'Battery': 'Pin',
  'Status': 'Trạng thái',
  'Location': 'Vị trí',
  'Food Delivered by Drones': 'Giao Đồ Ăn Bằng Drone',
  'Experience the future of food delivery. Fast, safe, and efficient delivery powered by cutting-edge drone technology.': 'Trải nghiệm tương lai của giao đồ ăn. Giao hàng nhanh chóng, an toàn và hiệu quả với công nghệ drone tiên tiến.',
  'Lightning Fast': 'Siêu Nhanh',
  'Contactless Delivery': 'Giao Không Tiếp Xúc',
  'Premium Quality': 'Chất Lượng Cao Cấp',
  'Drone Delivery Available': 'Có Giao Hàng Bằng Drone',
  'Drone delivery': 'Giao hàng bằng drone',
  
  // Payment
  'Payment': 'Thanh toán',
  'Payment Method': 'Phương thức thanh toán',
  'Total Amount': 'Tổng tiền',
  'Pay Now': 'Thanh toán ngay',
  'Payment Successful': 'Thanh toán thành công',
  'Payment Failed': 'Thanh toán thất bại',
  
  // Status
  'Active': 'Hoạt động',
  'Inactive': 'Không hoạt động',
  'Pending': 'Đang chờ',
  'Approved': 'Đã duyệt',
  'Rejected': 'Từ chối',
  'Completed': 'Hoàn thành',
  'Cancelled': 'Đã hủy',
  'Failed': 'Thất bại',
  'Placed': 'Đã đặt',
  'Confirmed': 'Đã xác nhận',
  'Cooking': 'Đang nấu',
  'Ready for Pickup': 'Sẵn sàng giao',
  'In Flight': 'Đang giao',
  'Delivered': 'Đã giao',
  
  // User & Account
  'User': 'Người dùng',
  'Customer': 'Khách hàng',
  'Restaurant Owner': 'Chủ nhà hàng',
  'Admin': 'Quản trị viên',
  'Name': 'Tên',
  'Email': 'Email',
  'Phone': 'Số điện thoại',
  'Address': 'Địa chỉ',
  'Password': 'Mật khẩu',
  'Confirm Password': 'Xác nhận mật khẩu',
  
  // Form Labels
  'Required': 'Bắt buộc',
  'Optional': 'Tùy chọn',
  'Description': 'Mô tả',
  'Notes': 'Ghi chú',
  'Special Instructions': 'Hướng dẫn đặc biệt',
  
  // Time & Date
  'Today': 'Hôm nay',
  'Yesterday': 'Hôm qua',
  'This Week': 'Tuần này',
  'This Month': 'Tháng này',
  'This Year': 'Năm này',
  'Created': 'Tạo lúc',
  'Updated': 'Cập nhật lúc',
  'Last Active': 'Hoạt động cuối',
  
  // Error Messages
  'This field is required': 'Trường này là bắt buộc',
  'Invalid email format': 'Định dạng email không hợp lệ',
  'Password too short': 'Mật khẩu quá ngắn',
  'Passwords do not match': 'Mật khẩu không khớp',
  'Invalid phone number': 'Số điện thoại không hợp lệ',
  
  // Success Messages
  'Order placed successfully': 'Đặt hàng thành công',
  'Item added to cart': 'Đã thêm vào giỏ hàng',
  'Profile updated': 'Cập nhật hồ sơ thành công',
  'Settings saved': 'Đã lưu cài đặt',
  
  // System Messages
  'System is online': 'Hệ thống đang hoạt động',
  'System is offline': 'Hệ thống đang tạm dừng',
  'Maintenance mode': 'Chế độ bảo trì',
  'Connection lost': 'Mất kết nối',
  'Reconnecting...': 'Đang kết nối lại...'
}

// Function to translate text in content
function translateContent(content) {
  let translatedContent = content
  
  // Replace all translation keys
  Object.entries(translations).forEach(([english, vietnamese]) => {
    // Escape special regex characters
    const escapedEnglish = english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    
    // Patterns to match
    const patterns = [
      // String literals in quotes
      new RegExp(`"${escapedEnglish}"`, 'g'),
      new RegExp(`'${escapedEnglish}'`, 'g'),
      new RegExp(`\`${escapedEnglish}\``, 'g'),
      // JSX text content
      new RegExp(`>${escapedEnglish}<`, 'g'),
      // Placeholder attributes
      new RegExp(`placeholder="${escapedEnglish}"`, 'g'),
      new RegExp(`placeholder='${escapedEnglish}'`, 'g'),
      // Title attributes
      new RegExp(`title="${escapedEnglish}"`, 'g'),
      new RegExp(`title='${escapedEnglish}'`, 'g'),
      // Alt attributes
      new RegExp(`alt="${escapedEnglish}"`, 'g'),
      new RegExp(`alt='${escapedEnglish}'`, 'g'),
    ]
    
    patterns.forEach(pattern => {
      translatedContent = translatedContent.replace(pattern, (match) => {
        return match.replace(english, vietnamese)
      })
    })
  })
  
  return translatedContent
}

// Function to translate a file
function translateFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const translatedContent = translateContent(content)
    
    if (content !== translatedContent) {
      fs.writeFileSync(filePath, translatedContent, 'utf8')
      console.log(`✅ Translated: ${path.relative(process.cwd(), filePath)}`)
      return true
    }
    return false
  } catch (error) {
    console.error(`❌ Error translating ${filePath}:`, error.message)
    return false
  }
}

// Function to find JSX/JS files recursively
function findJSXFiles(dir) {
  const files = []
  
  try {
    const items = fs.readdirSync(dir)
    
    items.forEach(item => {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files.push(...findJSXFiles(fullPath))
      } else if (item.endsWith('.jsx') || item.endsWith('.js')) {
        files.push(fullPath)
      }
    })
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message)
  }
  
  return files
}

// Main function
function main() {
  const srcDir = path.join(__dirname, '../src')
  const jsxFiles = findJSXFiles(srcDir)
  
  console.log(`🔄 Found ${jsxFiles.length} files to translate...`)
  
  let translatedCount = 0
  jsxFiles.forEach(file => {
    if (translateFile(file)) {
      translatedCount++
    }
  })
  
  console.log(`✨ Translation completed! ${translatedCount} files updated.`)
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { translateFile, findJSXFiles, translateContent }
