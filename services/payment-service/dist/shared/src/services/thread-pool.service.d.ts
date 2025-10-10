export interface ThreadPoolOptions {
    maxConcurrency?: number;
    timeout?: number;
}
export declare class ThreadPoolService {
    private readonly maxConcurrency;
    private readonly timeout;
    constructor();
    execute<T>(task: () => Promise<T>): Promise<T>;
    executeBatch<T>(tasks: (() => Promise<T>)[]): Promise<T[]>;
    executeParallel<T>(tasks: (() => Promise<T>)[], options?: ThreadPoolOptions): Promise<T[]>;
    executeWithRetry<T>(task: () => Promise<T>, maxRetries?: number, delay?: number): Promise<T>;
}
