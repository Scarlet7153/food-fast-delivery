# 🚀 Quick Start - Grafana Monitoring

Hướng dẫn nhanh để setup và sử dụng Grafana trong 5 phút.

## ⚡ 5-Minute Setup

### 1. Deploy Monitoring Stack (1 phút)

```bash
# Windows
cd k8s\monitoring
deploy-monitoring.bat

# Linux/Mac
cd k8s/monitoring
chmod +x deploy-monitoring.sh
./deploy-monitoring.sh
```

Đợi pods ready (~1 phút):
```bash
kubectl get pods -n ffdd -l 'app in (prometheus,grafana)'
```

### 2. Truy cập Grafana (1 phút)

Mở browser: **http://localhost:31000**

**Login:**
- Username: `admin`
- Password: `admin123`

(Skip hoặc đổi password khi được hỏi)

### 3. Verify Dashboard (1 phút)

1. Click **Dashboards** (icon 4 ô vuông bên trái)
2. Click **Food Fast Delivery - Overview**
3. Bạn sẽ thấy dashboard với metrics!

**Nếu không có data:** Đợi thêm 1-2 phút để Prometheus collect metrics

### 4. Setup Services (2 phút)

Để có đầy đủ metrics, cần thêm metrics cho các services:

```bash
# 1. API Gateway (đã có sẵn, chỉ cần rebuild)
cd services/api-gateway
npm install
cd ../..

# 2. Rebuild images
docker-compose build api-gateway

# 3. Redeploy
kubectl rollout restart deployment api-gateway -n ffdd
```

**Verify metrics:**
```bash
kubectl port-forward svc/api-gateway 3001:3001 -n ffdd
```

Mở browser: http://localhost:3001/metrics

---

## 🎯 What You Get

### Dashboard Panels

✅ **System Health**
- Total Services (8)
- Request Rate (req/s)
- Error Rate (%)
- API Gateway Status (UP/DOWN)

✅ **Performance**
- Request Rate by Service (line chart)
- Response Time p95 by Service (line chart)

✅ **Resources**
- CPU Usage by Pod (line chart)
- Memory Usage by Pod (line chart)

### Services Access

| Service | URL | Description |
|---------|-----|-------------|
| Grafana | http://localhost:31000 | Dashboards & Visualization |
| Prometheus | http://localhost:30090 | Metrics & Queries |
| API Gateway | http://localhost:30001 | Health Check |

---

## 📊 Quick Actions

### View Metrics in Real-time

**Option 1: Grafana Dashboard**
1. Vào http://localhost:31000
2. Dashboards → Food Fast Delivery - Overview
3. Time range: Last 5 minutes
4. Refresh: 5s

**Option 2: Prometheus Query**
1. Vào http://localhost:30090
2. Tab "Graph"
3. Query: `rate(http_requests_total[5m])`
4. Execute

### Generate Some Load (Test)

```bash
# Windows (PowerShell)
for($i=1; $i -le 100; $i++) {
  Invoke-WebRequest -Uri http://localhost:30001/health
}

# Linux/Mac
for i in {1..100}; do
  curl http://localhost:30001/health
done
```

Sau đó refresh Grafana dashboard để thấy metrics tăng!

### Create Custom Panel

1. Vào dashboard
2. Click **Add** → **Visualization**
3. Select **Prometheus** data source
4. Query: `up{namespace="ffdd"}`
5. Panel type: **Stat**
6. Click **Apply**

---

## 🔍 Quick Queries

Copy-paste các queries này vào Prometheus hoặc Grafana:

### System Metrics

```promql
# Services đang UP
up{namespace="ffdd"}

# Total requests per second
sum(rate(http_requests_total[5m]))

# Error rate percentage
(sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))) * 100

# Average response time
avg(http_request_duration_seconds)
```

### Resource Metrics

