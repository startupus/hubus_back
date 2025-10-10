export declare class AtomicCounter {
    private value;
    private readonly lock;
    constructor(initialValue?: number);
    increment(): number;
    decrement(): number;
    get(): number;
    set(value: number): void;
    compareAndSet(expected: number, update: number): boolean;
}
export declare class ConcurrentMap<K, V> {
    private readonly map;
    private readonly locks;
    private readonly globalLock;
    get(key: K): V | undefined;
    set(key: K, value: V): void;
    delete(key: K): boolean;
    has(key: K): boolean;
    keys(): K[];
    size(): number;
    private getKeyLock;
}
export declare class ConcurrentQueue<T> {
    private readonly queue;
    private readonly lock;
    private readonly notEmpty;
    private readonly notFull;
    private readonly maxSize;
    constructor(maxSize?: number);
    enqueue(item: T): boolean;
    dequeue(): T | undefined;
    dequeueBlocking(timeout?: number): T | undefined;
    isEmpty(): boolean;
    size(): number;
}
export declare class ConcurrentCache<K, V> {
    private readonly cache;
    private readonly lock;
    get(key: K): V | undefined;
    set(key: K, value: V, ttl?: number): void;
    delete(key: K): boolean;
    cleanup(): number;
}
export declare class ResourcePool<T> {
    private readonly factory;
    private readonly maxSize;
    private readonly destroyResource?;
    private readonly available;
    private readonly inUse;
    private readonly lock;
    private readonly notEmpty;
    constructor(factory: () => T, maxSize?: number, destroyResource?: (resource: T) => void);
    acquire(): T | null;
    release(resource: T): void;
    acquireBlocking(timeout?: number): T | null;
    getStats(): {
        available: number;
        inUse: number;
        total: number;
    };
    destroyPool(): void;
}
export declare class Mutex {
    private locked;
    private waiting;
    lock(): Promise<void>;
    unlock(): void;
    withLock<T>(fn: () => Promise<T>): Promise<T>;
    tryAcquire(): boolean;
    acquire(timeout?: number): Promise<boolean>;
    release(): void;
}
export declare class Semaphore {
    private permits;
    private waiting;
    constructor(permits: number);
    acquire(): Promise<void>;
    release(): void;
    withPermit<T>(fn: () => Promise<T>): Promise<T>;
    availablePermits(): number;
    tryAcquire(): boolean;
    releaseMultiple(permits: number): void;
    drain(): number;
}
