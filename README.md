# 🚁 Fast Food Delivery Drone System

> Hệ thống giao đồ ăn nhanh bằng drone với kiến trúc **microservices**, sử dụng **MERN Stack** và **tích hợp thanh toán MoMo**.

---

## 👥 Thành viên thực hiện
- **Võ Duy Toàn** – 3122411218  
- **Lê Thanh Hùng** – 3122411059

---

## 🎯 Giới thiệu

**Fast Food Delivery Drone System** là nền tảng giao đồ ăn hiện đại, tự động hóa việc giao hàng bằng drone.  
Hệ thống được xây dựng theo **kiến trúc microservices**, đảm bảo khả năng mở rộng, bảo trì, và phát triển độc lập từng module.

### 🎯 Mục tiêu
- Tự động hóa quy trình giao hàng bằng drone  
- Theo dõi đơn hàng **real-time** với Socket.IO  
- Tích hợp thanh toán điện tử **MoMo**  
- Cung cấp 3 giao diện: **Customer**, **Restaurant**, **Admin**

---

## ✨ Tính năng chính

### 👤 Khách hàng (Customer)
- ✅ Đăng ký / Đăng nhập tài khoản
- ✅ Duyệt danh sách nhà hàng và món ăn
- ✅ Đặt món ăn và thanh toán MoMo (QR code)
- ✅ Theo dõi drone giao hàng **real-time** trên bản đồ
- ✅ Xem lịch sử đơn hàng

### 🍴 Nhà hàng (Restaurant)
- ✅ Quản lý menu (thêm, sửa, xóa món ăn)
- ✅ Quản lý đơn hàng (xác nhận, từ chối, xử lý)
- ✅ Quản lý drone giao hàng
- ✅ Theo dõi doanh thu
- ✅ Theo dõi nhiệm vụ giao hàng

### 👨‍💼 Quản trị viên (Admin)
- ✅ Quản lý người dùng hệ thống
- ✅ Quản lý nhà hàng (phê duyệt)
- ✅ Quản lý đơn hàng toàn hệ thống
- ✅ Duyệt nhà hàng mới đăng ký
- ✅ Xem thống kê và báo cáo toàn hệ thống

---

## 🏗️ Kiến trúc hệ thống

**Microservices chính:**
- **API Gateway** – Điểm vào duy nhất cho tất cả request
- **User Service** – Quản lý xác thực và tài khoản người dùng
- **Restaurant Service** – Quản lý nhà hàng và menu
- **Order Service** – Quản lý đơn hàng và logic giao hàng
- **Drone Service** – Quản lý drone, tracking vị trí real-time
- **Payment Service** – Xử lý thanh toán MoMo

**Frontend:**
- Customer Interface  
- Restaurant Dashboard  
- Admin Dashboard  

**Database:** MongoDB  
**Realtime Communication:** Socket.IO  

---

## 🛠️ Công nghệ sử dụng

| Loại | Công nghệ |
|------|------------|
| **Frontend** | React, Vite, TailwindCSS, Axios, Zustand |
| **Backend** | Node.js, Express, MongoDB, Mongoose |
| **Realtime** | Socket.IO |
| **Authentication** | JWT, Bcrypt |
| **Payment Gateway** | MoMo API |
| **DevOps** | Docker, Nginx |
| **Build Tools** | Concurrently, npm |

---

## ⚙️ Cài đặt nhanh

```bash
# Clone dự án
git clone https://github.com/Scarlet7153/food-fast-delivery.git
cd food-fast-delivery

# Cài đặt tất cả dependencies
cd client; npm install
cd ../services/api-gateway ; npm install
cd ../user-service ; npm install
cd ../restaurant-service ; npm install
cd ../order-service ; npm install
cd ../drone-service ; npm install
cd ../payment-service ; npm install
cd ../..
# Chạy toàn bộ services
npm run microservices:start

# Chạy client
npm run dev:client
```

---

## 📂 Cấu trúc dự án

```
food-fast-delivery/
├── services/
│   ├── api-gateway/
│   ├── user-service/
│   ├── restaurant-service/
│   ├── order-service/
│   ├── drone-service/
│   └── payment-service/
├── client/
│   ├── customer/
│   ├── restaurant/
│   └── admin/
└── docker-compose.yml
```

---

## 📘 API Documentation

Base URL (API Gateway): `http://localhost:3001/api`

Lưu ý: một vài route có thể tồn tại với đường dẫn khác nếu gateway map lại prefix; dùng các file trong `services/*/src/routes` làm nguồn xác thực cuối cùng.

---

🔐 Authentication / User

- POST `/api/auth/register`
	- Mô tả: Đăng ký người dùng
	- Body: { name, email, password }
	- Response: 201 { user, token }

- POST `/api/auth/login`
	- Mô tả: Đăng nhập
	- Body: { email, password }
	- Response: 200 { token, user }

- POST `/api/auth/logout`
	- Mô tả: Đăng xuất
	- Protected: Có (Authorization)

- POST `/api/auth/logout-all`
	- Mô tả: Đăng xuất tất cả phiên

