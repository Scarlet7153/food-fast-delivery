# ☸️ Kubernetes Setup Guide

Hướng dẫn deploy dự án lên Kubernetes trên Docker Desktop.

## 📋 Yêu cầu

1. **Docker Desktop** đã được cài đặt
2. **Kubernetes enabled** trong Docker Desktop
3. **kubectl** đã được cài đặt (thường đi kèm với Docker Desktop)

## 🚀 Quick Start

### Bước 1: Enable Kubernetes trong Docker Desktop

1. Mở **Docker Desktop**
2. Vào **Settings** → **Kubernetes**
3. Tick vào **Enable Kubernetes**
4. Click **Apply & Restart**
5. Đợi Kubernetes cluster khởi động (có thể mất vài phút)

### Bước 2: Build Docker Images

```bash
# Build tất cả images
docker-compose build
```

### Bước 3: Deploy lên Kubernetes

**Windows:**
```cmd
k8s\deploy.bat
```

**Linux/Mac:**
```bash
chmod +x k8s/deploy.sh
./k8s/deploy.sh
```

**Hoặc deploy từng bước:**
```bash
# 1. Tạo namespace
kubectl apply -f k8s/namespace.yaml

# 2. Tạo ConfigMap và Secrets
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml

# 3. Deploy MongoDB
kubectl apply -f k8s/mongodb.yaml

# 4. Deploy các services
kubectl apply -f k8s/user-service.yaml
kubectl apply -f k8s/restaurant-service.yaml
kubectl apply -f k8s/order-service.yaml
kubectl apply -f k8s/drone-service.yaml
kubectl apply -f k8s/payment-service.yaml
kubectl apply -f k8s/api-gateway.yaml
kubectl apply -f k8s/client.yaml
```

## 🌐 Truy cập Services

Sau khi deploy thành công, các services sẽ available tại:

| Service | URL | Port |
|---------|-----|------|
| API Gateway | http://localhost:30001 | 30001 |
| Client (Frontend) | http://localhost:30173 | 30173 |

**Lưu ý:** Các services khác chỉ accessible từ trong cluster (ClusterIP).

## 📊 Kiểm tra trạng thái

### Xem tất cả pods
```bash
kubectl get pods -n ffdd
```

### Xem tất cả services
```bash
kubectl get services -n ffdd
```

### Xem deployments
```bash
kubectl get deployments -n ffdd
```

### Xem chi tiết một pod
```bash
kubectl describe pod <pod-name> -n ffdd
```

## 📝 Xem Logs

### Logs của một pod
```bash
kubectl logs <pod-name> -n ffdd
```

### Logs real-time (follow)
```bash
kubectl logs -f <pod-name> -n ffdd
```

### Logs của tất cả pods trong một deployment
```bash
kubectl logs -l app=api-gateway -n ffdd
```

## 🔧 Quản lý

### Scale deployment
```bash
# Scale api-gateway lên 3 replicas
kubectl scale deployment api-gateway --replicas=3 -n ffdd
```

### Restart deployment
```bash
kubectl rollout restart deployment api-gateway -n ffdd
```

### Update image
```bash
# Sau khi build image mới
docker-compose build api-gateway

# Update deployment
kubectl set image deployment/api-gateway api-gateway=ffdd-api-gateway:latest -n ffdd
```

### Rollback deployment
```bash
kubectl rollout undo deployment/api-gateway -n ffdd
```

## 🗑️ Xóa Deployment

### Xóa một service
```bash
kubectl delete -f k8s/api-gateway.yaml
```

### Xóa tất cả
```bash
kubectl delete namespace ffdd
```

## 🔍 Troubleshooting

### Pod không start được

```bash
# Xem events
kubectl get events -n ffdd --sort-by='.lastTimestamp'

# Xem logs
kubectl logs <pod-name> -n ffdd

# Xem describe để biết lỗi
kubectl describe pod <pod-name> -n ffdd
```

### Image pull errors

Nếu gặp lỗi `ImagePullBackOff`, có thể do:
- Image chưa được build: `docker-compose build`
- Image không có trong local registry

**Giải pháp:** Build lại images và đảm bảo chúng có trong Docker local:
```bash
docker images | grep ffdd
```

### MongoDB connection issues

