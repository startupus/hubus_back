"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisClient = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
let RedisClient = class RedisClient {
    REDIS_SERVICE_URL = process.env.REDIS_SERVICE_URL || 'http://redis-service:3009';
    axiosInstance = null;
    getAxiosInstance() {
        if (!this.axiosInstance) {
            this.axiosInstance = axios_1.default.create({
                timeout: 10000,
                maxRedirects: 3,
            });
        }
        return this.axiosInstance;
    }
    async set(key, value, ttl) {
        try {
            // Проверяем доступность redis-service
            const response = await this.getAxiosInstance().post(`${this.REDIS_SERVICE_URL}/api/redis/set`, {
                key,
                value,
                ttl
            }, {
                timeout: 5000 // 5 секунд таймаут
            });
            return response.data.success;
        }
        catch (error) {
            console.warn('Redis set error (fallback to false):', error.message);
            return false; // Fallback к false вместо ошибки
        }
    }
    async get(key) {
        try {
            const response = await this.getAxiosInstance().get(`${this.REDIS_SERVICE_URL}/api/redis/get/${encodeURIComponent(key)}`, {
                timeout: 5000
            });
            return response.data.data;
        }
        catch (error) {
            console.warn('Redis get error (fallback to null):', error.message);
            return null;
        }
    }
    async mdelete(keys) {
        try {
            const response = await this.getAxiosInstance().post(`${this.REDIS_SERVICE_URL}/api/redis/mdelete`, { keys }, {
                timeout: 5000
            });
            return response.data.deleted;
        }
        catch (error) {
            console.warn('Redis mdelete error (fallback to 0):', error.message);
            return 0;
        }
    }
    async keys(pattern) {
        try {
            const response = await this.getAxiosInstance().get(`${this.REDIS_SERVICE_URL}/api/redis/keys/${encodeURIComponent(pattern)}`, {
                timeout: 5000
            });
            return response.data.keys;
        }
        catch (error) {
            console.warn('Redis keys error (fallback to []):', error.message);
            return [];
        }
    }
    async clearPattern(pattern) {
        try {
            const response = await this.getAxiosInstance().delete(`${this.REDIS_SERVICE_URL}/api/redis/clear-pattern/${encodeURIComponent(pattern)}`, {
                timeout: 5000
            });
            return response.data.deleted;
        }
        catch (error) {
            console.warn('Redis clearPattern error (fallback to 0):', error.message);
            return 0;
        }
    }
};
exports.RedisClient = RedisClient;
exports.RedisClient = RedisClient = __decorate([
    (0, common_1.Injectable)()
], RedisClient);
//# sourceMappingURL=redis.client.js.map