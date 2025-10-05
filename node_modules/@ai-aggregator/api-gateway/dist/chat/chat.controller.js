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
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const chat_service_1 = require("./chat.service");
const shared_1 = require("@ai-aggregator/shared");
let ChatController = class ChatController {
    chatService;
    constructor(chatService) {
        this.chatService = chatService;
    }
    async createCompletion(request, userId, provider = 'openai') {
        console.log('Chat completion request received:', JSON.stringify(request, null, 2));
        return this.chatService.createCompletion(request, userId, provider);
    }
    async getModels(provider) {
        const models = await this.chatService.getModels(provider);
        return {
            success: true,
            message: 'Models retrieved successfully',
            models
        };
    }
    async getModelInfo(provider, model) {
        const modelInfo = await this.chatService.getModelInfo(provider, model);
        return {
            success: true,
            message: 'Model info retrieved successfully',
            model: modelInfo
        };
    }
    async validateRequest(request) {
        const validation = await this.chatService.validateRequest(request);
        return {
            success: validation.isValid,
            message: validation.isValid ? 'Request is valid' : 'Request validation failed',
            ...validation
        };
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Post)('completions'),
    (0, swagger_1.ApiOperation)({ summary: 'Create chat completion with anonymization' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Chat completion created successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('user_id')),
    __param(2, (0, common_1.Query)('provider')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "createCompletion", null);
__decorate([
    (0, common_1.Get)('models'),
    (0, swagger_1.ApiOperation)({ summary: 'Get available models' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Models retrieved successfully' }),
    __param(0, (0, common_1.Query)('provider')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getModels", null);
__decorate([
    (0, common_1.Get)('models/:provider/:model'),
    (0, swagger_1.ApiOperation)({ summary: 'Get model information' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Model info retrieved successfully' }),
    __param(0, (0, common_1.Param)('provider')),
    __param(1, (0, common_1.Param)('model')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getModelInfo", null);
__decorate([
    (0, common_1.Post)('validate'),
    (0, swagger_1.ApiOperation)({ summary: 'Validate chat request' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Request validated successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shared_1.ChatCompletionRequest]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "validateRequest", null);
exports.ChatController = ChatController = __decorate([
    (0, swagger_1.ApiTags)('Chat'),
    (0, common_1.Controller)('chat'),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map