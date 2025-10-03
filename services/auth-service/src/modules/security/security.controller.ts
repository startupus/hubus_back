import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { SecurityService } from './security.service';

@ApiTags('Security')
@Controller('security')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Get('events')
  @ApiOperation({ summary: 'Get user security events' })
  @ApiResponse({ status: 200, description: 'Security events retrieved successfully' })
  async getSecurityEvents(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Req() req: Request
  ) {
    const userId = (req.user as any).sub;
    return this.securityService.getUserSecurityEvents(userId, page, limit);
  }

  @Get('login-attempts')
  @ApiOperation({ summary: 'Get user login attempts' })
  @ApiResponse({ status: 200, description: 'Login attempts retrieved successfully' })
  async getLoginAttempts(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Req() req: Request
  ) {
    const email = (req.user as any).email;
    return this.securityService.getUserLoginAttempts(email, page, limit);
  }
}
