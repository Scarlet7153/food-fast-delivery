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