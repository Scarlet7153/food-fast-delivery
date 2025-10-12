# Hệ Thống Giao Đồ Ăn Bằng Drone

## 🚁 Tổng Quan

Hệ thống giao đồ ăn bằng drone hiện đại với 3 giao diện chính:
- **Khách hàng**: Đặt hàng, theo dõi đơn hàng, thanh toán
- **Nhà hàng**: Quản lý đơn hàng, drone, thực đơn
- **Quản trị viên**: Quản lý toàn hệ thống

## 🛠️ Công Nghệ Sử Dụng

### Frontend
- **React 18** + **Vite** - Framework chính
- **TailwindCSS** - Styling
- **Zustand** - State management
- **React Query** - Data fetching
- **React Router** - Routing
- **Socket.IO Client** - Real-time updates

### Backend
- **Node.js** + **Express** - API server
- **MongoDB** + **Mongoose** - Database
- **JWT** - Authentication
- **Socket.IO** - Real-time communication
- **MoMo Payment** - Payment gateway

## 🚀 Cách Chạy

### Yêu Cầu Hệ Thống
- Node.js 18+
- MongoDB 6+
- npm hoặc yarn

### Cài Đặt Dependencies
```bash
# Backend
cd server
npm install

# Frontend
cd client
npm install
```

### Cấu Hình Môi Trường
```bash
# Copy file env mẫu
cp server/env.example server/.env

# Chỉnh sửa file .env với thông tin của bạn
```

### Chạy Ứng Dụng
```bash
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
cd client
npm run dev
```

### Chạy Với Docker
```bash
# Chạy toàn bộ hệ thống
docker-compose up

# Chỉ chạy backend
docker-compose up server mongo

# Chỉ chạy frontend
docker-compose up client
```

## 📱 Giao Diện

### 1. Giao Diện Khách Hàng
- **Trang chủ**: Tìm kiếm nhà hàng, danh mục món ăn
- **Chi tiết nhà hàng**: Xem menu, đặt món
- **Giỏ hàng**: Quản lý đơn hàng
- **Thanh toán**: MoMo, QR code
- **Theo dõi đơn hàng**: Real-time tracking với drone

### 2. Giao Diện Nhà Hàng
- **Bảng điều khiển**: Thống kê đơn hàng, doanh thu
- **Quản lý đơn hàng**: Xác nhận, giao cho drone
- **Thực đơn**: Thêm/sửa/xóa món ăn
- **Quản lý drone**: Đăng ký, theo dõi trạng thái
- **Nhiệm vụ giao hàng**: Theo dõi drone delivery

### 3. Giao Diện Quản Trị
- **Bảng điều khiển**: Tổng quan hệ thống
- **Quản lý người dùng**: Khách hàng, chủ nhà hàng
- **Quản lý nhà hàng**: Duyệt đăng ký, kiểm duyệt
- **Quản lý đơn hàng**: Giám sát tất cả đơn hàng
- **Quản lý drone**: Theo dõi toàn bộ đội drone
- **Cài đặt hệ thống**: Cấu hình platform

## 🔐 Xác Thực & Phân Quyền

### Vai Trò Người Dùng
- **Customer**: Đặt hàng, thanh toán
- **Restaurant**: Quản lý nhà hàng, drone
- **Admin**: Quản lý toàn hệ thống

### Bảo Mật
- JWT Access Token + Refresh Token
- Password hashing với bcrypt
- Rate limiting
- CORS protection
- Input validation

## 💳 Thanh Toán

### MoMo E-Wallet
- QR Code payment
- App-to-App payment
- IPN webhook handling
- Sandbox environment

## 🚁 Quản Lý Drone

### Tính Năng Drone
- Đăng ký drone cho nhà hàng
- Theo dõi trạng thái (Idle, Charging, In Flight, Maintenance)
- Quản lý pin, tải trọng, tầm bay
- Geofence cho vùng giao hàng

### Nhiệm Vụ Giao Hàng
- Tự động gán drone phù hợp
- Tính toán tuyến đường tối ưu
- Real-time tracking
- Xử lý sự cố, hủy đơn hàng

## 📊 Real-time Updates

### Socket.IO Events
- Order status updates
- Drone location tracking
- Mission progress
- System notifications

## 🗄️ Cơ Sở Dữ Liệu

### Models Chính
- **User**: Thông tin người dùng
- **Restaurant**: Thông tin nhà hàng
- **MenuItem**: Món ăn trong menu
- **Order**: Đơn hàng
- **Drone**: Thông tin drone
- **DeliveryMission**: Nhiệm vụ giao hàng

## 🧪 Testing

### Chạy Tests
```bash
# Backend tests
cd server
npm test

# Frontend tests (nếu có)
cd client
npm test
```

### Seed Data
```bash
cd server
npm run seed
```

## 📦 Deployment

### Production Build
```bash
# Frontend
cd client
npm run build

# Backend
cd server
npm run build
```

### Docker Production
```bash
docker-compose -f docker-compose.prod.yml up
```

## 🔧 Cấu Hình

### Environment Variables
```env
# Server
PORT=5000
MONGO_URI=mongodb://localhost:27017/ffdd
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
CLIENT_URL=http://localhost:5173

# MoMo Payment
MOMO_PARTNER_CODE=your-partner-code
MOMO_ACCESS_KEY=your-access-key
MOMO_SECRET_KEY=your-secret-key
```

## 📝 API Documentation

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Đăng xuất

### Restaurants
- `GET /api/restaurants` - Danh sách nhà hàng
- `GET /api/restaurants/:id` - Chi tiết nhà hàng
- `GET /api/restaurants/:id/menu` - Menu nhà hàng

### Orders
- `POST /api/orders` - Tạo đơn hàng
- `GET /api/orders` - Danh sách đơn hàng
- `GET /api/orders/:id` - Chi tiết đơn hàng

### Drones
- `GET /api/drones` - Danh sách drone
- `POST /api/drones` - Đăng ký drone
- `PUT /api/drones/:id` - Cập nhật drone

## 🐛 Troubleshooting

### Lỗi Thường Gặp
1. **MongoDB connection failed**: Kiểm tra MongoDB đã chạy
2. **JWT token expired**: Refresh token hoặc đăng nhập lại
3. **MoMo payment failed**: Kiểm tra credentials
4. **Socket.IO connection failed**: Kiểm tra server đang chạy

### Logs
```bash
# Backend logs
cd server
npm run dev

# Frontend logs
cd client
npm run dev
```

## 📞 Hỗ Trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra logs để xem lỗi chi tiết
2. Đảm bảo tất cả dependencies đã được cài đặt
3. Kiểm tra environment variables
4. Restart services nếu cần

## 📄 License

MIT License - Xem file LICENSE để biết thêm chi tiết.

---

**Chúc bạn sử dụng hệ thống thành công! 🚁🍔**
