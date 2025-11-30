const { recordTestResult, recordTestSuiteSummary, pushMetrics } = require('./test-metrics');

class TestMetricsReporter {
  constructor(globalConfig, options) {
    this.globalConfig = globalConfig;
    this.options = options || {};
    this.serviceName = this.options.serviceName || 'unknown-service';
    this.pushgatewayUrl = this.options.pushgatewayUrl || process.env.PROMETHEUS_PUSHGATEWAY_URL || 'http://localhost:9091';
    this.testResults = [];
  }

  onTestResult(test, testResult, aggregatedResult) {
    // Determine test type from file path
    const testType = this._determineTestType(testResult.testFilePath);
    
    // Process each test
    testResult.testResults.forEach((result) => {
      const testSuite = this._extractTestSuite(result.ancestorTitles);
      const testName = result.title;
      const status = result.status === 'passed' ? 'passed' : 'failed';
      const duration = result.duration || 0;
      
      recordTestResult({
        service: this.serviceName,
        testType: testType,
        testSuite: testSuite,
        testName: testName,
        status: status,
        duration: duration,
        errorMessage: result.failureMessages ? result.failureMessages.join('\n') : null
      });
    });

    // Record suite summary - group by test suite
    const suiteGroups = {};
    testResult.testResults.forEach((result) => {
      const suiteName = this._extractTestSuite(result.ancestorTitles);
      if (!suiteGroups[suiteName]) {
        suiteGroups[suiteName] = { total: 0, passed: 0, failed: 0 };
      }
      suiteGroups[suiteName].total++;
      if (result.status === 'passed') {
        suiteGroups[suiteName].passed++;
      } else {
        suiteGroups[suiteName].failed++;
      }
    });

    // Record summary for each suite
    Object.entries(suiteGroups).forEach(([suiteName, counts]) => {
      recordTestSuiteSummary({
        service: this.serviceName,
        testType: testType,
        testSuite: suiteName,
        total: counts.total || 0,
        passed: counts.passed || 0,
        failed: counts.failed || 0
      });
    });
  }

  onRunComplete(contexts, results) {
    // Push metrics to Pushgateway after all tests complete
    if (this.pushgatewayUrl && this.pushgatewayUrl !== '') {
      // Use a common job name 'tests' and include service as a grouping label so Grafana
      // can filter metrics by the 'service' label. This avoids grouping all services under
      // a single job and allows per-service dashboards.
      const grouping = {
        service: this.serviceName,
        instance: process.env.HOSTNAME || 'local',
        branch: process.env.GIT_BRANCH || 'main',
        commit: process.env.GIT_COMMIT || 'unknown'
      };

      pushMetrics(this.pushgatewayUrl, 'tests', grouping).catch(err => {
        console.warn('Failed to push test metrics:', err.message);
      });
    }
  }

  _determineTestType(filePath) {
    if (!filePath) return 'unknown';
    // Prefer content-based detection for integration tests (DB/timeouts/etc)
    // Fall back to filename/path heuristics if file can't be read.
    try {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(filePath, 'utf8').toLowerCase();

      // Common integration markers
      const integrationMarkers = [
        'mongodb-memory-server',
        'mongodb-memory-server-core',
        'mongoose.connect',
        'jest.settimeout',
        "supertest",
        "http://localhost",
        "mongo\"",
      ];

      for (const marker of integrationMarkers) {
        if (content.includes(marker)) return 'integration';
      }

      // Filename/path heuristics
      const fileName = path.basename(filePath).toLowerCase();
      if (fileName.includes('integration') || filePath.includes(`${path.sep}integration${path.sep}`)) {
        return 'integration';
      }
      if (fileName === 'app.test.js' || fileName.endsWith('.spec.js') || filePath.includes(`${path.sep}unit${path.sep}`) || fileName.includes('.unit.')) {
        return 'unit';
      }

      // Default: treat tests under __tests__ as unit unless we saw an integration marker
      if (filePath.includes('__tests__')) return 'unit';
    } catch (e) {
      // If reading file fails, fall back to conservative heuristics below
    }

    // Conservative fallback heuristics
    if (filePath.includes('integration') || filePath.includes('.e2e.')) return 'integration';
    if (filePath.includes('app.test.js') || filePath.includes('.spec.js') || filePath.includes('unit')) return 'unit';

    return 'unit';
  }

  _extractTestSuite(ancestorTitles) {
    if (!ancestorTitles || ancestorTitles.length === 0) {
      return 'unknown-suite';
    }
    
    // Use the top-level describe block as suite name
    return ancestorTitles[0] || 'unknown-suite';
  }
}

module.exports = TestMetricsReporter;

