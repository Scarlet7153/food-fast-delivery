# 🚀 Hướng dẫn sử dụng CI/CD Pipeline - Food Fast Delivery

## 📋 Mục lục
1. [Chuẩn bị ban đầu](#chuẩn-bị-ban-đầu)
2. [Cấu hình GitHub](#cấu-hình-github)
3. [Workflow Development](#workflow-development)
4. [Cách hoạt động của Pipeline](#cách-hoạt-động-của-pipeline)
5. [Ví dụ thực tế](#ví-dụ-thực-tế)
6. [Troubleshooting](#troubleshooting)

## 🔧 Chuẩn bị ban đầu

### Bước 1: Kiểm tra cấu trúc dự án
Đảm bảo bạn có cấu trúc thư mục như sau:
```
food-fast-delivery/
├── .github/
│   ├── workflows/          # ✅ Đã tạo
│   ├── ISSUE_TEMPLATE/     # ✅ Đã tạo
│   ├── dependabot.yml      # ✅ Đã tạo
│   └── pull_request_template.md # ✅ Đã tạo
├── client/                 # React app
├── services/
│   ├── api-gateway/
│   ├── user-service/
│   ├── restaurant-service/
│   ├── order-service/
│   ├── drone-service/
│   └── payment-service/
└── docker-compose.yml
```

### Bước 2: Push code lên GitHub
```bash
# Nếu chưa có remote
git remote add origin https://github.com/username/food-fast-delivery.git

# Push tất cả code
git add .
git commit -m "feat: add CI/CD pipeline"
git push origin main
```

## ⚙️ Cấu hình GitHub

### Bước 1: Cấu hình GitHub Secrets
Vào **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Thêm các secrets sau:
```
MONGO_URI=mongodb://admin:password123@localhost:27017/drone?authSource=admin
MOMO_PARTNER_CODE=your_momo_partner_code
MOMO_ACCESS_KEY=your_momo_access_key
MOMO_SECRET_KEY=your_momo_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

### Bước 2: Tạo GitHub Environments
Vào **Settings** → **Environments** → **New environment**

Tạo 2 environments:
- **staging**: Cho testing
- **production**: Cho production

### Bước 3: Cấu hình Branch Protection
Vào **Settings** → **Branches** → **Add rule**

Cấu hình cho `main` và `develop`:
- ✅ Require a pull request before merging
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging

## 🔄 Workflow Development

### Quy trình làm việc hàng ngày:

#### 1. **Tạo feature branch**
```bash
# Từ main branch
git checkout main
git pull origin main

# Tạo feature branch mới
git checkout -b feature/add-new-menu-item
```

#### 2. **Làm việc và commit**
```bash
# Làm thay đổi code
# Ví dụ: sửa file trong services/restaurant-service/

# Commit changes
git add .
git commit -m "feat: add new menu item functionality"
git push origin feature/add-new-menu-item
```

#### 3. **Tạo Pull Request**
- Vào GitHub repository
- Click "Compare & pull request"
- Điền thông tin theo template
- Assign reviewers
- Click "Create pull request"

#### 4. **Pipeline tự động chạy**
Khi tạo PR, pipeline sẽ:
- ✅ Chạy test cho `restaurant-service` (vì có thay đổi)
- ✅ Chạy ESLint cho client (nếu có thay đổi)
- ✅ Chạy security scan
- ✅ Hiển thị kết quả trong PR

#### 5. **Review và merge**
- Reviewer xem code và test results
- Nếu OK → Merge vào `develop`
- Pipeline tự động deploy to staging

## 🚀 Cách hoạt động của Pipeline

### Khi push vào `develop` branch:
```mermaid
graph LR
    A[Push to develop] --> B[Run Tests]
    B --> C[Build Docker Images]
    C --> D[Deploy to Staging]
    D --> E[Health Check]
    E --> F[Notify Team]
```

### Khi push vào `main` branch:
```mermaid
graph LR
    A[Push to main] --> B[Run All Tests]
    B --> C[Build All Images]
    C --> D[Security Scan]
    D --> E[Deploy to Production]
    E --> F[Health Check]
    F --> G[Notify Team]
```

## 📝 Ví dụ thực tế

### Ví dụ 1: Thêm tính năng mới vào User Service

#### Bước 1: Tạo branch
```bash
git checkout -b feature/user-profile-avatar
```

#### Bước 2: Sửa code
```bash
# Sửa file: services/user-service/src/controllers/user.controller.js
# Thêm function upload avatar

git add .
git commit -m "feat: add user avatar upload functionality"
git push origin feature/user-profile-avatar
```

#### Bước 3: Tạo PR
- GitHub sẽ tự động chạy workflow `user-service.yml`
- Test user-service với MongoDB
- Build Docker image
- Hiển thị kết quả trong PR

#### Bước 4: Merge
```bash
# Merge vào develop
git checkout develop
git merge feature/user-profile-avatar
git push origin develop

# → Tự động deploy to staging
```

### Ví dụ 2: Fix bug trong Client

#### Bước 1: Tạo hotfix branch
```bash
git checkout -b hotfix/fix-login-bug
```

#### Bước 2: Fix bug
```bash
# Sửa file: client/src/pages/auth/Login.jsx
# Fix login logic

git add .
git commit -m "fix: resolve login authentication issue"
git push origin hotfix/fix-login-bug
```

#### Bước 3: Tạo PR
- GitHub chạy workflow `client.yml`
- ESLint check
- Build client
- Test results hiển thị trong PR

#### Bước 4: Merge to main (hotfix)
```bash
git checkout main
git merge hotfix/fix-login-bug
git push origin main

# → Tự động deploy to production
```

## 🔍 Monitoring và Debugging

### Xem trạng thái Pipeline:

#### 1. **GitHub Actions Tab**
- Vào repository → **Actions** tab
- Xem tất cả workflow runs
- Click vào run để xem chi tiết

#### 2. **Pull Request Checks**
- Trong PR, xem phần "Checks"
- Xem kết quả test và build
- Click "Details" để xem logs

#### 3. **Security Tab**
- Vào **Security** tab
- Xem CodeQL alerts
- Xem dependency vulnerabilities

### Debug khi có lỗi:

#### 1. **Test Failures**
```bash
# Xem logs trong GitHub Actions
# Kiểm tra:
- Test environment setup
- Database connection
- Dependencies installation
```

#### 2. **Build Failures**
```bash
# Kiểm tra:
- Dockerfile syntax
- Dependencies in package.json
- Resource limits
```

#### 3. **Deployment Failures**
```bash
# Kiểm tra:
- Environment variables
- Network connectivity
- Service health
```

## 🛠️ Các lệnh hữu ích

### Kiểm tra trạng thái local:
```bash
# Test client
cd client
npm run lint
npm run build

# Test service
cd services/user-service
npm test
npm audit
```

### Kiểm tra Docker:
```bash
# Build image local
docker build -t user-service ./services/user-service

# Test docker-compose
docker-compose up -d
docker-compose ps
docker-compose logs
```

### Manual deployment:
```bash
# Nếu cần deploy manual
# Vào GitHub Actions → Deploy to Environments → Run workflow
```

## 📊 Dashboard và Reports

### 1. **GitHub Actions Dashboard**
- Tổng quan tất cả workflows
- Thời gian chạy
- Success/failure rate

### 2. **Dependabot**
- Dependency updates
- Security vulnerabilities
- Weekly reports

### 3. **Security Dashboard**
- CodeQL alerts
- Secret scanning
- Dependency vulnerabilities

## 🚨 Troubleshooting

### Lỗi thường gặp:

#### 1. **"No tests found"**
```bash
# Kiểm tra package.json có script test không
# Thêm test script nếu chưa có
"scripts": {
  "test": "jest"
}
```

#### 2. **"Docker build failed"**
```bash
# Kiểm tra Dockerfile có tồn tại không
# Kiểm tra syntax Dockerfile
```

#### 3. **"Environment not found"**
```bash
# Tạo environment trong GitHub Settings
# Cấu hình environment variables
```

#### 4. **"Permission denied"**
```bash
# Kiểm tra GitHub token permissions
# Kiểm tra repository settings
```

## 📞 Hỗ trợ

### Khi cần help:
1. **Xem logs**: GitHub Actions → Workflow run → Job → Step
2. **Check documentation**: README_CI_CD.md
3. **Tạo issue**: Sử dụng bug report template
4. **Liên hệ team**: Slack/Discord channel

### Resources hữu ích:
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Node.js Testing](https://nodejs.org/en/docs/guides/testing/)

---

## 🎯 Tóm tắt

**Quy trình đơn giản:**
1. Tạo feature branch
2. Code và commit
3. Tạo Pull Request
4. Review và merge
5. Tự động deploy

**Pipeline sẽ:**
- ✅ Test code tự động
- ✅ Build Docker images
- ✅ Deploy to staging/production
- ✅ Health check
- ✅ Notify team

**Bạn chỉ cần:**
- Code và commit
- Tạo PR
- Review và merge
- Pipeline làm phần còn lại! 🚀
