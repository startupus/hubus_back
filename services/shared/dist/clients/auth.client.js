"use strict";
/**
 * HTTP Client for Auth Service
 * Клиент для взаимодействия с auth-service через HTTP API
 */
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
exports.AuthClient = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
let AuthClient = class AuthClient {
    AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
    axiosInstance;
    constructor() {
        this.axiosInstance = axios_1.default.create({
            timeout: 10000,
            maxRedirects: 3,
        });
    }
    /**
     * Регистрация пользователя
     */
    async register(data) {
        const response = await this.axiosInstance.post(`${this.AUTH_SERVICE_URL}/auth/register`, data);
        return response.data;
    }
    /**
     * Авторизация пользователя
     */
    async login(data) {
        const response = await this.axiosInstance.post(`${this.AUTH_SERVICE_URL}/auth/login`, data);
        return response.data;
    }
    /**
     * Получение профиля пользователя
     */
    async getUserProfile(userId, accessToken) {
        const response = await this.axiosInstance.get(`${this.AUTH_SERVICE_URL}/users/${userId}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        return response.data;
    }
    /**
     * Создание API ключа
     */
    async createApiKey(data, accessToken) {
        const response = await this.axiosInstance.post(`${this.AUTH_SERVICE_URL}/api-keys`, data, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        return response.data;
    }
    /**
     * Валидация токена
     */
    async validateToken(data) {
        const response = await this.axiosInstance.post(`${this.AUTH_SERVICE_URL}/auth/validate`, data);
        return response.data;
    }
};
exports.AuthClient = AuthClient;
exports.AuthClient = AuthClient = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AuthClient);
//# sourceMappingURL=auth.client.js.map