import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisClientType } from 'redis';
/**
 * Redis Service для кэширования данных
 *
 * Обеспечивает:
 * - Кэширование часто запрашиваемых данных
 * - TTL для автоматического истечения
 * - Сериализация/десериализация JSON
 * - Мониторинг производительности
 */
export declare class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private client;
    private readonly defaultTTL;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    /**
     * Подключение к Redis
     */
    private connect;
    /**
     * Отключение от Redis
     */
    private disconnect;
    /**
     * Получить значение из кэша
     */
    get<T>(key: string): Promise<T | null>;
    /**
     * Сохранить значение в кэш
     */
    set<T>(key: string, value: T, ttl?: number): Promise<boolean>;
    /**
     * Удалить значение из кэша
     */
    delete(key: string): Promise<boolean>;
    /**
     * Проверить существование ключа
     */
    exists(key: string): Promise<boolean>;
    /**
     * Получить TTL ключа
     */
    getTTL(key: string): Promise<number>;
    /**
     * Установить TTL для ключа
     */
    expire(key: string, ttl: number): Promise<boolean>;
    /**
     * Получить несколько значений
     */
    mget<T>(keys: string[]): Promise<(T | null)[]>;
    /**
     * Сохранить несколько значений
     */
    mset<T>(keyValuePairs: Record<string, T>, ttl?: number): Promise<boolean>;
    /**
     * Удалить несколько ключей
     */
    mdelete(keys: string[]): Promise<number>;
    /**
     * Получить все ключи по паттерну
     */
    keys(pattern: string): Promise<string[]>;
    /**
     * Очистить все ключи по паттерну
     */
    clearPattern(pattern: string): Promise<number>;
    /**
     * Получить информацию о Redis
     */
    getInfo(): Promise<{
        connected: boolean;
        memory: any;
        stats: any;
    }>;
    /**
     * Парсинг информации Redis
     */
    private parseInfo;
    /**
     * Проверка состояния соединения
     */
    isConnected(): boolean;
    /**
     * Получить клиент Redis (для продвинутых операций)
     */
    getClient(): RedisClientType | null;
    /**
     * Удалить ключ (алиас для delete)
     */
    del(key: string): Promise<boolean>;
    /**
     * Получить несколько значений (алиас для mget)
     */
    getMultiple<T>(keys: string[]): Promise<(T | null)[]>;
    /**
     * Сохранить несколько значений (алиас для mset)
     */
    setMultiple<T>(keyValuePairs: Record<string, T>, ttl?: number): Promise<boolean>;
    /**
     * Получить значение из хэша
     */
    getHash(key: string, field: string): Promise<string | null>;
    /**
     * Установить значение в хэш
     */
    setHash(key: string, field: string, value: string): Promise<boolean>;
    /**
     * Получить все поля хэша
     */
    getAllHash(key: string): Promise<Record<string, string>>;
    /**
     * Установить все поля хэша
     */
    setAllHash(key: string, hash: Record<string, string>): Promise<boolean>;
    /**
     * Удалить поле из хэша
     */
    deleteHash(key: string, field: string): Promise<boolean>;
    /**
     * Увеличить значение
     */
    increment(key: string, amount?: number): Promise<number>;
    /**
     * Уменьшить значение
     */
    decrement(key: string, amount?: number): Promise<number>;
    /**
     * Получить ключи по паттерну (алиас для keys)
     */
    getKeys(pattern: string): Promise<string[]>;
    /**
     * Удалить несколько ключей (алиас для mdelete)
     */
    deleteKeys(keys: string[]): Promise<number>;
    /**
     * Установить TTL (алиас для expire)
     */
    setTTL(key: string, ttl: number): Promise<boolean>;
    /**
     * Очистить все ключи
     */
    clear(): Promise<boolean>;
    /**
     * Ping Redis
     */
    ping(): Promise<string>;
}
//# sourceMappingURL=redis.service.d.ts.map