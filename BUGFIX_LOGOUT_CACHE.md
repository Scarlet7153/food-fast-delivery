# 🐛 Bug Fix: Cache Persistence After Logout

## Vấn đề
Khi đăng xuất user A và đăng nhập user B, thông tin của user A vẫn hiển thị cho đến khi refresh trang.

## Nguyên nhân
1. **React Query Cache**: React Query lưu cache các API response trong memory
2. **LocalStorage**: Một số data có thể được cache trong localStorage
3. **Zustand State**: State management có thể giữ state cũ
4. **Component State**: Các component không re-render hoàn toàn sau logout

## Giải pháp đã áp dụng

### 1. Cập nhật `main.jsx`
```javascript
// Make queryClient available globally for logout function
window.queryClient = queryClient
```
- Expose React Query client globally để có thể clear cache từ auth store

### 2. Cập nhật `authStore.js` - Logout Function

#### a. Clear React Query Cache
```javascript
if (window.queryClient) {
  window.queryClient.clear()
}
```

#### b. Clear User-Specific LocalStorage
```javascript
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('restaurant-') || 
      key.startsWith('order-') || 
      key.startsWith('mission-') ||
      key.startsWith('drone-') ||
      key.startsWith('menu-')) {
    localStorage.removeItem(key)
  }
})
```

#### c. Force Page Reload
```javascript
setTimeout(() => {
  window.location.href = '/login'
}, 500)
```
- Redirect về trang login sau 500ms
- Đảm bảo tất cả state được reset hoàn toàn

### 3. Cập nhật Login & Register Functions
```javascript
// Clear any existing cache before login
if (window.queryClient) {
  window.queryClient.clear()
}
```
- Clear cache cũ trước khi đăng nhập user mới
- Đảm bảo không có data cũ còn sót lại

### 4. Cập nhật Force Logout
```javascript
// Clear React Query cache
if (window.queryClient) {
  window.queryClient.clear()
}
```
- Áp dụng tương tự cho trường hợp token hết hạn

## Kết quả
✅ Khi logout, toàn bộ cache được xóa sạch
✅ Khi login user mới, chỉ hiển thị data của user đó
✅ Không cần refresh trang thủ công
✅ Tự động redirect về trang login sau logout

## Test Cases
1. ✅ Login user A (restaurant) → Xem thông tin
2. ✅ Logout user A
3. ✅ Login user B (restaurant khác)
4. ✅ Kiểm tra thông tin hiển thị đúng của user B
5. ✅ Không còn thông tin của user A

## Files Modified
- `client/src/main.jsx`
- `client/src/stores/authStore.js`

## Notes
- Sử dụng `window.location.href` thay vì `navigate()` để đảm bảo full page reload
- Delay 500ms cho phép toast message hiển thị trước khi redirect
- Clear cache theo pattern (prefix) để tránh xóa nhầm dữ liệu hệ thống

## Related Issues
- Cache persistence after logout
- Stale data showing for new user
- Need manual refresh after login/logout
