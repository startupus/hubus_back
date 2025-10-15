import { Controller, Get, Param, Query } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Controller('employee-stats')
export class EmployeeStatsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':companyId/employees')
  async getEmployeeStats(@Param('companyId') companyId: string) {
    try {
      // Получаем всех сотрудников компании
      const employees = await this.prisma.company.findMany({
        where: {
          parentCompanyId: companyId
        },
        select: {
          id: true,
          name: true,
          email: true,
          position: true,
          department: true,
          billingMode: true,
          isActive: true,
          createdAt: true
        }
      });

      // Получаем статистику использования для каждого сотрудника
      const employeeStats = await Promise.all(
        employees.map(async (employee) => {
          // Считаем общее количество токенов
          const usageEvents = await this.prisma.usageEvent.findMany({
            where: {
              initiatorCompanyId: employee.id,
              service: 'ai-chat',
              resource: 'tokens'
            },
            select: {
              quantity: true,
              cost: true,
              timestamp: true,
              metadata: true
            },
            orderBy: { timestamp: 'desc' }
          });

          const totalTokens = usageEvents.reduce((sum, event) => sum + (event.quantity || 0), 0);
          const totalCost = usageEvents.reduce((sum, event) => sum + event.cost.toNumber(), 0);
          const lastActivity = usageEvents.length > 0 ? usageEvents[0].timestamp : null;

          // Получаем детали по моделям
          const modelStats = await this.prisma.usageEvent.groupBy({
            by: ['metadata'],
            where: {
              initiatorCompanyId: employee.id,
              service: 'ai-chat',
              resource: 'tokens'
            },
            _sum: {
              quantity: true,
              cost: true
            },
            _count: {
              id: true
            }
          });

          const modelBreakdown = modelStats.map(stat => ({
            model: (stat.metadata as any)?.model || 'unknown',
            provider: (stat.metadata as any)?.provider || 'unknown',
            tokens: stat._sum.quantity || 0,
            cost: stat._sum.cost?.toNumber() || 0,
            requests: stat._count.id
          }));

          return {
            ...employee,
            stats: {
              totalTokens,
              totalCost,
              totalRequests: usageEvents.length,
              lastActivity,
              modelBreakdown
            }
          };
        })
      );

      return {
        success: true,
        data: employeeStats
      };
    } catch (error) {
      console.error('Failed to get employee stats', error);
      return {
        success: false,
        message: 'Failed to get employee statistics'
      };
    }
  }

  @Get(':companyId/employees/:employeeId/usage')
  async getEmployeeUsageDetails(
    @Param('companyId') companyId: string,
    @Param('employeeId') employeeId: string,
    @Query('limit') limit?: string
  ) {
    try {
      const limitNum = limit ? parseInt(limit) : 50;

      const usageEvents = await this.prisma.usageEvent.findMany({
        where: {
          initiatorCompanyId: employeeId,
          service: 'ai-chat',
          resource: 'tokens'
        },
        select: {
          id: true,
          quantity: true,
          cost: true,
          timestamp: true,
          metadata: true
        },
        orderBy: { timestamp: 'desc' },
        take: limitNum
      });

      return {
        success: true,
        data: usageEvents
      };
    } catch (error) {
      console.error('Failed to get employee usage details', error);
      return {
        success: false,
        message: 'Failed to get employee usage details'
      };
    }
  }
}
