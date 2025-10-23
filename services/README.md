# Fast Food Delivery Drone - Microservices Architecture

Dự án đã được tái cấu trúc từ mô hình 3 lớp (monolith) sang kiến trúc microservices.

## Kiến trúc Microservices

### 1. API Gateway (Port 3000)
- **Chức năng**: Điểm vào chính cho tất cả các microservices
- **Nhiệm vụ**: 
  - Routing requests đến các services phù hợp
  - Authentication và authorization
  - Rate limiting
  - Load balancing
  - Request/Response logging

### 2. User Service (Port 3002)
- **Chức năng**: Quản lý authentication và thông tin người dùng
- **Nhiệm vụ**:
  - User registration và login
  - JWT token generation và validation
  - Password reset
  - Refresh token management
  - Token verification cho API Gateway
  - User profile management
  - User data storage
  - Admin user management
  - User status management
  - Restaurant owner registration

### 3. Restaurant Service (Port 3003)
- **Chức năng**: Quản lý nhà hàng và menu
- **Nhiệm vụ**:
  - Restaurant registration và approval
  - Menu management
  - Restaurant profile management
  - Location-based restaurant search

### 4. Order Service (Port 3004)
- **Chức năng**: Xử lý đơn hàng
- **Nhiệm vụ**:
  - Order creation và management
  - Order status tracking
  - Order history
  - Integration với Payment và Drone services

### 5. Drone Service (Port 3005)
- **Chức năng**: Quản lý drone và delivery missions
- **Nhiệm vụ**:
  - Drone fleet management
  - Delivery mission planning
  - Real-time drone tracking
  - Mission status updates

### 6. Payment Service (Port 3006)
- **Chức năng**: Xử lý thanh toán
- **Nhiệm vụ**:
  - Payment processing
  - Payment method management
  - Transaction history
  - Integration với MoMo và other payment gateways

## Cơ sở dữ liệu

Mỗi service có database riêng biệt:
- `ffdd_auth` - User Service (bao gồm cả auth)
- `ffdd_restaurants` - Restaurant Service
- `ffdd_orders` - Order Service
- `ffdd_drones` - Drone Service
- `ffdd_payments` - Payment Service

## Cách chạy

### 1. Chạy tất cả services cùng lúc

```bash
# Từ thư mục root của dự án
npm run microservices:start
```

### 2. Chạy từng service riêng lẻ

```bash
# Vào thư mục service
cd services/user-service

# Cài đặt dependencies
npm install

# Chạy development mode
npm run dev
```

## API Endpoints

### API Gateway (http://localhost:3000)
- `GET /health` - Health check
- `POST /api/auth/*` - Authentication endpoints
- `GET /api/users/*` - User management endpoints
- `GET /api/restaurants/*` - Restaurant endpoints
- `GET /api/orders/*` - Order endpoints
- `GET /api/drones/*` - Drone endpoints
- `GET /api/payments/*` - Payment endpoints

### User Service (http://localhost:3002) - includes Auth functionality
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/verify` - Verify token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password` - Reset password

### User Service (http://localhost:3002)
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/:id` - Get user by ID
- `GET /api/admin/users` - Get all users (Admin)
- `PATCH /api/admin/users/:id/status` - Update user status (Admin)

## Lợi ích của Microservices Architecture

1. **Scalability**: Mỗi service có thể scale độc lập
2. **Maintainability**: Code dễ maintain và update
3. **Technology Diversity**: Có thể sử dụng công nghệ khác nhau cho từng service
4. **Fault Isolation**: Lỗi ở một service không ảnh hưởng đến services khác
5. **Team Independence**: Các team có thể phát triển độc lập
6. **Deployment Flexibility**: Deploy từng service riêng biệt

## Monitoring và Logging

- Mỗi service có logging riêng với Winston
- Health check endpoints cho monitoring
- Centralized logging có thể được implement với ELK stack
- Metrics collection với Prometheus và Grafana

## Security

- JWT-based authentication
- Service-to-service communication security
- Rate limiting
- Input validation
- CORS configuration
- Helmet.js security headers
