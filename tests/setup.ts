import { TestUtils } from './shared/test-utils';

// Global test setup
beforeAll(async () => {
  // Mock console methods to reduce noise in tests
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  
  // Mock LoggerUtil globally
  TestUtils.mockLoggerUtil();
});

afterAll(async () => {
  // Restore all mocks
  jest.restoreAllMocks();
  TestUtils.restoreLoggerUtil();
});

// Global test utilities
global.testUtils = TestUtils;

// Extend Jest matchers
expect.extend({
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    
    return {
      message: () => `expected ${received} ${pass ? 'not ' : ''}to be a valid email`,
      pass,
    };
  },
  
  toBeValidUuid(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    
    return {
      message: () => `expected ${received} ${pass ? 'not ' : ''}to be a valid UUID`,
      pass,
    };
  },
  
  toBeValidApiKey(received: string) {
    const apiKeyRegex = /^ak_[a-f0-9]{32}$/;
    const pass = apiKeyRegex.test(received);
    
    return {
      message: () => `expected ${received} ${pass ? 'not ' : ''}to be a valid API key`,
      pass,
    };
  }
});

// Declare global types
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidEmail(): R;
      toBeValidUuid(): R;
      toBeValidApiKey(): R;
    }
  }
  
  var testUtils: typeof TestUtils;
}