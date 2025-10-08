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
exports.ProxyController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const proxy_service_1 = require("./proxy.service");
let ProxyController = class ProxyController {
    proxyService;
    constructor(proxyService) {
        this.proxyService = proxyService;
    }
    async proxyOpenAI(requestData) {
        try {
            return await this.proxyService.proxyOpenAI(requestData);
        }
        catch (error) {
            throw new common_1.HttpException('Failed to proxy OpenAI request', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async proxyOpenRouter(requestData) {
        try {
            return await this.proxyService.proxyOpenRouter(requestData);
        }
        catch (error) {
            throw new common_1.HttpException('Failed to proxy OpenRouter request', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async validateRequest(requestData) {
        try {
            return await this.proxyService.validateRequest(requestData);
        }
        catch (error) {
            throw new common_1.HttpException('Failed to validate request', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.ProxyController = ProxyController;
__decorate([
    (0, common_1.Post)('openai/chat/completions'),
    (0, swagger_1.ApiOperation)({ summary: 'Proxy OpenAI chat completions' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Request proxied successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProxyController.prototype, "proxyOpenAI", null);
__decorate([
    (0, common_1.Post)('openrouter/chat/completions'),
    (0, swagger_1.ApiOperation)({ summary: 'Proxy OpenRouter chat completions' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Request proxied successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProxyController.prototype, "proxyOpenRouter", null);
__decorate([
    (0, common_1.Post)('validate-request'),
    (0, swagger_1.ApiOperation)({ summary: 'Validate request format' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Request validated successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProxyController.prototype, "validateRequest", null);
exports.ProxyController = ProxyController = __decorate([
    (0, swagger_1.ApiTags)('Proxy'),
    (0, common_1.Controller)('proxy'),
    __metadata("design:paramtypes", [proxy_service_1.ProxyService])
], ProxyController);
//# sourceMappingURL=proxy.controller.js.map