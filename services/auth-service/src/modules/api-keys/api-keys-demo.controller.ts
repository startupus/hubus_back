import { Controller, Get, Post, Body, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ApiKeyAuthGuard } from '../auth/guards/api-key-auth.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@ApiTags('api-keys-demo')
@Controller('api-keys-demo')
export class ApiKeysDemoController {
  
  @Get('public')
  @ApiOperation({ summary: 'Public endpoint - no authentication required' })
  @ApiResponse({ status: 200, description: 'Public data returned successfully' })
  async getPublicData() {
    return {
      message: 'This is public data - no authentication required',
      timestamp: new Date().toISOString(),
      data: {
        version: '1.0.0',
        status: 'active'
      }
    };
  }

  @Get('protected-jwt')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Protected endpoint - JWT authentication required' })
  @ApiResponse({ status: 200, description: 'Protected data returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  async getProtectedJWTData(@Request() req) {
    return {
      message: 'This is protected data - JWT authentication required',
      timestamp: new Date().toISOString(),
      user: {
        companyId: req.user.companyId,
        email: req.user.email,
        role: req.user.role,
        authType: 'jwt'
      },
      data: {
        companyInfo: 'Sensitive company data',
        permissions: ['read', 'write']
      }
    };
  }

  @Get('protected-api-key')
  @UseGuards(ApiKeyAuthGuard)
  @ApiOperation({ summary: 'Protected endpoint - API key authentication required' })
  @ApiResponse({ status: 200, description: 'Protected data returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - API key required' })
  async getProtectedApiKeyData(@Request() req) {
    return {
      message: 'This is protected data - API key authentication required',
      timestamp: new Date().toISOString(),
      user: {
        companyId: req.user.companyId,
        permissions: req.user.permissions,
        authType: req.user.authType
      },
      data: {
        companyInfo: 'Sensitive company data accessible via API key',
        apiKeyPermissions: req.user.permissions,
        integration: {
          status: 'active',
          lastAccess: new Date().toISOString()
        }
      }
    };
  }

  @Post('send-message')
  @UseGuards(ApiKeyAuthGuard)
  @ApiOperation({ summary: 'Send message - API key authentication required' })
  @ApiResponse({ status: 200, description: 'Message sent successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - API key required' })
  async sendMessage(@Request() req, @Body() body: { message: string; recipient: string }) {
    return {
      message: 'Message sent successfully',
      timestamp: new Date().toISOString(),
      sender: {
        companyId: req.user.companyId,
        permissions: req.user.permissions
      },
      messageData: {
        content: body.message,
        recipient: body.recipient,
        status: 'delivered'
      }
    };
  }

  @Get('company-stats')
  @UseGuards(ApiKeyAuthGuard)
  @ApiOperation({ summary: 'Get company statistics - API key authentication required' })
  @ApiResponse({ status: 200, description: 'Company statistics returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - API key required' })
  async getCompanyStats(@Request() req) {
    return {
      message: 'Company statistics retrieved successfully',
      timestamp: new Date().toISOString(),
      companyId: req.user.companyId,
      stats: {
        totalApiKeys: 3,
        activeApiKeys: 2,
        lastActivity: new Date().toISOString(),
        monthlyUsage: {
          requests: 1250,
          tokens: 45000
        }
      }
    };
  }
}
