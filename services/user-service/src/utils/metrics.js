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
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10] // 1ms to 10s
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
  buckets: [100, 1000, 5000, 10000, 50000, 100000, 500000] // 100B to 500KB
});

// Response Size (histogram)
const responseSize = new promClient.Histogram({
  name: 'http_response_size_bytes',
  help: 'Size of HTTP responses in bytes',
  labelNames: ['method', 'route', 'service'],
  buckets: [100, 1000, 5000, 10000, 50000, 100000, 500000, 1000000] // 100B to 1MB
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

/**
 * Express middleware to collect HTTP metrics
 * @param {string} serviceName - Name of the service
 */
function metricsMiddleware(serviceName = 'user-service') {
  return (req, res, next) => {
    const start = Date.now();
    
    // Increment active connections
    activeConnections.labels(serviceName).inc();
    
    // Track request size
    const reqSize = parseInt(req.get('content-length')) || 0;
    if (reqSize > 0) {
      requestSize
        .labels(req.method, req.route?.path || req.path, serviceName)
        .observe(reqSize);
    }
    
    // On response finish
    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000; // Convert to seconds
      const route = req.route?.path || req.path;
      const statusCode = res.statusCode;
      
      // Record request duration
      httpRequestDuration
        .labels(req.method, route, statusCode, serviceName)
        .observe(duration);
      
      // Increment request counter
      httpRequestTotal
        .labels(req.method, route, statusCode, serviceName)
        .inc();
      
      // Track response size
      const resSize = parseInt(res.get('content-length')) || 0;
      if (resSize > 0) {
        responseSize
          .labels(req.method, route, serviceName)
          .observe(resSize);
      }
      
      // Decrement active connections
      activeConnections.labels(serviceName).dec();
    });
    
    next();
  };
}

// ============================================================================
// Exports
// ============================================================================

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

