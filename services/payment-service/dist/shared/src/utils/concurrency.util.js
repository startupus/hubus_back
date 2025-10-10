"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Semaphore = exports.Mutex = exports.ResourcePool = exports.ConcurrentCache = exports.ConcurrentQueue = exports.ConcurrentMap = exports.AtomicCounter = void 0;
class AtomicCounter {
    constructor(initialValue = 0) {
        this.value = 0;
        this.lock = new Int32Array(new SharedArrayBuffer(4));
        this.value = initialValue;
    }
    increment() {
        return Atomics.add(this.lock, 0, 1) + 1;
    }
    decrement() {
        return Atomics.sub(this.lock, 0, 1) - 1;
    }
    get() {
        return Atomics.load(this.lock, 0);
    }
    set(value) {
        Atomics.store(this.lock, 0, value);
    }
    compareAndSet(expected, update) {
        return Atomics.compareExchange(this.lock, 0, expected, update) === expected;
    }
}
exports.AtomicCounter = AtomicCounter;
class ConcurrentMap {
    constructor() {
        this.map = new Map();
        this.locks = new Map();
        this.globalLock = new Int32Array(new SharedArrayBuffer(4));
    }
    get(key) {
        const keyLock = this.getKeyLock(key);
        Atomics.wait(keyLock, 0, 0);
        try {
            return this.map.get(key);
        }
        finally {
            Atomics.notify(keyLock, 0, 1);
        }
    }
    set(key, value) {
        const keyLock = this.getKeyLock(key);
        try {
            while (!Atomics.compareExchange(keyLock, 0, 0, 1)) {
                Atomics.wait(keyLock, 0, 1);
            }
            this.map.set(key, value);
        }
        finally {
            Atomics.store(keyLock, 0, 0);
            Atomics.notify(keyLock, 0, 1);
        }
    }
    delete(key) {
        const keyLock = this.getKeyLock(key);
        try {
            while (!Atomics.compareExchange(keyLock, 0, 0, 1)) {
                Atomics.wait(keyLock, 0, 1);
            }
            return this.map.delete(key);
        }
        finally {
            Atomics.store(keyLock, 0, 0);
            Atomics.notify(keyLock, 0, 1);
        }
    }
    has(key) {
        const keyLock = this.getKeyLock(key);
        Atomics.wait(keyLock, 0, 0);
        try {
            return this.map.has(key);
        }
        finally {
            Atomics.notify(keyLock, 0, 1);
        }
    }
    keys() {
        while (!Atomics.compareExchange(this.globalLock, 0, 0, 1)) {
            Atomics.wait(this.globalLock, 0, 1);
        }
        try {
            return Array.from(this.map.keys());
        }
        finally {
            Atomics.store(this.globalLock, 0, 0);
            Atomics.notify(this.globalLock, 0, 1);
        }
    }
    size() {
        while (!Atomics.compareExchange(this.globalLock, 0, 0, 1)) {
            Atomics.wait(this.globalLock, 0, 1);
        }
        try {
            return this.map.size;
        }
        finally {
            Atomics.store(this.globalLock, 0, 0);
            Atomics.notify(this.globalLock, 0, 1);
        }
    }
    getKeyLock(key) {
        if (!this.locks.has(key)) {
            this.locks.set(key, new Int32Array(new SharedArrayBuffer(4)));
        }
        return this.locks.get(key);
    }
}
exports.ConcurrentMap = ConcurrentMap;
class ConcurrentQueue {
    constructor(maxSize = Number.MAX_SAFE_INTEGER) {
        this.queue = [];
        this.lock = new Int32Array(new SharedArrayBuffer(4));
        this.notEmpty = new Int32Array(new SharedArrayBuffer(4));
        this.notFull = new Int32Array(new SharedArrayBuffer(4));
        this.maxSize = maxSize;
    }
    enqueue(item) {
        while (!Atomics.compareExchange(this.lock, 0, 0, 1)) {
            Atomics.wait(this.lock, 0, 1);
        }
        try {
            if (this.queue.length >= this.maxSize) {
                return false;
            }
            this.queue.push(item);
            Atomics.store(this.notEmpty, 0, 1);
            Atomics.notify(this.notEmpty, 0, 1);
            return true;
        }
        finally {
            Atomics.store(this.lock, 0, 0);
            Atomics.notify(this.lock, 0, 1);
        }
    }
    dequeue() {
        while (!Atomics.compareExchange(this.lock, 0, 0, 1)) {
            Atomics.wait(this.lock, 0, 1);
        }
        try {
            if (this.queue.length === 0) {
                return undefined;
            }
            const item = this.queue.shift();
            Atomics.store(this.notFull, 0, 1);
            Atomics.notify(this.notFull, 0, 1);
            return item;
        }
        finally {
            Atomics.store(this.lock, 0, 0);
            Atomics.notify(this.lock, 0, 1);
        }
    }
    dequeueBlocking(timeout = 0) {
        const startTime = Date.now();
        while (true) {
            const item = this.dequeue();
            if (item !== undefined) {
                return item;
            }
            if (timeout > 0 && (Date.now() - startTime) > timeout) {
                return undefined;
            }
            Atomics.wait(this.notEmpty, 0, 0);
        }
    }
    isEmpty() {
        while (!Atomics.compareExchange(this.lock, 0, 0, 1)) {
            Atomics.wait(this.lock, 0, 1);
        }
        try {
            return this.queue.length === 0;
        }
        finally {
            Atomics.store(this.lock, 0, 0);
            Atomics.notify(this.lock, 0, 1);
        }
    }
    size() {
        while (!Atomics.compareExchange(this.lock, 0, 0, 1)) {
            Atomics.wait(this.lock, 0, 1);
        }
        try {
            return this.queue.length;
        }
        finally {
            Atomics.store(this.lock, 0, 0);
            Atomics.notify(this.lock, 0, 1);
        }
    }
}
exports.ConcurrentQueue = ConcurrentQueue;
class ConcurrentCache {
    constructor() {
        this.cache = new Map();
        this.lock = new Int32Array(new SharedArrayBuffer(4));
    }
    get(key) {
        while (!Atomics.compareExchange(this.lock, 0, 0, 1)) {
            Atomics.wait(this.lock, 0, 1);
        }
        try {
            const item = this.cache.get(key);
            if (!item) {
                return undefined;
            }
            if (Date.now() > item.expires) {
                this.cache.delete(key);
                return undefined;
            }
            return item.value;
        }
        finally {
            Atomics.store(this.lock, 0, 0);
            Atomics.notify(this.lock, 0, 1);
        }
    }
    set(key, value, ttl = 300000) {
        while (!Atomics.compareExchange(this.lock, 0, 0, 1)) {
            Atomics.wait(this.lock, 0, 1);
        }
        try {
            const expires = Date.now() + ttl;
            this.cache.set(key, { value, expires });
        }
        finally {
            Atomics.store(this.lock, 0, 0);
            Atomics.notify(this.lock, 0, 1);
        }
    }
    delete(key) {
        while (!Atomics.compareExchange(this.lock, 0, 0, 1)) {
            Atomics.wait(this.lock, 0, 1);
        }
        try {
            return this.cache.delete(key);
        }
        finally {
            Atomics.store(this.lock, 0, 0);
            Atomics.notify(this.lock, 0, 1);
        }
    }
    cleanup() {
        while (!Atomics.compareExchange(this.lock, 0, 0, 1)) {
            Atomics.wait(this.lock, 0, 1);
        }
        try {
            const now = Date.now();
            let cleaned = 0;
            for (const [key, item] of this.cache.entries()) {
                if (now > item.expires) {
                    this.cache.delete(key);
                    cleaned++;
                }
            }
            return cleaned;
        }
        finally {
            Atomics.store(this.lock, 0, 0);
            Atomics.notify(this.lock, 0, 1);
        }
    }
}
exports.ConcurrentCache = ConcurrentCache;
class ResourcePool {
    constructor(factory, maxSize = 10, destroyResource) {
        this.factory = factory;
        this.maxSize = maxSize;
        this.destroyResource = destroyResource;
        this.available = [];
        this.inUse = new Set();
        this.lock = new Int32Array(new SharedArrayBuffer(4));
        this.notEmpty = new Int32Array(new SharedArrayBuffer(4));
    }
    acquire() {
        while (!Atomics.compareExchange(this.lock, 0, 0, 1)) {
            Atomics.wait(this.lock, 0, 1);
        }
        try {
            if (this.available.length > 0) {
                const resource = this.available.pop();
                this.inUse.add(resource);
                return resource;
            }
            if (this.inUse.size < this.maxSize) {
                const resource = this.factory();
                this.inUse.add(resource);
                return resource;
            }
            return null;
        }
        finally {
            Atomics.store(this.lock, 0, 0);
            Atomics.notify(this.lock, 0, 1);
        }
    }
    release(resource) {
        while (!Atomics.compareExchange(this.lock, 0, 0, 1)) {
            Atomics.wait(this.lock, 0, 1);
        }
        try {
            if (this.inUse.has(resource)) {
                this.inUse.delete(resource);
                this.available.push(resource);
                Atomics.store(this.notEmpty, 0, 1);
                Atomics.notify(this.notEmpty, 0, 1);
            }
        }
        finally {
            Atomics.store(this.lock, 0, 0);
            Atomics.notify(this.lock, 0, 1);
        }
    }
    acquireBlocking(timeout = 0) {
        const startTime = Date.now();
        while (true) {
            const resource = this.acquire();
            if (resource !== null) {
                return resource;
            }
            if (timeout > 0 && (Date.now() - startTime) > timeout) {
                return null;
            }
            Atomics.wait(this.notEmpty, 0, 0);
        }
    }
    getStats() {
        while (!Atomics.compareExchange(this.lock, 0, 0, 1)) {
            Atomics.wait(this.lock, 0, 1);
        }
        try {
            return {
                available: this.available.length,
                inUse: this.inUse.size,
                total: this.available.length + this.inUse.size
            };
        }
        finally {
            Atomics.store(this.lock, 0, 0);
            Atomics.notify(this.lock, 0, 1);
        }
    }
    destroyPool() {
        while (!Atomics.compareExchange(this.lock, 0, 0, 1)) {
            Atomics.wait(this.lock, 0, 1);
        }
        try {
            const allResources = [...this.available, ...this.inUse];
            if (this.destroyResource) {
                allResources.forEach(resource => this.destroyResource(resource));
            }
            this.available.length = 0;
            this.inUse.clear();
        }
        finally {
            Atomics.store(this.lock, 0, 0);
            Atomics.notify(this.lock, 0, 1);
        }
    }
}
exports.ResourcePool = ResourcePool;
class Mutex {
    constructor() {
        this.locked = false;
        this.waiting = [];
    }
    async lock() {
        return new Promise((resolve) => {
            if (!this.locked) {
                this.locked = true;
                resolve();
            }
            else {
                this.waiting.push(resolve);
            }
        });
    }
    unlock() {
        if (this.waiting.length > 0) {
            const next = this.waiting.shift();
            next();
        }
        else {
            this.locked = false;
        }
    }
    async withLock(fn) {
        await this.lock();
        try {
            return await fn();
        }
        finally {
            this.unlock();
        }
    }
    tryAcquire() {
        if (!this.locked) {
            this.locked = true;
            return true;
        }
        return false;
    }
    async acquire(timeout) {
        if (timeout) {
            return new Promise((resolve) => {
                const timer = setTimeout(() => resolve(false), timeout);
                this.lock().then(() => {
                    clearTimeout(timer);
                    resolve(true);
                });
            });
        }
        await this.lock();
        return true;
    }
    release() {
        this.unlock();
    }
}
exports.Mutex = Mutex;
class Semaphore {
    constructor(permits) {
        this.waiting = [];
        this.permits = permits;
    }
    async acquire() {
        return new Promise((resolve) => {
            if (this.permits > 0) {
                this.permits--;
                resolve();
            }
            else {
                this.waiting.push(resolve);
            }
        });
    }
    release() {
        if (this.waiting.length > 0) {
            const next = this.waiting.shift();
            next();
        }
        else {
            this.permits++;
        }
    }
    async withPermit(fn) {
        await this.acquire();
        try {
            return await fn();
        }
        finally {
            this.release();
        }
    }
    availablePermits() {
        return this.permits;
    }
    tryAcquire() {
        if (this.permits > 0) {
            this.permits--;
            return true;
        }
        return false;
    }
    releaseMultiple(permits) {
        for (let i = 0; i < permits; i++) {
            this.release();
        }
    }
    drain() {
        const drained = this.waiting.length;
        this.waiting.forEach(resolve => resolve());
        this.waiting = [];
        return drained;
    }
}
exports.Semaphore = Semaphore;
//# sourceMappingURL=concurrency.util.js.map