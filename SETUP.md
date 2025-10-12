# Fast Food Delivery Drone - Setup Guide

## Tổng quan dự án

Hệ thống quản lý đặt món và giao hàng bằng drone với các tính năng:
- 🚁 Giao hàng bằng drone (mỗi nhà hàng quản lý drone riêng)
- 💳 Thanh toán MoMo (QR + App-to-App)
- 📱 3 giao diện: Customer, Restaurant, Admin
- 🔄 Realtime tracking với Socket.IO
- 🗺️ Theo dõi vị trí drone realtime

## Cấu trúc dự án

```
food-fast-delivery/
├── server/                 # Backend Node.js + Express
│   ├── src/
│   │   ├── config/         # Cấu hình database, env
│   │   ├── controllers/    # API controllers
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── middlewares/    # Auth, validation
│   │   ├── sockets/        # Socket.IO handlers
│   │   └── utils/          # Helper functions
│   ├── scripts/            # Database seeding
│   ├── tests/              # Unit tests
│   └── Dockerfile
├── client/                 # Frontend React + Vite (sẽ tạo sau)
├── docker-compose.yml      # Docker orchestration
├── nginx.conf              # Nginx reverse proxy
└── README.md
```

## Yêu cầu hệ thống

- Node.js 18+
- MongoDB 7.0+
- Docker & Docker Compose (tùy chọn)

## Cài đặt và chạy

### 1. Cài đặt dependencies

```bash
# Cài đặt dependencies cho toàn bộ dự án
npm run install:all

# Hoặc cài đặt riêng lẻ
cd server && npm install
```

### 2. Cấu hình môi trường

```bash
# Copy file cấu hình
cp server/env.example server/.env

# Chỉnh sửa file .env theo nhu cầu
# Quan trọng: Thay đổi JWT secrets trong production
```

### 3. Chạy với MongoDB local

```bash
# Khởi động MongoDB (nếu chưa có)
# Windows: net start MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod

# Chạy server
cd server && npm run dev

# Server sẽ chạy tại: http://localhost:4000
```

### 4. Chạy với Docker

```bash
# Khởi động tất cả services
docker-compose up -d

# Xem logs
docker-compose logs -f

# Dừng services
docker-compose down
```

### 5. Seed dữ liệu mẫu

```bash
# Chạy seed script
cd server && npm run seed

# Hoặc với Docker
docker-compose exec server npm run seed
```

## API Documentation

### Base URL
- Development: `http://localhost:4000/api`
- Production: `https://your-domain.com/api`

### Authentication
Tất cả API (trừ auth và public) yêu cầu Bearer token:
```
Authorization: Bearer <access_token>
```

### Endpoints chính

#### Authentication
- `POST /api/auth/register` - Đăng ký user mới
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Lấy thông tin user hiện tại

#### Restaurants
- `GET /api/restaurants` - Danh sách nhà hàng
- `GET /api/restaurants/:id` - Chi tiết nhà hàng
- `GET /api/restaurants/:id/menu` - Menu nhà hàng

#### Orders
- `POST /api/orders` - Tạo đơn hàng
- `GET /api/orders/my-orders` - Đơn hàng của tôi (customer)
- `GET /api/orders/restaurant/orders` - Đơn hàng nhà hàng (restaurant)
- `PATCH /api/orders/:id/status` - Cập nhật trạng thái đơn

#### Payments
- `POST /api/payments/momo/create` - Tạo thanh toán MoMo
- `POST /api/payments/momo/ipn` - Webhook MoMo IPN

#### Drones (Restaurant only)
- `GET /api/restaurant/drones` - Danh sách drone
- `POST /api/restaurant/drones` - Tạo drone mới
- `PATCH /api/restaurant/drones/:id/status` - Cập nhật trạng thái drone

