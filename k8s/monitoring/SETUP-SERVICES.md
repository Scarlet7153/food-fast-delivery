# 🔧 Setup Metrics cho Services

Hướng dẫn chi tiết để thêm Prometheus metrics cho các microservices.

## 📋 Tổng quan

Để Prometheus có thể scrape metrics từ services, cần:
1. ✅ Install `prom-client` package
2. ✅ Tạo metrics utility file
3. ✅ Thêm metrics middleware vào app
4. ✅ Expose `/metrics` endpoint
5. ✅ Thêm Prometheus annotations vào Kubernetes deployment

## 🎯 API Gateway (Đã hoàn thành)

API Gateway đã được setup sẵn làm ví dụ mẫu. Kiểm tra:
- `services/api-gateway/src/utils/metrics.js`
- `services/api-gateway/src/app.js`
- `k8s/api-gateway.yaml`

## 📝 Setup cho các Services khác

### Bước 1: Install prom-client

Trong thư mục service:

```bash
cd services/<service-name>
npm install prom-client --save
```

### Bước 2: Copy metrics utility

Copy file `services/api-gateway/src/utils/metrics.js` vào service của bạn:

```bash
# Windows
copy services\api-gateway\src\utils\metrics.js services\<service-name>\src\utils\metrics.js

# Linux/Mac
cp services/api-gateway/src/utils/metrics.js services/<service-name>/src/utils/metrics.js
```

**Hoặc tạo file mới** `src/utils/metrics.js`:

```javascript
const promClient = require('prom-client');

// Create a Registry
const register = new promClient.Registry();

// Add default metrics (CPU, Memory, etc.)
promClient.collectDefaultMetrics({ 
  register,
  prefix: 'nodejs_'
});

// HTTP Request Duration (histogram)
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code', 'service'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
});

// HTTP Request Total (counter)
const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'service']
});

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);

/**
 * Express middleware to collect HTTP metrics
 */
function metricsMiddleware(serviceName = 'unknown') {
  return (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      const route = req.route?.path || req.path;
      const statusCode = res.statusCode;
      
      httpRequestDuration
        .labels(req.method, route, statusCode, serviceName)
        .observe(duration);
      
      httpRequestTotal
        .labels(req.method, route, statusCode, serviceName)
        .inc();
    });
    
    next();
  };
}

module.exports = {
  register,
  metricsMiddleware
};
```

### Bước 3: Update app.js

#### 1. Import metrics

Đầu file `src/app.js`:

```javascript
const { register, metricsMiddleware } = require('./utils/metrics');
```

#### 2. Thêm middleware

Sau các middleware khác (trước routes):

```javascript
// Prometheus metrics middleware
app.use(metricsMiddleware('service-name')); // Thay service-name bằng tên service của bạn
```

#### 3. Thêm /metrics endpoint

```javascript
// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    console.error('Error generating metrics:', error);
    res.status(500).end();
  }
});
```

**Vị trí đặt endpoint:** Ngay sau health check endpoint

#### Ví dụ hoàn chỉnh:

```javascript
const express = require('express');
const { register, metricsMiddleware } = require('./utils/metrics');

const app = express();

// Middlewares
app.use(express.json());
app.use(metricsMiddleware('user-service')); // <-- Thêm metrics middleware

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'User Service' });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    console.error('Error generating metrics:', error);
    res.status(500).end();
  }
});

// ... other routes

app.listen(3002, () => {
  console.log('User Service running on port 3002');
});
```

### Bước 4: Update Kubernetes Deployment

Edit file `k8s/<service-name>.yaml`:

Thêm `annotations` vào `spec.template.metadata`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
  namespace: ffdd
spec:
  template:
    metadata:
      labels:
        app: user-service
      annotations:                          # <-- Thêm phần này
        prometheus.io/scrape: "true"        # <-- Enable scraping
        prometheus.io/port: "3002"          # <-- Port của service
        prometheus.io/path: "/metrics"      # <-- Metrics endpoint path
    spec:
      containers:
      - name: user-service
        # ... rest of config
