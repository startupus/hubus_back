import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
/**
 * Concurrency Monitor Service для мониторинга многопоточности
 *
 * Обеспечивает:
 * - Мониторинг производительности потоков
 * - Обнаружение deadlocks и race conditions
 * - Статистику использования ресурсов
 * - Алерты при проблемах с производительностью
 */
export declare class ConcurrencyMonitorService implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    private readonly monitoringInterval;
    private readonly metrics;
    private readonly threadStats;
    private readonly deadlockDetector;
    private readonly performanceAnalyzer;
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    /**
     * Регистрация нового потока для мониторинга
     */
    registerThread(threadId: string, metadata?: any): void;
    /**
     * Обновление статуса потока
     */
    updateThreadStatus(threadId: string, status: 'running' | 'blocked' | 'completed' | 'error'): void;
    /**
     * Запись операции потока
     */
    recordThreadOperation(threadId: string, operationTime: number, success: boolean): void;
    /**
     * Обнаружение deadlock
     */
    detectDeadlock(threadId: string, resources: string[]): boolean;
    /**
     * Обнаружение race condition
     */
    detectRaceCondition(threadId: string, resource: string): boolean;
    /**
     * Получение метрик производительности
     */
    getPerformanceMetrics(): {
        totalThreads: number;
        activeThreads: number;
        blockedThreads: number;
        deadlockCount: number;
        raceConditionCount: number;
        averageResponseTime: number;
        throughput: number;
        errorRate: number;
        threadStats: Array<{
            threadId: string;
            duration: number;
            operations: number;
            errors: number;
            status: string;
        }>;
    };
    /**
     * Получение рекомендаций по оптимизации
     */
    getOptimizationRecommendations(): Array<{
        type: 'performance' | 'deadlock' | 'race_condition' | 'resource_usage';
        severity: 'low' | 'medium' | 'high' | 'critical';
        message: string;
        recommendation: string;
    }>;
    /**
     * Выполнение мониторинга
     */
    private performMonitoring;
    /**
     * Обновление метрик
     */
    private updateMetrics;
    /**
     * Проверка на проблемы
     */
    private checkForIssues;
    /**
     * Очистка старых данных
     */
    private cleanupOldData;
    /**
     * Обновление среднего времени ответа
     */
    private updateAverageResponseTime;
}
//# sourceMappingURL=concurrency-monitor.service.d.ts.map