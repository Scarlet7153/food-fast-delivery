# 🚀 Quick Start Guide - Food Fast Delivery

Hướng dẫn nhanh để setup và chạy toàn bộ hệ thống từ đầu đến cuối.

---

## 📋 Yêu cầu hệ thống

- **Docker Desktop** (với Kubernetes enabled)
- **kubectl** (Kubernetes CLI)
- **Node.js** (v18+)
- **npm** hoặc **yarn**

---

## 🔧 Bước 1: Kiểm tra môi trường

### 1.1. Kiểm tra Docker

```powershell
docker --version
docker ps
```

### 1.2. Kiểm tra Kubernetes

```powershell
# Enable Kubernetes trong Docker Desktop (Settings > Kubernetes > Enable Kubernetes)
kubectl version --client
kubectl cluster-info
```

### 1.3. Kiểm tra Node.js

```powershell
node --version
npm --version
```

---

## 📦 Bước 2: Install Dependencies

### 2.1. Install dependencies cho tất cả services

```powershell
# User Service
cd services\user-service
npm install
cd ..\..

# Restaurant Service
cd services\restaurant-service
npm install
cd ..\..

# Order Service
cd services\order-service
npm install
cd ..\..

# Drone Service
cd services\drone-service
npm install
cd ..\..

# Payment Service
cd services\payment-service
npm install
cd ..\..

# API Gateway
cd services\api-gateway
npm install
cd ..\..

# Quay về root
cd ..
```

**Hoặc chạy tất cả cùng lúc:**

```powershell
cd services\user-service; npm install; cd ..\..
cd services\restaurant-service; npm install; cd ..\..
cd services\order-service; npm install; cd ..\..
cd services\drone-service; npm install; cd ..\..
cd services\payment-service; npm install; cd ..\..
cd services\api-gateway; npm install; cd ..\..
```

**Thời gian:** ~2-3 phút

---

## 🐳 Bước 3: Build Docker Images

### 3.1. Build tất cả images

```powershell
docker-compose build
```

**Hoặc build từng service:**

```powershell
docker-compose build api-gateway
docker-compose build user-service
docker-compose build restaurant-service
docker-compose build order-service
docker-compose build drone-service
docker-compose build payment-service
docker-compose build client
```

**Thời gian:** ~5-10 phút (tùy máy)

### 3.2. Verify images đã được build

```powershell
docker images | findstr ffdd
```

**Kết quả mong đợi:**
```
ffdd-api-gateway          latest
ffdd-user-service         latest
ffdd-restaurant-service   latest
ffdd-order-service        latest
ffdd-drone-service        latest
ffdd-payment-service       latest
ffdd-client               latest
```

---

## ☸️ Bước 4: Deploy lên Kubernetes

### 4.1. Tạo namespace

```powershell
kubectl create namespace ffdd
```

### 4.2. Deploy ConfigMap và Secrets

```powershell
kubectl apply -f k8s\configmap.yaml
kubectl apply -f k8s\secrets.yaml
```

### 4.3. Deploy MongoDB

```powershell
kubectl apply -f k8s\mongodb.yaml
```

**Đợi MongoDB ready:**

```powershell
kubectl wait --for=condition=ready pod -l app=mongodb -n ffdd --timeout=120s
```

### 4.4. Deploy tất cả services

```powershell
kubectl apply -f k8s\api-gateway.yaml
kubectl apply -f k8s\user-service.yaml
kubectl apply -f k8s\restaurant-service.yaml
kubectl apply -f k8s\order-service.yaml
kubectl apply -f k8s\drone-service.yaml
kubectl apply -f k8s\payment-service.yaml
kubectl apply -f k8s\client.yaml
```

**Hoặc deploy tất cả cùng lúc:**

```powershell
kubectl apply -f k8s\configmap.yaml
kubectl apply -f k8s\secrets.yaml
kubectl apply -f k8s\mongodb.yaml
kubectl apply -f k8s\api-gateway.yaml
kubectl apply -f k8s\user-service.yaml
kubectl apply -f k8s\restaurant-service.yaml
kubectl apply -f k8s\order-service.yaml
kubectl apply -f k8s\drone-service.yaml
kubectl apply -f k8s\payment-service.yaml
kubectl apply -f k8s\client.yaml
```

**Thời gian:** ~1-2 phút

### 4.5. Kiểm tra pods

```powershell
kubectl get pods -n ffdd
```

**Kết quả mong đợi:** Tất cả pods có status **Running** và **READY 1/1**

