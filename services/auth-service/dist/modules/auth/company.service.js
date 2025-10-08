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
exports.CompanyService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const shared_1 = require("@ai-aggregator/shared");
let CompanyService = class CompanyService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async registerCompany(companyData) {
        try {
            const existingCompany = await this.prisma.company.findUnique({
                where: { email: companyData.email },
            });
            if (existingCompany) {
                throw new common_1.ConflictException('Company with this email already exists');
            }
            const company = await this.prisma.company.create({
                data: {
                    name: companyData.name,
                    email: companyData.email,
                    passwordHash: companyData.password,
                    description: companyData.description,
                    isActive: true,
                },
            });
            shared_1.LoggerUtil.info('auth-service', 'Company registered successfully', {
                companyId: company.id,
                email: company.email
            });
            return company;
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Failed to register company', error);
            throw error;
        }
    }
    async createUser(companyId, userData) {
        try {
            const company = await this.prisma.company.findUnique({
                where: { id: companyId },
            });
            if (!company) {
                throw new common_1.NotFoundException('Company not found');
            }
            const existingUser = await this.prisma.user.findUnique({
                where: { email: userData.email },
            });
            if (existingUser) {
                throw new common_1.ConflictException('User with this email already exists');
            }
            const user = await this.prisma.user.create({
                data: {
                    email: userData.email,
                    passwordHash: userData.password,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    position: userData.position,
                    department: userData.department,
                    companyId: companyId,
                    isVerified: true,
                },
            });
            shared_1.LoggerUtil.info('auth-service', 'User created successfully', {
                userId: user.id,
                companyId,
                email: user.email
            });
            return user;
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Failed to create user', error);
            throw error;
        }
    }
    async getCompany(companyId) {
        try {
            const company = await this.prisma.company.findUnique({
                where: { id: companyId },
                include: {
                    users: true,
                },
            });
            if (!company) {
                throw new common_1.NotFoundException('Company not found');
            }
            return company;
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Failed to get company', error);
            throw error;
        }
    }
    async updateCompany(companyId, updateData) {
        try {
            const company = await this.prisma.company.findUnique({
                where: { id: companyId },
            });
            if (!company) {
                throw new common_1.NotFoundException('Company not found');
            }
            const updatedCompany = await this.prisma.company.update({
                where: { id: companyId },
                data: updateData,
            });
            shared_1.LoggerUtil.info('auth-service', 'Company updated successfully', {
                companyId: updatedCompany.id
            });
            return updatedCompany;
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Failed to update company', error);
            throw error;
        }
    }
    async getCompanyUsers(companyId) {
        try {
            const company = await this.prisma.company.findUnique({
                where: { id: companyId },
            });
            if (!company) {
                throw new common_1.NotFoundException('Company not found');
            }
            const users = await this.prisma.user.findMany({
                where: { companyId },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    position: true,
                    department: true,
                    isActive: true,
                    isVerified: true,
                    createdAt: true,
                },
            });
            return users;
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Failed to get company users', error);
            throw error;
        }
    }
    async getAllCompanies() {
        try {
            const companies = await this.prisma.company.findMany({
                include: {
                    users: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            isActive: true,
                        },
                    },
                },
            });
            return companies;
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Failed to get all companies', error);
            throw error;
        }
    }
    async getAllUsers() {
        try {
            const users = await this.prisma.user.findMany({
                include: {
                    company: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });
            return users;
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Failed to get all users', error);
            throw error;
        }
    }
};
exports.CompanyService = CompanyService;
exports.CompanyService = CompanyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CompanyService);
//# sourceMappingURL=company.service.js.map