/**
 * HTTP Client for Auth Service
 * Клиент для взаимодействия с auth-service через HTTP API
 */
import { RegisterRequest, LoginRequest, AuthResponse, UserProfileResponse, ApiKeyResponse, CreateApiKeyRequest, ValidateTokenRequest, ValidateTokenResponse } from '../contracts/auth.contract';
export declare class AuthClient {
    private readonly AUTH_SERVICE_URL;
    private readonly axiosInstance;
    constructor();
    /**
     * Регистрация пользователя
     */
    register(data: RegisterRequest): Promise<AuthResponse>;
    /**
     * Авторизация пользователя
     */
    login(data: LoginRequest): Promise<AuthResponse>;
    /**
     * Получение профиля пользователя
     */
    getUserProfile(userId: string, accessToken: string): Promise<UserProfileResponse>;
    /**
     * Создание API ключа
     */
    createApiKey(data: CreateApiKeyRequest, accessToken: string): Promise<ApiKeyResponse>;
    /**
     * Валидация токена
     */
    validateToken(data: ValidateTokenRequest): Promise<ValidateTokenResponse>;
}
//# sourceMappingURL=auth.client.d.ts.map