import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CompanyService, CreateCompanyRequest, CreateUserRequest } from './company.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

@ApiTags('Company Management')
@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new company' })
  @ApiResponse({ status: 201, description: 'Company registered successfully' })
  @ApiResponse({ status: 409, description: 'Company with this email already exists' })
  async registerCompany(@Body() data: CreateCompanyRequest) {
    return this.companyService.createCompany(data);
  }

  @Post('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company', 'admin', 'fsb')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create user in company' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  @ApiResponse({ status: 409, description: 'User with this email already exists' })
  async createUser(@Body() data: CreateUserRequest, @Request() req: any) {
    // Если это компания, используем её ID
    if (req.user.ownerType === 'company') {
      data.companyId = req.user.id;
    }
    
    return this.companyService.createUser(data);
  }

  @Post('auth')
  @ApiOperation({ summary: 'Authenticate company or user' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 400, description: 'Invalid credentials' })
  async authenticate(@Body() body: { email: string; password: string }) {
    return this.companyService.authenticate(body.email, body.password);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current company/user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getProfile(@Request() req: any) {
    if (req.user.ownerType === 'company') {
      return this.companyService.getCompanyById(req.user.id);
    } else {
      return this.companyService.getUserById(req.user.id);
    }
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company', 'admin', 'fsb')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get company users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiQuery({ name: 'companyId', required: false, description: 'Company ID (required for admin/fsb)' })
  async getCompanyUsers(
    @Query('companyId') companyId?: string,
    @Request() req?: any
  ) {
    // Если это компания, используем её ID
    if (req.user.ownerType === 'company') {
      companyId = req.user.id;
    }
    
    if (!companyId) {
      throw new Error('Company ID is required');
    }
    
    return this.companyService.getCompanyUsers(companyId);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'fsb')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all companies (admin/fsb only)' })
  @ApiResponse({ status: 200, description: 'Companies retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin/fsb only' })
  async getAllCompanies() {
    return this.companyService.getAllCompanies();
  }

  @Get('users/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'fsb')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users (admin/fsb only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin/fsb only' })
  async getAllUsers() {
    return this.companyService.getAllUsers();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company', 'admin', 'fsb')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get company by ID' })
  @ApiResponse({ status: 200, description: 'Company retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async getCompanyById(@Param('id') id: string, @Request() req: any) {
    // Если это компания, проверяем что запрашивает свою информацию
    if (req.user.ownerType === 'company' && req.user.id !== id) {
      throw new Error('Forbidden - can only access own company');
    }
    
    return this.companyService.getCompanyById(id);
  }

  @Get('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company', 'admin', 'fsb')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id') id: string, @Request() req: any) {
    // Если это пользователь, проверяем что запрашивает свою информацию
    if (req.user.ownerType === 'user' && req.user.id !== id) {
      throw new Error('Forbidden - can only access own profile');
    }
    
    // Если это компания, проверяем что пользователь принадлежит этой компании
    if (req.user.ownerType === 'company') {
      const user = await this.companyService.getUserById(id);
      if (user.companyId !== req.user.id) {
        throw new Error('Forbidden - user does not belong to your company');
      }
    }
    
    return this.companyService.getUserById(id);
  }

  @Put('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company', 'admin', 'fsb')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(
    @Param('id') id: string,
    @Body() updates: any,
    @Request() req: any
  ) {
    // Если это пользователь, проверяем что обновляет свою информацию
    if (req.user.ownerType === 'user' && req.user.id !== id) {
      throw new Error('Forbidden - can only update own profile');
    }
    
    // Если это компания, проверяем что пользователь принадлежит этой компании
    if (req.user.ownerType === 'company') {
      const user = await this.companyService.getUserById(id);
      if (user.companyId !== req.user.id) {
        throw new Error('Forbidden - user does not belong to your company');
      }
    }
    
    return this.companyService.updateUser(id, updates);
  }

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company', 'admin', 'fsb')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('id') id: string, @Request() req: any) {
    // Если это компания, проверяем что пользователь принадлежит этой компании
    if (req.user.ownerType === 'company') {
      const user = await this.companyService.getUserById(id);
      if (user.companyId !== req.user.id) {
        throw new Error('Forbidden - user does not belong to your company');
      }
    }
    
    return this.companyService.deleteUser(id);
  }
}
