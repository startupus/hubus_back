import { Controller, Get, Query, Res, Req, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

@Controller('auth')
export class OAuthController {
  private readonly logger = new Logger(OAuthController.name);
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly frontendUrl: string;
  private readonly scopes: string[];

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly httpService: HttpService,
  ) {
    this.baseUrl = this.configService.get('LOGINUS_BASE_URL', 'https://loginus.startapus.com');
    this.clientId = this.configService.get('LOGINUS_CLIENT_ID');
    this.clientSecret = this.configService.get('LOGINUS_CLIENT_SECRET');
    this.redirectUri = this.configService.get('LOGINUS_REDIRECT_URI', 'http://localhost:3000/v1/auth/callback');
    this.frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:80');
    // Scopes согласно инструкции
    this.scopes = ['openid', 'email', 'profile', 'organizations', 'roles', 'permissions'];

    if (!this.clientId || !this.clientSecret) {
      this.logger.warn('Loginus OAuth credentials not configured. OAuth endpoints will not work.');
    }
  }

  /**
   * Перенаправляет пользователя на страницу авторизации Loginus
   * GET /v1/auth/login?force=true (опционально, для принудительного входа)
   */
  @Get('login')
  async login(
    @Query('force') force: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    if (!this.clientId || !this.clientSecret) {
      this.logger.error('OAuth not configured. Please set LOGINUS_CLIENT_ID and LOGINUS_CLIENT_SECRET environment variables.');
      throw new HttpException(
        'OAuth not configured. Please contact administrator to set up Loginus OAuth credentials.',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    try {
      // Генерируем state для защиты от CSRF
      const state = Math.random().toString(36).substring(7);
      const forceLogin = force === 'true';
      
      // Сохраняем state в cookie
      res.cookie('oauth_state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 600000, // 10 минут
        path: '/',
      });

      // Формируем URL для редиректа на Loginus согласно инструкции
      const params = new URLSearchParams({
        client_id: this.clientId,
        redirect_uri: this.redirectUri,
        response_type: 'code',
        scope: this.scopes.join(' '),
        state,
      });
      
      if (forceLogin) {
        params.append('prompt', 'login');
      }
      
      const authUrl = `${this.baseUrl}/ru/auth?${params.toString()}`;

      this.logger.log(`Initiating OAuth flow, redirecting to: ${authUrl}`);
      return res.redirect(302, authUrl);
    } catch (error: any) {
      this.logger.error('[OAuthController] Error generating auth URL:', error);
      throw new HttpException(
        'OAuth configuration error',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Обрабатывает callback от Loginus после авторизации
   * GET /v1/auth/callback?code=...&state=...
   */
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    // Проверяем наличие ошибки
    if (error) {
      this.logger.error(`[OAuthController] OAuth error from Loginus: ${error}`);
      return res.redirect(`${this.frontendUrl}/auth/error?error=${encodeURIComponent(error)}`);
    }

    // Проверяем state (защита от CSRF)
    const storedState = req.cookies?.oauth_state;
    if (!storedState || storedState !== state) {
      this.logger.error('Invalid state parameter - possible CSRF attack');
      return res.redirect(`${this.frontendUrl}/auth/error?error=${encodeURIComponent('invalid_state')}`);
    }

    // Очищаем cookie
    res.clearCookie('oauth_state', { path: '/' });

    if (!code) {
      this.logger.error('[OAuthController] No authorization code received');
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Missing authorization code',
      });
    }

    try {
      this.logger.log('[OAuthController] Exchanging authorization code for access token');
      
      // Обмениваем code на access token через AuthService
      const tokens = await this.authService.exchangeCodeForToken(code);
      
      if (!tokens.access_token) {
        throw new Error('No access_token received from Loginus API');
      }
      
      this.logger.log('[OAuthController] Getting user info from Loginus');
      
      // Получаем информацию о пользователе
      const userInfo = await this.authService.getUserInfo(tokens.access_token);
      
      this.logger.log(`[OAuthController] User info received: ${userInfo.id} (Email: ${userInfo.email || 'no-email'})`);
      
      // Логируем информацию об организациях и правах доступа
      if (userInfo.organizations && userInfo.organizations.length > 0) {
        const org = userInfo.organizations[0];
        this.logger.log(`[OAuthController] User organization: ${org.name} (ID: ${org.id}), Role: ${org.role?.name || 'N/A'}`);
        if (org.role?.permissions) {
          this.logger.log(`[OAuthController] User has ${org.role.permissions.length} permissions`);
        }
      }

      // Синхронизируем пользователя в нашем auth-service
      const jwtToken = await this.authService.syncUserFromLoginus(userInfo);

      this.logger.log('[OAuthController] User synchronized, redirecting to frontend with token');

      // Перенаправляем на фронтенд с токеном согласно инструкции
      // Фронтенд ожидает параметры: token, success
      const redirectUrl = `${this.frontendUrl}/?token=${jwtToken}&success=true`;
      return res.redirect(redirectUrl);
    } catch (error: any) {
      this.logger.error('[OAuthController] Error in callback:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'OAuth authentication failed';
      const errorRedirectUrl = `${this.frontendUrl}/auth/error?error=${encodeURIComponent(errorMessage)}`;
      return res.redirect(errorRedirectUrl);
    }
  }

  /**
   * Возвращает информацию о текущем пользователе (требует авторизации)
   * GET /v1/auth/userinfo
   */
  @Get('userinfo')
  async userinfo(@Req() req: Request) {
    // Получаем токен из заголовка Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpException('Missing or invalid authorization header', HttpStatus.UNAUTHORIZED);
    }
    
    const accessToken = authHeader.substring(7);
    return await this.authService.getUserInfo(accessToken);
  }
}
