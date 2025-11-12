# 🐳 Docker Setup Guide

Hướng dẫn build và chạy toàn bộ dự án bằng Docker với chỉ **1 lệnh**.

## 🚀 Quick Start

### Cách 1: Sử dụng Docker Compose (Đơn giản nhất)

```bash
# Build và chạy tất cả services
docker-compose up -d --build
```

### Cách 2: Sử dụng Makefile (Linux/Mac)

```bash
# Build và chạy tất cả
make all

# Hoặc từng bước
make build    # Build images
make up       # Start services
```
~
### Cách 3: Sử dụng Script

**Linux/Mac:**
```bash
./build.sh
```

**Windows:**
```cmd
build.bat
```

## 📋 Các lệnh Docker phổ biến

### Build và chạy
```bash
# Build tất cả images
docker-compose build

# Chạy tất cả services
docker-compose up -d

# Build và chạy cùng lúc
docker-compose up -d --build
```

### Quản lý services
```bash
# Xem logs
docker-compose logs -f

# Xem logs của một service cụ thể
docker-compose logs -f api-gateway

# Dừng tất cả services
docker-compose down

# Restart tất cả services
docker-compose restart

# Xem trạng thái
docker-compose ps
```

### Cleanup
```bash
# Dừng và xóa containers, networks
docker-compose down

# Dừng và xóa containers, networks, volumes
docker-compose down -v

# Xóa tất cả images, containers, networks, volumes
docker system prune -af
```

## 🌐 Services và Ports

Sau khi chạy, các services sẽ available tại:

| Service | Port | URL |
|---------|------|-----|
| API Gateway | 3001 | http://localhost:3001 |
| User Service | 3002 | http://localhost:3002 |
| Restaurant Service | 3003 | http://localhost:3003 |
| Order Service | 3004 | http://localhost:3004 |
| Drone Service | 3005 | http://localhost:3005 |
| Payment Service | 3006 | http://localhost:3006 |
| Client (Frontend) | 5173 | http://localhost:5173 |
| MongoDB | 27017 | localhost:27017 |

## 🔍 Health Checks

Kiểm tra health của các services:

```bash
# API Gateway
curl http://localhost:3001/health

# User Service
curl http://localhost:3002/health

# Restaurant Service
curl http://localhost:3003/health

# Order Service
curl http://localhost:3004/health

# Drone Service
curl http://localhost:3005/health

# Payment Service
curl http://localhost:3006/health
```

## 🗄️ Database

### Kết nối MongoDB Shell
```bash
docker exec -it ffdd-mongo mongosh -u admin -p password123 --authenticationDatabase admin
```

### Backup Database
```bash
docker exec ffdd-mongo mongodump --uri="mongodb://admin:password123@localhost:27017/drone?authSource=admin" --out=/data/backup
```

## 🔧 Environment Variables

Mỗi service có file `.env` riêng. Tạo file `.env` cho từng service từ `.env.example`:

### Bước 1: Tạo file .env cho từng service

```bash
# Copy .env.example thành .env cho từng service
cp services/api-gateway/.env.example services/api-gateway/.env
cp services/user-service/.env.example services/user-service/.env
cp services/restaurant-service/.env.example services/restaurant-service/.env
cp services/order-service/.env.example services/order-service/.env
cp services/drone-service/.env.example services/drone-service/.env
cp services/payment-service/.env.example services/payment-service/.env
```

**Windows PowerShell:**
```powershell
Copy-Item services\api-gateway\.env.example services\api-gateway\.env
Copy-Item services\user-service\.env.example services\user-service\.env
Copy-Item services\restaurant-service\.env.example services\restaurant-service\.env
Copy-Item services\order-service\.env.example services\order-service\.env
Copy-Item services\drone-service\.env.example services\drone-service\.env
Copy-Item services\payment-service\.env.example services\payment-service\.env
```

### Bước 2: Cập nhật MongoDB Atlas Connection String

Mở từng file `.env` và cập nhật `MONGODB_URI` với connection string thực tế từ MongoDB Atlas:

1. Vào MongoDB Atlas Dashboard
2. Click "Connect" trên cluster của bạn
3. Chọn "Connect your application"
4. Copy connection string và thay `<password>` bằng mật khẩu database
5. Cập nhật trong file `.env` của từng service

**Lưu ý:**
- Mỗi service có thể dùng database riêng (ví dụ: `ffdd_users`, `ffdd_restaurants`, `ffdd_orders`, etc.)
- Đảm bảo IP của bạn đã được whitelist trong MongoDB Atlas Network Access
- Các SERVICE_URL trong `.env` sẽ được override bởi Docker để dùng service names (không cần sửa)

### Bước 3: Cập nhật các biến khác (nếu cần)

- `JWT_SECRET`, `JWT_REFRESH_SECRET`: Thay đổi cho production
- `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY`: Nếu sử dụng MoMo payment

## 🐛 Troubleshooting

### Services không start được
```bash
# Xem logs để debug
docker-compose logs [service-name]

# Rebuild từ đầu
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Port đã được sử dụng
```bash
# Kiểm tra port nào đang được sử dụng
netstat -ano | findstr :3001  # Windows
lsof -i :3001                  # Linux/Mac

# Thay đổi port trong docker-compose.yml nếu cần
```

### MongoDB connection issues
```bash
# Kiểm tra MongoDB container
docker-compose ps mongo

# Xem MongoDB logs
docker-compose logs mongo

# Restart MongoDB
docker-compose restart mongo
```

## 📝 Makefile Commands

Nếu bạn có Makefile, sử dụng các lệnh sau:

```bash
make help        # Xem tất cả commands
make build       # Build images
make up          # Start services
make down        # Stop services
make restart     # Restart services
make logs        # View logs
make clean       # Clean up
make health      # Check health
make db-shell    # MongoDB shell
```

## ✅ Checklist

- [ ] Docker và Docker Compose đã được cài đặt
- [ ] Ports 3001-3006, 5173, 27017 không bị chiếm dụng
- [ ] Đã chạy `docker-compose up -d --build`
- [ ] Tất cả services đã healthy (check bằng `docker-compose ps`)
- [ ] Có thể truy cập http://localhost:5173

## 🎉 Hoàn thành!

Sau khi build và chạy thành công, bạn có thể:
- Truy cập frontend tại: http://localhost:5173
- API Gateway tại: http://localhost:3001/api
- Xem logs: `docker-compose logs -f`

