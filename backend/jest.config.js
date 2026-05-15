module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/src/tests/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/tests/**'],
  coverageDirectory: 'coverage',
  testTimeout: 300000,
};
