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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const passport_1 = require("@nestjs/passport");
const auth_service_1 = require("../modules/auth/auth.service");
const api_key_service_1 = require("../modules/api-key/api-key.service");
const user_service_1 = require("../modules/user/user.service");
const shared_1 = require("@ai-aggregator/shared");
const shared_2 = require("@ai-aggregator/shared");
let HttpController = class HttpController {
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
            shared_1.LoggerUtil.debug('auth-service', 'HTTP CreateUser called', { email: data.email });
            const result = await this.authService.register({
                email: data.email,
                password: data.password,
                firstName: data.firstName,
                lastName: data.lastName,
            });
            return {
                success: result.success,
                user: result.user ? {
                    id: result.user.id,
                    email: result.user.email,
                    isActive: result.user.isActive,
                    isVerified: result.user.isVerified,
                    role: result.user.role,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    createdAt: result.user.createdAt.toISOString(),
                    updatedAt: result.user.updatedAt.toISOString(),
                } : undefined,
                error: result.error,
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'HTTP CreateUser failed', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async getUser(id, email) {
        try {
            shared_1.LoggerUtil.debug('auth-service', 'HTTP GetUser called', { id, email });
            let user;
            if (id) {
                user = await this.userService.getUserById(id);
            }
            else if (email) {
                user = await this.userService.getUserByEmail(email);
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
                    isActive: user.isActive,
                    isVerified: user.isVerified,
                    role: user.role,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    createdAt: user.createdAt.toISOString(),
                    updatedAt: user.updatedAt.toISOString(),
                    lastLoginAt: user.lastLoginAt?.toISOString(),
                },
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'HTTP GetUser failed', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async login(data, req) {
        try {
            shared_1.LoggerUtil.debug('auth-service', 'HTTP Login called', { email: data.email });
            const result = await this.authService.login({
                email: data.email,
                password: data.password,
            }, req.ip, req.get('User-Agent'));
            return {
                success: result.success,
                accessToken: result.token,
                refreshToken: result.refreshToken,
                user: result.user ? {
                    id: result.user.id,
                    email: result.user.email,
                    isActive: result.user.isActive,
                    isVerified: result.user.isVerified,
                    role: result.user.role,
                    firstName: result.user.firstName || '',
                    lastName: result.user.lastName || '',
                    createdAt: result.user.createdAt.toISOString(),
                    updatedAt: result.user.updatedAt.toISOString(),
                    lastLoginAt: result.user.lastLoginAt?.toISOString(),
                } : undefined,
                error: result.error,
                requiresVerification: result.requiresVerification,
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'HTTP Login failed', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async validateToken(data) {
        try {
            shared_1.LoggerUtil.debug('auth-service', 'HTTP ValidateToken called', { tokenType: data.tokenType });
            if (data.tokenType === 'api_key') {
                const validation = await this.apiKeyService.validateApiKey(data.token);
                return {
                    success: validation.isValid,
                    authContext: validation.isValid ? {
                        userId: validation.userId,
                        email: '',
                        role: '',
                        permissions: validation.permissions || [],
                        apiKeyId: data.token,
                    } : undefined,
                    error: validation.isValid ? undefined : 'Invalid API key',
                };
            }
            else {
                const payload = await this.authService.validateToken(data.token);
                return {
                    success: !!payload,
                    authContext: payload ? {
                        userId: payload.sub,
                        email: payload.email,
                        role: payload.role,
                        permissions: [],
                    } : undefined,
                    error: payload ? undefined : 'Invalid token',
                };
            }
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'HTTP ValidateToken failed', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async createApiKey(data, req) {
        try {
            shared_1.LoggerUtil.debug('auth-service', 'HTTP CreateApiKey called - req.user', { reqUser: req.user, name: data.name });
            const userId = req.user?.sub;
            shared_1.LoggerUtil.debug('auth-service', 'HTTP CreateApiKey called - extracted userId', { userId, name: data.name });
            const apiKey = await this.apiKeyService.createApiKey(userId, {
                name: data.name,
                description: data.description,
                permissions: data.permissions || [],
                expiresAt: data.expiresAt,
            });
            return {
                success: true,
                apiKey: {
                    id: apiKey.id,
                    key: apiKey.key,
                    userId: apiKey.userId,
                    name: apiKey.name,
                    description: apiKey.description,
                    isActive: apiKey.isActive,
                    permissions: apiKey.permissions,
                    lastUsedAt: apiKey.lastUsedAt?.toISOString(),
                    expiresAt: apiKey.expiresAt?.toISOString(),
                    createdAt: apiKey.createdAt.toISOString(),
                },
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'HTTP CreateApiKey failed', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async validateApiKey(data) {
        try {
            shared_1.LoggerUtil.debug('auth-service', 'HTTP ValidateApiKey called', { key: data.key });
            const validation = await this.apiKeyService.validateApiKey(data.key);
            return {
                success: validation.isValid,
                authContext: validation.isValid ? {
                    userId: validation.userId,
                    email: '',
                    role: '',
                    permissions: validation.permissions || [],
                    apiKeyId: data.key,
                } : undefined,
                error: validation.isValid ? undefined : 'Invalid API key',
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'HTTP ValidateApiKey failed', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
};
exports.HttpController = HttpController;
__decorate([
    (0, common_1.Post)('register'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Register a new user' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                email: { type: 'string', format: 'email' },
                password: { type: 'string', minLength: 6 },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                role: { type: 'string', default: 'user' }
            },
            required: ['email', 'password', 'firstName', 'lastName']
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'User created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shared_2.RegisterDto]),
    __metadata("design:returntype", Promise)
], HttpController.prototype, "createUser", null);
__decorate([
    (0, common_1.Get)('user'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user by ID or email' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Query)('id')),
    __param(1, (0, common_1.Query)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], HttpController.prototype, "getUser", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Login user' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                email: { type: 'string', format: 'email' },
                password: { type: 'string' },
                ipAddress: { type: 'string' },
                userAgent: { type: 'string' }
            },
            required: ['email', 'password']
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Login successful' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid credentials' }),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shared_2.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], HttpController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('validate-token'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Validate token' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                token: { type: 'string' },
                tokenType: { type: 'string', enum: ['access', 'api_key'] }
            },
            required: ['token', 'tokenType']
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Token validation result' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HttpController.prototype, "validateToken", null);
__decorate([
    (0, common_1.Post)('api-keys'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, swagger_1.ApiOperation)({ summary: 'Create API key' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                permissions: { type: 'array', items: { type: 'string' } },
                expiresAt: { type: 'string', format: 'date-time' }
            },
            required: ['name']
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'API key created successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], HttpController.prototype, "createApiKey", null);
__decorate([
    (0, common_1.Post)('api-keys/validate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Validate API key' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                key: { type: 'string' }
            },
            required: ['key']
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'API key validation result' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HttpController.prototype, "validateApiKey", null);
exports.HttpController = HttpController = __decorate([
    (0, swagger_1.ApiTags)('auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        api_key_service_1.ApiKeyService,
        user_service_1.UserService])
], HttpController);
//# sourceMappingURL=http.controller.js.map