import { RegisterRequest, LoginRequest, AuthResponse, UserProfileResponse, ApiKeyResponse, CreateApiKeyRequest, ValidateTokenRequest, ValidateTokenResponse } from '../contracts/auth.contract';
export declare class AuthClient {
    private readonly AUTH_SERVICE_URL;
    private readonly axiosInstance;
    constructor();
    register(data: RegisterRequest): Promise<AuthResponse>;
    login(data: LoginRequest): Promise<AuthResponse>;
    getUserProfile(userId: string, accessToken: string): Promise<UserProfileResponse>;
    createApiKey(data: CreateApiKeyRequest, accessToken: string): Promise<ApiKeyResponse>;
    validateToken(data: ValidateTokenRequest): Promise<ValidateTokenResponse>;
}
