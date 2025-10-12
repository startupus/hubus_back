/**
 * Performance Monitor Service для отслеживания производительности
 *
 * Обеспечивает:
 * - Метрики производительности в реальном времени
 * - Отслеживание медленных операций
 * - Статистику использования ресурсов
 * - Алерты при превышении лимитов
 */
export declare class PerformanceMonitorService {
    private readonly logger;
    private readonly metrics;
    private readonly slowOperationThreshold;
    private readonly memoryThreshold;
    private readonly cpuThreshold;
    private readonly responseTimes;
    private readonly errorRates;
    private readonly requestCounts;
    private readonly memoryUsage;
    private readonly cpuUsage;
    /**
     * Записать метрику времени отклика
     */
    recordResponseTime(operation: string, responseTime: number): void;
    /**
     * Записать метрику ошибки
     */
    recordError(operation: string, error: Error): void;
    /**
     * Записать метрику запроса
     */
    recordRequest(operation: string): void;
    /**
     * Записать метрику использования памяти
     */
    recordMemoryUsage(operation: string, memoryUsage: number): void;
    /**
     * Записать метрику использования CPU
     */
    recordCpuUsage(operation: string, cpuUsage: number): void;
    /**
     * Получить статистику производительности
     */
    getPerformanceStats(): {
        operations: Array<{
            name: string;
            avgResponseTime: number;
            maxResponseTime: number;
            minResponseTime: number;
            errorRate: number;
            requestCount: number;
            avgMemoryUsage: number;
            avgCpuUsage: number;
        }>;
        system: {
            totalMemory: number;
            freeMemory: number;
            usedMemory: number;
            memoryUsagePercent: number;
            uptime: number;
            nodeVersion: string;
        };
    };
    /**
     * Очистить метрики
     */
    clearMetrics(): void;
    /**
     * Получить метрики для конкретной операции
     */
    getOperationMetrics(operation: string): {
        avgResponseTime: number;
        maxResponseTime: number;
        minResponseTime: number;
        errorRate: number;
        requestCount: number;
        avgMemoryUsage: number;
        avgCpuUsage: number;
    } | null;
}
//# sourceMappingURL=performance-monitor.service.d.ts.map