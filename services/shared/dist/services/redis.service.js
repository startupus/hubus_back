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
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const redis_1 = require("redis");
const logger_util_1 = require("../utils/logger.util");
/**
 * Redis Service для кэширования данных
 *
 * Обеспечивает:
 * - Кэширование часто запрашиваемых данных
 * - TTL для автоматического истечения
 * - Сериализация/десериализация JSON
 * - Мониторинг производительности
 */
let RedisService = RedisService_1 = class RedisService {
    configService;
    logger = new common_1.Logger(RedisService_1.name);
    client = null;
    defaultTTL = 300; // 5 минут по умолчанию
    constructor(configService) {
        this.configService = configService;
    }
    async onModuleInit() {
        await this.connect();
    }
    async onModuleDestroy() {
        await this.disconnect();
    }
    /**
     * Подключение к Redis
     */
    async connect() {
        try {
            const redisUrl = this.configService.get('REDIS_URL');
            if (!redisUrl) {
                throw new Error('REDIS_URL is not configured');
            }
            this.client = (0, redis_1.createClient)({
                url: redisUrl,
                socket: {
                    reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
                }
            });
            this.client.on('error', (err) => {
                logger_util_1.LoggerUtil.error('shared', 'Redis client error', err);
            });
            this.client.on('connect', () => {
                logger_util_1.LoggerUtil.info('shared', 'Redis connected successfully', { url: redisUrl });
            });
            this.client.on('reconnect', () => {
                logger_util_1.LoggerUtil.info('shared', 'Redis reconnected');
            });
            await this.client.connect();
        }
        catch (error) {
            logger_util_1.LoggerUtil.error('shared', 'Failed to connect to Redis', error);
            throw error;
        }
    }
    /**
     * Отключение от Redis
     */
    async disconnect() {
        try {
            if (this.client) {
                await this.client.quit();
                this.client = null;
            }
            logger_util_1.LoggerUtil.info('shared', 'Redis disconnected successfully');
        }
        catch (error) {
            logger_util_1.LoggerUtil.error('shared', 'Failed to disconnect from Redis', error);
        }
    }
    /**
     * Получить значение из кэша
     */
    async get(key) {
        if (!this.client) {
            logger_util_1.LoggerUtil.warn('shared', 'Redis client not available');
            return null;
        }
        try {
            const value = await this.client.get(key);
            if (!value) {
                logger_util_1.LoggerUtil.debug('shared', 'Cache miss', { key });
                return null;
            }
            const parsed = JSON.parse(value);
            logger_util_1.LoggerUtil.debug('shared', 'Cache hit', { key });
            return parsed;
        }
        catch (error) {
            logger_util_1.LoggerUtil.error('shared', 'Failed to get from cache', error, { key });
            return null;
        }
    }
    /**
     * Сохранить значение в кэш
     */
    async set(key, value, ttl) {
        if (!this.client) {
            logger_util_1.LoggerUtil.warn('shared', 'Redis client not available');
            return false;
        }
        try {
            const serialized = JSON.stringify(value);
            const actualTTL = ttl || this.defaultTTL;
            await this.client.setEx(key, actualTTL, serialized);
            logger_util_1.LoggerUtil.debug('shared', 'Cache set', { key, ttl: actualTTL });
            return true;
        }
        catch (error) {
            logger_util_1.LoggerUtil.error('shared', 'Failed to set cache', error, { key });
            return false;
        }
    }
    /**
     * Удалить значение из кэша
     */
    async delete(key) {
        if (!this.client) {
            logger_util_1.LoggerUtil.warn('shared', 'Redis client not available');
            return false;
        }
        try {
            const result = await this.client.del(key);
            logger_util_1.LoggerUtil.debug('shared', 'Cache delete', { key, deleted: result > 0 });
            return result > 0;
        }
        catch (error) {
            logger_util_1.LoggerUtil.error('shared', 'Failed to delete from cache', error, { key });
            return false;
        }
    }
    /**
     * Проверить существование ключа
     */
    async exists(key) {
        if (!this.client) {
            return false;
        }
        try {
            const result = await this.client.exists(key);
            return result === 1;
        }
        catch (error) {
            logger_util_1.LoggerUtil.error('shared', 'Failed to check key existence', error, { key });
            return false;
        }
    }
    /**
     * Получить TTL ключа
     */
    async getTTL(key) {
        if (!this.client) {
            return -1;
        }
        try {
            return await this.client.ttl(key);
        }
        catch (error) {
            logger_util_1.LoggerUtil.error('shared', 'Failed to get TTL', error, { key });
            return -1;
        }
    }
    /**
     * Установить TTL для ключа
     */
    async expire(key, ttl) {
        if (!this.client) {
            return false;
        }
        try {
            const result = await this.client.expire(key, ttl);
            logger_util_1.LoggerUtil.debug('shared', 'TTL set', { key, ttl, success: result });
            return result;
        }
        catch (error) {
            logger_util_1.LoggerUtil.error('shared', 'Failed to set TTL', error, { key, ttl });
            return false;
        }
    }
    /**
     * Получить несколько значений
     */
    async mget(keys) {
        if (!this.client || keys.length === 0) {
            return [];
        }
        try {
            const values = await this.client.mGet(keys);
            return values.map(value => value ? JSON.parse(value) : null);
        }
        catch (error) {
            logger_util_1.LoggerUtil.error('shared', 'Failed to get multiple values', error, { keys });
            return keys.map(() => null);
        }
    }
    /**
     * Сохранить несколько значений
     */
    async mset(keyValuePairs, ttl) {
        if (!this.client || Object.keys(keyValuePairs).length === 0) {
            return false;
        }
        try {
            const serializedPairs = {};
            for (const [key, value] of Object.entries(keyValuePairs)) {
                serializedPairs[key] = JSON.stringify(value);
            }
            await this.client.mSet(serializedPairs);
            // Устанавливаем TTL для всех ключей
            if (ttl) {
                const actualTTL = ttl || this.defaultTTL;
                for (const key of Object.keys(keyValuePairs)) {
                    await this.client.expire(key, actualTTL);
                }
            }
            logger_util_1.LoggerUtil.debug('shared', 'Multiple values set', {
                count: Object.keys(keyValuePairs).length,
                ttl: ttl || this.defaultTTL
            });
            return true;
        }
        catch (error) {
            logger_util_1.LoggerUtil.error('shared', 'Failed to set multiple values', error);
            return false;
        }
    }
    /**
     * Удалить несколько ключей
     */
    async mdelete(keys) {
        if (!this.client || keys.length === 0) {
            return 0;
        }
        try {
            const result = await this.client.del(keys);
            logger_util_1.LoggerUtil.debug('shared', 'Multiple keys deleted', { keys, deleted: result });
            return result;
        }
        catch (error) {
            logger_util_1.LoggerUtil.error('shared', 'Failed to delete multiple keys', error, { keys });
            return 0;
        }
    }
    /**
     * Получить все ключи по паттерну
     */
    async keys(pattern) {
        if (!this.client) {
            return [];
        }
        try {
            const keys = await this.client.keys(pattern);
            logger_util_1.LoggerUtil.debug('shared', 'Keys retrieved', { pattern, count: keys.length });
            return keys;
        }
        catch (error) {
            logger_util_1.LoggerUtil.error('shared', 'Failed to get keys', error, { pattern });
            return [];
        }
    }
    /**
     * Очистить все ключи по паттерну
     */
    async clearPattern(pattern) {
        if (!this.client) {
            return 0;
        }
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length === 0) {
                return 0;
            }
            const deleted = await this.client.del(keys);
            logger_util_1.LoggerUtil.info('shared', 'Pattern cleared', { pattern, deleted });
            return deleted;
        }
        catch (error) {
            logger_util_1.LoggerUtil.error('shared', 'Failed to clear pattern', error, { pattern });
            return 0;
        }
    }
    /**
     * Получить информацию о Redis
     */
    async getInfo() {
        if (!this.client) {
            try {
                const info = await this.client.info();
                const memory = await this.client.info('memory');
                const stats = await this.client.info('stats');
                return {
                    connected: true,
                    memory: this.parseInfo(memory),
                    stats: this.parseInfo(stats)
                };
            }
            catch (error) {
                logger_util_1.LoggerUtil.error('shared', 'Failed to get Redis info', error);
            }
        }
        return {
            connected: false,
            memory: {},
            stats: {}
        };
    }
    /**
     * Парсинг информации Redis
     */
    parseInfo(info) {
        const result = {};
        const lines = info.split('\r\n');
        for (const line of lines) {
            if (line.includes(':')) {
                const [key, value] = line.split(':');
                result[key] = isNaN(Number(value)) ? value : Number(value);
            }
        }
        return result;
    }
    /**
     * Проверка состояния соединения
     */
    isConnected() {
        return this.client !== null && this.client.isReady;
    }
    /**
     * Получить клиент Redis (для продвинутых операций)
     */
    getClient() {
        return this.client;
    }
    // Дополнительные методы для совместимости с тестами
    /**
     * Удалить ключ (алиас для delete)
     */
    async del(key) {
        return this.delete(key);
    }
    /**
     * Получить несколько значений (алиас для mget)
     */
    async getMultiple(keys) {
        return this.mget(keys);
    }
    /**
     * Сохранить несколько значений (алиас для mset)
     */
    async setMultiple(keyValuePairs, ttl) {
        return this.mset(keyValuePairs, ttl);
    }
    /**
     * Получить значение из хэша
     */
    async getHash(key, field) {
        if (!this.client) {
            return null;
        }
        try {
            return await this.client.hGet(key, field);
        }
        catch (error) {
            logger_util_1.LoggerUtil.error('shared', 'Failed to get hash field', error, { key, field });
            return null;
        }
    }
    /**
     * Установить значение в хэш
     */
    async setHash(key, field, value) {
        if (!this.client) {
            return false;
        }
        try {
            const result = await this.client.hSet(key, field, value);
            return result >= 0;
        }
        catch (error) {
            logger_util_1.LoggerUtil.error('shared', 'Failed to set hash field', error, { key, field });
            return false;
        }
    }
    /**
     * Получить все поля хэша
     */
    async getAllHash(key) {
        if (!this.client) {
            return {};
        }
        try {
            return await this.client.hGetAll(key);
        }
        catch (error) {
            logger_util_1.LoggerUtil.error('shared', 'Failed to get all hash fields', error, { key });
            return {};
        }
    }
    /**
     * Установить все поля хэша
     */
    async setAllHash(key, hash) {
        if (!this.client) {
            return false;
        }
        try {
            await this.client.hSet(key, hash);
            return true;
        }
        catch (error) {
            logger_util_1.LoggerUtil.error('shared', 'Failed to set all hash fields', error, { key });
            return false;
        }
    }
    /**
     * Удалить поле из хэша
     */
    async deleteHash(key, field) {
        if (!this.client) {
            return false;
        }
        try {
            const result = await this.client.hDel(key, field);
            return result > 0;
        }
        catch (error) {
            logger_util_1.LoggerUtil.error('shared', 'Failed to delete hash field', error, { key, field });
            return false;
        }
    }
    /**
     * Увеличить значение
     */
    async increment(key, amount = 1) {
        if (!this.client) {
            return 0;
        }
        try {
            return await this.client.incrBy(key, amount);
        }
        catch (error) {
            logger_util_1.LoggerUtil.error('shared', 'Failed to increment value', error, { key, amount });
            return 0;
        }
    }
    /**
     * Уменьшить значение
     */
    async decrement(key, amount = 1) {
        if (!this.client) {
            return 0;
        }
        try {
            return await this.client.decrBy(key, amount);
        }
        catch (error) {
            logger_util_1.LoggerUtil.error('shared', 'Failed to decrement value', error, { key, amount });
            return 0;
        }
    }
    /**
     * Получить ключи по паттерну (алиас для keys)
     */
    async getKeys(pattern) {
        return this.keys(pattern);
    }
    /**
     * Удалить несколько ключей (алиас для mdelete)
     */
    async deleteKeys(keys) {
        return this.mdelete(keys);
    }
    /**
     * Установить TTL (алиас для expire)
     */
    async setTTL(key, ttl) {
        return this.expire(key, ttl);
    }
    /**
     * Очистить все ключи
     */
    async clear() {
        if (!this.client) {
            return false;
        }
        try {
            await this.client.flushAll();
            return true;
        }
        catch (error) {
            logger_util_1.LoggerUtil.error('shared', 'Failed to clear all keys', error);
            return false;
        }
    }
    /**
     * Ping Redis
     */
    async ping() {
        if (!this.client) {
            throw new Error('Redis connection failed');
        }
        try {
            return await this.client.ping();
        }
        catch (error) {
            logger_util_1.LoggerUtil.error('shared', 'Failed to ping Redis', error);
            throw new Error('Redis connection failed');
        }
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map