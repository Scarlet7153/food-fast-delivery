# ⚡ Quick Setup - Từ Main Branch

## 🎯 Tình huống của bạn
- ✅ Có branch `main`
- ❌ Chưa có branch `develop`
- ❌ Chưa có CI/CD pipeline

## 🚀 Setup nhanh trong 5 phút

### Bước 1: Tạo branch develop
```bash
# Đảm bảo ở branch main
git checkout main
git pull origin main

# Tạo branch develop
git checkout -b develop
git push origin develop
```

### Bước 2: Test CI/CD pipeline
```bash
# Tạo feature branch test
git checkout -b feature/test-ci-cd

# Tạo file test
echo "# Test CI/CD" > TEST.md
git add TEST.md
git commit -m "test: add test file for CI/CD"
git push origin feature/test-ci-cd
```

### Bước 3: Tạo Pull Request
1. Vào GitHub repository
2. Click "Compare & pull request"
3. Chọn base: `develop`, compare: `feature/test-ci-cd`
4. Click "Create pull request"

### Bước 4: Cấu hình GitHub (quan trọng!)

#### A. Branch Protection Rules
Vào **Settings** → **Branches** → **Add rule**

**Cho branch `main`:**
```
Branch name pattern: main
✅ Require a pull request before merging
✅ Require status checks to pass before merging
✅ Require branches to be up to date before merging
```

**Cho branch `develop`:**
```
Branch name pattern: develop
✅ Require a pull request before merging
✅ Require status checks to pass before merging
✅ Require branches to be up to date before merging
```

#### B. GitHub Secrets
Vào **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Thêm:
```
MONGO_URI=mongodb://admin:password123@localhost:27017/drone?authSource=admin
MOMO_PARTNER_CODE=your_partner_code
MOMO_ACCESS_KEY=your_access_key
MOMO_SECRET_KEY=your_secret_key
```

#### C. GitHub Environments
Vào **Settings** → **Environments** → **New environment**
- Tạo: `staging`
- Tạo: `production`

## 🎯 Workflow sau khi setup

### Development:
```bash
# 1. Tạo feature branch từ develop
git checkout develop
git pull origin develop
git checkout -b feature/ten-tinh-nang

# 2. Code và commit
git add .
git commit -m "feat: add new feature"
git push origin feature/ten-tinh-nang

# 3. Tạo PR vào develop
# → Pipeline chạy test tự động

# 4. Merge vào develop
# → Tự động deploy to staging

# 5. Tạo PR từ develop vào main
# → Merge vào main
# → Tự động deploy to production
```

## 🔍 Kiểm tra kết quả

### 1. **GitHub Actions**
- Vào **Actions** tab
- Xem workflow chạy
- Kiểm tra test results

### 2. **Pull Request**
- Xem phần "Checks"
- Kiểm tra test status
- Xem build results

### 3. **Security**
- Vào **Security** tab
- Xem security alerts
- Kiểm tra vulnerabilities

## 🚨 Lưu ý quan trọng

### ❌ Không làm:
```bash
# Không push trực tiếp vào main/develop
git checkout main
git commit -m "fix bug"
git push origin main  # ❌ Sẽ bị block
```

### ✅ Làm đúng:
```bash
# Tạo feature branch
git checkout -b feature/fix-bug
git commit -m "fix bug"
git push origin feature/fix-bug
# Tạo PR và merge
```

## 🎉 Kết quả

Sau khi setup xong, bạn sẽ có:

- ✅ **2 branches**: `main` (production), `develop` (staging)
- ✅ **CI/CD pipeline**: Tự động test và deploy
- ✅ **Branch protection**: Không thể push trực tiếp
- ✅ **Quality assurance**: Tự động test và security scan
- ✅ **Staging environment**: Test trước khi production
- ✅ **Production environment**: Stable code

## 🆘 Cần help?

### 1. **Xem logs**
- GitHub Actions → Workflow run → Job → Step

### 2. **Check documentation**
- `SETUP_BRANCH_STRATEGY.md` - Hướng dẫn chi tiết
- `QUICK_START.md` - Hướng dẫn sử dụng

### 3. **Test local**
```bash
# Test client
cd client && npm run lint && npm run build

# Test service
cd services/user-service && npm test
```

---

## 🚀 Bắt đầu ngay!

### 1. **Chạy script setup**
```bash
chmod +x setup-branches.sh
./setup-branches.sh
```

### 2. **Hoặc làm manual**
```bash
git checkout main
git checkout -b develop
git push origin develop
```

### 3. **Cấu hình GitHub**
- Branch protection rules
- Secrets
- Environments

### 4. **Test pipeline**
- Tạo feature branch
- Tạo PR
- Xem CI/CD chạy

**Chúc bạn thành công! 🎉**
