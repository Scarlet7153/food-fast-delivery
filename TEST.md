# Hướng dẫn chạy Test thủ công

## Cách chạy test cho từng service

### 1. User Service
```bash
cd services/user-service
npm install  # Nếu chưa install dependencies
npm test
```

### 2. API Gateway
```bash
cd services/api-gateway
npm install
npm test
```

### 3. Order Service
```bash
cd services/order-service
npm install
npm test
```

### 4. Restaurant Service
```bash
cd services/restaurant-service
npm install
npm test
```

### 5. Drone Service
```bash
cd services/drone-service
npm install
npm test
```

### 6. Payment Service
```bash
cd services/payment-service
npm install
npm test
```

## Chạy test với coverage (xem báo cáo coverage)
```bash
cd services/user-service
npm test -- --coverage
```

## Chạy test với watch mode (tự động chạy lại khi có thay đổi)
```bash
cd services/user-service
npm test -- --watch
```

## Chạy test cho một file cụ thể
```bash
cd services/user-service
npm test -- app.test.js
```

## Chạy test cho tất cả services cùng lúc (từ root directory)

Tạo script `test-all.sh` (Linux/Mac) hoặc `test-all.bat` (Windows):

### Windows (test-all.bat):
```batch
@echo off
echo Testing all services...
cd services\user-service && npm test && cd ..\..
cd services\api-gateway && npm test && cd ..\..
cd services\order-service && npm test && cd ..\..
cd services\restaurant-service && npm test && cd ..\..
cd services\drone-service && npm test && cd ..\..
cd services\payment-service && npm test && cd ..\..
echo All tests completed!
```

### Linux/Mac (test-all.sh):
```bash
#!/bin/bash
echo "Testing all services..."
cd services/user-service && npm test && cd ../..
cd services/api-gateway && npm test && cd ../..
cd services/order-service && npm test && cd ../..
cd services/restaurant-service && npm test && cd ../..
cd services/drone-service && npm test && cd ../..
cd services/payment-service && npm test && cd ../..
echo "All tests completed!"
```

## Chạy test với verbose output (xem chi tiết)
```bash
cd services/user-service
npm test -- --verbose
```

## Troubleshooting

### Lỗi: "Cannot find module 'supertest'"
```bash
cd services/user-service
npm install
```

### Lỗi: "Jest did not exit one second after the test run"
- Đây là warning thông thường, không ảnh hưởng đến kết quả test
- Có thể bỏ qua hoặc thêm `--forceExit` flag:
```bash
npm test -- --forceExit
```

### Test không chạy
- Đảm bảo đã cài đặt dependencies: `npm install`
- Kiểm tra file test có đúng format: `**/__tests__/**/*.js` hoặc `**/*.test.js`

