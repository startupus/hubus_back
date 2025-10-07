import { Controller, Get, Post, Body, Query, UseGuards, Request, HttpException, HttpStatus, Put, Delete, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { HistoryService } from '../history/history.service';
import { AnonymizationService } from '../anonymization/anonymization.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LoggerUtil } from '@ai-aggregator/shared';

/**
 * FSB Controller
 * 
 * Специальный контроллер для ФСБ с полным доступом к истории запросов:
 * - Поиск по содержимому запросов
 * - Поиск по авторам
 * - Управление настройками обезличивания
 * - Полный доступ к истории всех пользователей
 */
@ApiTags('FSB')
@Controller('fsb')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FsbController {
  constructor(
    private readonly historyService: HistoryService,
    private readonly anonymizationService: AnonymizationService
  ) {}

  /**
   * Middleware для проверки прав ФСБ
   */
  private checkFsbAccess(user: any): void {
    if (user.role !== 'fsb') {
      throw new HttpException('Access denied. FSB role required.', HttpStatus.FORBIDDEN);
    }
  }

  /**
   * Поиск по истории запросов
   */
  @Get('search/requests')
  @ApiOperation({ summary: 'Search requests by content and authors' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  @ApiQuery({ name: 'query', description: 'Search query (content or author)', required: false })
  @ApiQuery({ name: 'userId', description: 'Filter by specific user ID', required: false })
  @ApiQuery({ name: 'provider', description: 'Filter by provider', required: false })
  @ApiQuery({ name: 'model', description: 'Filter by model', required: false })
  @ApiQuery({ name: 'fromDate', description: 'Filter from date (ISO string)', required: false })
  @ApiQuery({ name: 'toDate', description: 'Filter to date (ISO string)', required: false })
  @ApiQuery({ name: 'limit', description: 'Limit results', required: false })
  @ApiQuery({ name: 'offset', description: 'Offset results', required: false })
  async searchRequests(
    @Request() req: any,
    @Query('query') query?: string,
    @Query('userId') userId?: string,
    @Query('provider') provider?: string,
    @Query('model') model?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    this.checkFsbAccess(req.user);

    LoggerUtil.info('api-gateway', 'FSB search request', {
      query,
      userId,
      provider,
      model,
      fromDate,
      toDate,
      requestedBy: req.user.id
    });

    try {
      // Поиск в истории запросов
      const searchResults = await this.historyService.searchRequests({
        query,
        userId,
        provider,
        model,
        fromDate: fromDate ? new Date(fromDate) : undefined,
        toDate: toDate ? new Date(toDate) : undefined,
        limit: limit ? parseInt(limit, 10) : 50,
        offset: offset ? parseInt(offset, 10) : 0
      });

      return {
        success: true,
        data: searchResults.data,
        pagination: searchResults.pagination,
        searchParams: {
          query,
          userId,
          provider,
          model,
          fromDate,
          toDate
        }
      };
    } catch (error) {
      LoggerUtil.error('api-gateway', 'FSB search failed', error as Error, {
        query,
        requestedBy: req.user.id
      });
      throw new HttpException('Search failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Получить детальную информацию о запросе
   */
  @Get('requests/:id')
  @ApiOperation({ summary: 'Get detailed request information' })
  @ApiResponse({ status: 200, description: 'Request details retrieved successfully' })
  async getRequestDetails(@Request() req: any, @Query('id') id: string) {
    this.checkFsbAccess(req.user);

    try {
      const requestDetails = await this.historyService.getRequestHistoryById(id, 'fsb-access');
      
      if (!requestDetails.success) {
        throw new HttpException('Request not found', HttpStatus.NOT_FOUND);
      }

      LoggerUtil.info('api-gateway', 'FSB request details accessed', {
        requestId: id,
        requestedBy: req.user.id
      });

      return {
        success: true,
        data: requestDetails.data
      };
    } catch (error) {
      LoggerUtil.error('api-gateway', 'FSB request details failed', error as Error, {
        requestId: id,
        requestedBy: req.user.id
      });
      throw new HttpException('Failed to get request details', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Поиск по авторам (пользователям)
   */
  @Get('search/users')
  @ApiOperation({ summary: 'Search users by activity patterns' })
  @ApiResponse({ status: 200, description: 'User search results retrieved successfully' })
  @ApiQuery({ name: 'query', description: 'Search query for user patterns', required: false })
  @ApiQuery({ name: 'fromDate', description: 'Filter from date', required: false })
  @ApiQuery({ name: 'toDate', description: 'Filter to date', required: false })
  async searchUsers(
    @Request() req: any,
    @Query('query') query?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string
  ) {
    this.checkFsbAccess(req.user);

    try {
      const userSearchResults = await this.historyService.searchUsers({
        query,
        fromDate: fromDate ? new Date(fromDate) : undefined,
        toDate: toDate ? new Date(toDate) : undefined
      });

      LoggerUtil.info('api-gateway', 'FSB user search', {
        query,
        resultsCount: Array.isArray(userSearchResults.data) ? userSearchResults.data.length : 0,
        requestedBy: req.user.id
      });

      return {
        success: true,
        data: userSearchResults.data,
        searchParams: { query, fromDate, toDate }
      };
    } catch (error) {
      LoggerUtil.error('api-gateway', 'FSB user search failed', error as Error, {
        query,
        requestedBy: req.user.id
      });
      throw new HttpException('User search failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Получить статистику пользователя
   */
  @Get('users/:userId/stats')
  @ApiOperation({ summary: 'Get detailed user statistics' })
  @ApiResponse({ status: 200, description: 'User statistics retrieved successfully' })
  async getUserStats(@Request() req: any, @Query('userId') userId: string) {
    this.checkFsbAccess(req.user);

    try {
      const userStats = await this.historyService.getUserStats(userId);

      LoggerUtil.info('api-gateway', 'FSB user stats accessed', {
        userId,
        requestedBy: req.user.id
      });

      return {
        success: true,
        data: userStats
      };
    } catch (error) {
      LoggerUtil.error('api-gateway', 'FSB user stats failed', error as Error, {
        userId,
        requestedBy: req.user.id
      });
      throw new HttpException('Failed to get user statistics', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Получить все настройки обезличивания
   */
  @Get('anonymization/settings')
  @ApiOperation({ summary: 'Get all anonymization settings' })
  @ApiResponse({ status: 200, description: 'Anonymization settings retrieved successfully' })
  @ApiQuery({ name: 'provider', description: 'Filter by provider', required: false })
  @ApiQuery({ name: 'model', description: 'Filter by model', required: false })
  @ApiQuery({ name: 'enabled', description: 'Filter by enabled status', required: false })
  @ApiQuery({ name: 'limit', description: 'Limit results', required: false })
  @ApiQuery({ name: 'offset', description: 'Offset results', required: false })
  async getAnonymizationSettings(
    @Request() req: any,
    @Query('provider') provider?: string,
    @Query('model') model?: string,
    @Query('enabled') enabled?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    this.checkFsbAccess(req.user);

    try {
      const searchParams = {
        provider,
        model,
        enabled: enabled ? enabled === 'true' : undefined,
        limit: limit ? parseInt(limit, 10) : 50,
        offset: offset ? parseInt(offset, 10) : 0,
      };

      const result = await this.anonymizationService.searchSettings(searchParams);

      LoggerUtil.info('api-gateway', 'FSB anonymization settings accessed', {
        requestedBy: req.user.id,
        filters: searchParams,
        total: result.total
      });

      return {
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          limit: searchParams.limit,
          offset: searchParams.offset,
          hasMore: searchParams.offset + searchParams.limit < result.total,
        }
      };
    } catch (error) {
      LoggerUtil.error('api-gateway', 'FSB anonymization settings failed', error as Error, {
        requestedBy: req.user.id
      });
      throw new HttpException('Failed to get anonymization settings', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Создать или обновить настройки обезличивания для конкретного провайдера и модели
   */
  @Post('anonymization/settings')
  @ApiOperation({ summary: 'Create or update anonymization settings for specific provider/model' })
  @ApiResponse({ status: 200, description: 'Anonymization settings created/updated successfully' })
  async upsertAnonymizationSettings(
    @Request() req: any,
    @Body() settings: {
      provider: string;
      model: string;
      enabled: boolean;
      preserveMetadata?: boolean;
    }
  ) {
    this.checkFsbAccess(req.user);

    try {
      const result = await this.anonymizationService.upsertSettings({
        provider: settings.provider,
        model: settings.model,
        enabled: settings.enabled,
        preserveMetadata: settings.preserveMetadata,
        createdBy: req.user.id,
      });

      LoggerUtil.info('api-gateway', 'FSB anonymization settings upserted', {
        provider: settings.provider,
        model: settings.model,
        enabled: settings.enabled,
        requestedBy: req.user.id
      });

      return {
        success: true,
        message: 'Anonymization settings created/updated successfully',
        data: result
      };
    } catch (error) {
      LoggerUtil.error('api-gateway', 'FSB anonymization settings upsert failed', error as Error, {
        settings,
        requestedBy: req.user.id
      });
      throw new HttpException('Failed to create/update anonymization settings', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Обновить настройки обезличивания по ID
   */
  @Put('anonymization/settings/:id')
  @ApiOperation({ summary: 'Update anonymization settings by ID' })
  @ApiResponse({ status: 200, description: 'Anonymization settings updated successfully' })
  async updateAnonymizationSettingsById(
    @Request() req: any,
    @Param('id') id: string,
    @Body() settings: {
      enabled?: boolean;
      preserveMetadata?: boolean;
    }
  ) {
    this.checkFsbAccess(req.user);

    try {
      const result = await this.anonymizationService.updateSettings(id, {
        enabled: settings.enabled,
        preserveMetadata: settings.preserveMetadata,
        updatedBy: req.user.id,
      });

      if (!result) {
        throw new HttpException('Settings not found', HttpStatus.NOT_FOUND);
      }

      LoggerUtil.info('api-gateway', 'FSB anonymization settings updated by ID', {
        id,
        enabled: settings.enabled,
        requestedBy: req.user.id
      });

      return {
        success: true,
        message: 'Anonymization settings updated successfully',
        data: result
      };
    } catch (error) {
      LoggerUtil.error('api-gateway', 'FSB anonymization settings update by ID failed', error as Error, {
        id,
        settings,
        requestedBy: req.user.id
      });
      throw new HttpException('Failed to update anonymization settings', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Удалить настройки обезличивания
   */
  @Delete('anonymization/settings/:id')
  @ApiOperation({ summary: 'Delete anonymization settings by ID' })
  @ApiResponse({ status: 200, description: 'Anonymization settings deleted successfully' })
  async deleteAnonymizationSettings(
    @Request() req: any,
    @Param('id') id: string
  ) {
    this.checkFsbAccess(req.user);

    try {
      const success = await this.anonymizationService.deleteSettings(id, req.user.id);

      if (!success) {
        throw new HttpException('Failed to delete settings', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      LoggerUtil.info('api-gateway', 'FSB anonymization settings deleted', {
        id,
        requestedBy: req.user.id
      });

      return {
        success: true,
        message: 'Anonymization settings deleted successfully'
      };
    } catch (error) {
      LoggerUtil.error('api-gateway', 'FSB anonymization settings delete failed', error as Error, {
        id,
        requestedBy: req.user.id
      });
      throw new HttpException('Failed to delete anonymization settings', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Получить общую статистику системы
   */
  @Get('statistics')
  @ApiOperation({ summary: 'Get system statistics' })
  @ApiResponse({ status: 200, description: 'System statistics retrieved successfully' })
  async getSystemStatistics(@Request() req: any) {
    this.checkFsbAccess(req.user);

    try {
      const systemStats = await this.historyService.getSystemStatistics();

      LoggerUtil.info('api-gateway', 'FSB system statistics accessed', {
        requestedBy: req.user.id
      });

      return {
        success: true,
        data: systemStats
      };
    } catch (error) {
      LoggerUtil.error('api-gateway', 'FSB system statistics failed', error as Error, {
        requestedBy: req.user.id
      });
      throw new HttpException('Failed to get system statistics', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Восстановить обезличенные данные (только для ФСБ)
   */
  @Post('anonymization/deanonymize')
  @ApiOperation({ summary: 'Deanonymize data using mapping' })
  @ApiResponse({ status: 200, description: 'Data deanonymized successfully' })
  async deanonymizeData(
    @Request() req: any,
    @Body() data: {
      anonymizedData: any;
      mapping: Record<string, string>;
    }
  ) {
    this.checkFsbAccess(req.user);

    try {
      const deanonymizedData = this.anonymizationService.deanonymizeChatMessages(
        data.anonymizedData,
        data.mapping
      );

      LoggerUtil.info('api-gateway', 'FSB data deanonymized', {
        requestedBy: req.user.id,
        dataLength: data.anonymizedData.length
      });

      return {
        success: true,
        data: deanonymizedData
      };
    } catch (error) {
      LoggerUtil.error('api-gateway', 'FSB deanonymization failed', error as Error, {
        requestedBy: req.user.id
      });
      throw new HttpException('Failed to deanonymize data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
