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
exports.UserProfileDto = exports.ApiKeyResponseDto = exports.AuthResponseDto = exports.UpdateApiKeyDto = exports.CreateApiKeyDto = exports.VerifyEmailDto = exports.ResetPasswordDto = exports.ResetPasswordRequestDto = exports.ChangePasswordDto = exports.RefreshTokenDto = exports.LoginDto = exports.RegisterDto = void 0;
/**
 * Authentication DTOs
 */
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class RegisterDto {
    email;
    password;
    firstName;
    lastName;
}
exports.RegisterDto = RegisterDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'user@example.com', description: 'User email address' }),
    (0, class_validator_1.IsEmail)({}, { message: 'Invalid email format' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'password123', description: 'User password', minLength: 8, maxLength: 128 }),
    (0, class_validator_1.IsString)({ message: 'Password must be a string' }),
    (0, class_validator_1.MinLength)(8, { message: 'Password must be at least 8 characters long' }),
    (0, class_validator_1.MaxLength)(128, { message: 'Password must not exceed 128 characters' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'John', description: 'User first name', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'First name must be a string' }),
    (0, class_validator_1.MaxLength)(50, { message: 'First name must not exceed 50 characters' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Doe', description: 'User last name', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Last name must be a string' }),
    (0, class_validator_1.MaxLength)(50, { message: 'Last name must not exceed 50 characters' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "lastName", void 0);
class LoginDto {
    email;
    password;
}
exports.LoginDto = LoginDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'user@example.com', description: 'User email address' }),
    (0, class_validator_1.IsEmail)({}, { message: 'Invalid email format' }),
    __metadata("design:type", String)
], LoginDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'password123', description: 'User password' }),
    (0, class_validator_1.IsString)({ message: 'Password must be a string' }),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
class RefreshTokenDto {
    refreshToken;
}
exports.RefreshTokenDto = RefreshTokenDto;
class ChangePasswordDto {
    currentPassword;
    newPassword;
}
exports.ChangePasswordDto = ChangePasswordDto;
class ResetPasswordRequestDto {
    email;
}
exports.ResetPasswordRequestDto = ResetPasswordRequestDto;
class ResetPasswordDto {
    token;
    newPassword;
}
exports.ResetPasswordDto = ResetPasswordDto;
class VerifyEmailDto {
    token;
}
exports.VerifyEmailDto = VerifyEmailDto;
class CreateApiKeyDto {
    name;
    description;
    permissions;
    expiresAt;
}
exports.CreateApiKeyDto = CreateApiKeyDto;
class UpdateApiKeyDto {
    name;
    description;
    permissions;
    isActive;
}
exports.UpdateApiKeyDto = UpdateApiKeyDto;
class AuthResponseDto {
    accessToken;
    refreshToken;
    tokenType = 'Bearer';
    expiresIn;
    user;
}
exports.AuthResponseDto = AuthResponseDto;
class ApiKeyResponseDto {
    id;
    key;
    name;
    description;
    isActive;
    permissions;
    createdAt;
    lastUsedAt;
    expiresAt;
}
exports.ApiKeyResponseDto = ApiKeyResponseDto;
class UserProfileDto {
    id;
    email;
    role;
    isActive;
    isVerified;
    createdAt;
    updatedAt;
    lastLoginAt;
}
exports.UserProfileDto = UserProfileDto;
//# sourceMappingURL=auth.dto.js.map