```promql
# CPU usage by pod
rate(container_cpu_usage_seconds_total{namespace="ffdd"}[5m]) * 100

# Memory usage by pod (MB)
container_memory_usage_bytes{namespace="ffdd"} / 1024 / 1024

# Network received (MB/s)
rate(container_network_receive_bytes_total{namespace="ffdd"}[5m]) / 1024 / 1024
```

---

## 🚨 Quick Alerts

### Setup Email Alert (2 phút)

1. Vào **Alerting** (bell icon) → **Notification channels**
2. Click **Add channel**
3. **Type:** Email
4. **Name:** My Alerts
5. **Email addresses:** your-email@example.com
6. **Send test** → **Save**

### Create Alert (1 phút)

1. Vào dashboard panel "Error Rate"
2. Click title → **Edit**
3. Tab **Alert**
4. Click **Create Alert**
5. **Condition:** IS ABOVE **5** (5% error rate)
6. **Evaluate every:** 1m
7. **For:** 5m
8. **Notifications:** Select "My Alerts"
9. **Save**

---

## 📚 Next Steps

### For Beginners

1. ✅ Explore default dashboard
2. ✅ Try different time ranges (Last 5m, 1h, 24h)
3. ✅ Click on panels to zoom in
4. ✅ Change refresh rate (top right)

### For Advanced Users

1. 📖 Read [Full Grafana Guide](../../GRAFANA.md)
2. 🔧 Setup metrics for all services: [SETUP-SERVICES.md](./SETUP-SERVICES.md)
3. 📊 Create custom dashboards
4. 🚨 Setup advanced alerting
5. 📈 Add business metrics

---

## 🐛 Quick Troubleshooting

### Dashboard trống / No data

**Check 1:** Prometheus có đang chạy?
```bash
kubectl get pods -n ffdd -l app=prometheus
```

**Check 2:** Time range có đúng không?
- Thử "Last 24 hours"
- Đảm bảo không phải future time

**Check 3:** Data source có connect không?
- Vào Configuration → Data Sources
- Click Prometheus → "Save & Test"

### Prometheus không có targets

**Check 1:** Prometheus config
```bash
kubectl get configmap prometheus-config -n ffdd -o yaml
```

**Check 2:** Services có annotations không?
```bash
kubectl get pod <pod-name> -n ffdd -o yaml | grep prometheus
```

**Fix:** Redeploy Prometheus
```bash
kubectl rollout restart deployment prometheus -n ffdd
```

### Can't access Grafana

**Check:** Service có đang chạy không?
```bash
kubectl get svc grafana -n ffdd
```

**Check:** Port forwarding
```bash
kubectl port-forward svc/grafana 3000:3000 -n ffdd
# Then access: http://localhost:3000
```

---

## 💡 Quick Tips

### Keyboard Shortcuts

- `d + s` - Save dashboard
- `d + h` - Home
- `Ctrl + S` - Save
- `Esc` - Exit edit mode

### Time Ranges

- **Last 5 minutes** - Real-time monitoring
- **Last 1 hour** - Recent trends
- **Last 24 hours** - Daily patterns
- **Last 7 days** - Weekly trends

### Refresh Rates

- **5s** - Real-time (high load on browser)
- **10s** - Active monitoring
- **30s** - Normal use
- **1m** - Background monitoring

---

## 🎉 Success!

Bạn đã setup thành công Grafana monitoring!

**What's working:**
- ✅ Prometheus collecting metrics
- ✅ Grafana visualizing data
- ✅ Dashboard showing system health
- ✅ Ready for monitoring

**Explore:**
- 📊 Create custom panels
- 🚨 Setup alerts
- 📈 Add business metrics
- 🎨 Customize dashboards

---

## 📞 Need Help?

- **Full Guide:** [GRAFANA.md](../../GRAFANA.md)
- **Setup Services:** [SETUP-SERVICES.md](./SETUP-SERVICES.md)
- **Monitoring README:** [README.md](./README.md)

---

**Happy Monitoring! 🚀📊**

_Time spent: ~5 minutes | Value gained: Priceless_ ✨

