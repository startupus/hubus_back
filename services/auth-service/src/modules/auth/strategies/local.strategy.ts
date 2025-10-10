import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { Company } from '@ai-aggregator/shared';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<Company> {
    const result = await this.authService.login({ email, password });
    
    if (!result.success || !result.company) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return result.company;
  }
}
