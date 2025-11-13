# 📊 Hướng Dẫn Chi Tiết Grafana

Hướng dẫn setup và sử dụng Grafana để trực quan hóa các chỉ số quan trọng của hệ thống Food Fast Delivery.

## 📋 Mục lục

1. [Tổng quan](#tổng-quan)
2. [Kiến trúc Monitoring](#kiến-trúc-monitoring)
3. [Cài đặt](#cài-đặt)
4. [Cấu hình](#cấu-hình)
5. [Dashboard](#dashboard)
6. [Metrics quan trọng](#metrics-quan-trọng)
7. [Alerting](#alerting)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Tổng quan

### Grafana là gì?

**Grafana** là nền tảng mã nguồn mở để:
- **Trực quan hóa** metrics và logs
- **Giám sát** hệ thống real-time
- **Cảnh báo** khi có vấn đề
- **Phân tích** performance và trends

### Tại sao cần Grafana?

Với hệ thống microservices của Food Fast Delivery, Grafana giúp:

✅ **Giám sát toàn diện**
- Theo dõi tất cả services trong 1 dashboard
- Nhìn thấy bottlenecks và issues ngay lập tức
- Phát hiện anomalies sớm

✅ **Performance Monitoring**
- CPU, Memory, Network usage
- Request rate, response time
- Error rate và success rate

✅ **Business Metrics**
- Số đơn hàng/giờ
- Số users active
- Doanh thu real-time
- Drone delivery performance

✅ **Troubleshooting nhanh**
- Xác định service nào có vấn đề
- Xem correlation giữa các metrics
- Phân tích root cause

---

## 🏗️ Kiến trúc Monitoring

```
┌─────────────────────────────────────────────────────────────┐
│                        Grafana                               │
│              (Visualization & Dashboards)                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ Query
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      Prometheus                              │
│                  (Metrics Collection)                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ Scrape metrics
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Microservices                             │
├─────────────┬─────────────┬──────────────┬──────────────────┤
│ API Gateway │ User Service│ Order Service│ Restaurant Svc   │
│             │             │              │                  │
│ Drone Svc   │ Payment Svc │   MongoDB    │   Client         │
└─────────────┴─────────────┴──────────────┴──────────────────┘
```

### Components

1. **Services** - Expose metrics tại `/metrics` endpoint
2. **Prometheus** - Thu thập (scrape) metrics từ các services
3. **Grafana** - Hiển thị metrics dưới dạng charts và dashboards

---

## 🚀 Cài đặt

### Bước 1: Deploy Prometheus và Grafana

```bash
# Deploy tất cả monitoring stack
kubectl apply -f k8s/monitoring/

# Hoặc từng bước:
kubectl apply -f k8s/monitoring/prometheus-config.yaml
kubectl apply -f k8s/monitoring/prometheus.yaml
kubectl apply -f k8s/monitoring/grafana.yaml
```

### Bước 2: Verify Deployment

```bash
# Kiểm tra pods
kubectl get pods -n ffdd -l app=prometheus
kubectl get pods -n ffdd -l app=grafana

# Kiểm tra services
kubectl get svc -n ffdd | grep -E 'prometheus|grafana'
```

### Bước 3: Truy cập Grafana

**Port Forward:**
```bash
kubectl port-forward svc/grafana 3000:3000 -n ffdd
```

**Hoặc qua NodePort:**
```
http://localhost:31000
```

**Login thông tin:**
- **Username:** `admin`
- **Password:** `admin123` (nên đổi sau lần đầu login)

---

## ⚙️ Cấu hình

### 1. Thêm Prometheus Data Source

Sau khi login Grafana:

1. Vào **Configuration** ⚙️ → **Data Sources**
2. Click **Add data source**
3. Chọn **Prometheus**
4. Điền thông tin:
   - **Name:** `Prometheus`
   - **URL:** `http://prometheus:9090`
   - **Access:** `Server (default)`
5. Click **Save & Test**

### 2. Import Dashboard

#### Cách 1: Import từ file JSON

1. Vào **Dashboards** → **Import**
2. Click **Upload JSON file**
3. Chọn file `k8s/monitoring/dashboards/food-delivery-dashboard.json`
4. Select **Prometheus** data source
5. Click **Import**

#### Cách 2: Import từ Grafana.com

1. Vào **Dashboards** → **Import**
2. Nhập ID dashboard:
   - **1860** - Node Exporter Full
   - **6417** - Kubernetes Cluster Monitoring
3. Click **Load** → **Import**

---

## 📊 Dashboard

### Main Dashboard: Food Fast Delivery Overview

Dashboard này hiển thị tất cả metrics quan trọng trong 1 màn hình:

#### 📈 System Health (Row 1)
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│  Total       │   Active     │  Request     │   Error      │
│  Services    │   Users      │  Rate        │   Rate       │
│     8/8      │     123      │   245 req/s  │   0.2%       │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

#### 🔥 Service Performance (Row 2)
```
┌─────────────────────────────────────────────────────────────┐
│         Response Time by Service (Last 1h)                  │
│   API Gateway ──────────  150ms                             │
│   User Service ─────────   80ms                             │
│   Order Service ────────  120ms                             │
│   Restaurant Service ───  100ms                             │
│   Drone Service ────────   90ms                             │
│   Payment Service ──────  200ms                             │
└─────────────────────────────────────────────────────────────┘
```

#### 💻 Resource Usage (Row 3)
```
┌───────────────────────────┬─────────────────────────────────┐
│    CPU Usage (%)          │    Memory Usage (MB)            │
│                           │                                 │
│  [Line Chart]             │    [Line Chart]                 │
│                           │                                 │
└───────────────────────────┴─────────────────────────────────┘
```

#### 📦 Business Metrics (Row 4)
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│  Orders      │   Revenue    │  Active      │   Delivery   │
│  Today       │   Today      │  Drones      │   Success    │
│   342        │  $4,250      │    15/20     │    98.5%     │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

#### 🚁 Drone Monitoring (Row 5)
```
┌─────────────────────────────────────────────────────────────┐
│           Drone Fleet Status                                │
│   ● Available: 15    ● In Mission: 5    ● Charging: 2      │
│                                                             │
│   [Time Series: Battery Levels]                            │
└─────────────────────────────────────────────────────────────┘
```

### Tạo Custom Panel

#### Ví dụ 1: Total Orders Counter

```sql
# Query (PromQL)
sum(order_total{status="completed"})

# Visualization: Stat
# Unit: None
# Color: Green
```

#### Ví dụ 2: Request Rate Graph

```sql
# Query
rate(http_requests_total[5m])

# Visualization: Time series
# Legend: {{service}}
# Unit: reqps (requests per second)
```

#### Ví dụ 3: Error Rate Percentage

```sql
# Query
(sum(rate(http_requests_total{status=~"5.."}[5m])) / 
 sum(rate(http_requests_total[5m]))) * 100

# Visualization: Gauge
# Unit: percent (0-100)
# Thresholds: 
#   - Green: 0-1
#   - Yellow: 1-5
#   - Red: 5-100
```

#### Ví dụ 4: Service Response Time

```sql
# Query
histogram_quantile(0.95, 
  rate(http_request_duration_seconds_bucket[5m])
) * 1000

# Visualization: Time series
# Unit: ms (milliseconds)
# Legend: p95 Response Time
```

---

## 📏 Metrics Quan Trọng

### 1. HTTP Metrics

#### Request Rate
```promql
# Tổng requests per second
sum(rate(http_requests_total[5m]))

# Requests per service
sum(rate(http_requests_total[5m])) by (service)

# Requests per endpoint
sum(rate(http_requests_total[5m])) by (endpoint)
```

#### Response Time
```promql
# Average response time
avg(http_request_duration_seconds)

# p95 response time (95% requests faster than this)
histogram_quantile(0.95, 
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service)
)

# p99 response time
histogram_quantile(0.99, 
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
)
```

#### Error Rate
```promql
# Total error rate
sum(rate(http_requests_total{status=~"5.."}[5m])) / 
sum(rate(http_requests_total[5m]))

# Error rate by service
sum(rate(http_requests_total{status=~"5.."}[5m])) by (service) /
sum(rate(http_requests_total[5m])) by (service)
```

### 2. System Metrics

#### CPU Usage
```promql
# CPU usage per container
rate(container_cpu_usage_seconds_total[5m]) * 100

# Total CPU usage
sum(rate(container_cpu_usage_seconds_total[5m])) * 100
```

#### Memory Usage
```promql
# Memory usage per container (MB)
container_memory_usage_bytes / 1024 / 1024

# Memory usage percentage
(container_memory_usage_bytes / container_spec_memory_limit_bytes) * 100
```

#### Network I/O
```promql
# Network received (MB/s)
rate(container_network_receive_bytes_total[5m]) / 1024 / 1024

# Network transmitted (MB/s)
rate(container_network_transmit_bytes_total[5m]) / 1024 / 1024
```

### 3. Database Metrics (MongoDB)

```promql
# Active connections
mongodb_connections{state="active"}

# Query operations per second
rate(mongodb_op_counters_total{type="query"}[5m])

# Insert operations per second
rate(mongodb_op_counters_total{type="insert"}[5m])

# Average query execution time
rate(mongodb_query_executor_scanned_total[5m])
```

### 4. Business Metrics

#### Orders
```promql
# Total orders
order_total

# Orders per hour
increase(order_total[1h])

# Orders by status
order_total by (status)

# Order creation rate
rate(order_created_total[5m])
```

#### Revenue
```promql
# Total revenue
sum(order_revenue)

# Revenue per hour
increase(sum(order_revenue)[1h])

# Average order value
sum(order_revenue) / sum(order_total)
```

#### Drones
```promql
# Available drones
drone_status{status="available"}

# Drones in mission
drone_status{status="in_mission"}

# Average battery level
avg(drone_battery_level)

# Delivery success rate
(sum(delivery_status{status="completed"}) / 
 sum(delivery_status)) * 100
```

### 5. Service Health

```promql
# Service uptime
up{job="ffdd-services"}

# Pod restart count
kube_pod_container_status_restarts_total

# Service availability percentage
(count(up{job="ffdd-services"} == 1) / 
 count(up{job="ffdd-services"})) * 100
```

---

## 🚨 Alerting

### Tạo Alert Rules

#### 1. High Error Rate Alert

1. Vào panel "Error Rate"
2. Click **Alert** tab
3. Click **Create Alert**
4. Cấu hình:

```yaml
Name: High Error Rate
Evaluate every: 1m
For: 5m

Condition:
  WHEN: avg() OF query(A, 5m, now)
  IS ABOVE: 5

# Alert sẽ fire khi error rate > 5% trong 5 phút
```

#### 2. Service Down Alert

```yaml
Name: Service Down
Evaluate every: 30s
For: 2m

Condition:
  WHEN: avg() OF query(up{job="ffdd-services"}, 1m, now)
  IS BELOW: 1

# Alert khi service down > 2 phút
```

#### 3. High Response Time Alert

```yaml
Name: Slow Response Time
Evaluate every: 1m
For: 5m

Condition:
  WHEN: avg() OF query(histogram_quantile(0.95, 
    rate(http_request_duration_seconds_bucket[5m])), 5m, now)
  IS ABOVE: 2

# Alert khi p95 response time > 2 seconds
```

#### 4. High Memory Usage Alert

```yaml
Name: High Memory Usage
Evaluate every: 1m
For: 10m

Condition:
  WHEN: avg() OF query(
    (container_memory_usage_bytes / container_spec_memory_limit_bytes) * 100,
    5m, now)
  IS ABOVE: 90

# Alert khi memory usage > 90% trong 10 phút
```

### Notification Channels

#### Setup Email Notifications

1. Vào **Alerting** → **Notification channels**
2. Click **Add channel**
3. Chọn **Email**
4. Điền:
   - **Name:** `Team Email`
   - **Email addresses:** `team@example.com`
   - **Send on all alerts:** ✓
5. **Test** và **Save**

#### Setup Slack Notifications

1. Tạo Slack Incoming Webhook
2. Vào Grafana → **Alerting** → **Notification channels**
3. Click **Add channel**
4. Chọn **Slack**
5. Điền:
   - **Name:** `Slack Alerts`
   - **Webhook URL:** `https://hooks.slack.com/services/...`
   - **Channel:** `#alerts`
6. **Test** và **Save**

---

## 🎨 Dashboard Best Practices

### 1. Tổ chức Dashboard

✅ **DO:**
- Nhóm metrics liên quan vào các Rows
- Đặt metrics quan trọng nhất ở trên cùng
- Sử dụng màu sắc nhất quán
- Thêm descriptions cho panels phức tạp

❌ **DON'T:**
- Quá nhiều panels trong 1 dashboard (> 20)
- Charts không có unit hoặc legend
- Quá nhiều màu khác nhau
- Dashboard quá chậm (query phức tạp)

### 2. Panel Types

| Use Case | Best Panel Type |
|----------|----------------|
| Single value | Stat, Gauge |
| Trend over time | Time series |
| Comparison | Bar chart, Bar gauge |
| Distribution | Histogram, Heatmap |
| Relationships | Graph (scatter) |
| Geographic | Geomap |
| Status | State timeline |

### 3. Color Schemes

**Performance Metrics:**
- 🟢 Green: Good (< 100ms)
- 🟡 Yellow: Warning (100-500ms)
- 🔴 Red: Critical (> 500ms)

**Availability:**
- 🟢 Green: Up (100%)
- 🟡 Yellow: Degraded (99-100%)
- 🔴 Red: Down (< 99%)

**Resource Usage:**
- 🟢 Green: Normal (< 70%)
- 🟡 Yellow: High (70-90%)
- 🔴 Red: Critical (> 90%)

### 4. Time Ranges

**Quick ranges:**
- Last 5 minutes - Real-time monitoring
- Last 1 hour - Recent issues
- Last 24 hours - Daily patterns
- Last 7 days - Weekly trends
- Last 30 days - Monthly analysis

**Refresh rates:**
- 5s - Critical systems
- 10s - Normal monitoring
- 30s - General overview
- 1m - Historical analysis

---

## 🔧 Advanced Features

### 1. Variables

Tạo dropdown để filter data:

**Variable: Service**
```
Name: service
Type: Query
Query: label_values(up, service)
Multi-value: ✓
Include All option: ✓
```

**Sử dụng trong query:**
```promql
rate(http_requests_total{service="$service"}[5m])
```

### 2. Annotations

Đánh dấu events quan trọng trên charts:

```yaml
Name: Deployments
Data source: Prometheus
Query: changes(up[1m]) > 0
Text: Deployment
Tags: deployment
```

### 3. Templating

**Dashboard URL with variables:**
```
http://localhost:3000/d/dashboard-id?
  var-service=api-gateway&
  var-environment=production&
  from=now-1h&
  to=now
```

### 4. Playlist

Tạo slide show các dashboards:

1. **Dashboards** → **Playlists**
2. **New Playlist**
3. Thêm dashboards
4. Set interval (30s - 5m)
5. **Start playlist**

---

## 📚 PromQL Cheat Sheet

### Selectors

```promql
# Exact match
metric_name{label="value"}

# Regex match
metric_name{label=~"value.*"}

# Not equal
metric_name{label!="value"}

# Regex not match
metric_name{label!~"value.*"}

# Multiple labels
metric_name{label1="value1", label2="value2"}
```

### Aggregations

```promql
# Sum
sum(metric_name)

# Average
avg(metric_name)

# Min/Max
min(metric_name)
max(metric_name)

# Count
count(metric_name)

# Group by
sum(metric_name) by (label)
avg(metric_name) by (label1, label2)
```

### Functions

```promql
# Rate (per second increase)
rate(metric_name[5m])

# Increase (total increase)
increase(metric_name[1h])

# Derivative (rate of change)
deriv(metric_name[5m])

# Percentile
histogram_quantile(0.95, metric_name)

# Round
round(metric_name, 0.1)

# Absolute
abs(metric_name)
```

### Time Ranges

```promql
# Last 5 minutes
[5m]

# Last 1 hour
[1h]

# Last 1 day
[1d]

# Offset (1 week ago)
metric_name offset 1w
```

---

## 🐛 Troubleshooting

### Grafana không connect được Prometheus

**Problem:** "Bad Gateway" hoặc "Prometheus server not responding"

**Solution:**
```bash
# 1. Kiểm tra Prometheus có running không
kubectl get pods -n ffdd -l app=prometheus

# 2. Kiểm tra Prometheus service
kubectl get svc -n ffdd prometheus

# 3. Test connection từ Grafana pod
kubectl exec -it <grafana-pod> -n ffdd -- wget -O- http://prometheus:9090/api/v1/status/config

# 4. Xem logs
kubectl logs -f <prometheus-pod> -n ffdd
kubectl logs -f <grafana-pod> -n ffdd
```

### Dashboard không hiển thị data

**Problem:** "No data" hoặc empty charts

**Giải pháp:**

1. **Kiểm tra Time Range:**
   - Đảm bảo time range phù hợp với data có sẵn
   - Thử "Last 24 hours"

2. **Kiểm tra Query:**
   ```bash
   # Test query trực tiếp trong Prometheus
   kubectl port-forward svc/prometheus 9090:9090 -n ffdd
   # Vào http://localhost:9090 và test query
   ```

3. **Kiểm tra Metrics có được collect không:**
   ```bash
   # Xem targets trong Prometheus
   # http://localhost:9090/targets
   # Tất cả targets phải là UP
   ```

4. **Kiểm tra Services có expose /metrics endpoint không:**
   ```bash
   # Test metrics endpoint
   kubectl port-forward svc/api-gateway 3001:3001 -n ffdd
   curl http://localhost:3001/metrics
   ```

### Grafana chạy chậm

**Giải pháp:**

1. **Optimize queries:**
   - Sử dụng smaller time ranges
   - Giảm số lượng panels
   - Tăng scrape interval

2. **Tăng resources:**
   ```yaml
   # grafana.yaml
   resources:
     limits:
       cpu: 500m
       memory: 512Mi
     requests:
       cpu: 250m
       memory: 256Mi
   ```

3. **Enable caching:**
   ```ini
   # grafana.ini
   [dataproxy]
   timeout = 30
   keep_alive_seconds = 30
   ```

### Alert không fire

**Giải pháp:**

1. **Kiểm tra Alert Rule:**
   - Vào Alerting → Alert Rules
   - Check state (OK, Pending, Alerting)

2. **Test condition:**
   - Vào panel → Edit
   - Tab Alert → Test Rule

3. **Kiểm tra Notification Channel:**
   - Alerting → Notification channels
   - Click "Test" button

---

## 📖 Resources

### Documentation
- [Grafana Official Docs](https://grafana.com/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [PromQL Tutorial](https://prometheus.io/docs/prometheus/latest/querying/basics/)

### Dashboards
- [Grafana Dashboard Library](https://grafana.com/grafana/dashboards/)
- [Kubernetes Monitoring Dashboard](https://grafana.com/grafana/dashboards/6417)
- [Node Exporter Full](https://grafana.com/grafana/dashboards/1860)

### Community
- [Grafana Community Forum](https://community.grafana.com/)
- [Prometheus Users Mailing List](https://groups.google.com/forum/#!forum/prometheus-users)

---

## 🎯 Next Steps

Sau khi setup Grafana, bạn có thể:

1. ✅ Customize dashboard theo nhu cầu
2. ✅ Thêm business metrics specific cho Food Delivery
3. ✅ Setup alerting rules cho critical metrics
4. ✅ Integrate với Slack/Email cho notifications
5. ✅ Export dashboard và version control (Git)
6. ✅ Tạo dashboard riêng cho từng team:
   - Operations Dashboard
   - Business Dashboard
   - Developer Dashboard
7. ✅ Explore advanced features:
   - Loki (Logs)
   - Jaeger (Tracing)
   - Tempo (Distributed Tracing)

---

## ✨ Tips & Tricks

### 1. Keyboard Shortcuts

- `d + s` - Save dashboard
- `d + h` - Home
- `d + k` - Kiosk mode
- `d + e` - Expand row
- `d + r` - Refresh dashboard
- `Ctrl + S` - Save
- `Esc` - Exit panel edit

### 2. Share Dashboard

**Link:**
```
http://localhost:3000/d/dashboard-id?
  orgId=1&
  from=now-1h&
  to=now&
  var-service=api-gateway
```

**Embed:**
```html
<iframe 
  src="http://localhost:3000/d-solo/dashboard-id/panel-id?..."
  width="800" 
  height="400">
</iframe>
```

**Export:**
- JSON file (version control)
- PNG/PDF (reporting)

### 3. Dark Mode vs Light Mode

- Preferences → Theme
- Dark mode tốt cho monitoring real-time
- Light mode tốt cho presentations/reports

---

**Happy Monitoring! 📊🚀**

Nếu có câu hỏi, check phần [Troubleshooting](#troubleshooting) hoặc hỏi team DevOps.

