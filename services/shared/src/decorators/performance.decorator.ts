import { PerformanceMonitorService } from '../monitoring/performance-monitor.service';

/**
 * Декоратор для автоматического мониторинга производительности методов
 * 
 * Автоматически записывает:
 * - Время выполнения
 * - Использование памяти
 * - Ошибки
 * - Количество вызовов
 */
export function MonitorPerformance(operationName?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const monitor = new PerformanceMonitorService();
    const operation = operationName || `${target.constructor.name}.${propertyName}`;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      const startMemory = process.memoryUsage().heapUsed;

      try {
        // Записываем вызов
        monitor.recordRequest(operation);

        // Выполняем метод
        const result = await method.apply(this, args);

        // Записываем успешное выполнение
        const endTime = Date.now();
        const endMemory = process.memoryUsage().heapUsed;
        const responseTime = endTime - startTime;
        const memoryUsed = endMemory - startMemory;

        monitor.recordResponseTime(operation, responseTime);
        monitor.recordMemoryUsage(operation, memoryUsed);

        return result;
      } catch (error) {
        // Записываем ошибку
        monitor.recordError(operation, error as Error);

        // Записываем время выполнения даже при ошибке
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        monitor.recordResponseTime(operation, responseTime);

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Декоратор для мониторинга CPU использования
 */
export function MonitorCpu(operationName?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const monitor = new PerformanceMonitorService();
    const operation = operationName || `${target.constructor.name}.${propertyName}`;

    descriptor.value = async function (...args: any[]) {
      const startCpu = process.cpuUsage();

      try {
        const result = await method.apply(this, args);

        // Вычисляем использование CPU
        const endCpu = process.cpuUsage(startCpu);
        const cpuUsage = (endCpu.user + endCpu.system) / 1000000; // Конвертируем в секунды

        monitor.recordCpuUsage(operation, cpuUsage);

        return result;
      } catch (error) {
        // Записываем ошибку
        monitor.recordError(operation, error as Error);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Декоратор для мониторинга с кастомными метриками
 */
export function MonitorCustom(operationName: string, customMetrics?: {
  recordMemory?: boolean;
  recordCpu?: boolean;
  recordTime?: boolean;
  recordErrors?: boolean;
}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const monitor = new PerformanceMonitorService();
    const operation = operationName;

    // Настройки по умолчанию
    const settings = {
      recordMemory: true,
      recordCpu: true,
      recordTime: true,
      recordErrors: true,
      ...customMetrics,
    };

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      const startMemory = process.memoryUsage().heapUsed;
      const startCpu = process.cpuUsage();

      try {
        // Записываем вызов
        monitor.recordRequest(operation);

        // Выполняем метод
        const result = await method.apply(this, args);

        // Записываем метрики
        const endTime = Date.now();
        const endMemory = process.memoryUsage().heapUsed;
        const endCpu = process.cpuUsage(startCpu);

        if (settings.recordTime) {
          const responseTime = endTime - startTime;
          monitor.recordResponseTime(operation, responseTime);
        }

        if (settings.recordMemory) {
          const memoryUsed = endMemory - startMemory;
          monitor.recordMemoryUsage(operation, memoryUsed);
        }

        if (settings.recordCpu) {
          const cpuUsage = (endCpu.user + endCpu.system) / 1000000;
          monitor.recordCpuUsage(operation, cpuUsage);
        }

        return result;
      } catch (error) {
        // Записываем ошибку
        if (settings.recordErrors) {
          monitor.recordError(operation, error as Error);
        }

        // Записываем время выполнения даже при ошибке
        if (settings.recordTime) {
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          monitor.recordResponseTime(operation, responseTime);
        }

        throw error;
      }
    };

    return descriptor;
  };
}
