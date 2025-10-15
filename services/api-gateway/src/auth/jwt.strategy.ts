import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private configService: ConfigService) {
        const jwtSecret = configService.get<string>('JWT_SECRET') || 'your-super-secret-jwt-key-here';
        console.log('JWT Strategy configuration:', {
          jwtSecret: jwtSecret,
          issuer: configService.get<string>('JWT_ISSUER') || 'ai-aggregator',
          audience: configService.get<string>('JWT_AUDIENCE') || 'ai-aggregator-users',
        });
        super({
          jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
          ignoreExpiration: false,
          secretOrKey: jwtSecret,
          issuer: configService.get<string>('JWT_ISSUER') || 'ai-aggregator',
          audience: configService.get<string>('JWT_AUDIENCE') || 'ai-aggregator-users',
        });
  }

  async validate(payload: any) {
    this.logger.debug('JWT payload received', { 
      payload: payload,
      hasSub: !!payload?.sub,
      sub: payload?.sub,
      email: payload?.email,
      role: payload?.role
    });

    if (!payload || !payload.sub) {
      this.logger.error('Invalid token payload', { payload });
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      type: payload.type || 'company',
      sessionId: payload.sessionId,
    };

    this.logger.debug('JWT user created', { user });
    return user;
  }
}
