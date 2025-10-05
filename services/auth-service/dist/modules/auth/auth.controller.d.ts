import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, ChangePasswordDto, ResetPasswordRequestDto, ResetPasswordDto, VerifyEmailDto } from '@ai-aggregator/shared';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<AuthResult>;
    login(loginDto: LoginDto, req: Request): Promise<AuthResult>;
    logout(refreshToken: string): Promise<void>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    changePassword(changePasswordDto: ChangePasswordDto, req: Request): Promise<void>;
    requestPasswordReset(requestPasswordResetDto: ResetPasswordRequestDto): Promise<void>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void>;
    verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<void>;
    getProfile(req: Request): Promise<{
        userId: any;
    }>;
    createApiKey(body: {
        name: string;
    }, req: Request): Promise<any>;
    getApiKeys(req: Request): Promise<any>;
    revokeApiKey(keyId: string, req: Request): Promise<any>;
}
