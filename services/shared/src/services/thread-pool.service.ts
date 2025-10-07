import { Injectable } from '@nestjs/common';

export interface ThreadPoolOptions {
  maxConcurrency?: number;
  timeout?: number;
}

@Injectable()
export class ThreadPoolService {
  private readonly maxConcurrency: number;
  private readonly timeout: number;

  constructor() {
    this.maxConcurrency = 10; // По умолчанию 10 параллельных задач
    this.timeout = 30000; // 30 секунд таймаут
  }

  /**
   * Выполнение одной задачи
   */
  async execute<T>(task: () => Promise<T>): Promise<T> {
    return await Promise.race([
      task(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Task timeout')), this.timeout)
      )
    ]);
  }

  /**
   * Выполнение пакета задач последовательно
   */
  async executeBatch<T>(tasks: (() => Promise<T>)[]): Promise<T[]> {
    const results: T[] = [];
    
    for (const task of tasks) {
      try {
        const result = await this.execute(task);
        results.push(result);
      } catch (error) {
        console.error('Task execution failed:', error);
        throw error;
      }
    }
    
    return results;
  }

  /**
   * Выполнение задач параллельно с ограничением concurrency
   */
  async executeParallel<T>(tasks: (() => Promise<T>)[], options?: ThreadPoolOptions): Promise<T[]> {
    const maxConcurrency = options?.maxConcurrency || this.maxConcurrency;
    const timeout = options?.timeout || this.timeout;
    
    const results: T[] = [];
    const executing: Promise<void>[] = [];
    
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      
      const promise = this.execute(task)
        .then(result => {
          results[i] = result;
        })
        .catch(error => {
          console.error(`Task ${i} execution failed:`, error);
          throw error;
        });
      
      executing.push(promise);
      
      // Ограничиваем количество параллельных задач
      if (executing.length >= maxConcurrency) {
        await Promise.race(executing);
        // Удаляем завершенные задачи
        for (let j = executing.length - 1; j >= 0; j--) {
          if (await Promise.race([executing[j].then(() => true), Promise.resolve(false)])) {
            executing.splice(j, 1);
          }
        }
      }
    }
    
    // Ждем завершения всех оставшихся задач
    await Promise.all(executing);
    
    return results;
  }

  /**
   * Выполнение задач с retry логикой
   */
  async executeWithRetry<T>(
    task: () => Promise<T>, 
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.execute(task);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          console.warn(`Task failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        }
      }
    }
    
    throw lastError!;
  }
}
