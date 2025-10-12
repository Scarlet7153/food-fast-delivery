# Hướng Dẫn Setup Cloudinary cho Upload Ảnh

## 1. Tạo tài khoản Cloudinary

1. Truy cập [cloudinary.com](https://cloudinary.com)
2. Đăng ký tài khoản miễn phí
3. Xác nhận email và đăng nhập

## 2. Lấy thông tin cấu hình

1. Vào Dashboard của Cloudinary
2. Lấy **Cloud Name** từ phần "Product Environment Credentials"
3. Ghi lại Cloud Name để cấu hình

## 3. Tạo Upload Preset

1. Vào **Settings** > **Upload**
2. Cuộn xuống phần **Upload presets**
3. Click **Add upload preset**
4. Đặt tên preset: `food_delivery`
5. Cấu hình:
   - **Signing Mode**: `Unsigned` (để upload từ frontend)
   - **Folder**: `food-delivery` (tùy chọn)
   - **Access Mode**: `Public`
6. Click **Save**

## 4. Tạo file .env

Tạo file `.env` trong thư mục `client/` với nội dung:

```env
# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=food_delivery
```

**Lưu ý:** 
- Thay `your_actual_cloud_name` bằng Cloud Name thực tế từ Cloudinary dashboard
- File `.env` không được commit vào git (đã có trong .gitignore)
- Vite chỉ đọc các biến môi trường bắt đầu bằng `VITE_`

## 5. Cấu hình tự động

Code đã được cập nhật để tự động đọc từ environment variables. Không cần thay đổi code nữa!

## 6. Test upload

1. Chạy ứng dụng: `npm run dev`
2. Vào trang quản lý menu
3. Thêm món ăn mới
4. Test upload ảnh

## 7. Tùy chọn nâng cao

### Giới hạn kích thước file
Trong component `ImageUpload.jsx`, bạn có thể thay đổi giới hạn:
```javascript
// Thay đổi từ 5MB thành 10MB
if (file.size > 10 * 1024 * 1024) {
```

### Thêm watermark
Trong `cloudinary.js`, thêm transformation:
```javascript
transformations: {
  thumbnail: 'w_300,h_200,c_fill,l_watermark,w_50,h_50',
}
```

### Tự động resize
```javascript
transformations: {
  auto: 'w_auto,h_auto,c_auto,f_auto,q_auto',
}
```

## 8. Bảo mật

- Không commit thông tin API key vào git
- Sử dụng environment variables cho production
- Cấu hình CORS trong Cloudinary dashboard
- Giới hạn kích thước file và định dạng

## 9. Troubleshooting

### Lỗi "Upload preset not found"
- Kiểm tra tên preset có đúng không
- Đảm bảo preset được set là "Unsigned"

### Lỗi CORS
- Vào Cloudinary Settings > Security
- Thêm domain của bạn vào Allowed origins

### Ảnh không hiển thị
- Kiểm tra URL trả về từ Cloudinary
- Đảm bảo Access Mode là "Public"