---

## 📊 Bước 5: Deploy Monitoring Stack

### 5.1. Deploy Prometheus và Grafana

```powershell
cd k8s\monitoring
kubectl apply -f prometheus-config.yaml
kubectl apply -f prometheus.yaml
kubectl apply -f grafana.yaml
kubectl apply -f grafana-dashboard.yaml
cd ..\..
```

**Hoặc dùng script:**

```powershell
cd k8s\monitoring
.\deploy-monitoring.bat
cd ..\..
```

**Thời gian:** ~30 giây

### 5.2. Kiểm tra monitoring pods

```powershell
kubectl get pods -n ffdd -l app=prometheus
kubectl get pods -n ffdd -l app=grafana
```

---

## ✅ Bước 6: Verify Deployment

### 6.1. Kiểm tra tất cả pods

```powershell
kubectl get pods -n ffdd
```

**Kết quả mong đợi:**
```
NAME                                  READY   STATUS    RESTARTS   AGE
api-gateway-xxx                       1/1     Running   0          Xm
user-service-xxx                      1/1     Running   0          Xm
restaurant-service-xxx                 1/1     Running   0          Xm
order-service-xxx                     1/1     Running   0          Xm
drone-service-xxx                     1/1     Running   0          Xm
payment-service-xxx                   1/1     Running   0          Xm
client-xxx                            1/1     Running   0          Xm
mongodb-0                             1/1     Running   0          Xm
prometheus-xxx                        1/1     Running   0          Xm
grafana-xxx                           1/1     Running   0          Xm
```

### 6.2. Kiểm tra services

```powershell
kubectl get services -n ffdd
```

### 6.3. Kiểm tra metrics endpoints

```powershell
# Port forward API Gateway
kubectl port-forward svc/api-gateway 3001:3001 -n ffdd

# Ở terminal khác, test metrics
curl http://localhost:3001/metrics
```

---

## 🌐 Bước 7: Access Services

### 7.1. Port Forward Services

**API Gateway:**
```powershell
kubectl port-forward svc/api-gateway 3001:3001 -n ffdd
```
Access: http://localhost:3001

**Client:**
```powershell
kubectl port-forward svc/client 5173:5173 -n ffdd
```
Access: http://localhost:5173

**Prometheus:**
```powershell
kubectl port-forward svc/prometheus 9090:9090 -n ffdd
```
Access: http://localhost:9090

**Grafana:**
```powershell
kubectl port-forward svc/grafana 3100:3000 -n ffdd
```
Access: http://localhost:31000
Login: `admin` / `admin123`

### 7.2. Hoặc dùng NodePort (nếu đã config)

- **API Gateway:** http://localhost:30001
- **Client:** http://localhost:30000
- **Prometheus:** http://localhost:30090
- **Grafana:** http://localhost:31000

---

## 📊 Bước 8: Verify Monitoring

### 8.1. Kiểm tra Prometheus Targets

1. Mở http://localhost:30090/targets
2. Kiểm tra tất cả targets đều **UP** (màu xanh)

**Targets mong đợi:**
- ✅ api-gateway (1/1 up)
- ✅ user-service (1/1 up)
- ✅ restaurant-service (1/1 up)
- ✅ order-service (1/1 up)
- ✅ drone-service (1/1 up)
- ✅ payment-service (1/1 up)
- ✅ kubernetes-apiservers (1/1 up)
- ✅ kubernetes-nodes (1/1 up)
- ✅ kubernetes-pods (X/X up)

### 8.2. Kiểm tra Grafana Dashboard

1. Mở http://localhost:31000
2. Login: `admin` / `admin123`
3. Vào **Dashboards** > **Food Fast Delivery - Overview**
4. Kiểm tra các panels:
   - ✅ Total Services: 6
   - ✅ Request Rate: có data
   - ✅ Request Rate by Service: có data từ tất cả services
   - ✅ Response Time: có data
   - ✅ CPU Usage by Pod: có data từ tất cả pods
   - ✅ Memory Usage by Pod: có data từ tất cả pods

---

## 🔍 Troubleshooting

### Pod không start được

```powershell
# Xem logs
kubectl logs <pod-name> -n ffdd

# Xem events
kubectl describe pod <pod-name> -n ffdd

# Common errors:
# - ImagePullBackOff: Image chưa được build → Rebuild image
# - CrashLoopBackOff: Code có lỗi → Check logs
# - OOMKilled: Hết memory → Tăng resources
```

### Metrics endpoint trả về 404

