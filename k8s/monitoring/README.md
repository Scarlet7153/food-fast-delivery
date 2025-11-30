# 📊 Monitoring Stack - Prometheus + Grafana

Stack giám sát cho hệ thống Food Fast Delivery sử dụng Prometheus và Grafana.

## 📋 Thành phần

- **Prometheus** - Thu thập và lưu trữ metrics
- **Grafana** - Trực quan hóa metrics qua dashboards
- **Dashboard mặc định** - Overview dashboard cho toàn bộ hệ thống

## 🚀 Quick Start

### 1. Deploy Monitoring Stack

```bash
# Deploy tất cả monitoring components
kubectl apply -f k8s/monitoring/

# Hoặc từng bước:
kubectl apply -f k8s/monitoring/prometheus-config.yaml
kubectl apply -f k8s/monitoring/prometheus.yaml
kubectl apply -f k8s/monitoring/grafana.yaml
kubectl apply -f k8s/monitoring/grafana-dashboard.yaml
```

### 2. Kiểm tra Deployment

```bash
# Xem pods
kubectl get pods -n ffdd -l app=prometheus
kubectl get pods -n ffdd -l app=grafana

# Xem services
kubectl get svc -n ffdd | grep -E 'prometheus|grafana'
```

Kết quả mong đợi:
```
NAME         TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
prometheus   NodePort   10.96.xxx.xxx   <none>        9090:30090/TCP   1m
grafana      NodePort   10.96.xxx.xxx   <none>        3000:31000/TCP   1m
```

### 3. Truy cập Services

#### Prometheus
```
http://localhost:30090
```

Features:
- Query metrics bằng PromQL
- Xem targets đang được scrape
- Test queries trước khi add vào Grafana

#### Grafana
```
http://localhost:31000
```

**Login:**
- Username: `admin`
- Password: `admin123`

**⚠️ Lưu ý:** Nên đổi password sau lần đầu login!

## 📊 Dashboard

Dashboard **"Food Fast Delivery - Overview"** đã được tự động import, bao gồm:

### 📈 System Health
- Total Services
- Request Rate
- Error Rate
- API Gateway Status

### 🔥 Performance Metrics
- Request Rate by Service
- Response Time (p95) by Service

### 💻 Resource Usage
- CPU Usage by Pod
- Memory Usage by Pod

## ⚙️ Cấu hình Services

Để Prometheus có thể scrape metrics từ các services, cần:

### 1. Thêm Annotations vào Pods

Edit deployment của service (ví dụ: `api-gateway.yaml`):

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: monitoring
spec:
  template:
    metadata:
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3001"
        prometheus.io/path: "/metrics"
    spec:
      containers:
        - name: api-gateway
          # ... rest of config
```

### 2. Expose /metrics Endpoint

Thêm metrics endpoint vào các services.

#### Cho Node.js Services:

**Install prom-client:**
```bash
npm install prom-client
```

**Tạo file `src/utils/metrics.js`:**
```javascript
const promClient = require('prom-client');

// Create a Registry
const register = new promClient.Registry();

// Add default metrics
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);

module.exports = {
  register,
  httpRequestDuration,
  httpRequestTotal
};
```

**Thêm middleware (ví dụ trong `src/app.js`):**
```javascript
const { register, httpRequestDuration, httpRequestTotal } = require('./utils/metrics');

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Middleware to track requests
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
    
    httpRequestTotal
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .inc();
  });
  
  next();
});
```

### 3. Verify Metrics

```bash
# Port forward service
kubectl port-forward svc/api-gateway 3001:3001 -n ffdd

# Test metrics endpoint
curl http://localhost:3001/metrics
```

Kết quả mong đợi:
```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/health",status_code="200"} 142

# HELP http_request_duration_seconds Duration of HTTP requests in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.01",method="GET",route="/health",status_code="200"} 140
...
```

## 🔍 Verify Monitoring

### 1. Kiểm tra Prometheus Targets

```bash
# Port forward Prometheus
kubectl port-forward svc/prometheus 9090:9090 -n ffdd
```

Vào http://localhost:9090/targets

Tất cả targets phải có state: **UP** (màu xanh)

### 2. Test Query trong Prometheus

Vào http://localhost:9090/graph

Test queries:
```promql
# Xem services đang up
up{namespace="ffdd"}