- POST `/api/auth/refresh`
	- Mô tả: Làm mới token (nếu project hỗ trợ refresh token)

- GET `/api/users/me` hoặc `/api/auth/current-user`
	- Mô tả: Lấy profile user hiện tại
	- Protected: Có

Admin user endpoints (user-service)
- GET `/api/users` (admin) — Lấy danh sách người dùng
- GET `/api/users/:id` (admin) — Lấy chi tiết user
- PATCH `/api/users/:id/status` (admin) — Cập nhật trạng thái

---

🏪 Shop / Restaurant

- GET `/api/shop/get-all` hoặc GET `/api/restaurants`
	- Mô tả: Lấy danh sách nhà hàng
	- Query params: q, city, page, limit, isOpen

- GET `/api/shop/get-by-city/:city` — Lấy shop theo thành phố

- POST `/api/shop/create` hoặc POST `/api/restaurants`
	- Mô tả: Tạo nhà hàng mới
	- Protected: role: restaurant
	- Body ví dụ: { name, ownerId, address, city, openingHours }

- POST `/api/shop/edit/:shopId` hoặc PATCH `/api/restaurants/:id`
	- Mô tả: Cập nhật thông tin shop (owner/admin)

- GET `/api/restaurants/:id` — Lấy chi tiết nhà hàng (kèm menu)

- GET `/api/restaurants/owner/:ownerId` — Lấy nhà hàng theo owner

---

🍕 Item / Menu

- GET `/api/item/get-all/:shopId` hoặc GET `/api/restaurants/:restaurantId/menu`
	- Mô tả: Lấy danh sách món của một nhà hàng

- GET `/api/item/get-by-id/:itemId` hoặc GET `/api/restaurants/menu/item/:id`
	- Mô tả: Lấy chi tiết món

- POST `/api/item/create` hoặc POST `/api/restaurants/:restaurantId/menu`
	- Protected: role: restaurant
	- Body ví dụ: { name, price, description, image, category, stock }

- POST `/api/item/edit-item/:itemId` hoặc PATCH `/api/restaurants/menu/:id`

- DELETE `/api/item/delete/:itemId` hoặc DELETE `/api/restaurants/menu/:id`

- PATCH `/api/restaurants/menu/:id/stock` — Cập nhật tồn kho

---

🛒 Cart

- GET `/api/cart/get` — Lấy giỏ hàng hiện tại (user)
	- Protected: Có

- POST `/api/cart/add`
	- Body: { itemId, quantity }

- POST `/api/cart/update`
	- Body: { itemId, quantity }

- DELETE `/api/cart/remove/:itemId`

- DELETE `/api/cart/clear`

---

📦 Order

- POST `/api/order` hoặc `/api/orders` — Tạo đơn hàng
	- Protected: Có
	- Body ví dụ: { shopId, items: [{ itemId, quantity }], deliveryAddress, paymentMethod }

- GET `/api/order/my-orders` hoặc GET `/api/orders/user` — Lấy đơn của user
- GET `/api/order/shop-orders` hoặc GET `/api/orders/restaurant/orders` — Lấy đơn của shop

- GET `/api/order/:orderId` — Lấy chi tiết đơn

- PATCH `/api/order/:orderId/status` — Cập nhật trạng thái đơn (shop/admin/delivery)

- PATCH `/api/order/:id/cancel` — Hủy đơn

- POST `/api/orders/:id/assign-drone` — Gán drone cho đơn

---

💳 Payment

- POST `/api/payment/vnpay/create-payment-url` — Tạo URL thanh toán VNPay
	- Body: { orderId, amount, returnUrl }

- GET `/api/payment/vnpay/return` — Redirect trả về sau thanh toán

- GET `/api/payment/vnpay/ipn` — IPN / notify từ cổng

- MoMo endpoints (payment-service)
	- POST `/api/payments/momo/create`
	- POST `/api/payments/momo/notify` (callback)
	- POST `/api/payments/momo/ipn`

---

🚁 Drone & Mission

- GET `/api/drones` — Lấy danh sách drone (admin)
- GET `/api/drones/:id` — Lấy chi tiết drone
- PATCH `/api/drones/:id/status` — Cập nhật trạng thái drone

- GET `/api/missions` — Lấy danh sách nhiệm vụ
- GET `/api/missions/:id` — Lấy chi tiết nhiệm vụ
- POST `/api/missions` — Tạo nhiệm vụ
- PATCH `/api/missions/:id/status` — Cập nhật trạng thái nhiệm vụ

- Restaurant-scoped missions:
	- GET `/api/missions` (restaurant)
	- POST `/api/missions` (restaurant tạo)
	- POST `/api/missions/:id/simulate` — Bắt đầu mô phỏng
	- POST `/api/missions/:id/stop-simulation` — Dừng mô phỏng

---

📌 Common response examples

- Success: 200 OK { data }
- Created: 201 Created { data }
- 400 Bad Request { message, errors }
- 401 Unauthorized { message }
- 403 Forbidden { message }
- 404 Not Found { message }

---

## 📄 License
- Dự án được phát triển cho mục đích học tập.

