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
exports.HistoryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const history_service_1 = require("./history.service");
const shared_1 = require("@ai-aggregator/shared");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let HistoryController = class HistoryController {
    historyService;
    constructor(historyService) {
        this.historyService = historyService;
    }
    async getRequestHistory(req, query) {
        const userId = req.user.id;
        return this.historyService.getRequestHistory({ ...query, userId });
    }
    async getRequestHistoryById(req, id) {
        const userId = req.user.id;
        return this.historyService.getRequestHistoryById(id, userId);
    }
    async deleteRequestHistory(req, id) {
        const userId = req.user.id;
        return this.historyService.deleteRequestHistory(id, userId);
    }
    async getSessions(req, query) {
        const userId = req.user.id;
        return this.historyService.getSessions({ ...query, userId });
    }
    async getSessionById(req, id) {
        const userId = req.user.id;
        return this.historyService.getSessionById(id, userId);
    }
    async deleteSession(req, id) {
        const userId = req.user.id;
        return this.historyService.deleteSession(id, userId);
    }
    async getUserStats(req) {
        const userId = req.user.id;
        return this.historyService.getUserStats(userId);
    }
    getRequestTypes() {
        return {
            success: true,
            data: Object.values(shared_1.RequestType),
        };
    }
    getRequestStatuses() {
        return {
            success: true,
            data: Object.values(shared_1.RequestStatus),
        };
    }
};
exports.HistoryController = HistoryController;
__decorate([
    (0, common_1.Get)('requests'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user request history' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Request history retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], HistoryController.prototype, "getRequestHistory", null);
__decorate([
    (0, common_1.Get)('requests/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get request history by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Request history retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Request history not found' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], HistoryController.prototype, "getRequestHistoryById", null);
__decorate([
    (0, common_1.Delete)('requests/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete request history' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Request history deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Request history not found' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], HistoryController.prototype, "deleteRequestHistory", null);
__decorate([
    (0, common_1.Get)('sessions'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user sessions' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Sessions retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], HistoryController.prototype, "getSessions", null);
__decorate([
    (0, common_1.Get)('sessions/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get session by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Session retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Session not found' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], HistoryController.prototype, "getSessionById", null);
__decorate([
    (0, common_1.Delete)('sessions/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete session' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Session deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Session not found' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], HistoryController.prototype, "deleteSession", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User statistics retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HistoryController.prototype, "getUserStats", null);
__decorate([
    (0, common_1.Get)('request-types'),
    (0, swagger_1.ApiOperation)({ summary: 'Get available request types' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Request types retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], HistoryController.prototype, "getRequestTypes", null);
__decorate([
    (0, common_1.Get)('request-statuses'),
    (0, swagger_1.ApiOperation)({ summary: 'Get available request statuses' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Request statuses retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], HistoryController.prototype, "getRequestStatuses", null);
exports.HistoryController = HistoryController = __decorate([
    (0, swagger_1.ApiTags)('history'),
    (0, common_1.Controller)('history'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [history_service_1.HistoryService])
], HistoryController);
//# sourceMappingURL=history.controller.js.map