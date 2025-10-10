import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { LoggerUtil } from '@ai-aggregator/shared';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    LoggerUtil.debug('auth-service', 'JWT Guard activated', { 
      hasToken: !!token,
      tokenPrefix: token ? token.substring(0, 20) + '...' : 'none',
      url: request.url,
      method: request.method
    });

    if (!token) {
      LoggerUtil.warn('auth-service', 'JWT token not found', { 
        url: request.url,
        method: request.method,
        headers: Object.keys(request.headers)
      });
      throw new UnauthorizedException('Token not found');
    }

    try {
      const payload = this.jwtService.verify(token);
      LoggerUtil.debug('auth-service', 'JWT token validated successfully', { 
        sub: payload.sub,
        email: payload.email,
        role: payload.role
      });
      
      request.user = {
        sub: payload.sub,
        companyId: payload.sub, // Use sub as companyId for companies
        email: payload.email,
        role: payload.role
      };
      return true;
    } catch (error) {
      LoggerUtil.error('auth-service', 'JWT validation failed', error as Error, { 
        token: token.substring(0, 20) + '...',
        error: error instanceof Error ? error.message : String(error)
      });
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }
    
    const parts = authHeader.split(' ');
    const type = parts[0];
    const token = parts[1];
    
    LoggerUtil.debug('auth-service', 'Extracting token from header', { 
      authHeader: authHeader.substring(0, 20) + '...',
      type: type,
      token: token ? token.substring(0, 20) + '...' : 'none',
      hasToken: !!token,
      partsLength: parts.length
    });
    
    return type === 'Bearer' ? token : undefined;
  }
}
