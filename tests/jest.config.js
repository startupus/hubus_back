module.exports = {
  displayName: 'AI Aggregator Tests',
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '../',
  testMatch: [
    '<rootDir>/tests/**/*.spec.ts',
    '<rootDir>/tests/**/*.test.ts',
  ],
  collectCoverageFrom: [
    'services/*/src/**/*.ts',
    '!services/*/src/**/*.d.ts',
    '!services/*/src/**/*.interface.ts',
    '!services/*/src/**/*.module.ts',
    '!services/*/src/main.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@ai-aggregator/shared$': '<rootDir>/services/shared/src',
  },
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testTimeout: 10000,
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
};
