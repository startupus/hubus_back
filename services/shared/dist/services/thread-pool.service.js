"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreadPoolService = void 0;
const common_1 = require("@nestjs/common");
let ThreadPoolService = class ThreadPoolService {
    maxConcurrency;
    timeout;
    constructor() {
        this.maxConcurrency = 10; // По умолчанию 10 параллельных задач
        this.timeout = 30000; // 30 секунд таймаут
    }
    /**
     * Выполнение одной задачи
     */
    async execute(task) {
        return await Promise.race([
            task(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Task timeout')), this.timeout))
        ]);
    }
    /**
     * Выполнение пакета задач последовательно
     */
    async executeBatch(tasks) {
        const results = [];
        for (const task of tasks) {
            try {
                const result = await this.execute(task);
                results.push(result);
            }
            catch (error) {
                console.error('Task execution failed:', error);
                throw error;
            }
        }
        return results;
    }
    /**
     * Выполнение задач параллельно с ограничением concurrency
     */
    async executeParallel(tasks, options) {
        const maxConcurrency = options?.maxConcurrency || this.maxConcurrency;
        const timeout = options?.timeout || this.timeout;
        const results = [];
        const executing = [];
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
    async executeWithRetry(task, maxRetries = 3, delay = 1000) {
        let lastError;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await this.execute(task);
            }
            catch (error) {
                lastError = error;
                if (attempt < maxRetries) {
                    console.warn(`Task failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= 2; // Exponential backoff
                }
            }
        }
        throw lastError;
    }
};
exports.ThreadPoolService = ThreadPoolService;
exports.ThreadPoolService = ThreadPoolService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], ThreadPoolService);
//# sourceMappingURL=thread-pool.service.js.map