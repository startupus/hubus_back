export interface RegisterRequest {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export interface UserProfileResponse {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
}
export interface ApiKeyResponse {
    id: string;
    key: string;
    name: string;
    isActive: boolean;
    createdAt: string;
    expiresAt: string;
}
export interface CreateApiKeyRequest {
    name: string;
    expiresAt?: string;
}
export interface ValidateTokenRequest {
    token: string;
}
export interface ValidateTokenResponse {
    valid: boolean;
    userId?: string;
    email?: string;
    expiresAt?: string;
}
