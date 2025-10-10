export interface RedisSetRequest {
    key: string;
    value: any;
    ttl?: number;
}
export interface RedisGetRequest {
    key: string;
}
export interface RedisDeleteRequest {
    keys: string[];
}
export interface RedisKeysRequest {
    pattern: string;
}
export interface RedisClearPatternRequest {
    pattern: string;
}
export declare class RedisClient {
    private readonly REDIS_SERVICE_URL;
    private readonly axiosInstance;
    constructor();
    set(key: string, value: any, ttl?: number): Promise<boolean>;
    get<T = any>(key: string): Promise<T | null>;
    mdelete(keys: string[]): Promise<number>;
    keys(pattern: string): Promise<string[]>;
    clearPattern(pattern: string): Promise<number>;
}
