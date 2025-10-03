import { Controller, Get, Put, Delete, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { UserService } from './user.service';
import { UserProfileDto } from '@ai-aggregator/shared';

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully', type: UserProfileDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getProfile(@Req() req: Request) {
    const userId = (req.user as any).sub;
    return this.userService.getUserById(userId);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'User profile updated successfully', type: UserProfileDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateProfile(@Body() updateData: Partial<UserProfileDto>, @Req() req: Request) {
    const userId = (req.user as any).sub;
    return this.userService.updateUser(userId, updateData as any);
  }

  @Delete('account')
  @ApiOperation({ summary: 'Delete user account' })
  @ApiResponse({ status: 200, description: 'User account deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteAccount(@Req() req: Request) {
    const userId = (req.user as any).sub;
    return this.userService.deleteUser(userId);
  }
}
