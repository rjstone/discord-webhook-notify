// See: https://jestjs.io/docs/configuration

/** @type {import('jest').Config} */

const jestConfig = {
  // clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['./src/**'],
  coverageDirectory: './coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],
  coverageReporters: ['json-summary', 'text', 'lcov'],
  moduleFileExtensions: ['js'],
  reporters: ['default'],
  testEnvironment: 'node',
  testMatch: ['**/*.test.js'],
  testPathIgnorePatterns: ['/dist/', '/node_modules/'],
  // maxConcurrency is because we have synchronous blocking behavior to test
  // using the same lockfile for all tests. This should really be set in a more
  // surgical manner, but the tests don't take that long.
  maxConcurrency: 1,
  // randomize: true,
  transform: {},
  verbose: true
}

export default jestConfig