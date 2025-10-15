import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmployeeStatsService } from './employee-stats.service';

@ApiTags('employee-stats')
@Controller('employee-stats')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EmployeeStatsController {
  constructor(private readonly employeeStatsService: EmployeeStatsService) {}

  @Get('employees')
  @ApiOperation({ summary: 'Get employee statistics for the current company' })
  @ApiResponse({ status: 200, description: 'Employee statistics retrieved successfully' })
  async getEmployeeStats(@Request() req: any) {
    return this.employeeStatsService.getEmployeeStats(req.user.id);
  }

  @Get('employees/:employeeId/usage')
  @ApiOperation({ summary: 'Get detailed usage statistics for a specific employee' })
  @ApiResponse({ status: 200, description: 'Employee usage details retrieved successfully' })
  async getEmployeeUsageDetails(
    @Request() req: any,
    @Param('employeeId') employeeId: string,
    @Query('limit') limit?: string
  ) {
    return this.employeeStatsService.getEmployeeUsageDetails(req.user.id, employeeId, limit);
  }
}
