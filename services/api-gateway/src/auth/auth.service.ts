import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto, LoginDto, AuthResponseDto, CreateApiKeyDto } from '@ai-aggregator/shared';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly authServiceUrl: string;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.authServiceUrl = this.configService.get('AUTH_SERVICE_URL', 'http://auth-service:3001');
  }

  async register(registerDto: RegisterDto, referralCode?: string): Promise<AuthResponseDto> {
    try {
      // Map RegisterDto to company registration format
      const companyData = {
        name: `${registerDto.firstName} ${registerDto.lastName}`.trim() || 'Default Company',
        email: registerDto.email,
        password: registerDto.password,
        description: `Company for ${registerDto.firstName} ${registerDto.lastName}`.trim(),
        referralCode: referralCode
      };

      const response: AxiosResponse = await firstValueFrom(
        this.httpService.post(`${this.authServiceUrl}/auth/register`, companyData)
      );

      // Auth-service returns company registration result
      const result = response.data;
      
      // Auth-service returns { company, token, refreshToken } on success
      if (!result.company || !result.token) {
        throw new HttpException('Registration failed - invalid response format', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return {
        accessToken: result.token,
        refreshToken: result.refreshToken,
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: {
          id: result.company.id,
          email: result.company.email,
          role: result.company.role,
          isVerified: result.company.isVerified,
        },
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error.response?.status === 409) {
        throw new HttpException('User with this email already exists', HttpStatus.CONFLICT);
      }
      throw new HttpException('Registration failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    try {
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.post(`${this.authServiceUrl}/auth/login`, loginDto)
      );

      // Auth-service returns company login result
      const result = response.data;
      
      // Auth-service returns { company, token, refreshToken } on success
      if (!result.company || !result.token) {
        throw new HttpException('Login failed - invalid credentials', HttpStatus.UNAUTHORIZED);
      }

      return {
        accessToken: result.token,
        refreshToken: result.refreshToken,
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: {
          id: result.company.id,
          email: result.company.email,
          role: result.company.role,
          isVerified: result.company.isVerified,
        },
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error.response?.status === 401) {
        throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
      }
      throw new HttpException('Login failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  async createApiKey(createApiKeyDto: CreateApiKeyDto, user: any, req?: any): Promise<any> {
    try {
      // Get token from Authorization header
      const authHeader = req?.headers?.authorization;
      if (!authHeader) {
        throw new HttpException('Authorization header missing', HttpStatus.UNAUTHORIZED);
      }

      const response = await firstValueFrom(
        this.httpService.post(`${this.authServiceUrl}/auth/api-keys`, createApiKeyDto, {
          headers: {
            'Authorization': authHeader
          }
        })
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 409) {
        throw new HttpException('API key with this name already exists', HttpStatus.CONFLICT);
      }
      throw new HttpException('Failed to create API key', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getApiKeys(user: any, req?: any): Promise<any> {
    try {
      // Get token from Authorization header
      const authHeader = req?.headers?.authorization;
      if (!authHeader) {
        throw new HttpException('Authorization header missing', HttpStatus.UNAUTHORIZED);
      }

      const response = await firstValueFrom(
        this.httpService.get(`${this.authServiceUrl}/auth/api-keys`, {
          headers: {
            'Authorization': authHeader
          }
        })
      );
      return response.data;
    } catch (error: any) {
      throw new HttpException('Failed to get API keys', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async revokeApiKey(keyId: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.delete(`${this.authServiceUrl}/auth/api-keys/${keyId}`)
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new HttpException('API key not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException('Failed to revoke API key', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Обменивает authorization code на access token
   * ⚠️ ВАЖНО: Loginus может возвращать ответ в обернутом формате: { success: true, data: { ... } }
   */
  async exchangeCodeForToken(code: string): Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token?: string;
  }> {
    const baseUrl = this.configService.get('LOGINUS_BASE_URL', 'https://loginus.startapus.com');
    const clientId = this.configService.get('LOGINUS_CLIENT_ID');
    const clientSecret = this.configService.get('LOGINUS_CLIENT_SECRET');
    const redirectUri = this.configService.get('LOGINUS_REDIRECT_URI', 'http://localhost:3000/v1/auth/callback');

    if (!clientId || !clientSecret) {
      throw new HttpException('OAuth not configured', HttpStatus.SERVICE_UNAVAILABLE);
    }

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const tokenUrl = `${baseUrl}/api/oauth/token`;
    
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          tokenUrl,
          params.toString(),
          {
            headers: { 
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json',
            },
          }
        ),
      );
      
      // Loginus может возвращать токен в разных форматах:
      // 1. Прямой: { access_token: "...", token_type: "Bearer", ... }
      // 2. Обернутый: { success: true, data: { access_token: "...", ... } }
      // 3. CamelCase: { accessToken: "...", ... }
      const responseData = response.data?.data || response.data;
      
      // Проверяем наличие токена (поддерживаем оба формата: snake_case и camelCase)
      const token = responseData?.access_token || responseData?.accessToken;
      if (!token) {
        this.logger.error('[AuthService.exchangeCodeForToken] No token found in response! Response:', response.data);
        throw new Error('No access token in response from Loginus API');
      }
      
      // Нормализуем ответ: всегда возвращаем access_token (snake_case)
      return {
        access_token: token,
        token_type: responseData?.token_type || responseData?.tokenType || 'Bearer',
        expires_in: responseData?.expires_in || responseData?.expiresIn || 3600,
        refresh_token: responseData?.refresh_token || responseData?.refreshToken,
      };
    } catch (error: any) {
      this.logger.error('[AuthService.exchangeCodeForToken] Error:', {
        status: error?.response?.status,
        message: error?.message,
        data: error?.response?.data,
      });
      throw new HttpException(
        error?.response?.data?.error_description || error?.message || 'Failed to exchange code for token',
        error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Получает информацию о пользователе по access token
   * ⚠️ ВАЖНО: Loginus может возвращать ответ в обернутом формате: { success: true, data: { ... } }
   */
  async getUserInfo(accessToken: string): Promise<any> {
    if (!accessToken || accessToken === 'undefined' || accessToken.trim() === '') {
      throw new HttpException('Invalid or missing access token', HttpStatus.UNAUTHORIZED);
    }
    
    const baseUrl = this.configService.get('LOGINUS_BASE_URL', 'https://loginus.startapus.com');
    
    try {
      const userInfoUrl = `${baseUrl}/api/oauth/userinfo`;
      
      const response = await firstValueFrom(
        this.httpService.get(userInfoUrl, {
          headers: { 
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        }),
      );
      
      // Loginus может возвращать userinfo в обернутом формате: { success: true, data: { ... } }
      const userInfoData = response.data?.data || response.data;
      
      if (!userInfoData || !userInfoData.id) {
        this.logger.error('[AuthService.getUserInfo] Invalid user info response:', response.data);
        throw new HttpException('Invalid user info response from Loginus', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      
      return userInfoData;
    } catch (error: any) {
      this.logger.error('[AuthService.getUserInfo] Error:', {
        status: error?.response?.status,
        message: error?.message,
        data: error?.response?.data,
      });
      throw new HttpException(
        error?.response?.data?.error || error?.message || 'Invalid or expired access token',
        error?.response?.status || HttpStatus.UNAUTHORIZED
      );
    }
  }

  async syncUserFromLoginus(userInfo: any): Promise<string> {
    try {
      // Обработка данных пользователя согласно новому формату Loginus
      // Согласно инструкции: id, email, firstName, lastName, phone, isVerified, organizationId
      const userEmail = userInfo.email;
      const displayName = `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() || 
                         userInfo.email || 
                         `User ${userInfo.id.substring(0, 8)}`;
      
      // Если email отсутствует, генерируем псевдо-email на основе ID
      const finalEmail = userEmail || `user_${userInfo.id.replace(/-/g, '')}@loginus.local`;

      this.logger.log(`Syncing user from Loginus: ${finalEmail} (ID: ${userInfo.id})`);

      // Проверяем, существует ли пользователь в нашей системе
      // Если email null, используем псевдо-email на основе ID
      let user;
      try {
        // Сначала пробуем по email (если есть реальный email)
        if (userEmail && !this.isPseudoEmail(finalEmail)) {
          try {
            const checkResponse = await firstValueFrom(
              this.httpService.get(`${this.authServiceUrl}/auth/user`, {
                params: { email: finalEmail }
              })
            );
            // Проверяем формат ответа - может быть success: true/user или прямо user
            if (checkResponse.data.success && checkResponse.data.user) {
              user = checkResponse.data.user;
            } else if (checkResponse.data.user) {
              user = checkResponse.data.user;
            } else if (checkResponse.data.id) {
              // Если вернулся объект напрямую
              user = checkResponse.data;
            } else {
              throw new Error('Invalid response format from auth-service');
            }
            this.logger.log(`User found in system by email: ${user.id}`);
          } catch (checkError: any) {
            // Если 404 или другая ошибка - пользователь не найден
            if (checkError.response?.status === 404) {
              throw new Error('User not found by email, will create new');
            }
            // Если другая ошибка (например, неверный формат ответа), логируем и пробуем создать
            this.logger.warn(`Error checking user by email: ${checkError.message}. Will try to create new user.`);
            throw new Error('User not found by email, will create new');
          }
        } else {
          // Если email псевдо-email или null, создаем нового пользователя
          throw new Error('User not found by email, will create new');
        }
      } catch (error: any) {
        // Пользователь не существует - создаем нового
        if (error.response?.status === 404 || error.message === 'User not found by email, will create new') {
          this.logger.log(`User not found, creating new user: ${finalEmail}`);
          
          const registerData = {
            name: displayName,
            email: finalEmail,
            password: crypto.randomBytes(32).toString('hex'), // Генерируем случайный пароль
            description: `User from Loginus: ${displayName}`,
            firstName: userInfo.firstName || '',
            lastName: userInfo.lastName || '',
          };

          this.logger.log(`Registering user with data:`, { 
            email: finalEmail, 
            name: displayName,
            hasEmail: !!userInfo.email,
            isPseudoEmail: this.isPseudoEmail(finalEmail)
          });

          const registerResponse = await firstValueFrom(
            this.httpService.post(`${this.authServiceUrl}/auth/register`, registerData)
          );

          user = registerResponse.data.company;
          this.logger.log(`New user created: ${user.id}`);
        } else {
          throw error;
        }
      }

      // Генерируем JWT токен для нашего сервиса
      // Включаем информацию о правах доступа из Loginus, если доступна
      const orgPermissions = userInfo.organizations?.[0]?.role?.permissions || [];
      const allPermissions = userInfo.allPermissions || orgPermissions;
      
      const token = this.jwtService.sign(
        {
          sub: user.id,
          email: user.email || finalEmail,
          role: user.role || 'user',
          type: 'company',
          // Сохраняем информацию о правах доступа из Loginus
          permissions: allPermissions.map((p: any) => p.name),
          organizationId: userInfo.organizationId,
        },
        { 
          expiresIn: '24h',
          issuer: this.configService.get('JWT_ISSUER') || 'ai-aggregator',
          audience: this.configService.get('JWT_AUDIENCE') || 'ai-aggregator-users',
        }
      );

      this.logger.log(`JWT token generated for user: ${user.id} (${user.email || finalEmail})`);
      return token;
    } catch (error: any) {
      this.logger.error('Failed to sync user from Loginus:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to sync user from Loginus', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Генерирует псевдо-email для пользователей без email
   * Согласно новому формату Loginus, используем только ID пользователя
   */
  private generatePseudoEmail(userInfo: any): string {
    // Используем ID пользователя для генерации псевдо-email
    // Формат: user_{id}@loginus.local (убираем дефисы из UUID)
    const cleanId = userInfo.id?.replace(/-/g, '') || 'unknown';
    return `user_${cleanId.substring(0, 16)}@loginus.local`;
  }

  /**
   * Проверяет, является ли email псевдо-email
   */
  private isPseudoEmail(email: string): boolean {
    if (!email) return true;
    const pseudoDomains = ['@telegram.local', '@github.local', '@loginus.local'];
    return pseudoDomains.some(domain => email.endsWith(domain));
  }
}

