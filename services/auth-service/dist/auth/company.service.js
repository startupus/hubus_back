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
var CompanyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
const shared_1 = require("@ai-aggregator/shared");
const crypto_util_1 = require("../utils/crypto.util");
let CompanyService = CompanyService_1 = class CompanyService {
    prisma;
    logger = new common_1.Logger(CompanyService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createCompany(data) {
        try {
            shared_1.LoggerUtil.info('auth-service', 'Creating new company', {
                name: data.name,
                email: data.email
            });
            const existingCompany = await this.prisma.company.findUnique({
                where: { email: data.email }
            });
            if (existingCompany) {
                throw new common_1.ConflictException('Company with this email already exists');
            }
            const passwordHash = await crypto_util_1.CryptoUtil.hashPassword(data.password);
            const company = await this.prisma.company.create({
                data: {
                    name: data.name,
                    email: data.email,
                    passwordHash,
                    description: data.description,
                    website: data.website,
                    phone: data.phone,
                    address: data.address,
                    role: 'company'
                }
            });
            shared_1.LoggerUtil.info('auth-service', 'Company created successfully', {
                companyId: company.id,
                name: company.name,
                email: company.email
            });
            return this.transformCompany(company);
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Failed to create company', error, {
                name: data.name,
                email: data.email
            });
            throw error;
        }
    }
    async createUser(data) {
        try {
            shared_1.LoggerUtil.info('auth-service', 'Creating new user in company', {
                companyId: data.companyId,
                email: data.email
            });
            const company = await this.prisma.company.findUnique({
                where: { id: data.companyId }
            });
            if (!company) {
                throw new common_1.NotFoundException('Company not found');
            }
            const existingUser = await this.prisma.user.findUnique({
                where: { email: data.email }
            });
            if (existingUser) {
                throw new common_1.ConflictException('User with this email already exists');
            }
            const passwordHash = await crypto_util_1.CryptoUtil.hashPassword(data.password);
            const user = await this.prisma.user.create({
                data: {
                    companyId: data.companyId,
                    email: data.email,
                    passwordHash,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    position: data.position,
                    department: data.department,
                    permissions: data.permissions || [],
                    role: 'user'
                }
            });
            shared_1.LoggerUtil.info('auth-service', 'User created successfully', {
                userId: user.id,
                companyId: data.companyId,
                email: user.email
            });
            return this.transformUser(user);
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Failed to create user', error, {
                companyId: data.companyId,
                email: data.email
            });
            throw error;
        }
    }
    async authenticate(email, password) {
        try {
            shared_1.LoggerUtil.info('auth-service', 'Authenticating user/company', {
                email
            });
            let user = await this.prisma.user.findUnique({
                where: { email },
                include: { company: true }
            });
            if (user) {
                const isPasswordValid = await crypto_util_1.CryptoUtil.comparePassword(password, user.passwordHash);
                if (!isPasswordValid) {
                    throw new common_1.BadRequestException('Invalid credentials');
                }
                await this.prisma.user.update({
                    where: { id: user.id },
                    data: { lastLoginAt: new Date() }
                });
                shared_1.LoggerUtil.info('auth-service', 'User authenticated successfully', {
                    userId: user.id,
                    email: user.email,
                    companyId: user.companyId
                });
                return {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    ownerType: 'user',
                    companyId: user.companyId,
                    permissions: user.permissions
                };
            }
            const company = await this.prisma.company.findUnique({
                where: { email }
            });
            if (company) {
                const isPasswordValid = await crypto_util_1.CryptoUtil.comparePassword(password, company.passwordHash);
                if (!isPasswordValid) {
                    throw new common_1.BadRequestException('Invalid credentials');
                }
                await this.prisma.company.update({
                    where: { id: company.id },
                    data: { lastLoginAt: new Date() }
                });
                shared_1.LoggerUtil.info('auth-service', 'Company authenticated successfully', {
                    companyId: company.id,
                    email: company.email
                });
                return {
                    id: company.id,
                    email: company.email,
                    role: company.role,
                    ownerType: 'company'
                };
            }
            throw new common_1.BadRequestException('Invalid credentials');
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Authentication failed', error, {
                email
            });
            throw error;
        }
    }
    async getCompanyById(id) {
        try {
            const company = await this.prisma.company.findUnique({
                where: { id },
                include: {
                    users: {
                        select: { id: true }
                    }
                }
            });
            if (!company) {
                throw new common_1.NotFoundException('Company not found');
            }
            return {
                ...this.transformCompany(company),
                usersCount: company.users.length
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Failed to get company', error, {
                companyId: id
            });
            throw error;
        }
    }
    async getUserById(id) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id },
                include: { company: true }
            });
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            return this.transformUser(user);
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Failed to get user', error, {
                userId: id
            });
            throw error;
        }
    }
    async getCompanyUsers(companyId) {
        try {
            const users = await this.prisma.user.findMany({
                where: { companyId },
                orderBy: { createdAt: 'desc' }
            });
            return users.map(user => this.transformUser(user));
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Failed to get company users', error, {
                companyId
            });
            throw error;
        }
    }
    async updateUser(id, updates) {
        try {
            const user = await this.prisma.user.update({
                where: { id },
                data: updates
            });
            shared_1.LoggerUtil.info('auth-service', 'User updated successfully', {
                userId: id,
                updates
            });
            return this.transformUser(user);
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Failed to update user', error, {
                userId: id,
                updates
            });
            throw error;
        }
    }
    async deleteUser(id) {
        try {
            await this.prisma.user.delete({
                where: { id }
            });
            shared_1.LoggerUtil.info('auth-service', 'User deleted successfully', {
                userId: id
            });
            return true;
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Failed to delete user', error, {
                userId: id
            });
            throw error;
        }
    }
    async getAllCompanies() {
        try {
            const companies = await this.prisma.company.findMany({
                include: {
                    users: {
                        select: { id: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
            return companies.map(company => ({
                ...this.transformCompany(company),
                usersCount: company.users.length
            }));
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Failed to get all companies', error);
            throw error;
        }
    }
    async getAllUsers() {
        try {
            const users = await this.prisma.user.findMany({
                include: { company: true },
                orderBy: { createdAt: 'desc' }
            });
            return users.map(user => this.transformUser(user));
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Failed to get all users', error);
            throw error;
        }
    }
    transformCompany(company) {
        return {
            id: company.id,
            name: company.name,
            email: company.email,
            isActive: company.isActive,
            isVerified: company.isVerified,
            description: company.description,
            website: company.website,
            phone: company.phone,
            address: company.address,
            settings: company.settings,
            createdAt: company.createdAt,
            updatedAt: company.updatedAt,
            lastLoginAt: company.lastLoginAt
        };
    }
    transformUser(user) {
        return {
            id: user.id,
            companyId: user.companyId,
            email: user.email,
            isActive: user.isActive,
            isVerified: user.isVerified,
            firstName: user.firstName,
            lastName: user.lastName,
            position: user.position,
            department: user.department,
            permissions: user.permissions,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastLoginAt: user.lastLoginAt
        };
    }
};
exports.CompanyService = CompanyService;
exports.CompanyService = CompanyService = CompanyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CompanyService);
//# sourceMappingURL=company.service.js.map