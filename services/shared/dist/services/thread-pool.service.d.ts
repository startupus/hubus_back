export interface ThreadPoolOptions {
    maxConcurrency?: number;
    timeout?: number;
}
export declare class ThreadPoolService {
    private readonly maxConcurrency;
    private readonly timeout;
    constructor();
    /**
     * Выполнение одной задачи
     */
    execute<T>(task: () => Promise<T>): Promise<T>;
    /**
     * Выполнение пакета задач последовательно
     */
    executeBatch<T>(tasks: (() => Promise<T>)[]): Promise<T[]>;
    /**
     * Выполнение задач параллельно с ограничением concurrency
     */
    executeParallel<T>(tasks: (() => Promise<T>)[], options?: ThreadPoolOptions): Promise<T[]>;
    /**
     * Выполнение задач с retry логикой
     */
    executeWithRetry<T>(task: () => Promise<T>, maxRetries?: number, delay?: number): Promise<T>;
}
//# sourceMappingURL=thread-pool.service.d.ts.map