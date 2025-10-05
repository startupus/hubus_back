import { LoggerUtil } from './logger.util';

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
export class AtomicCounter {
  private value: number = 0;
  private readonly lock = new Int32Array(new SharedArrayBuffer(4));

  constructor(initialValue: number = 0) {
    this.value = initialValue;
  }

  /**
   * Атомарно увеличивает счетчик и возвращает новое значение
   */
  increment(): number {
    return Atomics.add(this.lock, 0, 1) + 1;
  }

  /**
   * Атомарно уменьшает счетчик и возвращает новое значение
   */
  decrement(): number {
    return Atomics.sub(this.lock, 0, 1) - 1;
  }

  /**
   * Атомарно получает текущее значение
   */
  get(): number {
    return Atomics.load(this.lock, 0);
  }

  /**
   * Атомарно устанавливает значение
   */
  set(value: number): void {
    Atomics.store(this.lock, 0, value);
  }

  /**
   * Атомарно сравнивает и устанавливает значение (CAS)
   */
  compareAndSet(expected: number, update: number): boolean {
    return Atomics.compareExchange(this.lock, 0, expected, update) === expected;
  }
}

/**
 * Потокобезопасная карта с блокировками
 */
export class ConcurrentMap<K, V> {
  private readonly map = new Map<K, V>();
  private readonly locks = new Map<K, Int32Array>();
  private readonly globalLock = new Int32Array(new SharedArrayBuffer(4));

  /**
   * Потокобезопасное получение значения
   */
  get(key: K): V | undefined {
    // Блокируем доступ к конкретному ключу
    const keyLock = this.getKeyLock(key);
    Atomics.wait(keyLock, 0, 0); // Ждем освобождения блокировки
    
    try {
      return this.map.get(key);
    } finally {
      Atomics.notify(keyLock, 0, 1); // Освобождаем блокировку
    }
  }

  /**
   * Потокобезопасная установка значения
   */
  set(key: K, value: V): void {
    const keyLock = this.getKeyLock(key);
    
    try {
      // Блокируем запись
      while (!Atomics.compareExchange(keyLock, 0, 0, 1)) {
        Atomics.wait(keyLock, 0, 1);
      }
      
      this.map.set(key, value);
    } finally {
      Atomics.store(keyLock, 0, 0); // Освобождаем блокировку
      Atomics.notify(keyLock, 0, 1);
    }
  }

  /**
   * Потокобезопасное удаление значения
   */
  delete(key: K): boolean {
    const keyLock = this.getKeyLock(key);
    
    try {
      while (!Atomics.compareExchange(keyLock, 0, 0, 1)) {
        Atomics.wait(keyLock, 0, 1);
      }
      
      return this.map.delete(key);
    } finally {
      Atomics.store(keyLock, 0, 0);
      Atomics.notify(keyLock, 0, 1);
    }
  }

  /**
   * Потокобезопасная проверка существования ключа
   */
  has(key: K): boolean {
    const keyLock = this.getKeyLock(key);
    Atomics.wait(keyLock, 0, 0);
    
    try {
      return this.map.has(key);
    } finally {
      Atomics.notify(keyLock, 0, 1);
    }
  }

  /**
   * Потокобезопасное получение всех ключей
   */
  keys(): K[] {
    // Блокируем всю карту для чтения
    while (!Atomics.compareExchange(this.globalLock, 0, 0, 1)) {
      Atomics.wait(this.globalLock, 0, 1);
    }
    
    try {
      return Array.from(this.map.keys());
    } finally {
      Atomics.store(this.globalLock, 0, 0);
      Atomics.notify(this.globalLock, 0, 1);
    }
  }

  /**
   * Потокобезопасное получение размера
   */
  size(): number {
    while (!Atomics.compareExchange(this.globalLock, 0, 0, 1)) {
      Atomics.wait(this.globalLock, 0, 1);
    }
    
    try {
      return this.map.size;
    } finally {
      Atomics.store(this.globalLock, 0, 0);
      Atomics.notify(this.globalLock, 0, 1);
    }
  }

