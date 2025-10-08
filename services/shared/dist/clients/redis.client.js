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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisClient = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
let RedisClient = class RedisClient {
    REDIS_SERVICE_URL = process.env.REDIS_SERVICE_URL || 'http://redis-service:3009';
    axiosInstance;
    constructor() {
        this.axiosInstance = axios_1.default.create({
            timeout: 10000,
            maxRedirects: 3,
        });
    }
    async set(key, value, ttl) {
        try {
            const response = await this.axiosInstance.post(`${this.REDIS_SERVICE_URL}/api/redis/set`, {
                key,
                value,
                ttl
            });
            return response.data.success;
        }
        catch (error) {
            console.error('Redis set error:', error);
            return false;
        }
    }
    async get(key) {
        try {
            const response = await this.axiosInstance.get(`${this.REDIS_SERVICE_URL}/api/redis/get/${encodeURIComponent(key)}`);
            return response.data.data;
        }
        catch (error) {
            console.error('Redis get error:', error);
            return null;
        }
    }
    async mdelete(keys) {
        try {
            const response = await this.axiosInstance.post(`${this.REDIS_SERVICE_URL}/api/redis/mdelete`, { keys });
            return response.data.deleted;
        }
        catch (error) {
            console.error('Redis mdelete error:', error);
            return 0;
        }
    }
    async keys(pattern) {
        try {
            const response = await this.axiosInstance.get(`${this.REDIS_SERVICE_URL}/api/redis/keys/${encodeURIComponent(pattern)}`);
            return response.data.keys;
        }
        catch (error) {
            console.error('Redis keys error:', error);
            return [];
        }
    }
    async clearPattern(pattern) {
        try {
            const response = await this.axiosInstance.delete(`${this.REDIS_SERVICE_URL}/api/redis/clear-pattern/${encodeURIComponent(pattern)}`);
            return response.data.deleted;
        }
        catch (error) {
            console.error('Redis clearPattern error:', error);
            return 0;
        }
    }
};
exports.RedisClient = RedisClient;
exports.RedisClient = RedisClient = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], RedisClient);
//# sourceMappingURL=redis.client.js.map