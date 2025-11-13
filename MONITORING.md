# 📊 Monitoring với Grafana - Tổng quan

> **Hướng dẫn đầy đủ về monitoring và trực quan hóa metrics cho hệ thống Food Fast Delivery**

---

## 🎯 Mục tiêu

Trực quan hóa các chỉ số quan trọng của hệ thống trong **một dashboard duy nhất**:

✅ **System Health** - Tình trạng services  
✅ **Performance** - Request rate & response time  
✅ **Resources** - CPU & Memory usage  
✅ **Business Metrics** - Orders, revenue, users  
✅ **Alerting** - Cảnh báo khi có vấn đề  

---

## 🚀 Quick Start (5 phút)

### Bước 1: Deploy Monitoring Stack

```bash
# Windows
k8s\monitoring\deploy-monitoring.bat

# Linux/Mac
chmod +x k8s/monitoring/deploy-monitoring.sh
./k8s/monitoring/deploy-monitoring.sh
```

### Bước 2: Truy cập Grafana

Mở browser: **http://localhost:31000**

**Login:**
- Username: `admin`
- Password: `admin123`

### Bước 3: Xem Dashboard

1. Click **Dashboards** (icon 4 ô vuông)
2. Select **Food Fast Delivery - Overview**
3. Enjoy! 🎉

**→ Chi tiết:** [Quick Start Guide](k8s/monitoring/QUICK-START.md)

---

## 📚 Tài liệu

### 🎓 Cho Beginners

**1. [Quick Start Guide](k8s/monitoring/QUICK-START.md)** ⚡  
Bắt đầu với Grafana trong 5 phút. Bao gồm:
- Deployment nhanh
- Truy cập dashboard
- Test metrics
- Quick troubleshooting

### 📖 Hướng dẫn Chi tiết

**2. [GRAFANA.md](GRAFANA.md)** 📊  
Hướng dẫn đầy đủ về Grafana (~600 dòng). Bao gồm:
- Tổng quan về Grafana
- Kiến trúc monitoring (Prometheus + Grafana)
- Cài đặt chi tiết
- Dashboard creation & best practices
- Metrics quan trọng & PromQL
- Alerting setup
- Troubleshooting
- Tips & tricks

### 🔧 Cho Developers

**3. [Setup Services Guide](k8s/monitoring/SETUP-SERVICES.md)** 🛠️  
Hướng dẫn thêm metrics cho services của bạn. Bao gồm:
- Step-by-step setup
- Code examples (Node.js)
- Custom business metrics
- Kubernetes configuration
- Checklist

### 📋 Technical Docs

**4. [Monitoring README](k8s/monitoring/README.md)** 📄  
Technical overview của monitoring stack. Bao gồm:
- Components
- Configuration
- Verification
- Troubleshooting

**5. [Summary](k8s/monitoring/SUMMARY.md)** 📝  
Tóm tắt tất cả những gì đã setup

---

## 🎨 Dashboard

### Food Fast Delivery - Overview

Dashboard chính hiển thị toàn bộ metrics quan trọng:

```
┌─────────────────────────────────────────────────────────────────┐
│                    System Health (Row 1)                        │
├──────────────┬──────────────┬──────────────┬───────────────────┤
│ Total        │ Request      │ Error        │ API Gateway       │
│ Services: 8  │ Rate: 245/s  │ Rate: 0.2%   │ Status: UP        │
└──────────────┴──────────────┴──────────────┴───────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              Request Rate by Service (Row 2)                    │
│                                                                 │
│  [Time Series Line Chart - Multi Service]                      │
│   ── API Gateway    ── User Service                            │
│   ── Order Service  ── Restaurant Service                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│           Response Time (p95) by Service (Row 3)                │
│                                                                 │
│  [Time Series Line Chart with Thresholds]                      │
│   🟢 < 100ms  🟡 100-500ms  🔴 > 500ms                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────┬──────────────────────────────────┐
│  CPU Usage (Row 4)           │  Memory Usage                    │
│                              │                                  │
│  [Time Series by Pod]        │  [Time Series by Pod]            │
│                              │                                  │
└──────────────────────────────┴──────────────────────────────────┘
```

