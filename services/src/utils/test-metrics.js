// Optional dependency - only require if available
let promClient;
let axios;

try {
  promClient = require('prom-client');
  axios = require('axios');
} catch (error) {
  // prom-client not installed, metrics will be disabled
  console.warn('prom-client not found, test metrics will be disabled');
  promClient = null;
  axios = null;
}

// Create a separate registry for test metrics
let testRegister;
let testResultsTotal, testDuration, testFailures, testPasses, testTotal;

if (promClient) {
  testRegister = new promClient.Registry();

  // Test Metrics
  testResultsTotal = new promClient.Counter({
  name: 'test_results_total',
  help: 'Total number of test results',
  labelNames: ['service', 'test_type', 'status', 'test_suite', 'test_name'],
  registers: [testRegister]
});

  testDuration = new promClient.Histogram({
  name: 'test_duration_seconds',
  help: 'Duration of tests in seconds',
  labelNames: ['service', 'test_type', 'test_suite', 'test_name'],
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5, 10, 30, 60],
  registers: [testRegister]
});

  testFailures = new promClient.Gauge({
  name: 'test_failures',
  help: 'Number of test failures',
  labelNames: ['service', 'test_type', 'test_suite'],
  registers: [testRegister]
});

  testPasses = new promClient.Gauge({
  name: 'test_passes',
  help: 'Number of test passes',
  labelNames: ['service', 'test_type', 'test_suite'],
  registers: [testRegister]
});

  testTotal = new promClient.Gauge({
  name: 'test_total',
  help: 'Total number of tests',
  labelNames: ['service', 'test_type', 'test_suite'],
  registers: [testRegister]
});

  // Register all metrics
  testRegister.registerMetric(testResultsTotal);
  testRegister.registerMetric(testDuration);
  testRegister.registerMetric(testFailures);
  testRegister.registerMetric(testPasses);
  testRegister.registerMetric(testTotal);
}

/**
 * Record test result
 * @param {Object} options
 * @param {string} options.service - Service name
 * @param {string} options.testType - 'unit' or 'integration'
 * @param {string} options.testSuite - Test suite name
 * @param {string} options.testName - Test name
 * @param {string} options.status - 'passed' or 'failed'
 * @param {number} options.duration - Test duration in milliseconds
 * @param {string} options.errorMessage - Error message if failed
 */
function recordTestResult({ service, testType, testSuite, testName, status, duration, errorMessage }) {
  if (!promClient) {
    return; // Metrics disabled
  }
  
  const durationSeconds = duration / 1000;
  
  // Record test result
  testResultsTotal.labels(service, testType, status, testSuite, testName).inc();
  
  // Record duration
  testDuration.labels(service, testType, testSuite, testName).observe(durationSeconds);
  
  // Update pass/fail counts
  if (status === 'passed') {
    testPasses.labels(service, testType, testSuite).inc();
  } else if (status === 'failed') {
    testFailures.labels(service, testType, testSuite).inc();
  }
  
  // Update total
  testTotal.labels(service, testType, testSuite).inc();
}

/**
 * Record test suite summary
 * @param {Object} options
 * @param {string} options.service - Service name
 * @param {string} options.testType - 'unit' or 'integration'
 * @param {string} options.testSuite - Test suite name
 * @param {number} options.total - Total tests
 * @param {number} options.passed - Passed tests
 * @param {number} options.failed - Failed tests
 */
function recordTestSuiteSummary({ service, testType, testSuite, total, passed, failed }) {
  if (!promClient) {
    return; // Metrics disabled
  }
  
  testTotal.labels(service, testType, testSuite).set(total);
  testPasses.labels(service, testType, testSuite).set(passed);
  testFailures.labels(service, testType, testSuite).set(failed);
}

/**
 * Push metrics to Prometheus Pushgateway
 * @param {string} pushgatewayUrl - Pushgateway URL
 * @param {string} jobName - Job name (usually service name)
 * @param {Object} groupingKey - Additional labels
 */
async function pushMetrics(pushgatewayUrl, jobName, groupingKey = {}) {
  if (!promClient || !axios || !pushgatewayUrl || pushgatewayUrl === '') {
    return; // Metrics disabled or no pushgateway URL
  }
  
  try {
    const metrics = await testRegister.metrics();
    const url = `${pushgatewayUrl}/metrics/job/${jobName}`;
    
    const params = new URLSearchParams();
    Object.entries(groupingKey).forEach(([key, value]) => {
      params.append(key, value);
    });
    
    const fullUrl = params.toString() ? `${url}?${params.toString()}` : url;
    
    await axios.post(fullUrl, metrics, {
      headers: {
        'Content-Type': 'text/plain'
      },
      timeout: 5000
    });
    
    console.log(`✓ Test metrics pushed to ${fullUrl}`);
  } catch (error) {
    console.error('Failed to push test metrics:', error.message);
    // Don't throw - metrics pushing should not fail tests
  }
}

/**
 * Get metrics as string
 */
async function getMetrics() {
  if (!promClient || !testRegister) {
    return '# Metrics disabled - prom-client not installed\n';
  }
  return await testRegister.metrics();
}

/**
 * Reset all metrics (useful for testing)
 */
function resetMetrics() {
  if (!promClient || !testRegister) {
    return;
  }
  testRegister.resetMetrics();
}

module.exports = {
  recordTestResult,
  recordTestSuiteSummary,
  pushMetrics,
  getMetrics,
  resetMetrics,
  testRegister: testRegister || null,
  metrics: promClient ? {
    testResultsTotal,
    testDuration,
    testFailures,
    testPasses,
    testTotal
  } : null
};