# Request rate
rate(http_requests_total[5m])

# CPU usage
rate(container_cpu_usage_seconds_total{namespace="ffdd"}[5m])
```

### 3. Xem Dashboard trong Grafana

1. Vào http://localhost:31000
2. Login với `admin/admin123`
3. Vào **Dashboards** → **Food Fast Delivery - Overview**
4. Đảm bảo có data hiển thị

## 📏 Custom Metrics

Thêm custom metrics cho business logic:

```javascript
// Order metrics
const orderCreated = new promClient.Counter({
  name: 'order_created_total',
  help: 'Total orders created',
  labelNames: ['status']
});

const orderRevenue = new promClient.Counter({
  name: 'order_revenue_total',
  help: 'Total revenue from orders',
  labelNames: ['restaurant_id']
});

// Drone metrics
const droneStatus = new promClient.Gauge({
  name: 'drone_status',
  help: 'Current drone status',
  labelNames: ['drone_id', 'status']
});

const droneBatteryLevel = new promClient.Gauge({
  name: 'drone_battery_level',
  help: 'Current battery level of drone',
  labelNames: ['drone_id']
});

// Register metrics
register.registerMetric(orderCreated);
register.registerMetric(orderRevenue);
register.registerMetric(droneStatus);
register.registerMetric(droneBatteryLevel);

// Usage
orderCreated.labels('completed').inc();
orderRevenue.labels(restaurantId).inc(orderTotal);
droneStatus.labels(droneId, 'available').set(1);
droneBatteryLevel.labels(droneId).set(batteryPercentage);
```

## 🚨 Alerting

### Tạo Alert trong Grafana

1. Vào panel muốn tạo alert
2. Click **Alert** tab
3. Click **Create Alert**
4. Configure:
   - **Name:** Tên alert
   - **Evaluate every:** Tần suất kiểm tra
   - **For:** Thời gian chờ trước khi fire
   - **Condition:** Điều kiện để fire alert

### Alert Examples

#### High Error Rate
```
WHEN avg() OF query(A, 5m, now) IS ABOVE 5
```

#### Service Down
```
WHEN avg() OF query(up{service="api-gateway"}, 1m, now) IS BELOW 1
```

#### High Response Time
```
WHEN avg() OF query(histogram_quantile(0.95, ...), 5m, now) IS ABOVE 2
```

## 🔧 Troubleshooting

### Prometheus không scrape được metrics

**Check 1:** Xem targets trong Prometheus
```
http://localhost:30090/targets
```

**Check 2:** Verify pod annotations
```bash
kubectl get pod <pod-name> -n ffdd -o yaml | grep prometheus
```

**Check 3:** Test metrics endpoint
```bash
kubectl port-forward svc/api-gateway 3001:3001 -n ffdd
curl http://localhost:3001/metrics
```

**Check 4:** Xem logs
```bash
kubectl logs -f <prometheus-pod> -n ffdd
```

### Grafana không có data

**Check 1:** Data source configuration
- Vào Configuration → Data Sources
- Prometheus URL: `http://prometheus:9090`
- Click "Save & Test"

**Check 2:** Time range
- Dashboard time range phải có data
- Thử "Last 24 hours"

**Check 3:** Query syntax
- Test query trong Prometheus trước
- http://localhost:30090/graph

### Dashboard trống

**Check 1:** Import dashboard lại
```bash
kubectl delete configmap grafana-dashboards -n ffdd
kubectl apply -f k8s/monitoring/grafana-dashboard.yaml
# Restart Grafana
kubectl rollout restart deployment grafana -n ffdd
```

**Check 2:** Provisioning
```bash
kubectl logs -f <grafana-pod> -n ffdd | grep -i dashboard
```

## 📚 Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [PromQL Tutorial](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [prom-client (Node.js)](https://github.com/siimon/prom-client)
- [Hướng dẫn chi tiết](../../GRAFANA.md)

## 🎯 Next Steps

1. ✅ Thêm annotations cho tất cả services
2. ✅ Implement /metrics endpoint cho tất cả services
3. ✅ Tạo custom dashboards cho từng service
4. ✅ Setup alerting rules
5. ✅ Configure notification channels (Email/Slack)
6. ✅ Add business metrics (orders, revenue, etc.)
7. ✅ Setup log aggregation (Loki - optional)

---

**Happy Monitoring! 📊🚀**

