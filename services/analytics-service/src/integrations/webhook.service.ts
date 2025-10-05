import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AnalyticsEvent, MetricsSnapshot } from '../types/analytics.types';
import { LoggerUtil } from '@ai-aggregator/shared';

/**
 * Webhook Integration Service
 * 
 * Responsible for:
 * - Sending data to external webhooks
 * - Managing webhook configurations
 * - Retry logic and error handling
 * - Webhook health monitoring
 */
@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private readonly webhooks: Map<string, WebhookConfig> = new Map();
  private readonly retryAttempts = 3;
  private readonly retryDelay = 1000; // 1 second

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService
  ) {
    this.initializeWebhooks();
  }

  /**
   * Send analytics event to webhooks
   */
  async sendEvent(event: AnalyticsEvent): Promise<WebhookResult[]> {
    const results: WebhookResult[] = [];

    for (const [webhookId, config] of this.webhooks) {
      if (config.events.includes(event.eventType)) {
        try {
          const result = await this.sendToWebhook(webhookId, config, {
            type: 'event',
            data: event,
            timestamp: new Date().toISOString()
          });

          results.push(result);
        } catch (error) {
          this.logger.error(`Failed to send event to webhook ${webhookId}`, error);
          results.push({
            webhookId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    return results;
  }

  /**
   * Send metrics to webhooks
   */
  async sendMetrics(metrics: MetricsSnapshot): Promise<WebhookResult[]> {
    const results: WebhookResult[] = [];

    for (const [webhookId, config] of this.webhooks) {
      if (config.events.includes('metrics')) {
        try {
          const result = await this.sendToWebhook(webhookId, config, {
            type: 'metrics',
            data: metrics,
            timestamp: new Date().toISOString()
          });

          results.push(result);
        } catch (error) {
          this.logger.error(`Failed to send metrics to webhook ${webhookId}`, error);
          results.push({
            webhookId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    return results;
  }

  /**
   * Send batch data to webhooks
   */
  async sendBatch(
    events: AnalyticsEvent[],
    metrics: MetricsSnapshot[]
  ): Promise<WebhookResult[]> {
    const results: WebhookResult[] = [];

    for (const [webhookId, config] of this.webhooks) {
      try {
        const result = await this.sendToWebhook(webhookId, config, {
          type: 'batch',
          data: {
            events,
            metrics,
            count: {
              events: events.length,
              metrics: metrics.length
            }
          },
          timestamp: new Date().toISOString()
        });

        results.push(result);
      } catch (error) {
        this.logger.error(`Failed to send batch to webhook ${webhookId}`, error);
        results.push({
          webhookId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Send alert to webhooks
   */
  async sendAlert(alert: {
    type: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    service?: string;
    metadata?: Record<string, any>;
  }): Promise<WebhookResult[]> {
    const results: WebhookResult[] = [];

    for (const [webhookId, config] of this.webhooks) {
      if (config.events.includes('alert')) {
        try {
          const result = await this.sendToWebhook(webhookId, config, {
            type: 'alert',
            data: alert,
            timestamp: new Date().toISOString()
          });

          results.push(result);
        } catch (error) {
          this.logger.error(`Failed to send alert to webhook ${webhookId}`, error);
          results.push({
            webhookId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    return results;
  }

  /**
   * Add new webhook configuration
   */
  addWebhook(webhookId: string, config: WebhookConfig): void {
    this.webhooks.set(webhookId, config);
    this.logger.log('Webhook added', { webhookId, url: config.url });
  }

  /**
   * Remove webhook configuration
   */
  removeWebhook(webhookId: string): boolean {
    const removed = this.webhooks.delete(webhookId);
    if (removed) {
      this.logger.log('Webhook removed', { webhookId });
    }
    return removed;
  }

  /**
   * Test webhook connectivity
   */
  async testWebhook(webhookId: string): Promise<{ success: boolean; responseTime?: number; error?: string }> {
    const config = this.webhooks.get(webhookId);
    if (!config) {
      return { success: false, error: 'Webhook not found' };
    }

    const start = Date.now();
    try {
      const testPayload = {
        type: 'test',
        data: { message: 'Webhook test' },
        timestamp: new Date().toISOString()
      };

      await this.sendToWebhook(webhookId, config, testPayload, true);

      return {
        success: true,
        responseTime: Date.now() - start
      };
    } catch (error) {
      return {
        success: false,
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get webhook status
   */
  getWebhookStatus(): {
    totalWebhooks: number;
    activeWebhooks: number;
    webhooks: Array<{
      id: string;
      url: string;
      events: string[];
      enabled: boolean;
    }>;
  } {
    const webhooks = Array.from(this.webhooks.entries()).map(([id, config]) => ({
      id,
      url: config.url,
      events: config.events,
      enabled: config.enabled
    }));

    return {
      totalWebhooks: webhooks.length,
      activeWebhooks: webhooks.filter(w => w.enabled).length,
      webhooks
    };
  }

  // Private methods

  private async sendToWebhook(
    webhookId: string,
    config: WebhookConfig,
    payload: any,
    isTest: boolean = false
  ): Promise<WebhookResult> {
    if (!config.enabled && !isTest) {
      return {
        webhookId,
        success: false,
        error: 'Webhook disabled'
      };
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        this.logger.debug('Sending to webhook', {
          webhookId,
          attempt,
          url: config.url,
          isTest
        });

        const response = await firstValueFrom(
          this.httpService.post(config.url, payload, {
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'AI-Aggregator-Analytics/1.0',
              ...config.headers
            },
            timeout: config.timeout || 5000
          })
        );

        this.logger.debug('Webhook response received', {
          webhookId,
          status: response.status,
          attempt
        });

        return {
          webhookId,
          success: true,
          statusCode: response.status,
          responseTime: Date.now()
        };
      } catch (error) {
        lastError = error as Error;
        this.logger.warn('Webhook request failed', {
          webhookId,
          attempt,
          error: lastError.message,
          willRetry: attempt < this.retryAttempts
        });

        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    return {
      webhookId,
      success: false,
      error: lastError?.message || 'Unknown error',
      attempts: this.retryAttempts
    };
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private initializeWebhooks(): void {
    // Load webhooks from configuration
    const webhookConfigs = this.configService.get('WEBHOOKS', []);
    
    for (const config of webhookConfigs) {
      this.webhooks.set(config.id, {
        url: config.url,
        events: config.events || ['event', 'metrics', 'alert'],
        headers: config.headers || {},
        timeout: config.timeout || 5000,
        enabled: config.enabled !== false
      });
    }

    this.logger.log('Webhooks initialized', {
      count: this.webhooks.size,
      webhooks: Array.from(this.webhooks.keys())
    });
  }
}

// Types

interface WebhookConfig {
  url: string;
  events: string[];
  headers: Record<string, string>;
  timeout?: number;
  enabled: boolean;
}

interface WebhookResult {
  webhookId: string;
  success: boolean;
  statusCode?: number;
  responseTime?: number;
  error?: string;
  attempts?: number;
}
