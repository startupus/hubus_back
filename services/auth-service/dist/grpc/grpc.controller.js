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
exports.GrpcController = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const auth_service_1 = require("../modules/auth/auth.service");
const api_key_service_1 = require("../modules/api-key/api-key.service");
const user_service_1 = require("../modules/user/user.service");
const shared_1 = require("@ai-aggregator/shared");
let GrpcController = class GrpcController {
    authService;
    apiKeyService;
    userService;
    constructor(authService, apiKeyService, userService) {
        this.authService = authService;
        this.apiKeyService = apiKeyService;
        this.userService = userService;
    }
    async createUser(data) {
        try {
            shared_1.LoggerUtil.debug('auth-service', 'gRPC CreateUser called', { email: data.email });
            const result = await this.authService.register({
                email: data.email,
                password: data.password,
                firstName: data.first_name,
                lastName: data.last_name,
            });
            return {
                success: result.success,
                user: result.user ? {
                    id: result.user.id,
                    email: result.user.email,
                    is_active: result.user.isActive,
                    is_verified: result.user.isVerified,
                    role: result.user.role,
                    first_name: data.first_name,
                    last_name: data.last_name,
                    created_at: result.user.createdAt.toISOString(),
                    updated_at: result.user.updatedAt.toISOString(),
                } : undefined,
                error: result.error,
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'gRPC CreateUser failed', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async getUser(data) {
        try {
            shared_1.LoggerUtil.debug('auth-service', 'gRPC GetUser called', { id: data.id, email: data.email });
            let user;
            if (data.id) {
                user = await this.userService.getUserById(data.id);
            }
            else if (data.email) {
                user = await this.userService.getUserByEmail(data.email);
            }
            else {
                return {
                    success: false,
                    error: 'Either id or email must be provided',
                };
            }
            return {
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    is_active: user.isActive,
                    is_verified: user.isVerified,
                    role: user.role,
                    first_name: user.firstName,
                    last_name: user.lastName,
                    created_at: user.createdAt.toISOString(),
                    updated_at: user.updatedAt.toISOString(),
                    last_login_at: user.lastLoginAt?.toISOString(),
                },
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'gRPC GetUser failed', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async login(data) {
        try {
            shared_1.LoggerUtil.debug('auth-service', 'gRPC Login called', { email: data.email });
            const result = await this.authService.login({
                email: data.email,
                password: data.password,
            }, data.ip_address, data.user_agent);
            return {
                success: result.success,
                access_token: result.token,
                refresh_token: result.refreshToken,
                user: result.user ? {
                    id: result.user.id,
                    email: result.user.email,
                    is_active: result.user.isActive,
                    is_verified: result.user.isVerified,
                    role: result.user.role,
                    first_name: result.user.firstName || '',
                    last_name: result.user.lastName || '',
                    created_at: result.user.createdAt.toISOString(),
                    updated_at: result.user.updatedAt.toISOString(),
                    last_login_at: result.user.lastLoginAt?.toISOString(),
                } : undefined,
                error: result.error,
                requires_verification: result.requiresVerification,
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'gRPC Login failed', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async validateToken(data) {
        try {
            shared_1.LoggerUtil.debug('auth-service', 'gRPC ValidateToken called', { token_type: data.token_type });
            if (data.token_type === 'api_key') {
                const validation = await this.apiKeyService.validateApiKey(data.token);
                return {
                    success: validation.isValid,
                    auth_context: validation.isValid ? {
                        user_id: validation.userId,
                        email: '',
                        role: '',
                        permissions: validation.permissions || [],
                        api_key_id: data.token,
                    } : undefined,
                    error: validation.isValid ? undefined : 'Invalid API key',
                };
            }
            else {
                const payload = await this.authService.validateToken(data.token);
                return {
                    success: !!payload,
                    auth_context: payload ? {
                        user_id: payload.sub,
                        email: payload.email,
                        role: payload.role,
                        permissions: [],
                    } : undefined,
                    error: payload ? undefined : 'Invalid token',
                };
            }
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'gRPC ValidateToken failed', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async createApiKey(data) {
        try {
            shared_1.LoggerUtil.debug('auth-service', 'gRPC CreateApiKey called', { user_id: data.user_id, name: data.name });
            const apiKey = await this.apiKeyService.createApiKey(data.user_id, {
                name: data.name,
                description: data.description,
                permissions: data.permissions || [],
                expiresAt: data.expires_at,
            });
            return {
                success: true,
                api_key: {
                    id: apiKey.id,
                    key: apiKey.key,
                    user_id: apiKey.userId,
                    name: apiKey.name,
                    description: apiKey.description,
                    is_active: apiKey.isActive,
                    permissions: apiKey.permissions,
                    last_used_at: apiKey.lastUsedAt?.toISOString(),
                    expires_at: apiKey.expiresAt?.toISOString(),
                    created_at: apiKey.createdAt.toISOString(),
                },
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'gRPC CreateApiKey failed', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async validateApiKey(data) {
        try {
            shared_1.LoggerUtil.debug('auth-service', 'gRPC ValidateApiKey called', { key: data.key });
            const validation = await this.apiKeyService.validateApiKey(data.key);
            return {
                success: validation.isValid,
                auth_context: validation.isValid ? {
                    user_id: validation.userId,
                    email: '',
                    role: '',
                    permissions: validation.permissions || [],
                    api_key_id: data.key,
                } : undefined,
                error: validation.isValid ? undefined : 'Invalid API key',
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'gRPC ValidateApiKey failed', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
};
exports.GrpcController = GrpcController;
__decorate([
    (0, microservices_1.GrpcMethod)('AuthService', 'CreateUser'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GrpcController.prototype, "createUser", null);
__decorate([
    (0, microservices_1.GrpcMethod)('AuthService', 'GetUser'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GrpcController.prototype, "getUser", null);
__decorate([
    (0, microservices_1.GrpcMethod)('AuthService', 'Login'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GrpcController.prototype, "login", null);
__decorate([
    (0, microservices_1.GrpcMethod)('AuthService', 'ValidateToken'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GrpcController.prototype, "validateToken", null);
__decorate([
    (0, microservices_1.GrpcMethod)('AuthService', 'CreateApiKey'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GrpcController.prototype, "createApiKey", null);
__decorate([
    (0, microservices_1.GrpcMethod)('AuthService', 'ValidateApiKey'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GrpcController.prototype, "validateApiKey", null);
exports.GrpcController = GrpcController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        api_key_service_1.ApiKeyService,
        user_service_1.UserService])
], GrpcController);
//# sourceMappingURL=grpc.controller.js.map