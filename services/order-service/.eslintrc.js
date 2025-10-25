module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // Relaxed rules for learning project
    'no-unused-vars': 'warn',
    'no-console': 'warn',
    'no-undef': 'error',
  },
}