```

### Bước 5: Test Metrics

#### 1. Test locally (trước khi deploy)

```bash
cd services/<service-name>
npm install
npm start
```

```bash
# Ở terminal khác
curl http://localhost:<port>/metrics
```

Kết quả mong đợi:
```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/health",status_code="200",service="user-service"} 5

# HELP http_request_duration_seconds Duration of HTTP requests in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.005",method="GET",route="/health",status_code="200",service="user-service"} 5
...
```

#### 2. Test trong Kubernetes

```bash
# Deploy service
kubectl apply -f k8s/<service-name>.yaml

# Port forward
kubectl port-forward svc/<service-name> <port>:<port> -n ffdd

# Test
curl http://localhost:<port>/metrics
```

#### 3. Kiểm tra trong Prometheus

```bash
# Port forward Prometheus
kubectl port-forward svc/prometheus 9090:9090 -n ffdd
```

Vào http://localhost:9090/targets

Service của bạn phải xuất hiện với state **UP** (màu xanh)

## 📊 Custom Business Metrics

Ngoài HTTP metrics mặc định, bạn có thể thêm business metrics:

### Ví dụ: Order Service

```javascript
const promClient = require('prom-client');
const { register } = require('./metrics');

// Order metrics
const orderCreated = new promClient.Counter({
  name: 'order_created_total',
  help: 'Total orders created',
  labelNames: ['status', 'restaurant_id']
});

const orderRevenue = new promClient.Counter({
  name: 'order_revenue_total',
  help: 'Total revenue from orders in cents',
  labelNames: ['restaurant_id']
});

const activeOrders = new promClient.Gauge({
  name: 'active_orders',
  help: 'Number of active orders',
  labelNames: ['status']
});

// Register metrics
register.registerMetric(orderCreated);
register.registerMetric(orderRevenue);
register.registerMetric(activeOrders);

