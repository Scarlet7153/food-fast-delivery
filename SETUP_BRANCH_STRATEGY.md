# 🌿 Setup Branch Strategy cho CI/CD Pipeline

## 📋 Tình huống hiện tại
- ✅ Bạn đã có branch `main`
- ❌ Chưa có branch `develop`
- ❌ Chưa có branch protection rules
- ❌ Chưa có CI/CD pipeline

## 🎯 Mục tiêu
Tạo branch strategy phù hợp với CI/CD pipeline đã setup.

## 🚀 Cách setup từng bước

### Bước 1: Tạo branch `develop` từ `main`

```bash
# Đảm bảo bạn đang ở branch main
git checkout main

# Pull latest changes (nếu có)
git pull origin main

# Tạo branch develop từ main
git checkout -b develop

# Push branch develop lên GitHub
git push origin develop
```

### Bước 2: Cấu hình Branch Protection Rules

#### A. Vào GitHub Repository Settings
1. Vào repository trên GitHub
2. Click **Settings** tab
3. Click **Branches** trong menu bên trái
4. Click **Add rule**

#### B. Cấu hình cho branch `main`
```
Branch name pattern: main
✅ Require a pull request before merging
✅ Require status checks to pass before merging
✅ Require branches to be up to date before merging
✅ Restrict pushes that create files larger than 100 MB
```

#### C. Cấu hình cho branch `develop`
```
Branch name pattern: develop
✅ Require a pull request before merging
✅ Require status checks to pass before merging
✅ Require branches to be up to date before merging
```

### Bước 3: Cấu hình GitHub Secrets

Vào **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Thêm các secrets cần thiết:
```
MONGO_URI=mongodb://admin:password123@localhost:27017/drone?authSource=admin
MOMO_PARTNER_CODE=your_momo_partner_code
MOMO_ACCESS_KEY=your_momo_access_key
MOMO_SECRET_KEY=your_momo_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

### Bước 4: Tạo GitHub Environments

Vào **Settings** → **Environments** → **New environment**

Tạo 2 environments:
- **staging**: Cho testing
- **production**: Cho production

### Bước 5: Test CI/CD Pipeline

#### A. Tạo feature branch và test
```bash
# Tạo feature branch từ develop
git checkout develop
git checkout -b feature/test-ci-cd

# Tạo một thay đổi nhỏ để test
echo "# Test CI/CD" >> TEST.md
git add TEST.md
git commit -m "test: add test file for CI/CD"
git push origin feature/test-ci-cd
```

#### B. Tạo Pull Request
1. Vào GitHub repository
2. Click "Compare & pull request"
3. Chọn base branch: `develop`
4. Chọn compare branch: `feature/test-ci-cd`
5. Điền thông tin PR
6. Click "Create pull request"

#### C. Kiểm tra CI/CD Pipeline
- Vào **Actions** tab để xem workflow chạy
- Xem kết quả test trong PR
- Nếu thành công → Merge PR

## 🔄 Workflow sau khi setup

### Development Workflow:
```
main (production)
  ↑
develop (staging)
  ↑
feature/ten-tinh-nang (development)
```

### Quy trình làm việc:
1. **Tạo feature branch** từ `develop`
2. **Code và commit**
3. **Tạo PR** vào `develop`
4. **Review và merge** vào `develop`
5. **Tự động deploy** to staging
6. **Tạo PR** từ `develop` vào `main`
7. **Review và merge** vào `main`
8. **Tự động deploy** to production

## 📝 Ví dụ thực tế

### Scenario: Thêm tính năng mới

#### 1. Tạo feature branch
```bash
git checkout develop
git pull origin develop
git checkout -b feature/add-restaurant-rating
```

#### 2. Code và commit
```bash
# Làm thay đổi code
# Ví dụ: sửa file trong services/restaurant-service/

git add .
git commit -m "feat: add restaurant rating system"
git push origin feature/add-restaurant-rating
```

#### 3. Tạo PR vào develop
- GitHub UI → "Compare & pull request"
- Base: `develop`, Compare: `feature/add-restaurant-rating`
- Pipeline chạy test cho `restaurant-service`

#### 4. Merge vào develop
```bash
git checkout develop
git merge feature/add-restaurant-rating
git push origin develop
```

**→ Tự động deploy to staging!**

#### 5. Tạo PR vào main
- Tạo PR từ `develop` vào `main`
- Review và merge

#### 6. Deploy production
```bash
git checkout main
git merge develop
git push origin main
```

**→ Tự động deploy to production!**

## 🎯 Branch Strategy Summary

### Branch Types:
- **`main`**: Production code (stable)
- **`develop`**: Staging code (testing)
- **`feature/*`**: Feature development
- **`hotfix/*`**: Hotfixes (nếu cần)

### Naming Convention:
```bash
feature/add-user-profile
feature/fix-login-bug
hotfix/critical-security-fix
```

### Protection Rules:
- **`main`**: Require PR, status checks, up-to-date
- **`develop`**: Require PR, status checks, up-to-date
- **`feature/*`**: No restrictions

## 🚨 Lưu ý quan trọng

### 1. **Không push trực tiếp vào main/develop**
```bash
# ❌ Không làm thế này
git checkout main
git commit -m "fix bug"
git push origin main

# ✅ Làm thế này
git checkout -b feature/fix-bug
git commit -m "fix bug"
git push origin feature/fix-bug
# Tạo PR và merge
```

### 2. **Luôn pull trước khi tạo branch**
```bash
git checkout develop
git pull origin develop
git checkout -b feature/new-feature
```

### 3. **Delete feature branch sau khi merge**
```bash
# Sau khi merge PR
git branch -d feature/new-feature
git push origin --delete feature/new-feature
```

## 🔧 Troubleshooting

### 1. **"Branch protection rule prevents push"**
- Tạo feature branch thay vì push trực tiếp
- Tạo PR và merge

### 2. **"Status checks required"**
- Đợi CI/CD pipeline chạy xong
- Fix lỗi nếu có
- Pipeline sẽ chạy lại

### 3. **"Branch is not up to date"**
```bash
git checkout develop
git pull origin develop
git checkout feature/your-branch
git rebase develop
git push origin feature/your-branch
```

## 🎉 Kết quả sau khi setup

### Bạn sẽ có:
- ✅ **2 branches chính**: `main`, `develop`
- ✅ **Branch protection**: Không thể push trực tiếp
- ✅ **CI/CD pipeline**: Tự động test và deploy
- ✅ **Staging environment**: Test trước khi production
- ✅ **Production environment**: Stable code

### Workflow:
- ✅ **Feature development**: Tạo branch → Code → PR → Merge
- ✅ **Staging deployment**: Tự động khi merge vào `develop`
- ✅ **Production deployment**: Tự động khi merge vào `main`
- ✅ **Quality assurance**: Tự động test và security scan

---

## 🚀 Bắt đầu ngay!

### 1. **Tạo branch develop**
```bash
git checkout main
git checkout -b develop
git push origin develop
```

### 2. **Cấu hình GitHub**
- Branch protection rules
- Secrets
- Environments

### 3. **Test pipeline**
- Tạo feature branch
- Tạo PR
- Xem CI/CD chạy

### 4. **Bắt đầu development**
- Code trên feature branch
- Tạo PR
- Merge và deploy

**Chúc bạn thành công! 🎉**
