// See: https://jestjs.io/docs/configuration

/** @type {import('jest').Config} */

const jestConfig = {
  clearMocks: true,
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
  // XXX
  // extensionsToTreatAsEsm: [".js"],
  //moduleNameMapper: {
  //  '^(\\.{1,2}/.*)\\.js$': '$1',
  //},
  // maxConcurrency is because we have synchronous blocking behavior to test
  // using the same lockfile.
  maxConcurrency: 1,
  verbose: true
}

export default jestConfig