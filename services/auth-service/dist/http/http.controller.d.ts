import { AuthService } from '../modules/auth/auth.service';
import { ApiKeyService } from '../modules/api-key/api-key.service';
import { UserService } from '../modules/user/user.service';
import { RegisterDto, LoginDto } from '@ai-aggregator/shared';
export declare class HttpController {
    private readonly authService;
    private readonly apiKeyService;
    private readonly userService;
    constructor(authService: AuthService, apiKeyService: ApiKeyService, userService: UserService);
    createUser(data: RegisterDto): Promise<{
        success: boolean;
        user: {
            id: string;
            email: string;
            isActive: boolean;
            isVerified: boolean;
            role: import("@ai-aggregator/shared").UserRole;
            firstName: string;
            lastName: string;
            createdAt: string;
            updatedAt: string;
        };
        error: string;
    } | {
        success: boolean;
        error: string;
        user?: undefined;
    }>;
    getUser(id?: string, email?: string): Promise<{
        success: boolean;
        error: string;
        user?: undefined;
    } | {
        success: boolean;
        user: {
            id: any;
            email: any;
            isActive: any;
            isVerified: any;
            role: any;
            firstName: any;
            lastName: any;
            createdAt: any;
            updatedAt: any;
            lastLoginAt: any;
        };
        error?: undefined;
    }>;
    login(data: LoginDto, req: any): Promise<{
        success: boolean;
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            isActive: boolean;
            isVerified: boolean;
            role: import("@ai-aggregator/shared").UserRole;
            firstName: any;
            lastName: any;
            createdAt: string;
            updatedAt: string;
            lastLoginAt: string;
        };
        error: string;
        requiresVerification: boolean;
    } | {
        success: boolean;
        error: string;
        accessToken?: undefined;
        refreshToken?: undefined;
        user?: undefined;
        requiresVerification?: undefined;
    }>;
    validateToken(data: any): Promise<{
        success: boolean;
        authContext: {
            userId: string;
            email: string;
            role: string;
            permissions: import("@ai-aggregator/shared").Permission[];
            apiKeyId: any;
        };
        error: string;
    } | {
        success: boolean;
        authContext: {
            userId: string;
            email: string;
            role: import("@ai-aggregator/shared").UserRole;
            permissions: any[];
            apiKeyId?: undefined;
        };
        error: string;
    } | {
        success: boolean;
        error: string;
        authContext?: undefined;
    }>;
    createApiKey(data: any, req: any): Promise<{
        success: boolean;
        apiKey: {
            id: string;
            key: string;
            userId: string;
            name: string;
            description: string;
            isActive: boolean;
            permissions: import("@ai-aggregator/shared").Permission[];
            lastUsedAt: string;
            expiresAt: string;
            createdAt: string;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        apiKey?: undefined;
    }>;
    validateApiKey(data: any): Promise<{
        success: boolean;
        authContext: {
            userId: string;
            email: string;
            role: string;
            permissions: import("@ai-aggregator/shared").Permission[];
            apiKeyId: any;
        };
        error: string;
    } | {
        success: boolean;
        error: string;
        authContext?: undefined;
    }>;
}