```bash
# Kiểm tra MongoDB pod
kubectl get pods -l app=mongodb -n ffdd

# Xem MongoDB logs
kubectl logs -l app=mongodb -n ffdd

# Test connection từ một pod khác
kubectl exec -it <pod-name> -n ffdd -- sh
# Trong pod: mongosh mongodb://admin:password123@mongodb:27017/drone?authSource=admin
```

### Service không accessible

```bash
# Kiểm tra service endpoints
kubectl get endpoints -n ffdd

# Test từ trong cluster
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- sh
# Trong pod: curl http://api-gateway:3001/health
```

## 📁 Cấu trúc thư mục k8s/

```
k8s/
├── namespace.yaml          # Namespace definition
├── configmap.yaml          # Environment variables
├── secrets.yaml            # Sensitive data (JWT, passwords)
├── mongodb.yaml            # MongoDB StatefulSet
├── api-gateway.yaml        # API Gateway Deployment & Service
├── user-service.yaml       # User Service Deployment & Service
├── restaurant-service.yaml # Restaurant Service Deployment & Service
├── order-service.yaml      # Order Service Deployment & Service
├── drone-service.yaml      # Drone Service Deployment & Service
├── payment-service.yaml    # Payment Service Deployment & Service
├── client.yaml             # Client Deployment & Service
├── kustomization.yaml      # Kustomize config (optional)
├── deploy.sh               # Deployment script (Linux/Mac)
└── deploy.bat              # Deployment script (Windows)
```

## 🔐 Secrets Management

**⚠️ Quan trọng:** File `k8s/secrets.yaml` chứa sensitive data. Trong production, nên sử dụng:
- Kubernetes Secrets từ external sources
- Sealed Secrets
- External Secrets Operator
- Vault

Để update secrets:
```bash
# Edit secret
kubectl edit secret ffdd-secrets -n ffdd

# Hoặc apply lại file
kubectl apply -f k8s/secrets.yaml
```

## 📈 Monitoring

### Setup Prometheus + Grafana

```bash
# Deploy monitoring stack
# Windows
k8s\monitoring\deploy-monitoring.bat

# Linux/Mac
./k8s/monitoring/deploy-monitoring.sh
```

**Access:**
- **Grafana:** http://localhost:31000 (Username: `admin`, Password: `admin123`)
- **Prometheus:** http://localhost:30090

**Dashboard:** Food Fast Delivery - Overview (auto-imported)

### Quick Start

Xem [Quick Start Guide](k8s/monitoring/QUICK-START.md) để bắt đầu trong 5 phút!

**Features:**
- 📊 System health & performance metrics
- 🔥 Request rate & response time by service
- 💻 CPU & Memory usage monitoring
- 🚨 Alerting for critical issues
- 📈 Business metrics (orders, revenue, etc.)

### Resource Usage

```bash
kubectl top pods -n ffdd
kubectl top nodes
```

### Port Forwarding

```bash
# Forward API Gateway port
kubectl port-forward svc/api-gateway 3001:3001 -n ffdd

# Forward MongoDB port
kubectl port-forward svc/mongodb 27017:27017 -n ffdd

# Forward Grafana port
kubectl port-forward svc/grafana 3000:3000 -n ffdd

# Forward Prometheus port
kubectl port-forward svc/prometheus 9090:9090 -n ffdd
```

### Guides

- 📖 [Full Grafana Guide](GRAFANA.md) - Chi tiết về Grafana
- 🚀 [Quick Start](k8s/monitoring/QUICK-START.md) - Bắt đầu nhanh
- 🔧 [Setup Services](k8s/monitoring/SETUP-SERVICES.md) - Thêm metrics cho services
- 📚 [Monitoring README](k8s/monitoring/README.md) - Tổng quan monitoring

## ✅ Checklist

- [ ] Docker Desktop đã được cài đặt
- [ ] Kubernetes đã được enable trong Docker Desktop
- [ ] kubectl đã được cài đặt và hoạt động
- [ ] Đã build Docker images (`docker-compose build`)
- [ ] Đã deploy lên Kubernetes
- [ ] Tất cả pods đang running (`kubectl get pods -n ffdd`)
- [ ] Có thể truy cập http://localhost:30001 (API Gateway)
- [ ] Có thể truy cập http://localhost:30173 (Client)

## 🎉 Hoàn thành!

Sau khi deploy thành công:
- API Gateway: http://localhost:30001
- Client: http://localhost:30173
- Xem logs: `kubectl logs -f <pod-name> -n ffdd`
- Xem status: `kubectl get all -n ffdd`

