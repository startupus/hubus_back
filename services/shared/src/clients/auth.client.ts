/**
 * HTTP Client for Auth Service
 * Клиент для взаимодействия с auth-service через HTTP API
 */

import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { 
  RegisterRequest, 
  LoginRequest, 
  AuthResponse, 
  UserProfileResponse,
  ApiKeyResponse,
  CreateApiKeyRequest,
  ValidateTokenRequest,
  ValidateTokenResponse
} from '../contracts/auth.contract';

@Injectable()
export class AuthClient {
  private readonly AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
  private readonly axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 10000,
      maxRedirects: 3,
    });
  }

  /**
   * Регистрация пользователя
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.axiosInstance.post<AuthResponse>(`${this.AUTH_SERVICE_URL}/auth/register`, data);
    return response.data;
  }

  /**
   * Авторизация пользователя
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.axiosInstance.post<AuthResponse>(`${this.AUTH_SERVICE_URL}/auth/login`, data);
    return response.data;
  }

  /**
   * Получение профиля пользователя
   */
  async getUserProfile(userId: string, accessToken: string): Promise<UserProfileResponse> {
    const response = await this.axiosInstance.get<UserProfileResponse>(`${this.AUTH_SERVICE_URL}/users/${userId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data;
  }

  /**
   * Создание API ключа
   */
  async createApiKey(data: CreateApiKeyRequest, accessToken: string): Promise<ApiKeyResponse> {
    const response = await this.axiosInstance.post<ApiKeyResponse>(`${this.AUTH_SERVICE_URL}/api-keys`, data, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data;
  }

  /**
   * Валидация токена
   */
  async validateToken(data: ValidateTokenRequest): Promise<ValidateTokenResponse> {
    const response = await this.axiosInstance.post<ValidateTokenResponse>(`${this.AUTH_SERVICE_URL}/auth/validate`, data);
    return response.data;
  }
}
