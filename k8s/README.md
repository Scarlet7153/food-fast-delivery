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
REM Default deploys application (app namespace `ffdd`)
k8s\deploy.bat [app|monitoring|all]

:: Examples:
:: k8s\deploy.bat            -> deploy app (default)
:: k8s\deploy.bat monitoring -> deploy monitoring only (namespace: monitoring)
:: k8s\deploy.bat all        -> deploy both app and monitoring
```

### Linux/Mac:
```bash
chmod +x k8s/deploy.sh
./k8s/deploy.sh [app|monitoring|all]

# Examples:
# ./k8s/deploy.sh            -> deploy app (default)
# ./k8s/deploy.sh monitoring -> deploy monitoring only (namespace: monitoring)
# ./k8s/deploy.sh all        -> deploy both app and monitoring
```

## 📝 Manual Deploy

This repo separates application resources and monitoring into two namespaces:

- Application namespace: `ffdd` (default for app resources)
- Monitoring namespace: `monitoring` (Prometheus & Grafana)

Deploy application resources into the `ffdd` namespace:

```bash
# 1. Create application namespace
kubectl apply -f k8s/namespace.yaml

# 2. Create ConfigMap and Secrets in app namespace
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml

# 3. Deploy MongoDB and app services (namespace: ffdd)
kubectl apply -f k8s/mongodb.yaml
kubectl apply -f k8s/user-service.yaml
kubectl apply -f k8s/restaurant-service.yaml
kubectl apply -f k8s/order-service.yaml
kubectl apply -f k8s/drone-service.yaml
kubectl apply -f k8s/payment-service.yaml
kubectl apply -f k8s/api-gateway.yaml
kubectl apply -f k8s/client.yaml
```

Deploy monitoring to its own namespace so it can be managed/scaled independently:

```bash
# Deploy monitoring (Prometheus + Grafana) into namespace 'monitoring'
kubectl apply -k k8s/monitoring
```

## 🔍 Kiểm tra

```bash
# Xem pods (app)
kubectl get pods -n ffdd

# Xem pods (monitoring)
kubectl get pods -n monitoring

# Xem services
kubectl get services -n ffdd
kubectl get services -n monitoring

# Xem logs
kubectl logs -f <pod-name> -n ffdd
kubectl logs -f <pod-name> -n monitoring
```

## 📊 Monitoring

Deploy Prometheus + Grafana để giám sát hệ thống:

```bash
# Windows
k8s\monitoring\deploy-monitoring.bat

# Linux/Mac
./k8s/monitoring/deploy-monitoring.sh
```

**Truy cập:**
- Grafana: http://localhost:31000 (admin/admin123)
- Prometheus: http://localhost:30090

**Xem thêm:**
- [Quick Start Guide](monitoring/QUICK-START.md)
- [Setup Services](monitoring/SETUP-SERVICES.md)
- [Full Grafana Guide](../GRAFANA.md)

## 🗑️ Xóa

```bash
# Xóa tất cả (app)
kubectl delete namespace ffdd

# Xóa monitoring only
kubectl delete namespace monitoring
```

Xem thêm chi tiết trong [KUBERNETES.md](../KUBERNETES.md)

