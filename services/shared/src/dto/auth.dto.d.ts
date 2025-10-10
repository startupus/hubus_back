export declare class RegisterDto {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
export declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
export declare class ResetPasswordRequestDto {
    email: string;
}
export declare class ResetPasswordDto {
    token: string;
    newPassword: string;
}
export declare class VerifyEmailDto {
    token: string;
}
export declare class CreateApiKeyDto {
    name: string;
    description?: string;
    permissions?: string[];
    expiresAt?: string;
}
export declare class UpdateApiKeyDto {
    name?: string;
    description?: string;
    permissions?: string[];
    isActive?: boolean;
}
export declare class AuthResponseDto {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
    user?: {
        id: string;
        email: string;
        role: string;
        isVerified: boolean;
    };
}
export declare class ApiKeyResponseDto {
    id: string;
    key: string;
    name: string;
    description?: string;
    isActive: boolean;
    permissions: string[];
    createdAt: string;
    lastUsedAt?: string;
    expiresAt?: string;
}
export declare class UserProfileDto {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
    lastLoginAt?: string;
}
