import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { HistoryService } from './history.service';
import {
  RequestHistoryQueryDto,
  RequestHistoryResponse,
  SessionHistoryQueryDto,
  SessionHistoryResponse,
  RequestType,
  RequestStatus,
} from '@ai-aggregator/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('history')
@Controller('history')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  /**
   * Получить историю запросов пользователя
   */
  @Get('requests')
  @ApiOperation({ summary: 'Get user request history' })
  @ApiResponse({ status: 200, description: 'Request history retrieved successfully' })
  async getRequestHistory(
    @Request() req: any,
    @Query() query: RequestHistoryQueryDto,
  ): Promise<RequestHistoryResponse> {
    const userId = req.user.id;
    return this.historyService.getRequestHistory({ ...query, userId });
  }

  /**
   * Получить детали конкретного запроса
   */
  @Get('requests/:id')
  @ApiOperation({ summary: 'Get request history by ID' })
  @ApiResponse({ status: 200, description: 'Request history retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Request history not found' })
  async getRequestHistoryById(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<RequestHistoryResponse> {
    const userId = req.user.id;
    return this.historyService.getRequestHistoryById(id, userId);
  }

  /**
   * Удалить запись истории запроса
   */
  @Delete('requests/:id')
  @ApiOperation({ summary: 'Delete request history' })
  @ApiResponse({ status: 200, description: 'Request history deleted successfully' })
  @ApiResponse({ status: 404, description: 'Request history not found' })
  @HttpCode(HttpStatus.OK)
  async deleteRequestHistory(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<RequestHistoryResponse> {
    const userId = req.user.id;
    return this.historyService.deleteRequestHistory(id, userId);
  }

  /**
   * Получить сессии пользователя
   */
  @Get('sessions')
  @ApiOperation({ summary: 'Get user sessions' })
  @ApiResponse({ status: 200, description: 'Sessions retrieved successfully' })
  async getSessions(
    @Request() req: any,
    @Query() query: SessionHistoryQueryDto,
  ): Promise<SessionHistoryResponse> {
    const userId = req.user.id;
    return this.historyService.getSessions({ ...query, userId });
  }

  /**
   * Получить детали сессии
   */
  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get session by ID' })
  @ApiResponse({ status: 200, description: 'Session retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getSessionById(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<SessionHistoryResponse> {
    const userId = req.user.id;
    return this.historyService.getSessionById(id, userId);
  }

  /**
   * Удалить сессию
   */
  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Delete session' })
  @ApiResponse({ status: 200, description: 'Session deleted successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @HttpCode(HttpStatus.OK)
  async deleteSession(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<SessionHistoryResponse> {
    const userId = req.user.id;
    return this.historyService.deleteSession(id, userId);
  }

  /**
   * Получить статистику пользователя
   */
  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, description: 'User statistics retrieved successfully' })
  async getUserStats(@Request() req: any): Promise<any> {
    const userId = req.user.id;
    return this.historyService.getUserStats(userId);
  }

  /**
   * Получить доступные типы запросов
   */
  @Get('request-types')
  @ApiOperation({ summary: 'Get available request types' })
  @ApiResponse({ status: 200, description: 'Request types retrieved successfully' })
  getRequestTypes(): any {
    return {
      success: true,
      data: Object.values(RequestType),
    };
  }

  /**
   * Получить доступные статусы запросов
   */
  @Get('request-statuses')
  @ApiOperation({ summary: 'Get available request statuses' })
  @ApiResponse({ status: 200, description: 'Request statuses retrieved successfully' })
  getRequestStatuses(): any {
    return {
      success: true,
      data: Object.values(RequestStatus),
    };
  }
}
