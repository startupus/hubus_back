import { Test, TestingModule } from '@nestjs/testing';
import { Mutex, Semaphore } from '../utils/concurrency.util';

describe('Concurrency Utilities', () => {
  describe('Mutex', () => {
    let mutex: Mutex;

    beforeEach(() => {
      mutex = new Mutex();
    });

    it('should allow single access at a time', async () => {
      let accessCount = 0;
      const promises = Array.from({ length: 5 }, async () => {
        await mutex.acquire();
        try {
          accessCount++;
          await new Promise(resolve => setTimeout(resolve, 10));
        } finally {
          mutex.release();
        }
      });

      await Promise.all(promises);
      expect(accessCount).toBe(5);
    });

    it('should prevent concurrent access', async () => {
      let concurrentAccess = 0;
      let maxConcurrentAccess = 0;

      const promises = Array.from({ length: 10 }, async () => {
        await mutex.acquire();
        try {
          concurrentAccess++;
          maxConcurrentAccess = Math.max(maxConcurrentAccess, concurrentAccess);
          await new Promise(resolve => setTimeout(resolve, 10));
          concurrentAccess--;
        } finally {
          mutex.release();
        }
      });

      await Promise.all(promises);
      expect(maxConcurrentAccess).toBe(1);
    });

    it('should handle errors gracefully', async () => {
      let errorThrown = false;
      const promises = Array.from({ length: 3 }, async () => {
        await mutex.acquire();
        try {
          if (Math.random() < 0.5) {
            throw new Error('Test error');
          }
        } catch (error) {
          errorThrown = true;
        } finally {
          mutex.release();
        }
      });

      await Promise.all(promises);
      expect(errorThrown).toBe(true);
    });

    it('should support tryAcquire', async () => {
      const acquired = mutex.tryAcquire();
      expect(acquired).toBe(true);

      const secondAcquire = mutex.tryAcquire();
      expect(secondAcquire).toBe(false);

      mutex.release();
      const thirdAcquire = mutex.tryAcquire();
      expect(thirdAcquire).toBe(true);
    });

    it('should support acquire with timeout', async () => {
      await mutex.acquire();
      
      const startTime = Date.now();
      const acquired = await mutex.acquire(100);
      const endTime = Date.now();

      expect(acquired).toBe(false);
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Semaphore', () => {
    let semaphore: Semaphore;

    beforeEach(() => {
      semaphore = new Semaphore(3); // Allow 3 concurrent accesses
    });

    it('should allow limited concurrent access', async () => {
      let concurrentAccess = 0;
      let maxConcurrentAccess = 0;

      const promises = Array.from({ length: 10 }, async () => {
        await semaphore.acquire();
        try {
          concurrentAccess++;
          maxConcurrentAccess = Math.max(maxConcurrentAccess, concurrentAccess);
          await new Promise(resolve => setTimeout(resolve, 10));
          concurrentAccess--;
        } finally {
          semaphore.release();
        }
      });

      await Promise.all(promises);
      expect(maxConcurrentAccess).toBeLessThanOrEqual(3);
    });

    it('should handle errors gracefully', async () => {
      let errorThrown = false;
      const promises = Array.from({ length: 5 }, async (_, index) => {
        await semaphore.acquire();
        try {
          if (index === 2) { // Force error on 3rd iteration
            throw new Error('Test error');
          }
        } catch (error) {
          errorThrown = true;
        } finally {
          semaphore.release();
        }
      });

      await Promise.all(promises);
      expect(errorThrown).toBe(true);
    });

    it('should support tryAcquire', async () => {
      const acquired1 = semaphore.tryAcquire();
      const acquired2 = semaphore.tryAcquire();
      const acquired3 = semaphore.tryAcquire();
      const acquired4 = semaphore.tryAcquire();

      expect(acquired1).toBe(true);
      expect(acquired2).toBe(true);
      expect(acquired3).toBe(true);
      expect(acquired4).toBe(false);

      semaphore.release();
      const acquired5 = semaphore.tryAcquire();
      expect(acquired5).toBe(true);
    });

    it('should support acquire with timeout', async () => {
      // Acquire all available permits
      await semaphore.acquire();
      await semaphore.acquire();
      await semaphore.acquire();

      const startTime = Date.now();
      const acquirePromise = semaphore.acquire();
      
      // Wait a bit to ensure it's queued
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Release one permit to unblock the queued request
      semaphore.release();
      
      await acquirePromise;
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(50);
    }, 10000);

    it('should support release with count', async () => {
      await semaphore.acquire();
      await semaphore.acquire();
      await semaphore.acquire();

      semaphore.releaseMultiple(2);

      const acquired1 = semaphore.tryAcquire();
      const acquired2 = semaphore.tryAcquire();
      const acquired3 = semaphore.tryAcquire();

      expect(acquired1).toBe(true);
      expect(acquired2).toBe(true);
      expect(acquired3).toBe(false);
    });

    it('should support drain', async () => {
      // Acquire all available permits
      semaphore.acquire();
      semaphore.acquire();
      semaphore.acquire();
      
      // Try to acquire more (this will be queued)
      semaphore.acquire();
      
      // Drain should return the number of queued requests
      const drained = semaphore.drain();
      expect(drained).toBe(1);

      const acquired = semaphore.tryAcquire();
      expect(acquired).toBe(false);
    });

    it('should support available permits', async () => {
      expect(semaphore.availablePermits()).toBe(3);

      await semaphore.acquire();
      expect(semaphore.availablePermits()).toBe(2);

      await semaphore.acquire();
      expect(semaphore.availablePermits()).toBe(1);

      await semaphore.acquire();
      expect(semaphore.availablePermits()).toBe(0);

      semaphore.release();
      expect(semaphore.availablePermits()).toBe(1);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple mutexes', async () => {
      const mutex1 = new Mutex();
      const mutex2 = new Mutex();
      let accessCount = 0;

      const promises = Array.from({ length: 5 }, async () => {
        await mutex1.acquire();
        try {
          await mutex2.acquire();
          try {
            accessCount++;
            await new Promise(resolve => setTimeout(resolve, 10));
          } finally {
            mutex2.release();
          }
        } finally {
          mutex1.release();
        }
      });

      await Promise.all(promises);
      expect(accessCount).toBe(5);
    });

    it('should handle mixed semaphores and mutexes', async () => {
      const semaphore = new Semaphore(2);
      const mutex = new Mutex();
      let accessCount = 0;

      const promises = Array.from({ length: 6 }, async () => {
        await semaphore.acquire();
        try {
          await mutex.acquire();
          try {
            accessCount++;
            await new Promise(resolve => setTimeout(resolve, 10));
          } finally {
            mutex.release();
          }
        } finally {
          semaphore.release();
        }
      });

      await Promise.all(promises);
      expect(accessCount).toBe(6);
    });

    it('should handle nested semaphores', async () => {
      const outerSemaphore = new Semaphore(3);
      const innerSemaphore = new Semaphore(2);
      let accessCount = 0;

      const promises = Array.from({ length: 6 }, async () => {
        await outerSemaphore.acquire();
        try {
          await innerSemaphore.acquire();
          try {
            accessCount++;
            await new Promise(resolve => setTimeout(resolve, 10));
          } finally {
            innerSemaphore.release();
          }
        } finally {
          outerSemaphore.release();
        }
      });

      await Promise.all(promises);
      expect(accessCount).toBe(6);
    });
  });

  describe('Performance Tests', () => {
    it('should handle high concurrency', async () => {
      const mutex = new Mutex();
      const startTime = Date.now();
      const promises = Array.from({ length: 100 }, async () => {
        await mutex.acquire();
        try {
          // Simulate some work
          await new Promise(resolve => setTimeout(resolve, 1));
        } finally {
          mutex.release();
        }
      });

      await Promise.all(promises);
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle semaphore with high concurrency', async () => {
      const semaphore = new Semaphore(10);
      const startTime = Date.now();
      const promises = Array.from({ length: 100 }, async () => {
        await semaphore.acquire();
        try {
          // Simulate some work
          await new Promise(resolve => setTimeout(resolve, 1));
        } finally {
          semaphore.release();
        }
      });

      await Promise.all(promises);
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe('Error Handling', () => {
    it('should handle mutex errors gracefully', async () => {
      const mutex = new Mutex();
      let errorCount = 0;

      const promises = Array.from({ length: 10 }, async () => {
        try {
          await mutex.acquire();
          try {
            if (Math.random() < 0.3) {
              throw new Error('Random error');
            }
          } finally {
            mutex.release();
          }
        } catch (error) {
          errorCount++;
        }
      });

      await Promise.all(promises);
      expect(errorCount).toBeGreaterThan(0);
    });

    it('should handle semaphore errors gracefully', async () => {
      const semaphore = new Semaphore(3);
      let errorCount = 0;

      const promises = Array.from({ length: 10 }, async () => {
        try {
          await semaphore.acquire();
          try {
            if (Math.random() < 0.3) {
              throw new Error('Random error');
            }
          } finally {
            semaphore.release();
          }
        } catch (error) {
          errorCount++;
        }
      });

      await Promise.all(promises);
      expect(errorCount).toBeGreaterThan(0);
    });
  });
});
