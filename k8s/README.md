# ☸️ Kubernetes Manifests

Thư mục này chứa tất cả các file Kubernetes manifests để deploy dự án lên Kubernetes.

## 📁 Cấu trúc

```
k8s/
├── namespace.yaml          # Namespace definition
├── configmap.yaml          # Environment variables (non-sensitive)
├── secrets.yaml            # Sensitive data (JWT, passwords)
├── mongodb.yaml            # MongoDB StatefulSet & Service
├── api-gateway.yaml        # API Gateway Deployment & Service
├── user-service.yaml       # User Service Deployment & Service
├── restaurant-service.yaml # Restaurant Service Deployment & Service
├── order-service.yaml      # Order Service Deployment & Service
├── drone-service.yaml      # Drone Service Deployment & Service
├── payment-service.yaml    # Payment Service Deployment & Service
├── client.yaml             # Client Deployment & Service
├── kustomization.yaml      # Kustomize config (optional)
├── deploy.sh               # Deployment script (Linux/Mac)
├── deploy.bat              # Deployment script (Windows)
└── load-images.sh          # Load images script
```

## 🚀 Quick Deploy

### Windows:
```cmd
k8s\deploy.bat
```

### Linux/Mac:
```bash
chmod +x k8s/deploy.sh
./k8s/deploy.sh
```

## 📝 Manual Deploy

```bash
# 1. Create namespace
kubectl apply -f k8s/namespace.yaml

# 2. Create ConfigMap and Secrets
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml

# 3. Deploy MongoDB
kubectl apply -f k8s/mongodb.yaml

# 4. Deploy all services
kubectl apply -f k8s/user-service.yaml
kubectl apply -f k8s/restaurant-service.yaml
kubectl apply -f k8s/order-service.yaml
kubectl apply -f k8s/drone-service.yaml
kubectl apply -f k8s/payment-service.yaml
kubectl apply -f k8s/api-gateway.yaml
kubectl apply -f k8s/client.yaml
```

## 🔍 Kiểm tra

```bash
# Xem pods
kubectl get pods -n ffdd

# Xem services
kubectl get services -n ffdd

# Xem logs
kubectl logs -f <pod-name> -n ffdd
```

## 🗑️ Xóa

```bash
# Xóa tất cả
kubectl delete namespace ffdd
```

Xem thêm chi tiết trong [KUBERNETES.md](../KUBERNETES.md)