#### Missions (Restaurant only)
- `POST /api/restaurant/missions` - Tạo mission giao hàng
- `GET /api/restaurant/missions` - Danh sách missions
- `PATCH /api/restaurant/missions/:id/status` - Cập nhật trạng thái mission

#### Admin
- `GET /api/admin/dashboard` - Dashboard admin
- `GET /api/admin/users` - Quản lý users
- `GET /api/admin/restaurants` - Quản lý restaurants
- `PATCH /api/admin/restaurants/:id/approve` - Duyệt nhà hàng

## Socket.IO Events

### Client → Server
- `join:order` - Tham gia room theo dõi đơn hàng
- `join:mission` - Tham gia room theo dõi mission
- `drone:location` - Cập nhật vị trí drone
- `order:status:update` - Cập nhật trạng thái đơn hàng
- `mission:status:update` - Cập nhật trạng thái mission

### Server → Client
- `order:updated` - Đơn hàng được cập nhật
- `order:tracking` - Theo dõi vị trí drone
- `mission:updated` - Mission được cập nhật
- `drone:location:update` - Vị trí drone thay đổi

## Dữ liệu mẫu

Sau khi chạy seed, bạn có thể đăng nhập với:

### Admin
- Email: `admin@ffdd.com`
- Password: `admin123`

### Restaurant Owners
- Email: `restaurant1@ffdd.com` (Pizza Palace)
- Password: `restaurant123`
- Email: `restaurant2@ffdd.com` (Sushi Express)
- Password: `restaurant123`

### Customers
- Email: `customer1@ffdd.com`
- Password: `customer123`
- Email: `customer2@ffdd.com`
- Password: `customer123`

### Dữ liệu có sẵn
- 2 nhà hàng đã được duyệt
- 8 món ăn (4 pizza + 4 sushi)
- 4 drone (2 mỗi nhà hàng)
- 2 đơn hàng mẫu (1 đang chờ, 1 đã giao)

## Testing

```bash
# Chạy tests
cd server && npm test

# Chạy tests với coverage
cd server && npm run test:coverage

# Chạy tests trong Docker
docker-compose exec server npm test
```

## Quy tắc nghiệp vụ quan trọng

1. **Drone ownership**: Mỗi drone thuộc về 1 nhà hàng duy nhất
2. **Mission assignment**: Chỉ nhà hàng sở hữu drone mới được gán mission
3. **Geofence**: Drone chỉ hoạt động trong phạm vi đã định
4. **Weight limit**: Kiểm tra tải trọng drone trước khi giao
5. **Payment flow**: MoMo → IPN webhook → Order status update

## Troubleshooting

### Lỗi kết nối MongoDB
```bash
# Kiểm tra MongoDB đang chạy
# Windows: net start MongoDB
# macOS: brew services list | grep mongodb
# Linux: sudo systemctl status mongod
```

### Lỗi port đã được sử dụng
```bash
# Thay đổi port trong server/.env
PORT=4001
```

### Lỗi Docker
```bash
# Xóa containers và volumes cũ
docker-compose down -v
docker system prune -f

# Build lại images
docker-compose build --no-cache
```

## Production Deployment

1. **Cấu hình môi trường**:
   - Thay đổi JWT secrets
   - Cấu hình MoMo credentials thật
   - Setup MongoDB Atlas hoặc production DB

2. **Security**:
   - Enable HTTPS
   - Cấu hình CORS properly
   - Setup rate limiting
   - Enable helmet security headers

3. **Monitoring**:
   - Setup logging
   - Health checks
   - Error tracking
   - Performance monitoring

## Next Steps

Backend đã hoàn thành! Tiếp theo sẽ tạo:
1. Frontend React + Vite
2. Customer interface
3. Restaurant console  
4. Admin panel

## Support

Nếu gặp vấn đề, hãy kiểm tra:
1. Logs của server: `docker-compose logs server`
2. Logs của MongoDB: `docker-compose logs mongo`
3. Network connectivity
4. Environment variables
