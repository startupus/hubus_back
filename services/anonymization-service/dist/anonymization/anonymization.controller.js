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
exports.AnonymizationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const anonymization_service_1 = require("./anonymization.service");
const anonymization_dto_1 = require("./dto/anonymization.dto");
let AnonymizationController = class AnonymizationController {
    constructor(anonymizationService) {
        this.anonymizationService = anonymizationService;
    }
    async anonymize(request) {
        return this.anonymizationService.anonymize(request);
    }
    async deanonymize(request) {
        return this.anonymizationService.deanonymize(request);
    }
    async getSettings(userId) {
        return this.anonymizationService.getSettings(userId);
    }
    async updateSettings(userId, settings) {
        return this.anonymizationService.updateSettings(userId, settings);
    }
    async deleteSettings(userId) {
        await this.anonymizationService.deleteSettings(userId);
        return { message: 'Settings deleted successfully' };
    }
};
exports.AnonymizationController = AnonymizationController;
__decorate([
    (0, common_1.Post)('anonymize'),
    (0, swagger_1.ApiOperation)({ summary: 'Anonymize chat messages or text' }),
    (0, swagger_1.ApiBody)({ type: anonymization_dto_1.AnonymizeRequestDto }),
    (0, swagger_1.ApiResponse)({ status: 200, type: anonymization_dto_1.AnonymizeResponseDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [anonymization_dto_1.AnonymizeRequestDto]),
    __metadata("design:returntype", Promise)
], AnonymizationController.prototype, "anonymize", null);
__decorate([
    (0, common_1.Post)('deanonymize'),
    (0, swagger_1.ApiOperation)({ summary: 'Deanonymize chat messages or text' }),
    (0, swagger_1.ApiBody)({ type: anonymization_dto_1.DeanonymizeRequestDto }),
    (0, swagger_1.ApiResponse)({ status: 200, type: anonymization_dto_1.DeanonymizeResponseDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [anonymization_dto_1.DeanonymizeRequestDto]),
    __metadata("design:returntype", Promise)
], AnonymizationController.prototype, "deanonymize", null);
__decorate([
    (0, common_1.Get)('settings/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get anonymization settings for user' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: anonymization_dto_1.AnonymizationSettingsResponseDto }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnonymizationController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Put)('settings/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Update anonymization settings for user' }),
    (0, swagger_1.ApiBody)({ type: anonymization_dto_1.AnonymizationSettingsDto }),
    (0, swagger_1.ApiResponse)({ status: 200, type: anonymization_dto_1.AnonymizationSettingsResponseDto }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, anonymization_dto_1.AnonymizationSettingsDto]),
    __metadata("design:returntype", Promise)
], AnonymizationController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Delete)('settings/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete anonymization settings for user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Settings deleted successfully' }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnonymizationController.prototype, "deleteSettings", null);
exports.AnonymizationController = AnonymizationController = __decorate([
    (0, swagger_1.ApiTags)('anonymization'),
    (0, common_1.Controller)('anonymization'),
    __metadata("design:paramtypes", [anonymization_service_1.AnonymizationService])
], AnonymizationController);
//# sourceMappingURL=anonymization.controller.js.map