"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitorPerformance = MonitorPerformance;
exports.MonitorCpu = MonitorCpu;
exports.MonitorCustom = MonitorCustom;
const performance_monitor_service_1 = require("../monitoring/performance-monitor.service");
/**
 * Декоратор для автоматического мониторинга производительности методов
 *
 * Автоматически записывает:
 * - Время выполнения
 * - Использование памяти
 * - Ошибки
 * - Количество вызовов
 */
function MonitorPerformance(operationName) {
    return function (target, propertyName, descriptor) {
        const method = descriptor.value;
        const monitor = new performance_monitor_service_1.PerformanceMonitorService();
        const operation = operationName || `${target.constructor.name}.${propertyName}`;
        descriptor.value = async function (...args) {
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
            }
            catch (error) {
                // Записываем ошибку
                monitor.recordError(operation, error);
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
function MonitorCpu(operationName) {
    return function (target, propertyName, descriptor) {
        const method = descriptor.value;
        const monitor = new performance_monitor_service_1.PerformanceMonitorService();
        const operation = operationName || `${target.constructor.name}.${propertyName}`;
        descriptor.value = async function (...args) {
            const startCpu = process.cpuUsage();
            try {
                const result = await method.apply(this, args);
                // Вычисляем использование CPU
                const endCpu = process.cpuUsage(startCpu);
                const cpuUsage = (endCpu.user + endCpu.system) / 1000000; // Конвертируем в секунды
                monitor.recordCpuUsage(operation, cpuUsage);
                return result;
            }
            catch (error) {
                // Записываем ошибку
                monitor.recordError(operation, error);
                throw error;
            }
        };
        return descriptor;
    };
}
/**
 * Декоратор для мониторинга с кастомными метриками
 */
function MonitorCustom(operationName, customMetrics) {
    return function (target, propertyName, descriptor) {
        const method = descriptor.value;
        const monitor = new performance_monitor_service_1.PerformanceMonitorService();
        const operation = operationName;
        // Настройки по умолчанию
        const settings = {
            recordMemory: true,
            recordCpu: true,
            recordTime: true,
            recordErrors: true,
            ...customMetrics,
        };
        descriptor.value = async function (...args) {
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
            }
            catch (error) {
                // Записываем ошибку
                if (settings.recordErrors) {
                    monitor.recordError(operation, error);
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
//# sourceMappingURL=performance.decorator.js.map