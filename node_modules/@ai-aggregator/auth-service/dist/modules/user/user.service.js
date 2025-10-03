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
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const shared_1 = require("@ai-aggregator/shared");
let UserService = class UserService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getUserById(userId) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            return this.mapUserToDto(user);
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Failed to get user by ID', error, { userId });
            throw error;
        }
    }
    async getUserByEmail(email) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { email },
            });
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            return this.mapUserToDto(user);
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Failed to get user by email', error, { email });
            throw error;
        }
    }
    async updateUser(userId, updateData) {
        try {
            const user = await this.prisma.user.update({
                where: { id: userId },
                data: {
                    firstName: updateData.firstName,
                    lastName: updateData.lastName,
                    metadata: updateData.metadata,
                },
            });
            shared_1.LoggerUtil.info('auth-service', 'User updated', { userId });
            return this.mapUserToDto(user);
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Failed to update user', error, { userId });
            throw error;
        }
    }
    async deactivateUser(userId) {
        try {
            await this.prisma.user.update({
                where: { id: userId },
                data: { isActive: false },
            });
            await this.prisma.apiKey.updateMany({
                where: { userId },
                data: { isActive: false },
            });
            await this.prisma.refreshToken.updateMany({
                where: { userId },
                data: { isRevoked: true },
            });
            shared_1.LoggerUtil.info('auth-service', 'User deactivated', { userId });
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Failed to deactivate user', error, { userId });
            throw error;
        }
    }
    async deleteUser(userId) {
        try {
            await this.prisma.user.delete({
                where: { id: userId },
            });
            shared_1.LoggerUtil.info('auth-service', 'User deleted', { userId });
        }
        catch (error) {
            shared_1.LoggerUtil.error('auth-service', 'Failed to delete user', error, { userId });
            throw error;
        }
    }
    mapUserToDto(user) {
        return {
            id: user.id,
            email: user.email,
            passwordHash: user.passwordHash,
            isActive: user.isActive,
            isVerified: user.isVerified,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastLoginAt: user.lastLoginAt,
            metadata: user.metadata,
        };
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserService);
//# sourceMappingURL=user.service.js.map