  /**
   * Получение блокировки для конкретного ключа
   */
  private getKeyLock(key: K): Int32Array {
    if (!this.locks.has(key)) {
      this.locks.set(key, new Int32Array(new SharedArrayBuffer(4)));
    }
    return this.locks.get(key)!;
  }
}

/**
 * Потокобезопасная очередь с блокировками
 */
export class ConcurrentQueue<T> {
  private readonly queue: T[] = [];
  private readonly lock = new Int32Array(new SharedArrayBuffer(4));
  private readonly notEmpty = new Int32Array(new SharedArrayBuffer(4));
  private readonly notFull = new Int32Array(new SharedArrayBuffer(4));
  private readonly maxSize: number;

  constructor(maxSize: number = Number.MAX_SAFE_INTEGER) {
    this.maxSize = maxSize;
  }

  /**
   * Потокобезопасное добавление элемента
   */
  enqueue(item: T): boolean {
    // Блокируем запись
    while (!Atomics.compareExchange(this.lock, 0, 0, 1)) {
      Atomics.wait(this.lock, 0, 1);
    }

    try {
      if (this.queue.length >= this.maxSize) {
        return false; // Очередь полная
      }

      this.queue.push(item);
      
      // Уведомляем о том, что очередь не пустая
      Atomics.store(this.notEmpty, 0, 1);
      Atomics.notify(this.notEmpty, 0, 1);
      
      return true;
    } finally {
      Atomics.store(this.lock, 0, 0);
      Atomics.notify(this.lock, 0, 1);
    }
  }

  /**
   * Потокобезопасное извлечение элемента
   */
  dequeue(): T | undefined {
    while (!Atomics.compareExchange(this.lock, 0, 0, 1)) {
      Atomics.wait(this.lock, 0, 1);
    }

    try {
      if (this.queue.length === 0) {
        return undefined;
      }

      const item = this.queue.shift()!;
      
      // Уведомляем о том, что есть место в очереди
      Atomics.store(this.notFull, 0, 1);
      Atomics.notify(this.notFull, 0, 1);
      
      return item;
    } finally {
      Atomics.store(this.lock, 0, 0);
      Atomics.notify(this.lock, 0, 1);
    }
  }

  /**
   * Блокирующее извлечение элемента (ждет, пока элемент не появится)
   */
  dequeueBlocking(timeout: number = 0): T | undefined {
    const startTime = Date.now();
    
    while (true) {
      const item = this.dequeue();
      if (item !== undefined) {
        return item;
      }

      // Проверяем таймаут
      if (timeout > 0 && (Date.now() - startTime) > timeout) {
        return undefined;
      }

      // Ждем уведомления о появлении элемента
      Atomics.wait(this.notEmpty, 0, 0);
    }
  }

  /**
   * Потокобезопасная проверка пустоты
   */
  isEmpty(): boolean {
    while (!Atomics.compareExchange(this.lock, 0, 0, 1)) {
      Atomics.wait(this.lock, 0, 1);
    }

    try {
      return this.queue.length === 0;
    } finally {
      Atomics.store(this.lock, 0, 0);
      Atomics.notify(this.lock, 0, 1);
    }
  }

  /**
   * Потокобезопасное получение размера
   */
  size(): number {
    while (!Atomics.compareExchange(this.lock, 0, 0, 1)) {
      Atomics.wait(this.lock, 0, 1);
    }

    try {
      return this.queue.length;
    } finally {
      Atomics.store(this.lock, 0, 0);
      Atomics.notify(this.lock, 0, 1);
    }
  }
}

/**
 * Потокобезопасный кэш с TTL
 */
export class ConcurrentCache<K, V> {
  private readonly cache = new Map<K, { value: V; expires: number }>();
  private readonly lock = new Int32Array(new SharedArrayBuffer(4));