```powershell
# Verify code có /metrics endpoint
cat services\<service-name>\src\app.js | findstr metrics

# Rebuild image
docker-compose build <service-name>

# Redeploy
kubectl rollout restart deployment <service-name> -n ffdd
```

### Prometheus không scrape được

```powershell
# Check pod có annotations không?
kubectl get pod <pod-name> -n ffdd -o yaml | findstr prometheus

# Check metrics endpoint
kubectl port-forward svc/<service-name> <port>:<port> -n ffdd
curl http://localhost:<port>/metrics

# Restart Prometheus
kubectl delete pod -l app=prometheus -n ffdd
```

### Dashboard "No data"

1. Đợi 1-2 phút để Prometheus scrape metrics
2. Generate traffic: `curl http://localhost:30001/health` (nhiều lần)
3. Refresh dashboard (F5)
4. Check Prometheus targets có UP không

---

## 🗑️ Cleanup (nếu cần)

### Xóa tất cả resources

```powershell
# Xóa namespace (sẽ xóa tất cả resources bên trong)
kubectl delete namespace ffdd

# Xóa images (optional)
docker rmi ffdd-api-gateway ffdd-user-service ffdd-restaurant-service ffdd-order-service ffdd-drone-service ffdd-payment-service ffdd-client
```

---

## 📝 Quick Commands Summary

### Install Dependencies
```powershell
cd services\user-service; npm install; cd ..\..
cd services\restaurant-service; npm install; cd ..\..
cd services\order-service; npm install; cd ..\..
cd services\drone-service; npm install; cd ..\..
cd services\payment-service; npm install; cd ..\..
cd services\api-gateway; npm install; cd ..\..
```

### Build Images
```powershell
docker-compose build
```

### Deploy Services
```powershell
kubectl apply -f k8s\configmap.yaml
kubectl apply -f k8s\secrets.yaml
kubectl apply -f k8s\mongodb.yaml
kubectl apply -f k8s\api-gateway.yaml
kubectl apply -f k8s\user-service.yaml
kubectl apply -f k8s\restaurant-service.yaml
kubectl apply -f k8s\order-service.yaml
kubectl apply -f k8s\drone-service.yaml
kubectl apply -f k8s\payment-service.yaml
kubectl apply -f k8s\client.yaml
```

### Deploy Monitoring
```powershell
kubectl apply -f k8s\monitoring\prometheus-config.yaml
kubectl apply -f k8s\monitoring\prometheus.yaml
kubectl apply -f k8s\monitoring\grafana.yaml
kubectl apply -f k8s\monitoring\grafana-dashboard.yaml
```

### Verify
```powershell
kubectl get pods -n ffdd
kubectl get services -n ffdd
```

---

## ⏱️ Thời gian ước tính

| Bước | Thời gian |
|------|-----------|
| Install dependencies | 2-3 phút |
| Build images | 5-10 phút |
| Deploy services | 1-2 phút |
| Deploy monitoring | 30 giây |
| Verify | 2-3 phút |
| **Tổng** | **11-19 phút** |

---

## 🎯 Checklist

- [ ] Docker Desktop đã enable Kubernetes
- [ ] Install dependencies cho tất cả services
- [ ] Build Docker images
- [ ] Deploy ConfigMap và Secrets
- [ ] Deploy MongoDB và đợi ready
- [ ] Deploy tất cả services
- [ ] Deploy monitoring stack
- [ ] Verify pods đang running
- [ ] Verify services accessible
- [ ] Verify Prometheus targets (tất cả UP)
- [ ] Verify Grafana dashboard (có data)

---

## 🎉 Kết quả mong đợi

Sau khi hoàn thành:

✅ **6 services** đang chạy với metrics  
✅ **MongoDB** database ready  
✅ **Prometheus** scrape metrics từ tất cả services  
✅ **Grafana dashboard** hiển thị data từ tất cả services  
✅ **CPU & Memory** metrics từ tất cả pods  
✅ **Request rate & Response time** theo từng service  

---

## 📚 Tài liệu tham khảo

- [DOCKER.md](DOCKER.md) - Hướng dẫn Docker chi tiết
- [KUBERNETES.md](KUBERNETES.md) - Hướng dẫn Kubernetes chi tiết
- [MONITORING.md](MONITORING.md) - Hướng dẫn Monitoring chi tiết
- [GRAFANA.md](GRAFANA.md) - Hướng dẫn Grafana chi tiết
- [k8s/README.md](k8s/README.md) - Kubernetes deployment guide

---


