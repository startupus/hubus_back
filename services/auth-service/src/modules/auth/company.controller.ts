import { Controller, Post, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { CompanyService } from './company.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  /**
   * Register a new company
   */
  @Post('register')
  async registerCompany(@Body() companyData: {
    name: string;
    email: string;
    password: string;
    description?: string;
  }) {
    return this.companyService.registerCompany(companyData);
  }

  /**
   * Create a user within a company
   */
  @Post(':companyId/users')
  @Roles('company', 'admin')
  async createUser(
    @Param('companyId') companyId: string,
    @Body() userData: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      position?: string;
      department?: string;
    }
  ) {
    return this.companyService.createUser(companyId, userData);
  }

  /**
   * Get company by ID
   */
  @Get(':companyId')
  @Roles('company', 'admin')
  async getCompany(@Param('companyId') companyId: string) {
    return this.companyService.getCompany(companyId);
  }

  /**
   * Update company
   */
  @Put(':companyId')
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
   * Get company users
   */
  @Get(':companyId/users')
  @Roles('company', 'admin')
  async getCompanyUsers(@Param('companyId') companyId: string) {
    return this.companyService.getCompanyUsers(companyId);
  }

  /**
   * Get all companies (admin only)
   */
  @Get()
  @Roles('admin')
  async getAllCompanies() {
    return this.companyService.getAllCompanies();
  }

  /**
   * Get all users (admin only)
   */
  @Get('users/all')
  @Roles('admin')
  async getAllUsers() {
    return this.companyService.getAllUsers();
  }
}
