# CI Test Monitoring Setup Guide

Hướng dẫn setup monitoring cho test results (unit tests, integration tests) với Grafana.

## 📊 Tổng Quan

Hệ thống sẽ:
- Thu thập metrics từ Jest tests
- Push metrics lên Prometheus Pushgateway
- Hiển thị dashboard trong Grafana với:
  - **Test Pass Rate (%)**
  - **Total Tests**
  - **Failed Tests**
  - **Passed Tests**
  - **Test Results by Service**
  - **Failed Test Cases** (table)

## 🚀 Quick Setup

### 1. Deploy Pushgateway và Update Grafana

```bash
# Deploy Pushgateway
kubectl apply -f k8s/monitoring/prometheus-pushgateway.yaml

# Update Grafana với test dashboard
kubectl apply -f k8s/monitoring/grafana-test-dashboard.yaml
kubectl apply -f k8s/monitoring/grafana.yaml
kubectl apply -f k8s/monitoring/prometheus-config.yaml

# Restart Grafana để load dashboard mới
kubectl rollout restart deployment grafana -n ffdd
```

### 2. Setup Jest Reporter cho Services

#### Option A: Sử dụng Pushgateway (Recommended)

Cập nhật `jest.config.js` cho mỗi service:

```javascript
const path = require('path');

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  reporters: [
    'default',
    [
      path.join(__dirname, '../src/utils/jest-test-reporter.js'),
      {
        serviceName: 'user-service', // Thay đổi cho mỗi service
        pushgatewayUrl: process.env.PROMETHEUS_PUSHGATEWAY_URL || 'http://localhost:9091'
      }
    ]
  ]
};
```

#### Option B: Local Development (không cần Pushgateway)

Nếu chạy tests local, có thể export metrics ra file:

```bash
# Set environment variable
export PROMETHEUS_PUSHGATEWAY_URL=""

# Run tests
npm test
```

### 3. Install Dependencies

Đảm bảo `prom-client` đã được install trong mỗi service:

```bash
cd services/user-service
npm install prom-client

# Hoặc cho tất cả services
cd services
for dir in */; do
  cd "$dir"
  npm install prom-client
  cd ..
done
```

### 4. Run Tests

```bash
# Set Pushgateway URL (nếu chạy trong K8s)
export PROMETHEUS_PUSHGATEWAY_URL="http://prometheus-pushgateway:9091"

# Hoặc local
export PROMETHEUS_PUSHGATEWAY_URL="http://localhost:9091"

# Run tests
cd services/user-service
npm test
```

## 📊 Access Dashboard

1. **Truy cập Grafana**: http://localhost:31000
2. **Login**: admin/admin123
3. **Vào Dashboards** → **CI Test Monitoring**

## 🎯 Dashboard Panels

### 1. Test Pass Rate (%)
- Hiển thị tỷ lệ test pass
- Color coding: Red < 80%, Yellow 80-95%, Green > 95%

### 2. Total Tests
- Tổng số tests đã chạy

### 3. Failed Tests
- Số tests failed
- Color coding: Green = 0, Yellow = 1-4, Red >= 5

### 4. Passed Tests
- Số tests passed

### 5. Test Results by Service
- Bar chart hiển thị total tests theo service

### 6. Test Failures by Service
- Bar chart hiển thị failed tests theo service

### 7. Test Pass Rate by Service (%)
- Bar chart hiển thị pass rate theo service

### 8. Test Results by Type
- Pie chart: Unit tests vs Integration tests

### 9. Failed Test Cases
- Table liệt kê các test cases failed
- Columns: Service, Type, Suite, Test Name, Count

### 10. Test Duration Over Time
- Time series: p50 và p95 test duration

### 11. Test Results Over Time
- Time series: Passed và Failed tests over time

## 🔧 Configuration

### Environment Variables

```bash
# Pushgateway URL
PROMETHEUS_PUSHGATEWAY_URL=http://prometheus-pushgateway:9091

# Git info (optional, for CI/CD)
GIT_BRANCH=main
GIT_COMMIT=abc123
HOSTNAME=ci-runner-1
```

### Jest Config per Service

Cập nhật `jest.config.js` cho từng service:

- `user-service`: serviceName: 'user-service'
- `restaurant-service`: serviceName: 'restaurant-service'
- `order-service`: serviceName: 'order-service'
- `payment-service`: serviceName: 'payment-service'
- `drone-service`: serviceName: 'drone-service'
- `api-gateway`: serviceName: 'api-gateway'

## 📈 Metrics Exposed

### Prometheus Metrics

1. **test_results_total** (Counter)
   - Labels: `service`, `test_type`, `status`, `test_suite`, `test_name`
   - Tổng số test results

2. **test_duration_seconds** (Histogram)
   - Labels: `service`, `test_type`, `test_suite`, `test_name`
   - Thời gian chạy test

3. **test_failures** (Gauge)
   - Labels: `service`, `test_type`, `test_suite`
   - Số tests failed

4. **test_passes** (Gauge)
   - Labels: `service`, `test_type`, `test_suite`
   - Số tests passed

5. **test_total** (Gauge)
   - Labels: `service`, `test_type`, `test_suite`
   - Tổng số tests

## 🔍 Verification

### 1. Check Pushgateway

```bash
# Port forward
kubectl port-forward svc/prometheus-pushgateway 9091:9091 -n ffdd

# Check metrics
curl http://localhost:9091/metrics | grep test_
```

### 2. Check Prometheus

```bash
# Port forward
kubectl port-forward svc/prometheus 9090:9090 -n ffdd

# Access: http://localhost:9090
# Query: test_total
```

### 3. Check Grafana Dashboard

1. Vào Grafana: http://localhost:31000
2. Dashboards → CI Test Monitoring
3. Kiểm tra có data hiển thị

## 🐛 Troubleshooting

### Metrics không xuất hiện

1. **Check Pushgateway đang chạy:**
   ```bash
   kubectl get pods -n ffdd | grep pushgateway
   ```

2. **Check Jest reporter được load:**
   ```bash
   # Run test với verbose
   npm test -- --verbose
   ```

3. **Check environment variable:**
   ```bash
   echo $PROMETHEUS_PUSHGATEWAY_URL
   ```

4. **Check Prometheus scrape Pushgateway:**
   - Vào Prometheus: http://localhost:30090/targets
   - Tìm "pushgateway" target
   - Phải có state: **UP**

### Dashboard trống

1. **Check time range:**
   - Dashboard time range phải có data
   - Thử "Last 1 hour"

2. **Check Prometheus có data:**
   ```promql
   test_total
   ```

3. **Check dashboard queries:**
   - Mở panel → Edit
   - Test query trong Prometheus trước

### Tests không push metrics

1. **Check prom-client installed:**
   ```bash
   npm list prom-client
   ```

2. **Check jest.config.js:**
   - Đảm bảo reporter path đúng
   - Service name đúng

3. **Check console output:**
   - Tìm message: "✓ Test metrics pushed to..."

## 📝 Example Queries

### Test Pass Rate
```promql
(sum(test_passes) / sum(test_total)) * 100
```

### Failed Tests by Service
```promql
sum by (service) (test_failures)
```

### Test Duration p95
```promql
histogram_quantile(0.95, sum(rate(test_duration_seconds_bucket[5m])) by (le, service))
```

## 🎯 Next Steps

1. ✅ Setup cho tất cả services
2. ✅ Integrate vào CI/CD pipeline
3. ✅ Setup alerts cho test failures
4. ✅ Add custom metrics (coverage, etc.)

---

**Happy Testing! 🧪📊**

