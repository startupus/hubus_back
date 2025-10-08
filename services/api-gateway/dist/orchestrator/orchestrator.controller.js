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
exports.OrchestratorController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const orchestrator_service_1 = require("./orchestrator.service");
let OrchestratorController = class OrchestratorController {
    orchestratorService;
    constructor(orchestratorService) {
        this.orchestratorService = orchestratorService;
    }
    async getModels() {
        try {
            return await this.orchestratorService.getModels();
        }
        catch (error) {
            throw new common_1.HttpException('Failed to get models', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async routeRequest(requestData) {
        try {
            return await this.orchestratorService.routeRequest(requestData);
        }
        catch (error) {
            throw new common_1.HttpException('Failed to route request', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.OrchestratorController = OrchestratorController;
__decorate([
    (0, common_1.Get)('models'),
    (0, swagger_1.ApiOperation)({ summary: 'Get available AI models' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Models retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OrchestratorController.prototype, "getModels", null);
__decorate([
    (0, common_1.Post)('route-request'),
    (0, swagger_1.ApiOperation)({ summary: 'Route request to optimal provider' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Request routed successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrchestratorController.prototype, "routeRequest", null);
exports.OrchestratorController = OrchestratorController = __decorate([
    (0, swagger_1.ApiTags)('Orchestrator'),
    (0, common_1.Controller)('orchestrator'),
    __metadata("design:paramtypes", [orchestrator_service_1.OrchestratorService])
], OrchestratorController);
//# sourceMappingURL=orchestrator.controller.js.map