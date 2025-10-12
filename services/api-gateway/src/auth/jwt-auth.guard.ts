import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(context: ExecutionContext) {
    this.logger.log('JwtAuthGuard canActivate called');
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    this.logger.log(`JwtAuthGuard handleRequest - err: ${err}, user: ${!!user}, info: ${info}`);
    if (err || !user) {
      this.logger.error(`Authentication failed: ${err?.message || info?.message || 'Unknown error'}`);
      throw err || new Error(info?.message || 'Unauthorized');
    }
    return user;
  }
}
