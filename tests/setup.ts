import 'reflect-metadata';

// Настройка глобальных моков
jest.mock('@ai-aggregator/shared', () => ({
  LoggerUtil: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Настройка переменных окружения для тестов
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';

// Увеличиваем таймаут для тестов
jest.setTimeout(10000);

// Глобальные утилиты для тестов
global.console = {
  ...console,
  // Отключаем логи в тестах для чистоты вывода
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
