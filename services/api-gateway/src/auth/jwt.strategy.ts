import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
        super({
          jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
          ignoreExpiration: false,
          secretOrKey: configService.get<string>('JWT_SECRET') || 'your-super-secret-jwt-key-here',
          issuer: configService.get<string>('JWT_ISSUER') || 'ai-aggregator',
          audience: configService.get<string>('JWT_AUDIENCE') || 'ai-aggregator-users',
        });
  }

  async validate(payload: any) {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      type: payload.type || 'company',
      sessionId: payload.sessionId,
    };
  }
}
