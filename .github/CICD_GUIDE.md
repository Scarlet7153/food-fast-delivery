# Hướng dẫn CI/CD cho dự án Food Fast Delivery

## Tổng quan

Dự án Food Fast Delivery sử dụng GitHub Actions để triển khai CI/CD pipeline cho hệ thống microservices. Pipeline bao gồm:

- **Client**: React app (Vite)
- **API Gateway**: Express.js
- **Microservices**: user-service, restaurant-service, order-service, drone-service, payment-service

## Cấu trúc Workflows

### 1. Main Pipeline (`.github/workflows/main.yml`)
- **Trigger**: Push/PR vào `main` hoặc `develop`
- **Chức năng**: 
  - Test tất cả services
  - Build Docker images khi push vào `main`
  - Chạy song song các jobs để tối ưu thời gian

### 2. Service-specific Workflows
Mỗi service có workflow riêng để tối ưu hóa:

#### Client (`.github/workflows/client.yml`)
- **Trigger**: Khi có thay đổi trong `client/` folder
- **Jobs**:
  - Test: ESLint, Build
  - Build & Push Docker image
  - Deploy to staging/production

#### API Gateway (`.github/workflows/api-gateway.yml`)
- **Trigger**: Khi có thay đổi trong `services/api-gateway/`
- **Jobs**:
  - Test: Unit tests, Security audit
  - Build & Push Docker image
  - Deploy to staging/production

#### Microservices (`.github/workflows/{service}-service.yml`)
- **Services**: user, restaurant, order, drone, payment
- **Trigger**: Khi có thay đổi trong `services/{service}-service/`
- **Jobs**:
  - Test: Unit tests với MongoDB service
  - Build & Push Docker image
  - Deploy to staging/production

### 3. Docker Workflow (`.github/workflows/docker-build.yml`)
- **Trigger**: Push/PR vào `main` hoặc `develop`
- **Jobs**:
  - Build & Push tất cả Docker images
  - Security scan với Trivy
  - Test Docker Compose
  - Cleanup old images

### 4. Deployment Workflow (`.github/workflows/deploy.yml`)
- **Trigger**: Push vào `main`/`develop` hoặc manual trigger
- **Jobs**:
  - Deploy to staging (develop branch)
  - Deploy to production (main branch)
  - Health check
  - Rollback nếu cần
  - Notification

## Cấu hình Environment

### GitHub Secrets cần thiết:
```bash
# Container Registry
GITHUB_TOKEN  # Tự động có sẵn

# Database (nếu cần)
MONGO_URI
MONGO_USERNAME
MONGO_PASSWORD

# Payment (Momo)
MOMO_PARTNER_CODE
MOMO_ACCESS_KEY
MOMO_SECRET_KEY

# Cloudinary (nếu sử dụng)
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET

# Deployment (nếu sử dụng cloud)
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
KUBECONFIG
```

### GitHub Environments:
1. **staging**: Environment cho testing
2. **production**: Environment cho production

## Cách sử dụng

### 1. Development Workflow
```bash
# Tạo feature branch
git checkout -b feature/new-feature

# Push code
git push origin feature/new-feature

# Tạo Pull Request
# → Workflow sẽ chạy test cho các services có thay đổi
```

### 2. Staging Deployment
```bash
# Merge vào develop branch
git checkout develop
git merge feature/new-feature
git push origin develop

# → Tự động deploy to staging
```

### 3. Production Deployment
```bash
# Merge vào main branch
git checkout main
git merge develop
git push origin main

# → Tự động deploy to production
```

### 4. Manual Deployment
1. Vào GitHub Actions tab
2. Chọn workflow "Deploy to Environments"
3. Click "Run workflow"
4. Chọn environment (staging/production)
5. Click "Run workflow"

## Monitoring và Debugging

### 1. Xem logs
- Vào GitHub Actions tab
- Click vào workflow run
- Click vào job để xem logs

### 2. Common Issues
- **Test failures**: Kiểm tra test cases và dependencies
- **Build failures**: Kiểm tra Dockerfile và dependencies
- **Deployment failures**: Kiểm tra environment variables và permissions

### 3. Rollback
- Nếu deployment fail, workflow sẽ tự động rollback
- Hoặc có thể manual rollback bằng cách chạy lại workflow với commit cũ

## Tùy chỉnh

### 1. Thêm service mới
1. Tạo workflow file: `.github/workflows/{service-name}.yml`
2. Copy template từ service khác
3. Update paths và service name
4. Thêm vào main workflow nếu cần

### 2. Thay đổi deployment strategy
1. Edit `.github/workflows/deploy.yml`
2. Thêm logic deployment mới (Kubernetes, AWS ECS, etc.)
3. Update environment variables

### 3. Thêm notification
1. Edit notification steps trong workflows
2. Thêm webhook URLs hoặc API keys
3. Cấu hình message format

## Best Practices

### 1. Branch Strategy
- `main`: Production code
- `develop`: Staging code
- `feature/*`: Feature branches
- `hotfix/*`: Hotfix branches

### 2. Commit Messages
```
feat: add new feature
fix: fix bug
docs: update documentation
style: formatting changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

### 3. Security
- Sử dụng GitHub Secrets cho sensitive data
- Enable branch protection rules
- Require PR reviews
- Enable security scanning

### 4. Performance
- Sử dụng cache cho dependencies
- Chạy tests song song
- Chỉ build images khi cần thiết
- Cleanup old images

## Troubleshooting

### 1. Workflow không chạy
- Kiểm tra file syntax
- Kiểm tra branch protection rules
- Kiểm tra permissions

### 2. Test failures
- Kiểm tra test environment
- Kiểm tra database connection
- Kiểm tra dependencies

### 3. Build failures
- Kiểm tra Dockerfile
- Kiểm tra dependencies
- Kiểm tra resource limits

### 4. Deployment failures
- Kiểm tra environment variables
- Kiểm tra network connectivity
- Kiểm tra service health

## Liên hệ

Nếu có vấn đề với CI/CD pipeline, vui lòng:
1. Kiểm tra logs trong GitHub Actions
2. Tạo issue với thông tin chi tiết
3. Liên hệ team DevOps
