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
exports.OrchestratorService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
const shared_1 = require("@ai-aggregator/shared");
let OrchestratorService = class OrchestratorService {
    httpService;
    configService;
    orchestratorServiceUrl;
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
        this.orchestratorServiceUrl = this.configService.get('ORCHESTRATOR_SERVICE_URL', 'http://provider-orchestrator:3002');
    }
    async getModels() {
        try {
            shared_1.LoggerUtil.debug('api-gateway', 'Getting available models');
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.orchestratorServiceUrl}/orchestrator/models`));
            return response.data;
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'Failed to get models', error);
            throw new common_1.HttpException('Failed to get models', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async routeRequest(requestData) {
        try {
            shared_1.LoggerUtil.debug('api-gateway', 'Routing request to optimal provider', { requestData });
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.orchestratorServiceUrl}/orchestrator/route-request`, requestData));
            return response.data;
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'Failed to route request', error);
            throw new common_1.HttpException('Failed to route request', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.OrchestratorService = OrchestratorService;
exports.OrchestratorService = OrchestratorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], OrchestratorService);
//# sourceMappingURL=orchestrator.service.js.map