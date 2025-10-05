import { Injectable, Logger } from '@nestjs/common';
import { LoggerUtil } from '@ai-aggregator/shared';
import { RabbitMQService } from '@ai-aggregator/shared';
import { DataCollectionService } from '../services/data-collection.service';
import { PrismaService } from '../common/prisma/prisma.service';

/**
 * Critical Operations Service для аналитики
 * 
 * Обрабатывает критические операции через RabbitMQ:
 * - Отслеживание критических событий
 * - Обработка метрик производительности
 * - Аудит безопасности
 * - Синхронизация данных
 */
@Injectable()
export class CriticalOperationsService {
  private readonly logger = new Logger(CriticalOperationsService.name);

  constructor(
    private readonly rabbitmqService: RabbitMQService,
    private readonly dataCollectionService: DataCollectionService,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Инициализация обработчиков критических операций
   */
  async initializeCriticalHandlers(): Promise<void> {
    try {
      // Обработчик критических событий
      await this.rabbitmqService.subscribeToCriticalMessages(
        'analytics.critical.events',
        this.handleCriticalEvents.bind(this)
      );

      // Обработчик метрик производительности
      await this.rabbitmqService.subscribeToCriticalMessages(
        'analytics.performance.metrics',
        this.handlePerformanceMetrics.bind(this)
      );

      // Обработчик аудита безопасности
      await this.rabbitmqService.subscribeToCriticalMessages(
        'analytics.security.audit',
        this.handleSecurityAudit.bind(this)
      );

      // Обработчик синхронизации данных
      await this.rabbitmqService.subscribeToCriticalMessages(
        'analytics.sync.data',
        this.handleSyncData.bind(this)
      );

      LoggerUtil.info('analytics-service', 'Critical operations handlers initialized');
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to initialize critical handlers', error as Error);
      throw error;
    }
  }

  /**
   * Критическое отслеживание событий
   */
  async publishCriticalEvent(data: {
    userId: string;
    eventType: string;
    eventName: string;
    service: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    properties: Record<string, any>;
    metadata?: Record<string, any>;
  }): Promise<boolean> {
    try {
      LoggerUtil.info('analytics-service', 'Publishing critical event', { 
        userId: data.userId, 
        eventType: data.eventType,
        severity: data.severity
      });

      return await this.rabbitmqService.publishCriticalMessage(
        'analytics.critical.events',
        {
          operation: 'critical_event',
          ...data,
          timestamp: new Date().toISOString()
        },
        {
          persistent: true,
          priority: this.getPriorityBySeverity(data.severity),
          expiration: '1800000' // 30 минут TTL
        }
      );
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to publish critical event', error as Error, { 
        userId: data.userId 
      });
      return false;
    }
  }

  /**
   * Критические метрики производительности
   */
  async publishPerformanceMetrics(data: {
    service: string;
    endpoint: string;
    responseTime: number;
    statusCode: number;
    memoryUsage: number;
    cpuUsage: number;
    timestamp: Date;
    metadata?: Record<string, any>;
  }): Promise<boolean> {
    try {
      LoggerUtil.info('analytics-service', 'Publishing performance metrics', { 
        service: data.service, 
        endpoint: data.endpoint,
        responseTime: data.responseTime
      });

      return await this.rabbitmqService.publishCriticalMessage(
        'analytics.performance.metrics',
        {
          operation: 'performance_metrics',
          ...data,
          timestamp: data.timestamp.toISOString()
        },
        {
          persistent: true,
          priority: 5, // Средний приоритет для метрик
          expiration: '900000' // 15 минут TTL
        }
      );
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to publish performance metrics', error as Error, { 
        service: data.service 
      });
      return false;
    }
  }

  /**
   * Критический аудит безопасности
   */
  async publishSecurityAudit(data: {
    userId: string;
    action: string;
    resource: string;
    ipAddress: string;
    userAgent: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    riskScore: number;
    metadata?: Record<string, any>;
  }): Promise<boolean> {
    try {
      LoggerUtil.info('analytics-service', 'Publishing security audit', { 
        userId: data.userId, 
        action: data.action,
        severity: data.severity,
        riskScore: data.riskScore
      });

      return await this.rabbitmqService.publishCriticalMessage(
        'analytics.security.audit',
        {
          operation: 'security_audit',
          ...data,
          timestamp: new Date().toISOString()
        },
        {
          persistent: true,
          priority: this.getPriorityBySeverity(data.severity),
          expiration: '3600000' // 1 час TTL
        }
      );
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to publish security audit', error as Error, { 
        userId: data.userId 
      });
      return false;
    }
  }

  /**
   * Обработчик критических событий
   */
  private async handleCriticalEvents(message: any): Promise<boolean> {
    try {
      LoggerUtil.info('analytics-service', 'Processing critical event', { 
        messageId: message.messageId,
        userId: message.userId,
        eventType: message.eventType,
        severity: message.severity
      });

      // Создаем событие в базе данных
      const event = await this.prisma.analyticsEvent.create({
        data: {
          userId: message.userId,
          eventType: message.eventType,
          eventName: message.eventName,
          service: message.service,
          properties: {
            ...message.properties,
            severity: message.severity,
            critical: true
          },
          metadata: {
            ...message.metadata,
            processedAt: new Date().toISOString(),
            messageId: message.messageId
          },
          timestamp: new Date(message.timestamp)
        }
      });

      // Если это критическое событие, отправляем уведомления
      if (message.severity === 'critical') {
        await this.sendCriticalAlert(event);
      }

      LoggerUtil.info('analytics-service', 'Critical event processed successfully', { 
        messageId: message.messageId,
        eventId: event.id
      });

      return true;
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to process critical event', error as Error, { 
        messageId: message.messageId,
        userId: message.userId
      });
      return false;
    }
  }

  /**
   * Обработчик метрик производительности
   */
  private async handlePerformanceMetrics(message: any): Promise<boolean> {
    try {
      LoggerUtil.info('analytics-service', 'Processing performance metrics', { 
        messageId: message.messageId,
        service: message.service,
        endpoint: message.endpoint
      });

      // Создаем снимок метрик
      const metricsSnapshot = await this.prisma.metricsSnapshot.create({
        data: {
          service: message.service,
          endpoint: message.endpoint,
          responseTime: message.responseTime,
          statusCode: message.statusCode,
          memoryUsage: message.memoryUsage,
          cpuUsage: message.cpuUsage,
          timestamp: new Date(message.timestamp),
          metadata: message.metadata || {}
        }
      });

      // Проверяем на аномалии производительности
      await this.checkPerformanceAnomalies(metricsSnapshot);

      LoggerUtil.info('analytics-service', 'Performance metrics processed successfully', { 
        messageId: message.messageId,
        snapshotId: metricsSnapshot.id
      });

      return true;
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to process performance metrics', error as Error, { 
        messageId: message.messageId,
        service: message.service
      });
      return false;
    }
  }

  /**
   * Обработчик аудита безопасности
   */
  private async handleSecurityAudit(message: any): Promise<boolean> {
    try {
      LoggerUtil.info('analytics-service', 'Processing security audit', { 
        messageId: message.messageId,
        userId: message.userId,
        action: message.action,
        severity: message.severity
      });

      // Создаем запись аудита
      const auditRecord = await this.prisma.analyticsEvent.create({
        data: {
          userId: message.userId,
          eventType: 'security_audit',
          eventName: message.action,
          service: 'security-service',
          properties: {
            action: message.action,
            resource: message.resource,
            ipAddress: message.ipAddress,
            userAgent: message.userAgent,
            severity: message.severity,
            riskScore: message.riskScore
          },
          metadata: {
            ...message.metadata,
            processedAt: new Date().toISOString(),
            messageId: message.messageId
          },
          timestamp: new Date(message.timestamp)
        }
      });

      // Если высокий риск, отправляем предупреждение
      if (message.riskScore > 7 || message.severity === 'critical') {
        await this.sendSecurityAlert(auditRecord);
      }

      LoggerUtil.info('analytics-service', 'Security audit processed successfully', { 
        messageId: message.messageId,
        auditId: auditRecord.id
      });

      return true;
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to process security audit', error as Error, { 
        messageId: message.messageId,
        userId: message.userId
      });
      return false;
    }
  }

  /**
   * Обработчик синхронизации данных
   */
  private async handleSyncData(message: any): Promise<boolean> {
    try {
      LoggerUtil.info('analytics-service', 'Processing data sync', { 
        messageId: message.messageId,
        operation: message.operation
      });

      // Здесь можно добавить логику синхронизации данных
      // Например, синхронизация с внешними системами, обновление кэша и т.д.

      LoggerUtil.info('analytics-service', 'Data sync completed', { 
        messageId: message.messageId
      });

      return true;
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to sync data', error as Error, { 
        messageId: message.messageId
      });
      return false;
    }
  }

  /**
   * Отправка критического уведомления
   */
  private async sendCriticalAlert(event: any): Promise<void> {
    try {
      LoggerUtil.warn('analytics-service', 'CRITICAL EVENT DETECTED', null, {
        eventId: event.id,
        userId: event.userId,
        eventType: event.eventType,
        eventName: event.eventName,
        service: event.service
      });

      // Здесь можно добавить отправку уведомлений (email, Slack, etc.)
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to send critical alert', error as Error);
    }
  }

  /**
   * Отправка предупреждения безопасности
   */
  private async sendSecurityAlert(auditRecord: any): Promise<void> {
    try {
      LoggerUtil.warn('analytics-service', 'SECURITY ALERT', null, {
        auditId: auditRecord.id,
        userId: auditRecord.userId,
        action: auditRecord.eventName,
        severity: auditRecord.properties.severity,
        riskScore: auditRecord.properties.riskScore
      });

      // Здесь можно добавить отправку уведомлений безопасности
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to send security alert', error as Error);
    }
  }

  /**
   * Проверка аномалий производительности
   */
  private async checkPerformanceAnomalies(metricsSnapshot: any): Promise<void> {
    try {
      // Проверяем на высокое время отклика
      if (metricsSnapshot.responseTime > 5000) { // 5 секунд
        LoggerUtil.warn('analytics-service', 'High response time detected', null, {
          service: metricsSnapshot.service,
          endpoint: metricsSnapshot.endpoint,
          responseTime: metricsSnapshot.responseTime
        });
      }

      // Проверяем на высокое использование памяти
      if (metricsSnapshot.memoryUsage > 0.9) { // 90%
        LoggerUtil.warn('analytics-service', 'High memory usage detected', null, {
          service: metricsSnapshot.service,
          memoryUsage: metricsSnapshot.memoryUsage
        });
      }

      // Проверяем на высокое использование CPU
      if (metricsSnapshot.cpuUsage > 0.8) { // 80%
        LoggerUtil.warn('analytics-service', 'High CPU usage detected', null, {
          service: metricsSnapshot.service,
          cpuUsage: metricsSnapshot.cpuUsage
        });
      }
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to check performance anomalies', error as Error);
    }
  }

  /**
   * Получение приоритета по уровню серьезности
   */
  private getPriorityBySeverity(severity: string): number {
    switch (severity) {
      case 'critical': return 10;
      case 'high': return 8;
      case 'medium': return 5;
      case 'low': return 2;
      default: return 1;
    }
  }
}