### Metrics Tracked

#### 🔥 System Metrics
- Total services up/down
- Request rate (requests/second)
- Error rate (percentage)
- Response time (p50, p95, p99)
- CPU usage per pod
- Memory usage per pod
- Network I/O

#### 📈 Business Metrics (Coming Soon)
- Orders per hour
- Revenue real-time
- Active users
- Restaurant count
- Drone fleet status
- Delivery success rate

---

## ⚙️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Grafana                               │
│              (Visualization & Dashboards)                    │
│                   Port: 31000                               │
└──────────────────────────┬──────────────────────────────────┘
                           │ Query metrics
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      Prometheus                              │
│                 (Metrics Collection)                         │
│                    Port: 30090                              │
└──────────────────────────┬──────────────────────────────────┘
                           │ Scrape /metrics
                           │ (every 15s)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Microservices                             │
├─────────────┬─────────────┬──────────────┬──────────────────┤
│ API Gateway │ User Service│ Order Service│ Restaurant Svc   │
│   :3001     │   :3002     │   :3004      │   :3003          │
│ ✅ Metrics  │ ⏳ TODO     │ ⏳ TODO      │ ⏳ TODO          │
├─────────────┼─────────────┼──────────────┼──────────────────┤
│ Drone Svc   │ Payment Svc │   MongoDB    │   Client         │
│   :3005     │   :3006     │   :27017     │   :3000          │
│ ⏳ TODO     │ ⏳ TODO     │ ⏳ TODO      │   N/A            │
└─────────────┴─────────────┴──────────────┴──────────────────┘

Legend:
✅ Metrics enabled
⏳ Needs setup (see SETUP-SERVICES.md)
```

---

## 🔍 Example Queries

### System Health

```promql
# Services đang UP
up{namespace="ffdd"}

# Total request rate
sum(rate(http_requests_total[5m]))

# Error rate percentage
(sum(rate(http_requests_total{status=~"5.."}[5m])) / 
 sum(rate(http_requests_total[5m]))) * 100
```

### Performance

```promql
# p95 response time (milliseconds)
histogram_quantile(0.95, 
  rate(http_request_duration_seconds_bucket[5m])
) * 1000

# Request rate by service
sum(rate(http_requests_total[5m])) by (service)
```

### Resources

```promql
# CPU usage per pod (%)
rate(container_cpu_usage_seconds_total{namespace="ffdd"}[5m]) * 100

