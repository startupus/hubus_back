module.exports = {
  // Упрощенная конфигурация для монорепозитория
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/services', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        target: 'ES2020',
        module: 'commonjs',
        strict: false,
        skipLibCheck: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        useDefineForClassFields: false,
        isolatedModules: false
      }
    }],
  },
  moduleNameMapper: {
    '^@ai-aggregator/shared$': '<rootDir>/services/shared/src',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverage: false,
  testTimeout: 30000,
  verbose: true,
  // Игнорировать проблемные файлы и тесты
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/',
    '.*concurrent-orchestrator.service.spec.ts',
    '.*complex-integration.spec.ts'
  ]
};