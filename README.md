# Fast Food Delivery Drone System

Hệ thống quản lý đặt món và giao hàng bằng drone sử dụng MERN stack.

## Tính năng chính

- 🚁 Giao hàng bằng drone (mỗi nhà hàng quản lý drone riêng)
- 💳 Thanh toán MoMo (QR + App-to-App)
- 📱 3 giao diện: Customer, Restaurant, Admin
- 🔄 Realtime tracking với Socket.IO
- 🗺️ Theo dõi vị trí drone realtime
- 🔐 JWT Authentication + Role-based Access

## Công nghệ

### Frontend
- React + Vite
- TailwindCSS
- Zustand (State Management)
- Socket.IO Client
- Axios

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Socket.IO
- MoMo Payment Gateway

### DevOps
- Docker & Docker Compose
- MongoDB Atlas (production)

## Cấu trúc dự án

```
food-fast-delivery/
├── client/          # React Frontend
├── server/          # Node.js Backend
├── docker-compose.yml
└── README.md
```

## Cài đặt

1. Clone repository
```bash
git clone <repository-url>
cd food-fast-delivery
```

2. Cài đặt dependencies
```bash
npm run install:all
```

3. Setup environment variables
```bash
# Copy env files
cp server/.env.example server/.env
cp client/.env.example client/.env
```

4. Chạy development
```bash
npm run dev
```

## Docker

```bash
# Build và chạy với Docker Compose
docker-compose up -d

# Chỉ build
docker-compose build

# Xem logs
docker-compose logs -f
```

## API Documentation

- Customer APIs: `/api/customers/*`
- Restaurant APIs: `/api/restaurant/*`
- Admin APIs: `/api/admin/*`
- Payment APIs: `/api/payments/*`

## Testing

```bash
# Chạy tất cả tests
npm test

# Chỉ server tests
npm run test:server

# Chỉ client tests
npm run test:client
```

## Seed Data

```bash
npm run seed
```

Tạo dữ liệu mẫu:
- 1 Admin user
- 2 Restaurant owners
- 2 Restaurants với menu
- 4 Drones (2 mỗi restaurant)
- 5 Customer users
- Sample orders

## Quy tắc nghiệp vụ

1. **Drone ownership**: Mỗi drone thuộc về 1 nhà hàng duy nhất
2. **Mission assignment**: Chỉ nhà hàng sở hữu drone mới được gán mission
3. **Geofence**: Drone chỉ hoạt động trong phạm vi đã định
4. **Weight limit**: Kiểm tra tải trọng drone trước khi giao
5. **Payment flow**: MoMo → IPN webhook → Order status update

## License

MIT

