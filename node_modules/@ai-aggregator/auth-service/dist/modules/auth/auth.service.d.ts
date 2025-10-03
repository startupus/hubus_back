import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthResult, JwtPayload } from '@ai-aggregator/shared';
import { RegisterDto, LoginDto, ChangePasswordDto, ResetPasswordRequestDto, ResetPasswordDto, VerifyEmailDto } from '@ai-aggregator/shared';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly configService;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService);
    register(registerDto: RegisterDto): Promise<AuthResult>;
    login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResult>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    validateToken(token: string): Promise<JwtPayload | null>;
    changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void>;
    requestPasswordReset(requestPasswordResetDto: ResetPasswordRequestDto): Promise<void>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void>;
    verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<void>;
    logout(refreshToken: string): Promise<void>;
    private generateTokens;
    private mapUserToDto;
    private logFailedLoginAttempt;
    private logSecurityEvent;
}
