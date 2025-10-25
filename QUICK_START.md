# ⚡ Quick Start - CI/CD Pipeline

## 🎯 Tóm tắt nhanh

**CI/CD Pipeline đã sẵn sàng!** Bạn chỉ cần làm theo 3 bước đơn giản:

## 📋 Checklist trước khi bắt đầu

### ✅ 1. Cấu hình GitHub (chỉ làm 1 lần)

#### A. Thêm Secrets:
Vào **GitHub Repository** → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Thêm các secrets này:
```
MONGO_URI=mongodb://admin:password123@localhost:27017/drone?authSource=admin
MOMO_PARTNER_CODE=your_partner_code
MOMO_ACCESS_KEY=your_access_key
MOMO_SECRET_KEY=your_secret_key
```

#### B. Tạo Environments:
Vào **Settings** → **Environments** → **New environment**
- Tạo: `staging`
- Tạo: `production`

#### C. Cấu hình Branch Protection:
Vào **Settings** → **Branches** → **Add rule**
- Chọn branch: `main` và `develop`
- ✅ Require a pull request before merging
- ✅ Require status checks to pass before merging

## 🚀 Cách sử dụng hàng ngày

### Bước 1: Tạo feature branch
```bash
git checkout main
git pull origin main
git checkout -b feature/ten-tinh-nang-moi
```

### Bước 2: Code và commit
```bash
# Làm thay đổi code
# Ví dụ: sửa file trong services/user-service/

git add .
git commit -m "feat: add new feature"
git push origin feature/ten-tinh-nang-moi
```

### Bước 3: Tạo Pull Request
- Vào GitHub repository
- Click "Compare & pull request"
- Điền thông tin
- Click "Create pull request"

**→ Pipeline tự động chạy test!**

### Bước 4: Review và merge
- Reviewer xem code và test results
- Nếu OK → Merge vào `develop`
- **→ Tự động deploy to staging!**

### Bước 5: Deploy production
```bash
git checkout main
git merge develop
git push origin main
```

**→ Tự động deploy to production!**

## 🔍 Xem kết quả

### 1. **GitHub Actions Tab**
- Vào repository → **Actions**
- Xem tất cả workflows đang chạy
- Click vào để xem chi tiết

### 2. **Pull Request**
- Trong PR, xem phần "Checks"
- Xem kết quả test và build

### 3. **Security Tab**
- Vào **Security** tab
- Xem security alerts

## 🎯 Ví dụ thực tế

### Scenario: Thêm tính năng upload ảnh cho restaurant

#### 1. Tạo branch:
```bash
git checkout -b feature/restaurant-image-upload
```

#### 2. Code:
```bash
# Sửa file: services/restaurant-service/src/controllers/restaurant.controller.js
# Thêm function upload image

git add .
git commit -m "feat: add restaurant image upload"
git push origin feature/restaurant-image-upload
```

#### 3. Tạo PR:
- GitHub tự động chạy test cho `restaurant-service`
- Xem kết quả trong PR

#### 4. Merge:
```bash
git checkout develop
git merge feature/restaurant-image-upload
git push origin develop
```

**→ Tự động deploy to staging!**

#### 5. Deploy production:
```bash
git checkout main
git merge develop
git push origin main
```

**→ Tự động deploy to production!**

## 🚨 Khi có lỗi

### 1. **Test fail**
- Xem logs trong GitHub Actions
- Fix code và push lại
- Pipeline sẽ chạy lại

### 2. **Build fail**
- Kiểm tra Dockerfile
- Kiểm tra dependencies
- Fix và push lại

### 3. **Deploy fail**
- Xem logs deployment
- Kiểm tra environment variables
- Pipeline sẽ tự động rollback

## 📊 Monitoring

### Xem trạng thái:
- **GitHub Actions**: Tất cả workflows
- **Security**: Vulnerabilities
- **Dependabot**: Dependency updates

### Nhận thông báo:
- Email khi có lỗi
- Slack/Discord notifications (nếu cấu hình)

## 🎉 Kết quả

**Sau khi setup xong, bạn sẽ có:**

✅ **Tự động test** mỗi khi push code
✅ **Tự động build** Docker images
✅ **Tự động deploy** staging và production
✅ **Tự động security scan**
✅ **Tự động rollback** khi có lỗi
✅ **Tự động notify** team

## 🆘 Cần help?

### 1. **Xem logs**
- GitHub Actions → Workflow run → Job → Step

### 2. **Check documentation**
- `HUONG_DAN_SU_DUNG.md` - Hướng dẫn chi tiết
- `README_CI_CD.md` - Tổng quan

### 3. **Tạo issue**
- Sử dụng bug report template

### 4. **Test local**
```bash
# Test client
cd client && npm run lint && npm run build

# Test service
cd services/user-service && npm test
```

---

## 🎯 Tóm tắt

**Bạn chỉ cần nhớ:**
1. **Code** → **Commit** → **Push**
2. **Tạo PR** → **Review** → **Merge**
3. **Pipeline làm phần còn lại!**

**Pipeline sẽ:**
- Test code
- Build images
- Deploy apps
- Monitor health
- Notify team

**Kết quả:** Development nhanh hơn, ít lỗi hơn, deploy dễ hơn! 🚀
