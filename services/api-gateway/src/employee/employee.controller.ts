import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeeService } from './employee.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Employee')
@Controller('employee')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  @ApiOperation({ summary: 'Invite a new employee' })
  @ApiResponse({ status: 201, description: 'Employee invited successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async inviteEmployee(@Request() req: any, @Body() createEmployeeDto: any) {
    return this.employeeService.inviteEmployee(req.user.id, createEmployeeDto, req.headers.authorization);
  }

  @Get()
  @ApiOperation({ summary: 'Get all employees for the company' })
  @ApiResponse({ status: 200, description: 'Employees retrieved successfully' })
  async getEmployees(@Request() req: any, @Query('status') status?: string) {
    return this.employeeService.getEmployees(req.user.id, status, req.headers.authorization);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee by ID' })
  @ApiResponse({ status: 200, description: 'Employee retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async getEmployee(@Request() req: any, @Param('id') id: string) {
    return this.employeeService.getEmployee(req.user.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update employee' })
  @ApiResponse({ status: 200, description: 'Employee updated successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async updateEmployee(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateEmployeeDto: any
  ) {
    return this.employeeService.updateEmployee(req.user.id, id, updateEmployeeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove employee' })
  @ApiResponse({ status: 200, description: 'Employee removed successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async removeEmployee(@Request() req: any, @Param('id') id: string) {
    return this.employeeService.removeEmployee(req.user.id, id);
  }

  @Post(':id/resend-invitation')
  @ApiOperation({ summary: 'Resend invitation to employee' })
  @ApiResponse({ status: 200, description: 'Invitation resent successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async resendInvitation(@Request() req: any, @Param('id') id: string) {
    return this.employeeService.resendInvitation(req.user.id, id);
  }

  @Put(':id/billing-mode')
  @ApiOperation({ summary: 'Update employee billing mode' })
  @ApiResponse({ status: 200, description: 'Billing mode updated successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async updateBillingMode(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateBillingModeDto: { billingMode: 'SELF_PAID' | 'PARENT_PAID' }
  ) {
    console.log('Request headers:', req.headers);
    console.log('Authorization header:', req.headers.authorization);
    return this.employeeService.updateBillingMode(req.user.id, id, updateBillingModeDto.billingMode, req.headers.authorization);
  }
}
