import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeeService } from '../modules/employee/employee.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Employee Management')
@Controller('auth/employee')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post('invite')
  @ApiOperation({ summary: 'Invite a new employee to the company' })
  @ApiResponse({ status: 201, description: 'Employee invitation sent successfully' })
  async inviteEmployee(
    @Request() req: any,
    @Body() data: { 
      companyId: string; 
      email: string; 
      firstName: string; 
      lastName: string; 
      position?: string; 
      department?: string;
      billingMode?: 'SELF_PAID' | 'PARENT_PAID';
    }
  ) {
    return this.employeeService.inviteEmployee(data.companyId, data);
  }

  @Get(':companyId')
  @ApiOperation({ summary: 'Get all employees for a company' })
  @ApiResponse({ status: 200, description: 'Employees retrieved successfully' })
  async getEmployees(@Param('companyId') companyId: string) {
    return this.employeeService.getEmployees(companyId);
  }

  @Delete(':companyId/:employeeId')
  @ApiOperation({ summary: 'Remove an employee from the company' })
  @ApiResponse({ status: 200, description: 'Employee removed successfully' })
  async removeEmployee(
    @Param('companyId') companyId: string,
    @Param('employeeId') employeeId: string
  ) {
    return this.employeeService.removeEmployee(companyId, employeeId);
  }

  @Put(':companyId/:employeeId/billing-mode')
  @ApiOperation({ summary: 'Update employee billing mode' })
  @ApiResponse({ status: 200, description: 'Billing mode updated successfully' })
  async updateBillingMode(
    @Param('companyId') companyId: string,
    @Param('employeeId') employeeId: string,
    @Body() data: { billingMode: 'SELF_PAID' | 'PARENT_PAID' }
  ) {
    return this.employeeService.updateBillingMode(companyId, employeeId, data.billingMode);
  }
}
