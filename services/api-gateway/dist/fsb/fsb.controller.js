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
exports.FsbController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const history_service_1 = require("../history/history.service");
const anonymization_service_1 = require("../anonymization/anonymization.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const shared_1 = require("@ai-aggregator/shared");
let FsbController = class FsbController {
    historyService;
    anonymizationService;
    constructor(historyService, anonymizationService) {
        this.historyService = historyService;
        this.anonymizationService = anonymizationService;
    }
    checkFsbAccess(user) {
        if (user.role !== 'fsb') {
            throw new common_1.HttpException('Access denied. FSB role required.', common_1.HttpStatus.FORBIDDEN);
        }
    }
    async searchRequests(req, query, userId, provider, model, fromDate, toDate, limit, offset) {
        this.checkFsbAccess(req.user);
        shared_1.LoggerUtil.info('api-gateway', 'FSB search request', {
            query,
            userId,
            provider,
            model,
            fromDate,
            toDate,
            requestedBy: req.user.id
        });
        try {
            const searchResults = await this.historyService.searchRequests({
                query,
                userId,
                provider,
                model,
                fromDate: fromDate ? new Date(fromDate) : undefined,
                toDate: toDate ? new Date(toDate) : undefined,
                limit: limit ? parseInt(limit, 10) : 50,
                offset: offset ? parseInt(offset, 10) : 0
            });
            return {
                success: true,
                data: searchResults.data,
                pagination: searchResults.pagination,
                searchParams: {
                    query,
                    userId,
                    provider,
                    model,
                    fromDate,
                    toDate
                }
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'FSB search failed', error, {
                query,
                requestedBy: req.user.id
            });
            throw new common_1.HttpException('Search failed', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getRequestDetails(req, id) {
        this.checkFsbAccess(req.user);
        try {
            const requestDetails = await this.historyService.getRequestHistoryById(id, 'fsb-access');
            if (!requestDetails.success) {
                throw new common_1.HttpException('Request not found', common_1.HttpStatus.NOT_FOUND);
            }
            shared_1.LoggerUtil.info('api-gateway', 'FSB request details accessed', {
                requestId: id,
                requestedBy: req.user.id
            });
            return {
                success: true,
                data: requestDetails.data
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'FSB request details failed', error, {
                requestId: id,
                requestedBy: req.user.id
            });
            throw new common_1.HttpException('Failed to get request details', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async searchUsers(req, query, fromDate, toDate) {
        this.checkFsbAccess(req.user);
        try {
            const userSearchResults = await this.historyService.searchUsers({
                query,
                fromDate: fromDate ? new Date(fromDate) : undefined,
                toDate: toDate ? new Date(toDate) : undefined
            });
            shared_1.LoggerUtil.info('api-gateway', 'FSB user search', {
                query,
                resultsCount: Array.isArray(userSearchResults.data) ? userSearchResults.data.length : 0,
                requestedBy: req.user.id
            });
            return {
                success: true,
                data: userSearchResults.data,
                searchParams: { query, fromDate, toDate }
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'FSB user search failed', error, {
                query,
                requestedBy: req.user.id
            });
            throw new common_1.HttpException('User search failed', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getUserStats(req, userId) {
        this.checkFsbAccess(req.user);
        try {
            const userStats = await this.historyService.getUserStats(userId);
            shared_1.LoggerUtil.info('api-gateway', 'FSB user stats accessed', {
                userId,
                requestedBy: req.user.id
            });
            return {
                success: true,
                data: userStats
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'FSB user stats failed', error, {
                userId,
                requestedBy: req.user.id
            });
            throw new common_1.HttpException('Failed to get user statistics', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getAnonymizationSettings(req, provider, model, enabled, limit, offset) {
        this.checkFsbAccess(req.user);
        try {
            const searchParams = {
                provider,
                model,
                enabled: enabled ? enabled === 'true' : undefined,
                limit: limit ? parseInt(limit, 10) : 50,
                offset: offset ? parseInt(offset, 10) : 0,
            };
            const result = await this.anonymizationService.searchSettings(searchParams);
            shared_1.LoggerUtil.info('api-gateway', 'FSB anonymization settings accessed', {
                requestedBy: req.user.id,
                filters: searchParams,
                total: result.total
            });
            return {
                success: true,
                data: result.data,
                pagination: {
                    total: result.total,
                    limit: searchParams.limit,
                    offset: searchParams.offset,
                    hasMore: searchParams.offset + searchParams.limit < result.total,
                }
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'FSB anonymization settings failed', error, {
                requestedBy: req.user.id
            });
            throw new common_1.HttpException('Failed to get anonymization settings', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async upsertAnonymizationSettings(req, settings) {
        this.checkFsbAccess(req.user);
        try {
            const result = await this.anonymizationService.upsertSettings({
                provider: settings.provider,
                model: settings.model,
                enabled: settings.enabled,
                preserveMetadata: settings.preserveMetadata,
                createdBy: req.user.id,
            });
            shared_1.LoggerUtil.info('api-gateway', 'FSB anonymization settings upserted', {
                provider: settings.provider,
                model: settings.model,
                enabled: settings.enabled,
                requestedBy: req.user.id
            });
            return {
                success: true,
                message: 'Anonymization settings created/updated successfully',
                data: result
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'FSB anonymization settings upsert failed', error, {
                settings,
                requestedBy: req.user.id
            });
            throw new common_1.HttpException('Failed to create/update anonymization settings', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async updateAnonymizationSettingsById(req, id, settings) {
        this.checkFsbAccess(req.user);
        try {
            const result = await this.anonymizationService.updateSettings(id, {
                enabled: settings.enabled,
                preserveMetadata: settings.preserveMetadata,
                updatedBy: req.user.id,
            });
            if (!result) {
                throw new common_1.HttpException('Settings not found', common_1.HttpStatus.NOT_FOUND);
            }
            shared_1.LoggerUtil.info('api-gateway', 'FSB anonymization settings updated by ID', {
                id,
                enabled: settings.enabled,
                requestedBy: req.user.id
            });
            return {
                success: true,
                message: 'Anonymization settings updated successfully',
                data: result
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'FSB anonymization settings update by ID failed', error, {
                id,
                settings,
                requestedBy: req.user.id
            });
            throw new common_1.HttpException('Failed to update anonymization settings', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async deleteAnonymizationSettings(req, id) {
        this.checkFsbAccess(req.user);
        try {
            const success = await this.anonymizationService.deleteSettings(id, req.user.id);
            if (!success) {
                throw new common_1.HttpException('Failed to delete settings', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
            shared_1.LoggerUtil.info('api-gateway', 'FSB anonymization settings deleted', {
                id,
                requestedBy: req.user.id
            });
            return {
                success: true,
                message: 'Anonymization settings deleted successfully'
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'FSB anonymization settings delete failed', error, {
                id,
                requestedBy: req.user.id
            });
            throw new common_1.HttpException('Failed to delete anonymization settings', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getSystemStatistics(req) {
        this.checkFsbAccess(req.user);
        try {
            const systemStats = await this.historyService.getSystemStatistics();
            shared_1.LoggerUtil.info('api-gateway', 'FSB system statistics accessed', {
                requestedBy: req.user.id
            });
            return {
                success: true,
                data: systemStats
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'FSB system statistics failed', error, {
                requestedBy: req.user.id
            });
            throw new common_1.HttpException('Failed to get system statistics', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async deanonymizeData(req, data) {
        this.checkFsbAccess(req.user);
        try {
            const deanonymizedData = this.anonymizationService.deanonymizeChatMessages(data.anonymizedData, data.mapping);
            shared_1.LoggerUtil.info('api-gateway', 'FSB data deanonymized', {
                requestedBy: req.user.id,
                dataLength: data.anonymizedData.length
            });
            return {
                success: true,
                data: deanonymizedData
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'FSB deanonymization failed', error, {
                requestedBy: req.user.id
            });
            throw new common_1.HttpException('Failed to deanonymize data', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.FsbController = FsbController;
__decorate([
    (0, common_1.Get)('search/requests'),
    (0, swagger_1.ApiOperation)({ summary: 'Search requests by content and authors' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Search results retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'query', description: 'Search query (content or author)', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'userId', description: 'Filter by specific user ID', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'provider', description: 'Filter by provider', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'model', description: 'Filter by model', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'fromDate', description: 'Filter from date (ISO string)', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'toDate', description: 'Filter to date (ISO string)', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', description: 'Limit results', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'offset', description: 'Offset results', required: false }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('query')),
    __param(2, (0, common_1.Query)('userId')),
    __param(3, (0, common_1.Query)('provider')),
    __param(4, (0, common_1.Query)('model')),
    __param(5, (0, common_1.Query)('fromDate')),
    __param(6, (0, common_1.Query)('toDate')),
    __param(7, (0, common_1.Query)('limit')),
    __param(8, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], FsbController.prototype, "searchRequests", null);
__decorate([
    (0, common_1.Get)('requests/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get detailed request information' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Request details retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FsbController.prototype, "getRequestDetails", null);
__decorate([
    (0, common_1.Get)('search/users'),
    (0, swagger_1.ApiOperation)({ summary: 'Search users by activity patterns' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User search results retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'query', description: 'Search query for user patterns', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'fromDate', description: 'Filter from date', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'toDate', description: 'Filter to date', required: false }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('query')),
    __param(2, (0, common_1.Query)('fromDate')),
    __param(3, (0, common_1.Query)('toDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], FsbController.prototype, "searchUsers", null);
__decorate([
    (0, common_1.Get)('users/:userId/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get detailed user statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User statistics retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FsbController.prototype, "getUserStats", null);
__decorate([
    (0, common_1.Get)('anonymization/settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all anonymization settings' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Anonymization settings retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'provider', description: 'Filter by provider', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'model', description: 'Filter by model', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'enabled', description: 'Filter by enabled status', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', description: 'Limit results', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'offset', description: 'Offset results', required: false }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('provider')),
    __param(2, (0, common_1.Query)('model')),
    __param(3, (0, common_1.Query)('enabled')),
    __param(4, (0, common_1.Query)('limit')),
    __param(5, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], FsbController.prototype, "getAnonymizationSettings", null);
__decorate([
    (0, common_1.Post)('anonymization/settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Create or update anonymization settings for specific provider/model' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Anonymization settings created/updated successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], FsbController.prototype, "upsertAnonymizationSettings", null);
__decorate([
    (0, common_1.Put)('anonymization/settings/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update anonymization settings by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Anonymization settings updated successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], FsbController.prototype, "updateAnonymizationSettingsById", null);
__decorate([
    (0, common_1.Delete)('anonymization/settings/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete anonymization settings by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Anonymization settings deleted successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FsbController.prototype, "deleteAnonymizationSettings", null);
__decorate([
    (0, common_1.Get)('statistics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get system statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'System statistics retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FsbController.prototype, "getSystemStatistics", null);
__decorate([
    (0, common_1.Post)('anonymization/deanonymize'),
    (0, swagger_1.ApiOperation)({ summary: 'Deanonymize data using mapping' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Data deanonymized successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], FsbController.prototype, "deanonymizeData", null);
exports.FsbController = FsbController = __decorate([
    (0, swagger_1.ApiTags)('FSB'),
    (0, common_1.Controller)('fsb'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [history_service_1.HistoryService,
        anonymization_service_1.AnonymizationService])
], FsbController);
//# sourceMappingURL=fsb.controller.js.map