  /**
   * Потокобезопасное получение значения из кэша
   */
  get(key: K): V | undefined {
    while (!Atomics.compareExchange(this.lock, 0, 0, 1)) {
      Atomics.wait(this.lock, 0, 1);
    }

    try {
      const item = this.cache.get(key);
      if (!item) {
        return undefined;
      }

      // Проверяем TTL
      if (Date.now() > item.expires) {
        this.cache.delete(key);
        return undefined;
      }

      return item.value;
    } finally {
      Atomics.store(this.lock, 0, 0);
      Atomics.notify(this.lock, 0, 1);
    }
  }

  /**
   * Потокобезопасная установка значения в кэш
   */
  set(key: K, value: V, ttl: number = 300000): void {
    while (!Atomics.compareExchange(this.lock, 0, 0, 1)) {
      Atomics.wait(this.lock, 0, 1);
    }

    try {
      const expires = Date.now() + ttl;
      this.cache.set(key, { value, expires });
    } finally {
      Atomics.store(this.lock, 0, 0);
      Atomics.notify(this.lock, 0, 1);
    }
  }

  /**
   * Потокобезопасное удаление из кэша
   */
  delete(key: K): boolean {
    while (!Atomics.compareExchange(this.lock, 0, 0, 1)) {
      Atomics.wait(this.lock, 0, 1);
    }

    try {
      return this.cache.delete(key);
    } finally {
      Atomics.store(this.lock, 0, 0);
      Atomics.notify(this.lock, 0, 1);
    }
  }

  /**
   * Очистка истекших элементов
   */
  cleanup(): number {
    while (!Atomics.compareExchange(this.lock, 0, 0, 1)) {
      Atomics.wait(this.lock, 0, 1);
    }

    try {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, item] of this.cache.entries()) {
        if (now > item.expires) {
          this.cache.delete(key);
          cleaned++;
        }
      }

      return cleaned;
    } finally {
      Atomics.store(this.lock, 0, 0);
      Atomics.notify(this.lock, 0, 1);
    }
  }
}

/**
 * Потокобезопасный пул ресурсов
 */
export class ResourcePool<T> {
  private readonly available: T[] = [];
  private readonly inUse = new Set<T>();
  private readonly lock = new Int32Array(new SharedArrayBuffer(4));
  private readonly notEmpty = new Int32Array(new SharedArrayBuffer(4));

  constructor(
    private readonly factory: () => T,
    private readonly maxSize: number = 10,
    private readonly destroyResource?: (resource: T) => void
  ) {}

  /**
   * Получение ресурса из пула
   */
  acquire(): T | null {
    while (!Atomics.compareExchange(this.lock, 0, 0, 1)) {
      Atomics.wait(this.lock, 0, 1);
    }

    try {
      // Если есть доступные ресурсы, берем их
      if (this.available.length > 0) {
        const resource = this.available.pop()!;
        this.inUse.add(resource);
        return resource;
      }

      // Если можем создать новый ресурс
      if (this.inUse.size < this.maxSize) {
        const resource = this.factory();
        this.inUse.add(resource);
        return resource;
      }

      return null; // Пул полный
    } finally {
      Atomics.store(this.lock, 0, 0);
      Atomics.notify(this.lock, 0, 1);
    }
  }

  /**
   * Возврат ресурса в пул
   */
  release(resource: T): void {
    while (!Atomics.compareExchange(this.lock, 0, 0, 1)) {
      Atomics.wait(this.lock, 0, 1);
    }

    try {
      if (this.inUse.has(resource)) {
        this.inUse.delete(resource);
        this.available.push(resource);
        
        // Уведомляем о доступности ресурса
        Atomics.store(this.notEmpty, 0, 1);
        Atomics.notify(this.notEmpty, 0, 1);
      }
    } finally {
      Atomics.store(this.lock, 0, 0);
      Atomics.notify(this.lock, 0, 1);
    }
  }

  /**
   * Блокирующее получение ресурса
   */
  acquireBlocking(timeout: number = 0): T | null {
    const startTime = Date.now();

    while (true) {
      const resource = this.acquire();
      if (resource !== null) {
        return resource;
      }

      // Проверяем таймаут
      if (timeout > 0 && (Date.now() - startTime) > timeout) {
        return null;
      }

      // Ждем уведомления о доступности ресурса
      Atomics.wait(this.notEmpty, 0, 0);
    }
  }

