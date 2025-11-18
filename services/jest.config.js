const path = require('path');

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  reporters: [
    'default',
    [
      path.join(__dirname, 'src/utils/jest-test-reporter.js'),
      {
        serviceName: '',
        pushgatewayUrl: process.env.PROMETHEUS_PUSHGATEWAY_URL || 'http://localhost:9091'
      }
    ]
  ]
};
