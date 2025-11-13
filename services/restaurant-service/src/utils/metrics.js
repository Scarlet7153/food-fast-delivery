const promClient = require('prom-client');

// Create a Registry
const register = new promClient.Registry();

// Add default metrics (CPU, Memory, etc.)
promClient.collectDefaultMetrics({ 
  register,
  prefix: 'nodejs_'
});

// ============================================================================
// Custom Metrics
// ============================================================================

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

// Active Connections (gauge)
const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  labelNames: ['service']
});

// Request Size (histogram)
const requestSize = new promClient.Histogram({
  name: 'http_request_size_bytes',
  help: 'Size of HTTP requests in bytes',
  labelNames: ['method', 'route', 'service'],
  buckets: [100, 1000, 5000, 10000, 50000, 100000, 500000]
});

// Response Size (histogram)
const responseSize = new promClient.Histogram({
  name: 'http_response_size_bytes',
  help: 'Size of HTTP responses in bytes',
  labelNames: ['method', 'route', 'service'],
  buckets: [100, 1000, 5000, 10000, 50000, 100000, 500000, 1000000]
});

// Register all custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(activeConnections);
register.registerMetric(requestSize);
register.registerMetric(responseSize);

// ============================================================================
// Middleware
// ============================================================================

function metricsMiddleware(serviceName = 'restaurant-service') {
  return (req, res, next) => {
    const start = Date.now();
    activeConnections.labels(serviceName).inc();
    
    const reqSize = parseInt(req.get('content-length')) || 0;
    if (reqSize > 0) {
      requestSize
        .labels(req.method, req.route?.path || req.path, serviceName)
        .observe(reqSize);
    }
    
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
      
      const resSize = parseInt(res.get('content-length')) || 0;
      if (resSize > 0) {
        responseSize
          .labels(req.method, route, serviceName)
          .observe(resSize);
      }
      
      activeConnections.labels(serviceName).dec();
    });
    
    next();
  };
}

module.exports = {
  register,
  metricsMiddleware,
  metrics: {
    httpRequestDuration,
    httpRequestTotal,
    activeConnections,
    requestSize,
    responseSize
  }
};