// Usage trong controller
exports.createOrder = async (req, res) => {
  try {
    const order = await Order.create(req.body);
    
    // Increment metrics
    orderCreated.labels('pending', order.restaurantId).inc();
    orderRevenue.labels(order.restaurantId).inc(order.total * 100); // cents
    activeOrders.labels('pending').inc();
    
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

### Ví dụ: Drone Service

```javascript
const promClient = require('prom-client');
const { register } = require('./metrics');

// Drone metrics
const droneStatus = new promClient.Gauge({
  name: 'drone_status',
  help: 'Current drone status (1=available, 0=unavailable)',
  labelNames: ['drone_id', 'status']
});

const droneBatteryLevel = new promClient.Gauge({
  name: 'drone_battery_level',
  help: 'Current battery level percentage',
  labelNames: ['drone_id']
});

const deliveryDuration = new promClient.Histogram({
  name: 'delivery_duration_seconds',
  help: 'Duration of deliveries in seconds',
  labelNames: ['drone_id', 'restaurant_id'],
  buckets: [60, 120, 300, 600, 900, 1800, 3600] // 1min to 1hour
});

// Register
register.registerMetric(droneStatus);
register.registerMetric(droneBatteryLevel);
register.registerMetric(deliveryDuration);

// Usage
function updateDroneStatus(drone) {
  droneStatus.labels(drone.id, drone.status).set(
    drone.status === 'available' ? 1 : 0
  );
  droneBatteryLevel.labels(drone.id).set(drone.batteryLevel);
}
```

## ✅ Checklist cho mỗi Service

- [ ] Install `prom-client`: `npm install prom-client --save`
- [ ] Tạo file `src/utils/metrics.js`
- [ ] Import metrics vào `src/app.js`
- [ ] Thêm `metricsMiddleware()` vào app
- [ ] Thêm `/metrics` endpoint
- [ ] Thêm Prometheus annotations vào `k8s/<service-name>.yaml`
- [ ] Test `/metrics` endpoint locally
- [ ] Deploy và test trong Kubernetes
- [ ] Verify trong Prometheus targets (http://localhost:9090/targets)
- [ ] Thêm custom business metrics (optional)

## 📚 Tham khảo

### Default Metrics (tự động)

Khi gọi `collectDefaultMetrics()`, các metrics sau được thu thập:

- `process_cpu_user_seconds_total` - CPU user time
- `process_cpu_system_seconds_total` - CPU system time
- `process_heap_bytes` - Heap size
- `process_resident_memory_bytes` - Resident memory
- `nodejs_eventloop_lag_seconds` - Event loop lag
- `nodejs_active_handles_total` - Active handles
- `nodejs_active_requests_total` - Active requests
- `nodejs_gc_duration_seconds` - GC duration

### Custom Metric Types

**Counter** - Chỉ tăng (ví dụ: total requests, errors)
```javascript
const counter = new promClient.Counter({
  name: 'metric_name',
  help: 'Description',
  labelNames: ['label1', 'label2']
});
counter.inc();        // +1
counter.inc(5);       // +5
counter.labels('val1', 'val2').inc();
```

**Gauge** - Có thể tăng/giảm (ví dụ: active connections, queue size)
```javascript
const gauge = new promClient.Gauge({
  name: 'metric_name',
  help: 'Description',
  labelNames: ['label1']
});
gauge.set(42);        // Set to 42
gauge.inc();          // +1
gauge.dec();          // -1
gauge.inc(5);         // +5
gauge.dec(3);         // -3
```

**Histogram** - Phân phối giá trị (ví dụ: request duration, response size)
```javascript
const histogram = new promClient.Histogram({
  name: 'metric_name',
  help: 'Description',
  labelNames: ['label1'],
  buckets: [0.1, 0.5, 1, 2, 5, 10] // Định nghĩa buckets
});
histogram.observe(0.8);  // Record value
histogram.labels('val1').observe(1.2);
```

**Summary** - Tương tự histogram nhưng tính quantiles
```javascript
const summary = new promClient.Summary({
  name: 'metric_name',
  help: 'Description',
  labelNames: ['label1'],
  percentiles: [0.5, 0.9, 0.99]
});
summary.observe(0.8);
```

## 🚀 Services List

### Cần setup metrics:

- [x] **API Gateway** - Port 3001 ✅ (Đã xong)
- [ ] **User Service** - Port 3002
- [ ] **Restaurant Service** - Port 3003
- [ ] **Order Service** - Port 3004
- [ ] **Drone Service** - Port 3005
- [ ] **Payment Service** - Port 3006

### Port mapping:

| Service | Port | Metrics Path |
|---------|------|--------------|
| API Gateway | 3001 | /metrics |
| User Service | 3002 | /metrics |
| Restaurant Service | 3003 | /metrics |
| Order Service | 3004 | /metrics |
| Drone Service | 3005 | /metrics |
| Payment Service | 3006 | /metrics |
| MongoDB | 27017 | - (needs exporter) |

## 💡 Tips

1. **Service name** trong metrics nên match với tên service trong Kubernetes
2. **Labels** giúp filter và group metrics, nhưng đừng dùng quá nhiều
3. **Buckets** trong histogram nên match với expected response time
4. **Test metrics** locally trước khi deploy
5. **Monitor memory** - metrics được lưu trong memory, nhiều labels = nhiều memory

## 🐛 Troubleshooting

### Metrics không xuất hiện trong Prometheus

1. Check annotations trong deployment:
```bash
kubectl get pod <pod-name> -n ffdd -o yaml | grep prometheus
```

2. Test metrics endpoint:
```bash
kubectl port-forward svc/<service-name> <port>:<port> -n ffdd
curl http://localhost:<port>/metrics
```

3. Check Prometheus logs:
```bash
kubectl logs -f -l app=prometheus -n ffdd
```

4. Verify Prometheus targets:
```
http://localhost:30090/targets
```

### Service bị crash sau khi thêm metrics

1. Check logs:
```bash
kubectl logs -f <pod-name> -n ffdd
```

2. Kiểm tra `prom-client` đã được install:
```bash
npm list prom-client
```

3. Kiểm tra syntax errors trong `metrics.js`

---

**Happy Monitoring! 📊**

Nếu cần hỗ trợ, check:
- [Main Grafana Guide](../../GRAFANA.md)
- [Monitoring README](./README.md)
- [prom-client docs](https://github.com/siimon/prom-client)

