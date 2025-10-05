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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
let AuthService = class AuthService {
    httpService;
    configService;
    authServiceUrl;
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
        this.authServiceUrl = this.configService.get('AUTH_SERVICE_URL', 'http://auth-service:3001');
    }
    async register(registerDto) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.authServiceUrl}/auth/register`, registerDto));
            const authResult = response.data;
            if (!authResult.success) {
                if (authResult.error?.includes('already exists')) {
                    throw new common_1.HttpException('User with this email already exists', common_1.HttpStatus.CONFLICT);
                }
                throw new common_1.HttpException(authResult.error || 'Registration failed', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
            return {
                accessToken: authResult.token || 'temp-token',
                refreshToken: authResult.refreshToken || 'temp-refresh-token',
                tokenType: 'Bearer',
                expiresIn: 3600,
                user: authResult.user ? {
                    id: authResult.user.id,
                    email: authResult.user.email,
                    role: authResult.user.role,
                    isVerified: authResult.user.isVerified,
                } : undefined,
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            if (error.response?.status === 409) {
                throw new common_1.HttpException('User with this email already exists', common_1.HttpStatus.CONFLICT);
            }
            throw new common_1.HttpException('Registration failed', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async login(loginDto) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.authServiceUrl}/auth/login`, loginDto));
            const authResult = response.data;
            if (!authResult.success) {
                if (authResult.requiresVerification) {
                    throw new common_1.HttpException('Email verification required', common_1.HttpStatus.UNAUTHORIZED);
                }
                throw new common_1.HttpException(authResult.error || 'Invalid credentials', common_1.HttpStatus.UNAUTHORIZED);
            }
            return {
                accessToken: authResult.token || 'temp-token',
                refreshToken: authResult.refreshToken || 'temp-refresh-token',
                tokenType: 'Bearer',
                expiresIn: 3600,
                user: authResult.user ? {
                    id: authResult.user.id,
                    email: authResult.user.email,
                    role: authResult.user.role,
                    isVerified: authResult.user.isVerified,
                } : undefined,
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            if (error.response?.status === 401) {
                throw new common_1.HttpException('Invalid credentials', common_1.HttpStatus.UNAUTHORIZED);
            }
            throw new common_1.HttpException('Login failed', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map