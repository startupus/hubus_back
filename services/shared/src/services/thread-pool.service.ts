import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerUtil } from '../utils/logger.util';
import { ResourcePool } from '../utils/concurrency.util';

/**
 * Thread Pool Service для высоконагруженных операций
 * 
 * Обеспечивает:
 * - Пул воркеров для параллельной обработки
 * - Балансировку нагрузки
 * - Мониторинг производительности
 * - Graceful shutdown
 */
@Injectable()
export class ThreadPoolService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ThreadPoolService.name);
  private readonly workers: any[] = [];
  private readonly taskQueue: Array<{
    id: string;
    task: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    priority: number;
    createdAt: Date;
  }> = [];
  private readonly workerPool: ResourcePool<any>;
  private readonly maxWorkers: number;
  private readonly maxQueueSize: number;
  private isShuttingDown = false;
  private readonly lock = new Int32Array(new SharedArrayBuffer(4));

  constructor(private readonly configService: ConfigService) {
    this.maxWorkers = this.configService.get<number>('THREAD_POOL_MAX_WORKERS', 4);
    this.maxQueueSize = this.configService.get<number>('THREAD_POOL_MAX_QUEUE_SIZE', 1000);
    
    // Создаем пул воркеров
    this.workerPool = new ResourcePool<any>(
      () => this.createWorker(),
      this.maxWorkers,
      (worker) => this.destroyWorker(worker)
    );
  }

  async onModuleInit() {
    await this.initializeWorkers();
    this.startTaskProcessor();
  }

  async onModuleDestroy() {
    await this.shutdown();
  }

  /**
   * Создание нового воркера
   */
  private createWorker(): any {
    const workerCode = `
      // Воркер для обработки задач
      self.onmessage = async function(e) {
        const { taskId, task } = e.data;
        
        try {
          // Выполняем задачу
          const result = await eval('(' + task + ')')();
          
          // Отправляем результат
          self.postMessage({
            taskId,
            success: true,
            result
          });
        } catch (error) {
          // Отправляем ошибку
          self.postMessage({
            taskId,
            success: false,
            error: error.message,
            stack: error.stack
          });
        }
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const WorkerConstructor = (typeof (globalThis as any).Worker !== 'undefined' ? (globalThis as any).Worker : null) as any;
    const worker = WorkerConstructor ? new WorkerConstructor(URL.createObjectURL(blob)) : null;

    // Обработка сообщений от воркера
    worker.onmessage = (event) => {
      this.handleWorkerMessage(event.data);
    };

    worker.onerror = (error) => {
      LoggerUtil.error('shared', 'Worker error', error as Error);
    };

    return worker;
  }

  /**
   * Уничтожение воркера
   */
  private destroyWorker(worker: any): void {
    try {
      worker.terminate();
    } catch (error) {
      LoggerUtil.error('shared', 'Failed to destroy worker', error as Error);
    }
  }

  /**
   * Инициализация воркеров
   */
  private async initializeWorkers(): Promise<void> {
    try {
      // Создаем начальный пул воркеров
      for (let i = 0; i < this.maxWorkers; i++) {
        const worker = this.createWorker();
        this.workers.push(worker);
      }

      LoggerUtil.info('shared', 'Thread pool initialized', {
        maxWorkers: this.maxWorkers,
        maxQueueSize: this.maxQueueSize
      });
    } catch (error) {
      LoggerUtil.error('shared', 'Failed to initialize thread pool', error as Error);
      throw error;
    }
  }

  /**
   * Выполнение задачи в пуле потоков
   */
  async executeTask<T>(
    task: () => Promise<T>,
    options: {
      priority?: number;
      timeout?: number;
    } = {}
  ): Promise<T> {
    if (this.isShuttingDown) {
      throw new Error('Thread pool is shutting down');
    }

    const taskId = this.generateTaskId();
    const priority = options.priority || 0;
    const timeout = options.timeout || 30000; // 30 секунд по умолчанию

    return new Promise<T>((resolve, reject) => {
      // Проверяем размер очереди
      if (this.taskQueue.length >= this.maxQueueSize) {
        reject(new Error('Task queue is full'));
        return;
      }

      // Добавляем задачу в очередь с приоритетом
      const taskItem = {
        id: taskId,
        task,
        resolve,
        reject,
        priority,
        createdAt: new Date()
      };

      this.addTaskToQueue(taskItem);

      // Устанавливаем таймаут
      if (timeout > 0) {
        setTimeout(() => {
          reject(new Error(`Task ${taskId} timed out after ${timeout}ms`));
        }, timeout);
      }
    });
  }

  /**
   * Добавление задачи в очередь с учетом приоритета
   */
  private addTaskToQueue(taskItem: any): void {
    while (!Atomics.compareExchange(this.lock, 0, 0, 1)) {
      Atomics.wait(this.lock, 0, 1);
    }

    try {
      // Вставляем задачу в правильное место по приоритету
      let inserted = false;
      for (let i = 0; i < this.taskQueue.length; i++) {
        if (taskItem.priority > this.taskQueue[i].priority) {
          this.taskQueue.splice(i, 0, taskItem);
          inserted = true;
          break;
        }
      }

      if (!inserted) {
        this.taskQueue.push(taskItem);
      }

      LoggerUtil.debug('shared', 'Task added to queue', {
        taskId: taskItem.id,
        priority: taskItem.priority,
        queueSize: this.taskQueue.length
      });
    } finally {
      Atomics.store(this.lock, 0, 0);
      Atomics.notify(this.lock, 0, 1);
    }
  }

  /**
   * Обработчик сообщений от воркеров
   */
  private handleWorkerMessage(message: any): void {
    const { taskId, success, result, error } = message;

    // Находим задачу в очереди
    const taskIndex = this.taskQueue.findIndex(task => task.id === taskId);
    if (taskIndex === -1) {
      LoggerUtil.warn('shared', 'Received message for unknown task', { taskId });
      return;
    }

    const task = this.taskQueue[taskIndex];
    this.taskQueue.splice(taskIndex, 1);

    if (success) {
      task.resolve(result);
      LoggerUtil.debug('shared', 'Task completed successfully', { taskId });
    } else {
      task.reject(new Error(error));
      LoggerUtil.error('shared', 'Task failed', new Error(error), { taskId });
    }
  }

  /**
   * Процессор задач - распределяет задачи по воркерам
   */
  private startTaskProcessor(): void {
    const processTasks = async () => {
      while (!this.isShuttingDown) {
        try {
          // Получаем доступный воркер
          const worker = this.workerPool.acquireBlocking(1000); // Ждем 1 секунду
          if (!worker) {
            continue;
          }

          // Получаем следующую задачу
          const task = this.getNextTask();
          if (!task) {
            this.workerPool.release(worker);
            continue;
          }

          // Отправляем задачу воркеру
          worker.postMessage({
            taskId: task.id,
            task: task.task.toString()
          });

          // Возвращаем воркер в пул после завершения
          setTimeout(() => {
            this.workerPool.release(worker);
          }, 100);

        } catch (error) {
          LoggerUtil.error('shared', 'Task processor error', error as Error);
        }

        // Небольшая задержка для предотвращения busy waiting
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    };

    // Запускаем процессор в отдельном потоке
    setImmediate(processTasks);
  }

  /**
   * Получение следующей задачи из очереди
   */
  private getNextTask(): any | null {
    while (!Atomics.compareExchange(this.lock, 0, 0, 1)) {
      Atomics.wait(this.lock, 0, 1);
    }

    try {
      if (this.taskQueue.length === 0) {
        return null;
      }

      // Берем задачу с наивысшим приоритетом
      return this.taskQueue.shift();
    } finally {
      Atomics.store(this.lock, 0, 0);
      Atomics.notify(this.lock, 0, 1);
    }
  }

  /**
   * Параллельное выполнение массива задач
   */
  async executeParallel<T>(
    tasks: Array<() => Promise<T>>,
    options: {
      maxConcurrency?: number;
      timeout?: number;
    } = {}
  ): Promise<T[]> {
    const maxConcurrency = options.maxConcurrency || this.maxWorkers;
    const timeout = options.timeout || 30000;

    const results: T[] = [];
    const errors: Error[] = [];
    let completed = 0;

    return new Promise<T[]>((resolve, reject) => {
      const executeBatch = async (batch: Array<() => Promise<T>>) => {
        const promises = batch.map(async (task, index) => {
          try {
            const result = await this.executeTask(task, { timeout });
            results[index] = result;
          } catch (error) {
            errors[index] = error as Error;
          } finally {
            completed++;
            
            // Если все задачи завершены
            if (completed === tasks.length) {
              if (errors.length > 0) {
                reject(new Error(`Some tasks failed: ${errors.length} errors`));
              } else {
                resolve(results);
              }
            }
          }
        });

        await Promise.all(promises);
      };

      // Разбиваем задачи на батчи
      for (let i = 0; i < tasks.length; i += maxConcurrency) {
        const batch = tasks.slice(i, i + maxConcurrency);
        executeBatch(batch);
      }
    });
  }

  /**
   * Получение статистики пула
   */
  getStats(): {
    totalWorkers: number;
    availableWorkers: number;
    busyWorkers: number;
    queueSize: number;
    isShuttingDown: boolean;
  } {
    const poolStats = this.workerPool.getStats();
    
    return {
      totalWorkers: this.workers.length,
      availableWorkers: poolStats.available,
      busyWorkers: poolStats.inUse,
      queueSize: this.taskQueue.length,
      isShuttingDown: this.isShuttingDown
    };
  }

  /**
   * Генерация уникального ID задачи
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Graceful shutdown пула
   */
  private async shutdown(): Promise<void> {
    LoggerUtil.info('shared', 'Shutting down thread pool...');
    
    this.isShuttingDown = true;

    // Ждем завершения всех задач
    while (this.taskQueue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Уничтожаем всех воркеров
    this.workers.forEach(worker => {
      try {
        worker.terminate();
      } catch (error) {
        LoggerUtil.error('shared', 'Failed to terminate worker', error as Error);
      }
    });

    this.workers.length = 0;
    (this.workerPool as any).destroy();

    LoggerUtil.info('shared', 'Thread pool shutdown completed');
  }
}
