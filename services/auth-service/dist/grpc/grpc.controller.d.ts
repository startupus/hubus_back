import { AuthService } from '../modules/auth/auth.service';
import { ApiKeyService } from '../modules/api-key/api-key.service';
import { UserService } from '../modules/user/user.service';
export declare class GrpcController {
    private readonly authService;
    private readonly apiKeyService;
    private readonly userService;
    constructor(authService: AuthService, apiKeyService: ApiKeyService, userService: UserService);
    createUser(data: any): Promise<{
        success: boolean;
        user: {
            id: string;
            email: string;
            is_active: boolean;
            is_verified: boolean;
            role: import("@ai-aggregator/shared").UserRole;
            first_name: any;
            last_name: any;
            created_at: string;
            updated_at: string;
        };
        error: string;
    } | {
        success: boolean;
        error: string;
        user?: undefined;
    }>;
    getUser(data: any): Promise<{
        success: boolean;
        error: string;
        user?: undefined;
    } | {
        success: boolean;
        user: {
            id: any;
            email: any;
            is_active: any;
            is_verified: any;
            role: any;
            first_name: any;
            last_name: any;
            created_at: any;
            updated_at: any;
            last_login_at: any;
        };
        error?: undefined;
    }>;
    login(data: any): Promise<{
        success: boolean;
        access_token: string;
        refresh_token: string;
        user: {
            id: string;
            email: string;
            is_active: boolean;
            is_verified: boolean;
            role: import("@ai-aggregator/shared").UserRole;
            first_name: any;
            last_name: any;
            created_at: string;
            updated_at: string;
            last_login_at: string;
        };
        error: string;
        requires_verification: boolean;
    } | {
        success: boolean;
        error: string;
        access_token?: undefined;
        refresh_token?: undefined;
        user?: undefined;
        requires_verification?: undefined;
    }>;
    validateToken(data: any): Promise<{
        success: boolean;
        auth_context: {
            user_id: string;
            email: string;
            role: string;
            permissions: import("@ai-aggregator/shared").Permission[];
            api_key_id: any;
        };
        error: string;
    } | {
        success: boolean;
        auth_context: {
            user_id: string;
            email: string;
            role: import("@ai-aggregator/shared").UserRole;
            permissions: any[];
            api_key_id?: undefined;
        };
        error: string;
    } | {
        success: boolean;
        error: string;
        auth_context?: undefined;
    }>;
    createApiKey(data: any): Promise<{
        success: boolean;
        api_key: {
            id: string;
            key: string;
            user_id: string;
            name: string;
            description: string;
            is_active: boolean;
            permissions: import("@ai-aggregator/shared").Permission[];
            last_used_at: string;
            expires_at: string;
            created_at: string;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        api_key?: undefined;
    }>;
    validateApiKey(data: any): Promise<{
        success: boolean;
        auth_context: {
            user_id: string;
            email: string;
            role: string;
            permissions: import("@ai-aggregator/shared").Permission[];
            api_key_id: any;
        };
        error: string;
    } | {
        success: boolean;
        error: string;
        auth_context?: undefined;
    }>;
}
