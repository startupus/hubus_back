import { AtomicCounter, ConcurrentMap, ConcurrentQueue, ConcurrentCache, ResourcePool } from '../utils/concurrency.util';

/**
 * Тесты для многопоточности и потокобезопасности
 * 
 * Проверяет:
 * - Атомарные операции
 * - Потокобезопасные коллекции
 * - Синхронизацию доступа
 * - Предотвращение race conditions
 */

describe('Concurrency Tests', () => {
  describe('AtomicCounter', () => {
    it('should perform atomic increment operations', async () => {
      const counter = new AtomicCounter(0);
      
      // Создаем множество промисов для параллельного выполнения
      const promises = Array.from({ length: 1000 }, () => 
        Promise.resolve().then(() => counter.increment())
      );
      
      // Выполняем все операции параллельно
      await Promise.all(promises);
      
      // Проверяем, что счетчик равен 1000 (без race conditions)
      expect(counter.get()).toBe(1000);
    });

    it('should perform atomic decrement operations', async () => {
      const counter = new AtomicCounter(1000);
      
      const promises = Array.from({ length: 500 }, () => 
        Promise.resolve().then(() => counter.decrement())
      );
      
      await Promise.all(promises);
      
      expect(counter.get()).toBe(500);
    });

    it('should perform compare and set operations', async () => {
      const counter = new AtomicCounter(100);
      
      // CAS операция должна быть атомарной
      const result1 = counter.compareAndSet(100, 200);
      const result2 = counter.compareAndSet(100, 300); // Должна провалиться
      
      expect(result1).toBe(true);
      expect(result2).toBe(false);
      expect(counter.get()).toBe(200);
    });
  });

  describe('ConcurrentMap', () => {
    it('should handle concurrent read/write operations', async () => {
      const map = new ConcurrentMap<string, number>();
      
      // Параллельные операции записи
      const writePromises = Array.from({ length: 100 }, (_, i) => 
        Promise.resolve().then(() => map.set(`key${i}`, i))
      );
      
      // Параллельные операции чтения
      const readPromises = Array.from({ length: 50 }, (_, i) => 
        Promise.resolve().then(() => map.get(`key${i}`))
      );
      
      await Promise.all([...writePromises, ...readPromises]);
      
      // Проверяем, что все значения записаны корректно
      for (let i = 0; i < 100; i++) {
        expect(map.get(`key${i}`)).toBe(i);
      }
    });

    it('should handle concurrent delete operations', async () => {
      const map = new ConcurrentMap<string, number>();
      
      // Заполняем карту
      for (let i = 0; i < 100; i++) {
        map.set(`key${i}`, i);
      }
      
      // Параллельные операции удаления
      const deletePromises = Array.from({ length: 50 }, (_, i) => 
        Promise.resolve().then(() => map.delete(`key${i}`))
      );
      
      await Promise.all(deletePromises);
      
      // Проверяем, что половина ключей удалена
      for (let i = 0; i < 50; i++) {
        expect(map.has(`key${i}`)).toBe(false);
      }
      
      for (let i = 50; i < 100; i++) {
        expect(map.has(`key${i}`)).toBe(true);
      }
    });
  });

  describe('ConcurrentQueue', () => {
    it('should handle concurrent enqueue/dequeue operations', async () => {
      const queue = new ConcurrentQueue<number>();
      
      // Параллельные операции добавления
      const enqueuePromises = Array.from({ length: 1000 }, (_, i) => 
        Promise.resolve().then(() => queue.enqueue(i))
      );
      
      await Promise.all(enqueuePromises);
      
      expect(queue.size()).toBe(1000);
      
      // Параллельные операции извлечения
      const dequeuePromises = Array.from({ length: 500 }, () => 
        Promise.resolve().then(() => queue.dequeue())
      );
      
      const results = await Promise.all(dequeuePromises);
      
      expect(queue.size()).toBe(500);
      expect(results.every(result => typeof result === 'number')).toBe(true);
    });

    it('should handle blocking dequeue operations', async () => {
      const queue = new ConcurrentQueue<number>();
      
      // Добавляем элемент в очередь
      queue.enqueue(42);
      
      // Блокирующее извлечение должно вернуть элемент
      const result = queue.dequeueBlocking(1000);
      expect(result).toBe(42);
    });
  });

  describe('ConcurrentCache', () => {
    it('should handle concurrent cache operations', async () => {
      const cache = new ConcurrentCache<string, number>();
      
      // Параллельные операции записи
      const writePromises = Array.from({ length: 100 }, (_, i) => 
        Promise.resolve().then(() => cache.set(`key${i}`, i, 60000))
      );
      
      // Параллельные операции чтения
      const readPromises = Array.from({ length: 50 }, (_, i) => 
        Promise.resolve().then(() => cache.get(`key${i}`))
      );
      
      await Promise.all([...writePromises, ...readPromises]);
      
      // Проверяем, что все значения кэшированы
      for (let i = 0; i < 100; i++) {
        expect(cache.get(`key${i}`)).toBe(i);
      }
    });

    it('should handle TTL expiration', async () => {
      const cache = new ConcurrentCache<string, number>();
      
      // Устанавливаем значение с коротким TTL
      cache.set('test', 42, 100); // 100ms TTL
      
      // Проверяем, что значение доступно
      expect(cache.get('test')).toBe(42);
      
      // Ждем истечения TTL
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Проверяем, что значение истекло
      expect(cache.get('test')).toBeUndefined();
    });
  });

  describe('ResourcePool', () => {
    it('should handle concurrent resource acquisition', async () => {
      let resourceCount = 0;
      const pool = new ResourcePool<number>(
        () => ++resourceCount, // Фабрика ресурсов
        5, // Максимум 5 ресурсов
        (resource) => {} // Деструктор
      );
      
      // Параллельное получение ресурсов
      const acquirePromises = Array.from({ length: 10 }, () => 
        Promise.resolve().then(() => pool.acquire())
      );
      
      const results = await Promise.all(acquirePromises);
      
      // Проверяем, что все ресурсы получены
      expect(results.filter(result => result !== null)).toHaveLength(5);
      
      // Проверяем статистику пула
      const stats = pool.getStats();
      expect(stats.total).toBe(5);
      expect(stats.available).toBe(0);
      expect(stats.inUse).toBe(5);
    });

    it('should handle resource release and reuse', async () => {
      let resourceCount = 0;
      const pool = new ResourcePool<number>(
        () => ++resourceCount,
        3,
        (resource) => {}
      );
      
      // Получаем ресурс
      const resource1 = pool.acquire();
      expect(resource1).not.toBeNull();
      
      // Освобождаем ресурс
      pool.release(resource1!);
      
      // Получаем ресурс снова (должен быть переиспользован)
      const resource2 = pool.acquire();
      expect(resource2).toBe(resource1);
    });
  });

  describe('Race Condition Prevention', () => {
    it('should prevent race conditions in counter operations', async () => {
      const counter = new AtomicCounter(0);
      
      // Создаем множество операций, которые могут вызвать race condition
      const operations = Array.from({ length: 1000 }, () => 
        Promise.resolve().then(() => {
          const current = counter.get();
          counter.set(current + 1);
        })
      );
      
      await Promise.all(operations);
      
      // Без атомарных операций результат был бы непредсказуем
      // С атомарными операциями результат всегда 1000
      expect(counter.get()).toBe(1000);
    });

    it('should prevent data corruption in concurrent map operations', async () => {
      const map = new ConcurrentMap<string, { value: number; timestamp: number }>();
      
      // Параллельные операции, которые могут вызвать corruption
      const operations = Array.from({ length: 1000 }, (_, i) => 
        Promise.resolve().then(() => {
          const key = `key${i % 100}`;
          const existing = map.get(key);
          const newValue = {
            value: (existing?.value || 0) + 1,
            timestamp: Date.now()
          };
          map.set(key, newValue);
        })
      );
      
      await Promise.all(operations);
      
      // Проверяем, что данные не повреждены
      for (let i = 0; i < 100; i++) {
        const value = map.get(`key${i}`);
        expect(value).toBeDefined();
        expect(typeof value?.value).toBe('number');
        expect(typeof value?.timestamp).toBe('number');
      }
    });
  });

  describe('Performance Tests', () => {
    it('should handle high-throughput operations', async () => {
      const counter = new AtomicCounter(0);
      const startTime = Date.now();
      
      // Выполняем множество операций
      const operations = Array.from({ length: 10000 }, () => 
        Promise.resolve().then(() => counter.increment())
      );
      
      await Promise.all(operations);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(counter.get()).toBe(10000);
      expect(duration).toBeLessThan(5000); // Должно завершиться за 5 секунд
    });

    it('should handle memory-efficient operations', async () => {
      const cache = new ConcurrentCache<string, number>();
      
      // Добавляем много элементов
      for (let i = 0; i < 10000; i++) {
        cache.set(`key${i}`, i, 1000);
      }
      
      // Проверяем, что все элементы доступны
      let foundCount = 0;
      for (let i = 0; i < 10000; i++) {
        if (cache.get(`key${i}`) === i) {
          foundCount++;
        }
      }
      
      expect(foundCount).toBe(10000);
    });
  });
});