  /**
   * Получение статистики пула
   */
  getStats(): { available: number; inUse: number; total: number } {
    while (!Atomics.compareExchange(this.lock, 0, 0, 1)) {
      Atomics.wait(this.lock, 0, 1);
    }

    try {
      return {
        available: this.available.length,
        inUse: this.inUse.size,
        total: this.available.length + this.inUse.size
      };
    } finally {
      Atomics.store(this.lock, 0, 0);
      Atomics.notify(this.lock, 0, 1);
    }
  }

  /**
   * Очистка пула
   */
  destroyPool(): void {
    while (!Atomics.compareExchange(this.lock, 0, 0, 1)) {
      Atomics.wait(this.lock, 0, 1);
    }

    try {
      // Уничтожаем все ресурсы
      const allResources = [...this.available, ...this.inUse];
      if (this.destroyResource) {
        allResources.forEach(resource => this.destroyResource!(resource));
      }
      
      this.available.length = 0;
      this.inUse.clear();
    } finally {
      Atomics.store(this.lock, 0, 0);
      Atomics.notify(this.lock, 0, 1);
    }
  }
}

/**
 * Мьютекс для синхронизации
 */
export class Mutex {
  private locked = false;
  private waiting: Array<() => void> = [];

  /**
   * Заблокировать мьютекс
   */
  async lock(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.locked) {
        this.locked = true;
        resolve();
      } else {
        this.waiting.push(resolve);
      }
    });
  }

  /**
   * Разблокировать мьютекс
   */
  unlock(): void {
    if (this.waiting.length > 0) {
      const next = this.waiting.shift()!;
      next();
    } else {
      this.locked = false;
    }
  }

  /**
   * Выполнить функцию с блокировкой
   */
  async withLock<T>(fn: () => Promise<T>): Promise<T> {
    await this.lock();
    try {
      return await fn();
    } finally {
      this.unlock();
    }
  }

  /**
   * Попытаться заблокировать мьютекс (неблокирующий)
   */
  tryAcquire(): boolean {
    if (!this.locked) {
      this.locked = true;
      return true;
    }
    return false;
  }

  /**
   * Заблокировать мьютекс с таймаутом
   */
  async acquire(timeout?: number): Promise<boolean> {
    if (timeout) {
      return new Promise((resolve) => {
        const timer = setTimeout(() => resolve(false), timeout);
        this.lock().then(() => {
          clearTimeout(timer);
          resolve(true);
        });
      });
    }
    await this.lock();
    return true;
  }

  /**
   * Разблокировать мьютекс (алиас для unlock)
   */
  release(): void {
    this.unlock();
  }
}

/**
 * Семафор для ограничения количества одновременных операций
 */
export class Semaphore {
  private permits: number;
  private waiting: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  /**
   * Получить разрешение
   */
  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      if (this.permits > 0) {
        this.permits--;
        resolve();
      } else {
        this.waiting.push(resolve);
      }
    });
  }

  /**
   * Освободить разрешение
   */
  release(): void {
    if (this.waiting.length > 0) {
      const next = this.waiting.shift()!;
      next();
    } else {
      this.permits++;
    }
  }

  /**
   * Выполнить функцию с семафором
   */
  async withPermit<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }

  /**
   * Получить количество доступных разрешений
   */
  availablePermits(): number {
    return this.permits;
  }

  /**
   * Попытаться получить разрешение (неблокирующий)
   */
  tryAcquire(): boolean {
    if (this.permits > 0) {
      this.permits--;
      return true;
    }
    return false;
  }

  /**
   * Освободить несколько разрешений
   */
  releaseMultiple(permits: number): void {
    for (let i = 0; i < permits; i++) {
      this.release();
    }
  }

  /**
   * Очистить все ожидающие разрешения
   */
  drain(): number {
    const drained = this.waiting.length;
    this.waiting.forEach(resolve => resolve());
    this.waiting = [];
    return drained;
  }
}