# Memory usage per pod (MB)
container_memory_usage_bytes{namespace="ffdd"} / 1024 / 1024
```

**→ More queries:** [GRAFANA.md - PromQL Cheat Sheet](GRAFANA.md#-promql-cheat-sheet)

---

## 🚨 Alerting

### Example Alerts

#### 1. High Error Rate
```yaml
Alert: High Error Rate
Condition: Error rate > 5% for 5 minutes
Notification: Email/Slack
Action: Investigate immediately
```

#### 2. Service Down
```yaml
Alert: Service Unavailable
Condition: Service down for 2 minutes
Notification: Email/Slack/PagerDuty
Action: Emergency response
```

#### 3. High Memory Usage
```yaml
Alert: Memory Critical
Condition: Memory > 90% for 10 minutes
Notification: Email
Action: Scale up or investigate leak
```

**→ Setup guide:** [GRAFANA.md - Alerting](GRAFANA.md#-alerting)

---

## 📦 What's Included

### ✅ Files Created

#### Documentation (5 files)
- `GRAFANA.md` - Hướng dẫn chi tiết (~600 dòng)
- `MONITORING.md` - File này
- `k8s/monitoring/README.md` - Technical overview
- `k8s/monitoring/QUICK-START.md` - 5-minute guide
- `k8s/monitoring/SETUP-SERVICES.md` - Service setup guide
- `k8s/monitoring/SUMMARY.md` - Summary

#### Configuration (4 files)
- `k8s/monitoring/prometheus-config.yaml` - Prometheus config
- `k8s/monitoring/prometheus.yaml` - Prometheus deployment
- `k8s/monitoring/grafana.yaml` - Grafana deployment
- `k8s/monitoring/grafana-dashboard.yaml` - Dashboard config

#### Scripts (2 files)
- `k8s/monitoring/deploy-monitoring.bat` - Windows deploy
- `k8s/monitoring/deploy-monitoring.sh` - Linux/Mac deploy

#### Code (3 files)
- `services/api-gateway/src/utils/metrics.js` - Metrics utility
- `services/api-gateway/src/app.js` - Updated
- `services/api-gateway/package.json` - Updated

#### Kubernetes (1 file)
- `k8s/api-gateway.yaml` - Updated with annotations

**Total: 18 files** 📄

---

## 🎯 Next Steps

### Immediate (Do Now)
1. ✅ Deploy monitoring stack
2. ✅ Access Grafana dashboard
3. ✅ Verify metrics are flowing

### Short-term (This Week)
1. ⏳ Setup metrics cho các services còn lại
   - User Service
   - Restaurant Service
   - Order Service
   - Drone Service
   - Payment Service
2. ⏳ Thêm business metrics
3. ⏳ Setup alerting

### Long-term (This Month)
1. ⏳ Create custom dashboards cho từng team
2. ⏳ Setup notification channels (Slack/Email)
3. ⏳ Advanced monitoring (Logs, Tracing)
4. ⏳ Performance optimization based on metrics

---

## 📞 Resources

### Documentation
- [Grafana Official Docs](https://grafana.com/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [PromQL Tutorial](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [prom-client (Node.js)](https://github.com/siimon/prom-client)

### Community
- [Grafana Community](https://community.grafana.com/)
- [Prometheus Users](https://groups.google.com/forum/#!forum/prometheus-users)
- [Grafana Dashboards Library](https://grafana.com/grafana/dashboards/)

### Internal Guides
- [KUBERNETES.md](KUBERNETES.md) - Kubernetes setup
- [Docker Guide](DOCKER.md) - Docker setup (if exists)

---

## 💡 Tips

### For Beginners
- 📖 Start với [Quick Start Guide](k8s/monitoring/QUICK-START.md)
- 🎓 Đọc [GRAFANA.md](GRAFANA.md) từng section
- 🧪 Thử nghiệm queries trong Prometheus UI
- 🎨 Customize dashboard theo nhu cầu

### For Advanced Users
- 🔧 Setup metrics cho tất cả services
- 📊 Create custom dashboards
- 🚨 Configure advanced alerting
- 📈 Add business-specific metrics
- 🔍 Explore Loki (logs) + Jaeger (tracing)

### For Ops Team
- 📱 Setup mobile notifications
- 🔔 Configure on-call schedules
- 📊 Create SLA dashboards
- 📈 Track long-term trends
- 🔄 Automate remediation

---

## ✨ Features Highlights

### ✅ What Works Now
- Complete monitoring stack deployment
- Auto-discovery của Kubernetes services
- Default dashboard với system metrics
- API Gateway metrics (example)
- Comprehensive documentation
- Easy deployment scripts

### ⏳ Coming Soon
- All services với metrics
- Business metrics dashboard
- Custom alerts
- Slack/Email notifications
- Log aggregation (Loki)
- Distributed tracing (Jaeger)

---

## 🎉 Conclusion

Bạn đã có:
- ✅ Production-ready monitoring setup
- ✅ Comprehensive documentation (600+ dòng)
- ✅ Working examples
- ✅ Easy deployment (1-click)
- ✅ Scalable architecture

**Time to value:** ~5 minutes  
**Learning curve:** Documented & supported  
**Maintenance:** Low  
**ROI:** High  

---

## 🚀 Get Started Now!

```bash
# 1. Deploy
k8s\monitoring\deploy-monitoring.bat  # Windows
# or
./k8s/monitoring/deploy-monitoring.sh  # Linux/Mac

# 2. Access Grafana
open http://localhost:31000

# 3. Login
# Username: admin
# Password: admin123

# 4. View Dashboard
# Dashboards → Food Fast Delivery - Overview
```

---

**Happy Monitoring! 📊🚀**

_Questions? Check out [GRAFANA.md](GRAFANA.md) or [Quick Start](k8s/monitoring/QUICK-START.md)_

