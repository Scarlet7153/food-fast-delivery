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
- ✅ Đặt món ăn và thanh toán MoMo (QR code + App-to-App)
- ✅ Theo dõi drone giao hàng **real-time** trên bản đồ
- ✅ Xem lịch sử đơn hàng

### 🍴 Nhà hàng (Restaurant)
- ✅ Quản lý menu (thêm, sửa, xóa món ăn)
- ✅ Quản lý đơn hàng (xác nhận, từ chối, xử lý)
- ✅ Quản lý drone giao hàng
- ✅ Theo dõi doanh thu
- ✅ Theo dõi nhiệm vụ giao hàng
- ✅ Nhận thông báo **real-time**

### 👨‍💼 Quản trị viên (Admin)
- ✅ Quản lý người dùng hệ thống
- ✅ Quản lý nhà hàng (phê duyệt, cấp quyền)
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
npm run install:all

# Chạy toàn bộ hệ thống
npm run microservices:start
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
