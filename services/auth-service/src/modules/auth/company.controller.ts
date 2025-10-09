import { Controller, Post, Get, Put, Body, Param, Query, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { CompanyService } from './company.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  /**
   * Register a new company (public endpoint)
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async registerCompany(@Body() companyData: {
    name: string;
    email: string;
    password: string;
    description?: string;
  }) {
    return this.companyService.registerCompany(companyData);
  }

  /**
   * Login company (public endpoint)
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async loginCompany(
    @Body() credentials: { email: string; password: string },
    @Req() req: any,
  ) {
    return this.companyService.loginCompany(
      credentials,
      req.ip,
      req.get('User-Agent'),
    );
  }

  /**
   * Create a child company (employee company)
   */
  @Post(':companyId/child-companies')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company', 'admin')
  @HttpCode(HttpStatus.CREATED)
  async createChildCompany(
    @Param('companyId') companyId: string,
    @Body() companyData: {
      name: string;
      email: string;
      password: string;
      billingMode?: 'SELF_PAID' | 'PARENT_PAID';
      position?: string;
      department?: string;
      description?: string;
    }
  ) {
    return this.companyService.createChildCompany(companyId, companyData);
  }

  /**
   * Get company by ID
   */
  @Get(':companyId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company', 'admin')
  async getCompany(@Param('companyId') companyId: string) {
    return this.companyService.getCompany(companyId);
  }

  /**
   * Update company
   */
  @Put(':companyId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company', 'admin')
  async updateCompany(
    @Param('companyId') companyId: string,
    @Body() updateData: {
      name?: string;
      description?: string;
      isActive?: boolean;
    }
  ) {
    return this.companyService.updateCompany(companyId, updateData);
  }

  /**
   * Get child companies
   */
  @Get(':companyId/child-companies')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company', 'admin')
  async getChildCompanies(@Param('companyId') companyId: string) {
    return this.companyService.getChildCompanies(companyId);
  }

  /**
   * Get company hierarchy
   */
  @Get(':companyId/hierarchy')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company', 'admin')
  async getCompanyHierarchy(
    @Param('companyId') companyId: string,
    @Query('depth') depth?: number
  ) {
    return this.companyService.getCompanyHierarchy(companyId, depth || 3);
  }

  /**
   * Update billing mode
   */
  @Put(':companyId/billing-mode')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company', 'admin')
  async updateBillingMode(
    @Param('companyId') companyId: string,
    @Body() data: { billingMode: 'SELF_PAID' | 'PARENT_PAID' }
  ) {
    return this.companyService.updateBillingMode(companyId, data.billingMode);
  }

  /**
   * Get all companies (admin only)
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getAllCompanies() {
    return this.companyService.getAllCompanies();
  }

  /**
   * Get all users (admin only)
   */
  @Get('users/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getAllUsers() {
    return this.companyService.getAllCompanies();
  }

  /**
   * Create API key for company
   */
  @Post(':companyId/api-keys')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company', 'admin')
  @HttpCode(HttpStatus.CREATED)
  async createApiKey(
    @Param('companyId') companyId: string,
    @Body() apiKeyData: {
      name: string;
      description?: string;
      permissions?: string[];
      expiresAt?: string;
    }
  ) {
    return this.companyService.createCompanyApiKey(companyId, {
      ...apiKeyData,
      expiresAt: apiKeyData.expiresAt ? new Date(apiKeyData.expiresAt) : undefined,
    });
  }

  /**
   * Get company API keys
   */
  @Get(':companyId/api-keys')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company', 'admin')
  async getApiKeys(@Param('companyId') companyId: string) {
    return this.companyService.getCompanyApiKeys(companyId);
  }
}
