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
exports.SyncController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
const library_1 = require("@prisma/client/runtime/library");
let SyncController = class SyncController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async syncCompany(data) {
        try {
            console.log('Syncing company from auth-service', {
                companyId: data.id,
                email: data.email
            });
            const existingCompany = await this.prisma.company.findUnique({
                where: { id: data.id }
            });
            if (existingCompany) {
                console.warn('Company already exists', { companyId: data.id });
                return {
                    success: true,
                    message: 'Company already exists',
                    companyId: data.id
                };
            }
            const company = await this.prisma.company.create({
                data: {
                    id: data.id,
                    name: data.name,
                    email: data.email,
                    isActive: data.isActive ?? true,
                    billingMode: data.billingMode ?? 'SELF_PAID'
                }
            });
            const balance = await this.prisma.companyBalance.create({
                data: {
                    companyId: data.id,
                    balance: new library_1.Decimal(data.initialBalance ?? 100.0),
                    currency: data.currency ?? 'USD',
                    creditLimit: new library_1.Decimal(0)
                }
            });
            console.log('Company synced successfully', {
                companyId: data.id,
                balance: balance.balance.toString()
            });
            return {
                success: true,
                message: 'Company synced successfully',
                company: {
                    id: company.id,
                    name: company.name,
                    email: company.email,
                    balance: balance.balance.toString(),
                    currency: balance.currency
                }
            };
        }
        catch (error) {
            console.error('Failed to sync company', error, {
                companyId: data.id
            });
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
};
exports.SyncController = SyncController;
__decorate([
    (0, common_1.Post)('company'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "syncCompany", null);
exports.SyncController = SyncController = __decorate([
    (0, common_1.Controller)('sync'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SyncController);
//# sourceMappingURL=sync.controller.js.map