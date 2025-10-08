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
exports.ProxyService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
const shared_1 = require("@ai-aggregator/shared");
let ProxyService = class ProxyService {
    httpService;
    configService;
    proxyServiceUrl;
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
        this.proxyServiceUrl = this.configService.get('PROXY_SERVICE_URL', 'http://proxy-service:3003');
    }
    async proxyOpenAI(requestData) {
        try {
            shared_1.LoggerUtil.debug('api-gateway', 'Proxying OpenAI request', { requestData });
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.proxyServiceUrl}/proxy/openai/chat/completions`, requestData));
            return response.data;
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'Failed to proxy OpenAI request', error);
            throw new common_1.HttpException('Failed to proxy OpenAI request', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async proxyOpenRouter(requestData) {
        try {
            shared_1.LoggerUtil.debug('api-gateway', 'Proxying OpenRouter request', { requestData });
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.proxyServiceUrl}/proxy/openrouter/chat/completions`, requestData));
            return response.data;
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'Failed to proxy OpenRouter request', error);
            throw new common_1.HttpException('Failed to proxy OpenRouter request', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async validateRequest(requestData) {
        try {
            shared_1.LoggerUtil.debug('api-gateway', 'Validating request', { requestData });
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.proxyServiceUrl}/proxy/validate-request`, requestData));
            return response.data;
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'Failed to validate request', error);
            throw new common_1.HttpException('Failed to validate request', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.ProxyService = ProxyService;
exports.ProxyService = ProxyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], ProxyService);
//# sourceMappingURL=proxy.service.js.map