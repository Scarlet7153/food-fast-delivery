# 🚁 Fast Food Delivery Drone System

> Hệ thống giao đồ ăn nhanh bằng drone với kiến trúc **microservices**, sử dụng **MERN Stack** và **tích hợp thanh toán MoMo**.

---

## 👥 Thành viên thực hiện
- **Võ Duy Toàn** – 3122411218  
- **Lê Thanh Hùng** – [Mã sinh viên]

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

### 👤 Customer
- Đăng ký / Đăng nhập  
- Duyệt danh sách nhà hàng và món ăn  
- Đặt món và thanh toán MoMo (QR + App-to-App)  
- Theo dõi drone giao hàng trực tiếp  
- Xem lịch sử đơn hàng  

### 🍴 Restaurant
- Quản lý menu, đơn hàng và drone  
- Theo dõi doanh thu và nhiệm vụ giao hàng  
- Nhận thông báo real-time  

### 👨‍💼 Admin
- Quản lý người dùng, nhà hàng, đơn hàng  
- Duyệt nhà hàng mới đăng ký  
- Thống kê và báo cáo toàn hệ thống  

---

## 🏗️ Kiến trúc hệ thống

**Microservices chính:**
- API Gateway  
- User Service  
- Restaurant Service  
- Order Service  
- Drone Service  
- Payment Service  

**Database:** MongoDB  
**Frontend:** React + Vite  
**Realtime:** Socket.IO  

---

## 🛠️ Công nghệ

| Loại | Công nghệ |
|------|------------|
| **Frontend** | React, Vite, TailwindCSS, Axios, Zustand |
| **Backend** | Node.js, Express, MongoDB, Mongoose |
| **Realtime** | Socket.IO |
| **Auth** | JWT, Bcrypt |
| **Payment** | MoMo API |
| **DevOps** | Docker, Nginx, Concurrently |

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
