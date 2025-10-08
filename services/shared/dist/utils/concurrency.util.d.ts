/**
 * Concurrency Utilities для потокобезопасности
 *
 * Обеспечивает:
 * - Потокобезопасные операции
 * - Управление пулами потоков
 * - Синхронизацию доступа к ресурсам
 * - Предотвращение race conditions
 */
/**
 * Потокобезопасный счетчик с атомарными операциями
 */
export declare class AtomicCounter {
    private value;
    private readonly lock;
    constructor(initialValue?: number);
    /**
     * Атомарно увеличивает счетчик и возвращает новое значение
     */
    increment(): number;
    /**
     * Атомарно уменьшает счетчик и возвращает новое значение
     */
    decrement(): number;
    /**
     * Атомарно получает текущее значение
     */
    get(): number;
    /**
     * Атомарно устанавливает значение
     */
    set(value: number): void;
    /**
     * Атомарно сравнивает и устанавливает значение (CAS)
     */
    compareAndSet(expected: number, update: number): boolean;
}
/**
 * Потокобезопасная карта с блокировками
 */
export declare class ConcurrentMap<K, V> {
    private readonly map;
    private readonly locks;
    private readonly globalLock;
    /**
     * Потокобезопасное получение значения
     */
    get(key: K): V | undefined;
    /**
     * Потокобезопасная установка значения
     */
    set(key: K, value: V): void;
    /**
     * Потокобезопасное удаление значения
     */
    delete(key: K): boolean;
    /**
     * Потокобезопасная проверка существования ключа
     */
    has(key: K): boolean;
    /**
     * Потокобезопасное получение всех ключей
     */
    keys(): K[];
    /**
     * Потокобезопасное получение размера
     */
    size(): number;
    /**
     * Получение блокировки для конкретного ключа
     */
    private getKeyLock;
}
/**
 * Потокобезопасная очередь с блокировками
 */
export declare class ConcurrentQueue<T> {
    private readonly queue;
    private readonly lock;
    private readonly notEmpty;
    private readonly notFull;
    private readonly maxSize;
    constructor(maxSize?: number);
    /**
     * Потокобезопасное добавление элемента
     */
    enqueue(item: T): boolean;
    /**
     * Потокобезопасное извлечение элемента
     */
    dequeue(): T | undefined;
    /**
     * Блокирующее извлечение элемента (ждет, пока элемент не появится)
     */
    dequeueBlocking(timeout?: number): T | undefined;
    /**
     * Потокобезопасная проверка пустоты
     */
    isEmpty(): boolean;
    /**
     * Потокобезопасное получение размера
     */
    size(): number;
}
/**
 * Потокобезопасный кэш с TTL
 */
export declare class ConcurrentCache<K, V> {
    private readonly cache;
    private readonly lock;
    /**
     * Потокобезопасное получение значения из кэша
     */
    get(key: K): V | undefined;
    /**
     * Потокобезопасная установка значения в кэш
     */
    set(key: K, value: V, ttl?: number): void;
    /**
     * Потокобезопасное удаление из кэша
     */
    delete(key: K): boolean;
    /**
     * Очистка истекших элементов
     */
    cleanup(): number;
}
/**
 * Потокобезопасный пул ресурсов
 */
export declare class ResourcePool<T> {
    private readonly factory;
    private readonly maxSize;
    private readonly destroyResource?;
    private readonly available;
    private readonly inUse;
    private readonly lock;
    private readonly notEmpty;
    constructor(factory: () => T, maxSize?: number, destroyResource?: (resource: T) => void);
    /**
     * Получение ресурса из пула
     */
    acquire(): T | null;
    /**
     * Возврат ресурса в пул
     */
    release(resource: T): void;
    /**
     * Блокирующее получение ресурса
     */
    acquireBlocking(timeout?: number): T | null;
    /**
     * Получение статистики пула
     */
    getStats(): {
        available: number;
        inUse: number;
        total: number;
    };
    /**
     * Очистка пула
     */
    destroyPool(): void;
}
/**
 * Мьютекс для синхронизации
 */
export declare class Mutex {
    private locked;
    private waiting;
    /**
     * Заблокировать мьютекс
     */
    lock(): Promise<void>;
    /**
     * Разблокировать мьютекс
     */
    unlock(): void;
    /**
     * Выполнить функцию с блокировкой
     */
    withLock<T>(fn: () => Promise<T>): Promise<T>;
    /**
     * Попытаться заблокировать мьютекс (неблокирующий)
     */
    tryAcquire(): boolean;
    /**
     * Заблокировать мьютекс с таймаутом
     */
    acquire(timeout?: number): Promise<boolean>;
    /**
     * Разблокировать мьютекс (алиас для unlock)
     */
    release(): void;
}
/**
 * Семафор для ограничения количества одновременных операций
 */
export declare class Semaphore {
    private permits;
    private waiting;
    constructor(permits: number);
    /**
     * Получить разрешение
     */
    acquire(): Promise<void>;
    /**
     * Освободить разрешение
     */
    release(): void;
    /**
     * Выполнить функцию с семафором
     */
    withPermit<T>(fn: () => Promise<T>): Promise<T>;
    /**
     * Получить количество доступных разрешений
     */
    availablePermits(): number;
    /**
     * Попытаться получить разрешение (неблокирующий)
     */
    tryAcquire(): boolean;
    /**
     * Освободить несколько разрешений
     */
    releaseMultiple(permits: number): void;
    /**
     * Очистить все ожидающие разрешения
     */
    drain(): number;
}
//# sourceMappingURL=concurrency.util.d.ts.map