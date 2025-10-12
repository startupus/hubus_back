/**
 * Декоратор для автоматического мониторинга производительности методов
 *
 * Автоматически записывает:
 * - Время выполнения
 * - Использование памяти
 * - Ошибки
 * - Количество вызовов
 */
export declare function MonitorPerformance(operationName?: string): (target: any, propertyName: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
/**
 * Декоратор для мониторинга CPU использования
 */
export declare function MonitorCpu(operationName?: string): (target: any, propertyName: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
/**
 * Декоратор для мониторинга с кастомными метриками
 */
export declare function MonitorCustom(operationName: string, customMetrics?: {
    recordMemory?: boolean;
    recordCpu?: boolean;
    recordTime?: boolean;
    recordErrors?: boolean;
}): (target: any, propertyName: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
//# sourceMappingURL=performance.decorator.d.ts.map