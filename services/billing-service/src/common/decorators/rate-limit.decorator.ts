import { SetMetadata } from '@nestjs/common';

/**
 * Декоратор для настройки rate limiting
 * 
 * @param requests - Максимальное количество запросов
 * @param window - Временное окно в миллисекундах
 */
export const RateLimit = (requests: number, window: number) => 
  SetMetadata('rateLimit', { requests, window });

/**
 * Предустановленные лимиты для разных операций
 */
export const RateLimits = {
  // Критические операции - строгие лимиты
  UPDATE_BALANCE: RateLimit(10, 60000), // 10 запросов в минуту
  PROCESS_PAYMENT: RateLimit(5, 60000), // 5 запросов в минуту
  CREATE_TRANSACTION: RateLimit(20, 60000), // 20 запросов в минуту
  
  // Чтение данных - более мягкие лимиты
  GET_BALANCE: RateLimit(100, 60000), // 100 запросов в минуту
  GET_TRANSACTIONS: RateLimit(50, 60000), // 50 запросов в минуту
  GET_REPORT: RateLimit(10, 60000), // 10 запросов в минуту
  
  // Операции с использованием - средние лимиты
  TRACK_USAGE: RateLimit(1000, 60000), // 1000 запросов в минуту
  CALCULATE_COST: RateLimit(200, 60000), // 200 запросов в минуту
  
  // Административные операции - очень строгие лимиты
  ADMIN_OPERATIONS: RateLimit(5, 300000), // 5 запросов в 5 минут
};
