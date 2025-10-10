import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { RegisterDto, LoginDto, AuthResponseDto } from '@ai-aggregator/shared';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

@Injectable()
export class AuthService {
  private readonly authServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
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
        this.httpService.post(`${this.authServiceUrl}/companies/register`, companyData)
      );

      // Auth-service returns company registration result
      const result = response.data;
      
      // Auth-service returns { company, accessToken, refreshToken } on success
      if (!result.company || !result.accessToken) {
        throw new HttpException('Registration failed - invalid response format', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return {
        accessToken: result.accessToken,
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
        this.httpService.post(`${this.authServiceUrl}/companies/login`, loginDto)
      );

      // Auth-service returns company login result
      const result = response.data;
      
      // Auth-service returns { company, accessToken, refreshToken } on success
      if (!result.company || !result.accessToken) {
        throw new HttpException('Login failed - invalid credentials', HttpStatus.UNAUTHORIZED);
      }

      return {
        accessToken: result.accessToken,
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

  async createApiKey(createApiKeyDto: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.authServiceUrl}/auth/api-keys`, createApiKeyDto)
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 409) {
        throw new HttpException('API key with this name already exists', HttpStatus.CONFLICT);
      }
      throw new HttpException('Failed to create API key', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getApiKeys(getApiKeysDto: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.authServiceUrl}/auth/api-keys`, {
          params: { userId: getApiKeysDto.userId }
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
}

