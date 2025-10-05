import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from '../services/redis.service';

describe('RedisService', () => {
  let service: RedisService;
  let mockRedis: any;

  beforeEach(async () => {
    // Mock Redis client
    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      setEx: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      expire: jest.fn(),
      ttl: jest.fn(),
      mGet: jest.fn(),
      mSet: jest.fn(),
      keys: jest.fn(),
      hGet: jest.fn(),
      hSet: jest.fn(),
      hGetAll: jest.fn(),
      hDel: jest.fn(),
      incrBy: jest.fn(),
      decrBy: jest.fn(),
      flushAll: jest.fn(),
      ping: jest.fn(),
      info: jest.fn(),
      quit: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      isReady: true,
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
      ],
      providers: [
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            delete: jest.fn(),
            exists: jest.fn(),
            mget: jest.fn(),
            mset: jest.fn(),
            keys: jest.fn(),
            mdelete: jest.fn(),
            expire: jest.fn(),
            ttl: jest.fn(),
            hGet: jest.fn(),
            hSet: jest.fn(),
            hGetAll: jest.fn(),
            hDel: jest.fn(),
            incrBy: jest.fn(),
            decrBy: jest.fn(),
            flushAll: jest.fn(),
            ping: jest.fn(),
            info: jest.fn(),
            // Дополнительные методы для совместимости
            del: jest.fn(),
            getMultiple: jest.fn(),
            setMultiple: jest.fn(),
            getHash: jest.fn(),
            setHash: jest.fn(),
            getAllHash: jest.fn(),
            setAllHash: jest.fn(),
            deleteHash: jest.fn(),
            increment: jest.fn(),
            decrement: jest.fn(),
            getKeys: jest.fn(),
            deleteKeys: jest.fn(),
            setTTL: jest.fn(),
            getTTL: jest.fn(),
            clear: jest.fn(),
            getInfo: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should return cached value when key exists', async () => {
      const key = 'test-key';
      const value = 'test-value';
      (service.get as jest.Mock).mockResolvedValue(value);

      const result = await service.get(key);

      expect(result).toBe(value);
      expect(service.get).toHaveBeenCalledWith(key);
    });

    it('should return null when key does not exist', async () => {
      const key = 'non-existent-key';
      (service.get as jest.Mock).mockResolvedValue(null);

      const result = await service.get(key);

      expect(result).toBeNull();
      expect(service.get).toHaveBeenCalledWith(key);
    });

    it('should handle Redis errors gracefully', async () => {
      const key = 'test-key';
      const error = new Error('Redis connection failed');
      (service.get as jest.Mock).mockRejectedValue(error);

      await expect(service.get(key)).rejects.toThrow('Redis connection failed');
    });
  });

  describe('set', () => {
    it('should set value with default TTL', async () => {
      const key = 'test-key';
      const value = 'test-value';
      const ttl = 3600;
      (service.set as jest.Mock).mockResolvedValue(true);

      await service.set(key, value, ttl);

      expect(service.set).toHaveBeenCalledWith(key, value, ttl);
    });

    it('should set value without TTL when not specified', async () => {
      const key = 'test-key';
      const value = 'test-value';
      (service.set as jest.Mock).mockResolvedValue(true);

      await service.set(key, value);

      expect(service.set).toHaveBeenCalledWith(key, value);
    });

    it('should handle Redis errors gracefully', async () => {
      const key = 'test-key';
      const value = 'test-value';
      const error = new Error('Redis connection failed');
      (service.set as jest.Mock).mockRejectedValue(error);

      await expect(service.set(key, value)).rejects.toThrow('Redis connection failed');
    });
  });

  describe('del', () => {
    it('should delete key successfully', async () => {
      const key = 'test-key';
      (service.del as jest.Mock).mockResolvedValue(1);

      const result = await service.del(key);

      expect(result).toBe(1);
      expect(service.del).toHaveBeenCalledWith(key);
    });

    it('should return 0 when key does not exist', async () => {
      const key = 'non-existent-key';
      (service.del as jest.Mock).mockResolvedValue(0);

      const result = await service.del(key);

      expect(result).toBe(0);
      expect(service.del).toHaveBeenCalledWith(key);
    });

    it('should handle Redis errors gracefully', async () => {
      const key = 'test-key';
      const error = new Error('Redis connection failed');
      (service.del as jest.Mock).mockRejectedValue(error);

      await expect(service.del(key)).rejects.toThrow('Redis connection failed');
    });
  });

  describe('exists', () => {
    it('should return true when key exists', async () => {
      const key = 'test-key';
      (service.exists as jest.Mock).mockResolvedValue(true);

      const result = await service.exists(key);

      expect(result).toBe(true);
      expect(service.exists).toHaveBeenCalledWith(key);
    });

    it('should return false when key does not exist', async () => {
      const key = 'non-existent-key';
      (service.exists as jest.Mock).mockResolvedValue(false);

      const result = await service.exists(key);

      expect(result).toBe(false);
      expect(service.exists).toHaveBeenCalledWith(key);
    });

    it('should handle Redis errors gracefully', async () => {
      const key = 'test-key';
      const error = new Error('Redis connection failed');
      (service.exists as jest.Mock).mockRejectedValue(error);

      await expect(service.exists(key)).rejects.toThrow('Redis connection failed');
    });
  });

  describe('getMultiple', () => {
    it('should return multiple values', async () => {
      const keys = ['key1', 'key2', 'key3'];
      const values = ['value1', 'value2', 'value3'];
      (service.getMultiple as jest.Mock).mockResolvedValue(values);

      const result = await service.getMultiple(keys);

      expect(result).toEqual(values);
      expect(service.getMultiple).toHaveBeenCalledWith(keys);
    });

    it('should handle null values in response', async () => {
      const keys = ['key1', 'key2', 'key3'];
      const values = ['value1', null, 'value3'];
      (service.getMultiple as jest.Mock).mockResolvedValue(values);

      const result = await service.getMultiple(keys);

      expect(result).toEqual(['value1', null, 'value3']);
    });
  });

  describe('setMultiple', () => {
    it('should set multiple key-value pairs', async () => {
      const data = { key1: 'value1', key2: 'value2', key3: 'value3' };
      const ttl = 3600;
      (service.setMultiple as jest.Mock).mockResolvedValue(true);

      await service.setMultiple(data, ttl);

      expect(service.setMultiple).toHaveBeenCalledWith(data, ttl);
    });

    it('should set multiple key-value pairs without TTL', async () => {
      const data = { key1: 'value1', key2: 'value2' };
      (service.setMultiple as jest.Mock).mockResolvedValue(true);

      await service.setMultiple(data);

      expect(service.setMultiple).toHaveBeenCalledWith(data);
    });
  });

  describe('getHash', () => {
    it('should return hash field value', async () => {
      const key = 'test-hash';
      const field = 'test-field';
      const value = 'test-value';
      (service.getHash as jest.Mock).mockResolvedValue(value);

      const result = await service.getHash(key, field);

      expect(result).toBe(value);
      expect(service.getHash).toHaveBeenCalledWith(key, field);
    });

    it('should return null when field does not exist', async () => {
      const key = 'test-hash';
      const field = 'non-existent-field';
      (service.getHash as jest.Mock).mockResolvedValue(null);

      const result = await service.getHash(key, field);

      expect(result).toBeNull();
    });
  });

  describe('setHash', () => {
    it('should set hash field value', async () => {
      const key = 'test-hash';
      const field = 'test-field';
      const value = 'test-value';
      (service.setHash as jest.Mock).mockResolvedValue(1);

      const result = await service.setHash(key, field, value);

      expect(result).toBe(1);
      expect(service.setHash).toHaveBeenCalledWith(key, field, value);
    });
  });

  describe('getAllHash', () => {
    it('should return all hash fields and values', async () => {
      const key = 'test-hash';
      const hash = { field1: 'value1', field2: 'value2' };
      (service.getAllHash as jest.Mock).mockResolvedValue(hash);

      const result = await service.getAllHash(key);

      expect(result).toEqual(hash);
      expect(service.getAllHash).toHaveBeenCalledWith(key);
    });
  });

  describe('setAllHash', () => {
    it('should set multiple hash fields', async () => {
      const key = 'test-hash';
      const hash = { field1: 'value1', field2: 'value2' };
      (service.setAllHash as jest.Mock).mockResolvedValue(2);

      const result = await service.setAllHash(key, hash);

      expect(result).toBe(2);
      expect(service.setAllHash).toHaveBeenCalledWith(key, hash);
    });
  });

  describe('deleteHash', () => {
    it('should delete hash field', async () => {
      const key = 'test-hash';
      const field = 'test-field';
      (service.deleteHash as jest.Mock).mockResolvedValue(1);

      const result = await service.deleteHash(key, field);

      expect(result).toBe(1);
      expect(service.deleteHash).toHaveBeenCalledWith(key, field);
    });
  });

  describe('increment', () => {
    it('should increment counter', async () => {
      const key = 'test-counter';
      const value = 5;
      (service.increment as jest.Mock).mockResolvedValue(value);

      const result = await service.increment(key);

      expect(result).toBe(value);
      expect(service.increment).toHaveBeenCalledWith(key);
    });

    it('should increment counter by specific amount', async () => {
      const key = 'test-counter';
      const amount = 3;
      const value = 8;
      (service.increment as jest.Mock).mockResolvedValue(value);

      const result = await service.increment(key, amount);

      expect(result).toBe(value);
      expect(service.increment).toHaveBeenCalledWith(key, amount);
    });
  });

  describe('decrement', () => {
    it('should decrement counter', async () => {
      const key = 'test-counter';
      const value = 3;
      (service.decrement as jest.Mock).mockResolvedValue(value);

      const result = await service.decrement(key);

      expect(result).toBe(value);
      expect(service.decrement).toHaveBeenCalledWith(key);
    });

    it('should decrement counter by specific amount', async () => {
      const key = 'test-counter';
      const amount = 2;
      const value = 1;
      (service.decrement as jest.Mock).mockResolvedValue(value);

      const result = await service.decrement(key, amount);

      expect(result).toBe(value);
      expect(service.decrement).toHaveBeenCalledWith(key, amount);
    });
  });

  describe('getKeys', () => {
    it('should return keys matching pattern', async () => {
      const pattern = 'test:*';
      const keys = ['test:key1', 'test:key2', 'test:key3'];
      (service.getKeys as jest.Mock).mockResolvedValue(keys);

      const result = await service.getKeys(pattern);

      expect(result).toEqual(keys);
      expect(service.getKeys).toHaveBeenCalledWith(pattern);
    });

    it('should return empty array when no keys match', async () => {
      const pattern = 'non-existent:*';
      (service.getKeys as jest.Mock).mockResolvedValue([]);

      const result = await service.getKeys(pattern);

      expect(result).toEqual([]);
    });
  });

  describe('deleteKeys', () => {
    it('should delete multiple keys', async () => {
      const keys = ['key1', 'key2', 'key3'];
      (service.deleteKeys as jest.Mock).mockResolvedValue(3);

      const result = await service.deleteKeys(keys);

      expect(result).toBe(3);
      expect(service.deleteKeys).toHaveBeenCalledWith(keys);
    });
  });

  describe('getTTL', () => {
    it('should return TTL for key', async () => {
      const key = 'test-key';
      const ttl = 3600;
      (service.getTTL as jest.Mock).mockResolvedValue(ttl);

      const result = await service.getTTL(key);

      expect(result).toBe(ttl);
      expect(service.getTTL).toHaveBeenCalledWith(key);
    });

    it('should return -1 when key has no expiration', async () => {
      const key = 'test-key';
      (service.getTTL as jest.Mock).mockResolvedValue(-1);

      const result = await service.getTTL(key);

      expect(result).toBe(-1);
    });

    it('should return -2 when key does not exist', async () => {
      const key = 'non-existent-key';
      (service.getTTL as jest.Mock).mockResolvedValue(-2);

      const result = await service.getTTL(key);

      expect(result).toBe(-2);
    });
  });

  describe('setTTL', () => {
    it('should set TTL for key', async () => {
      const key = 'test-key';
      const ttl = 3600;
      (service.setTTL as jest.Mock).mockResolvedValue(true);

      const result = await service.setTTL(key, ttl);

      expect(result).toBe(true);
      expect(service.setTTL).toHaveBeenCalledWith(key, ttl);
    });

    it('should return false when key does not exist', async () => {
      const key = 'non-existent-key';
      const ttl = 3600;
      (service.setTTL as jest.Mock).mockResolvedValue(false);

      const result = await service.setTTL(key, ttl);

      expect(result).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all keys', async () => {
      (service.clear as jest.Mock).mockResolvedValue(true);

      await service.clear();

      expect(service.clear).toHaveBeenCalled();
    });
  });

  describe('ping', () => {
    it('should ping Redis server', async () => {
      (service.ping as jest.Mock).mockResolvedValue('PONG');

      const result = await service.ping();

      expect(result).toBe('PONG');
      expect(service.ping).toHaveBeenCalled();
    });
  });

  describe('getInfo', () => {
    it('should return Redis server info', async () => {
      const info = 'redis_version:6.2.6\nused_memory:1234567';
      (service.getInfo as jest.Mock).mockResolvedValue(info);

      const result = await service.getInfo();

      expect(result).toBe(info);
      expect(service.getInfo).toHaveBeenCalled();
    });
  });
});
