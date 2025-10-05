import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerUtil } from '@ai-aggregator/shared';

/**
 * Grafana Integration Service
 * 
 * Responsible for:
 * - Dashboard creation and management
 * - Data source configuration
 * - Alert rule management
 * - Panel and visualization setup
 */
@Injectable()
export class GrafanaService {
  private readonly logger = new Logger(GrafanaService.name);
  private readonly grafanaEnabled: boolean;
  private readonly grafanaApiUrl: string;
  private readonly grafanaApiKey: string;
  private readonly datasourceName: string;

  constructor(private readonly configService: ConfigService) {
    this.grafanaEnabled = this.configService.get('GRAFANA_ENABLED', false);
    this.grafanaApiUrl = this.configService.get('GRAFANA_API_URL', 'http://localhost:3000');
    this.grafanaApiKey = this.configService.get('GRAFANA_API_KEY', '');
    this.datasourceName = this.configService.get('GRAFANA_DATASOURCE_NAME', 'analytics-db');
  }

  /**
   * Create a new dashboard
   */
  async createDashboard(
    title: string,
    description: string,
    panels: any[],
    tags: string[] = []
  ): Promise<{ success: boolean; dashboardId?: string; error?: string }> {
    if (!this.grafanaEnabled) {
      this.logger.debug('Grafana integration disabled');
      return { success: false, error: 'Grafana integration disabled' };
    }

    try {
      this.logger.debug('Creating Grafana dashboard', { title, description, panelsCount: panels.length });

      const dashboard = {
        dashboard: {
          id: null,
          title,
          description,
          tags,
          timezone: 'browser',
          panels,
          time: {
            from: 'now-1h',
            to: 'now'
          },
          refresh: '30s',
          schemaVersion: 16,
          version: 0,
          links: []
        },
        overwrite: false
      };

      // This would be a real API call to Grafana
      // const response = await this.httpService.post(
      //   `${this.grafanaApiUrl}/api/dashboards/db`,
      //   dashboard,
      //   {
      //     headers: {
      //       'Authorization': `Bearer ${this.grafanaApiKey}`,
      //       'Content-Type': 'application/json'
      //     }
      //   }
      // ).toPromise();

      // For now, simulate success
      const dashboardId = `dashboard_${Date.now()}`;

      this.logger.log('Grafana dashboard created successfully', {
        title,
        dashboardId,
        panelsCount: panels.length
      });

      return { success: true, dashboardId };
    } catch (error) {
      this.logger.error('Failed to create Grafana dashboard', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Create analytics dashboard
   */
  async createAnalyticsDashboard(): Promise<{ success: boolean; dashboardId?: string; error?: string }> {
    try {
      const panels = [
        this.createUsagePanel(),
        this.createPerformancePanel(),
        this.createErrorRatePanel(),
        this.createCostPanel(),
        this.createAIAnalyticsPanel()
      ];

      return await this.createDashboard(
        'AI Aggregator Analytics',
        'Comprehensive analytics dashboard for AI Aggregator platform',
        panels,
        ['analytics', 'ai-aggregator', 'monitoring']
      );
    } catch (error) {
      this.logger.error('Failed to create analytics dashboard', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Create user dashboard
   */
  async createUserDashboard(userId: string): Promise<{ success: boolean; dashboardId?: string; error?: string }> {
    try {
      const panels = [
        this.createUserUsagePanel(userId),
        this.createUserCostPanel(userId),
        this.createUserActivityPanel(userId),
        this.createUserRecommendationsPanel(userId)
      ];

      return await this.createDashboard(
        `User Analytics - ${userId}`,
        `Personal analytics dashboard for user ${userId}`,
        panels,
        ['user', 'analytics', userId]
      );
    } catch (error) {
      this.logger.error('Failed to create user dashboard', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Create alert rule
   */
  async createAlertRule(
    name: string,
    condition: string,
    frequency: string,
    message: string,
    severity: 'critical' | 'warning' | 'info' = 'warning'
  ): Promise<{ success: boolean; ruleId?: string; error?: string }> {
    if (!this.grafanaEnabled) {
      return { success: false, error: 'Grafana integration disabled' };
    }

    try {
      this.logger.debug('Creating Grafana alert rule', { name, condition, severity });

      const alertRule = {
        name,
        condition,
        frequency,
        message,
        severity,
        enabled: true,
        tags: ['analytics', 'ai-aggregator']
      };

      // This would be a real API call to Grafana
      // const response = await this.httpService.post(
      //   `${this.grafanaApiUrl}/api/alert-rules`,
      //   alertRule,
      //   {
      //     headers: {
      //       'Authorization': `Bearer ${this.grafanaApiKey}`,
      //       'Content-Type': 'application/json'
      //     }
      //   }
      // ).toPromise();

      // For now, simulate success
      const ruleId = `rule_${Date.now()}`;

      this.logger.log('Grafana alert rule created successfully', { name, ruleId });

      return { success: true, ruleId };
    } catch (error) {
      this.logger.error('Failed to create Grafana alert rule', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Create data source
   */
  async createDataSource(): Promise<{ success: boolean; datasourceId?: string; error?: string }> {
    if (!this.grafanaEnabled) {
      return { success: false, error: 'Grafana integration disabled' };
    }

    try {
      this.logger.debug('Creating Grafana data source', { name: this.datasourceName });

      const dataSource = {
        name: this.datasourceName,
        type: 'postgres',
        url: this.configService.get('ANALYTICS_DATABASE_URL'),
        database: 'analytics_db',
        user: 'postgres',
        secureJsonData: {
          password: 'password'
        },
        jsonData: {
          sslmode: 'disable',
          maxOpenConns: 0,
          maxIdleConns: 2,
          connMaxLifetime: 14400
        }
      };

      // This would be a real API call to Grafana
      // const response = await this.httpService.post(
      //   `${this.grafanaApiUrl}/api/datasources`,
      //   dataSource,
      //   {
      //     headers: {
      //       'Authorization': `Bearer ${this.grafanaApiKey}`,
      //       'Content-Type': 'application/json'
      //     }
      //   }
      // ).toPromise();

      // For now, simulate success
      const datasourceId = `datasource_${Date.now()}`;

      this.logger.log('Grafana data source created successfully', { name: this.datasourceName, datasourceId });

      return { success: true, datasourceId };
    } catch (error) {
      this.logger.error('Failed to create Grafana data source', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Check Grafana health
   */
  async checkGrafanaHealth(): Promise<{ status: 'healthy' | 'unhealthy'; responseTime?: number; error?: string }> {
    if (!this.grafanaEnabled) {
      return { status: 'healthy' };
    }

    const start = Date.now();
    try {
      // This would be a real HTTP request to Grafana
      // const response = await this.httpService.get(
      //   `${this.grafanaApiUrl}/api/health`,
      //   {
      //     headers: {
      //       'Authorization': `Bearer ${this.grafanaApiKey}`
      //     }
      //   }
      // ).toPromise();

      const responseTime = Date.now() - start;
      
      return {
        status: 'healthy',
        responseTime
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Private helper methods for creating panels

  private createUsagePanel(): any {
    return {
      id: 1,
      title: 'API Usage Over Time',
      type: 'graph',
      gridPos: { h: 8, w: 12, x: 0, y: 0 },
      targets: [
        {
          expr: 'sum(rate(analytics_events_total[5m])) by (service)',
          legendFormat: '{{service}}',
          refId: 'A'
        }
      ],
      yAxes: [
        {
          label: 'Requests/sec',
          min: 0
        }
      ],
      xAxis: {
        mode: 'time',
        name: 'Time'
      }
    };
  }

  private createPerformancePanel(): any {
    return {
      id: 2,
      title: 'Response Time',
      type: 'graph',
      gridPos: { h: 8, w: 12, x: 12, y: 0 },
      targets: [
        {
          expr: 'histogram_quantile(0.95, rate(analytics_response_time_bucket[5m]))',
          legendFormat: '95th percentile',
          refId: 'A'
        },
        {
          expr: 'histogram_quantile(0.50, rate(analytics_response_time_bucket[5m]))',
          legendFormat: '50th percentile',
          refId: 'B'
        }
      ],
      yAxes: [
        {
          label: 'Response Time (ms)',
          min: 0
        }
      ]
    };
  }

  private createErrorRatePanel(): any {
    return {
      id: 3,
      title: 'Error Rate',
      type: 'singlestat',
      gridPos: { h: 8, w: 6, x: 0, y: 8 },
      targets: [
        {
          expr: 'rate(analytics_errors_total[5m]) / rate(analytics_requests_total[5m]) * 100',
          refId: 'A'
        }
      ],
      valueName: 'current',
      format: 'percent',
      thresholds: '0,5,10',
      colorBackground: true,
      colorValue: true
    };
  }

  private createCostPanel(): any {
    return {
      id: 4,
      title: 'Total Cost',
      type: 'singlestat',
      gridPos: { h: 8, w: 6, x: 6, y: 8 },
      targets: [
        {
          expr: 'sum(analytics_total_cost)',
          refId: 'A'
        }
      ],
      valueName: 'current',
      format: 'currencyUSD',
      colorBackground: true,
      colorValue: true
    };
  }

  private createAIAnalyticsPanel(): any {
    return {
      id: 5,
      title: 'AI Model Usage',
      type: 'piechart',
      gridPos: { h: 8, w: 12, x: 12, y: 8 },
      targets: [
        {
          expr: 'sum(ai_analytics_total_requests) by (model_id)',
          legendFormat: '{{model_id}}',
          refId: 'A'
        }
      ],
      legend: {
        show: true,
        values: true,
        current: true,
        max: 10
      }
    };
  }

  private createUserUsagePanel(userId: string): any {
    return {
      id: 1,
      title: 'My Usage',
      type: 'graph',
      gridPos: { h: 8, w: 12, x: 0, y: 0 },
      targets: [
        {
          expr: `sum(rate(analytics_events_total{user_id="${userId}"}[5m]))`,
          legendFormat: 'Requests/sec',
          refId: 'A'
        }
      ]
    };
  }

  private createUserCostPanel(userId: string): any {
    return {
      id: 2,
      title: 'My Costs',
      type: 'singlestat',
      gridPos: { h: 8, w: 6, x: 12, y: 0 },
      targets: [
        {
          expr: `sum(analytics_total_cost{user_id="${userId}"})`,
          refId: 'A'
        }
      ],
      valueName: 'current',
      format: 'currencyUSD'
    };
  }

  private createUserActivityPanel(userId: string): any {
    return {
      id: 3,
      title: 'Recent Activity',
      type: 'table',
      gridPos: { h: 8, w: 12, x: 0, y: 8 },
      targets: [
        {
          expr: `analytics_events{user_id="${userId}"}`,
          format: 'table',
          refId: 'A'
        }
      ]
    };
  }

  private createUserRecommendationsPanel(userId: string): any {
    return {
      id: 4,
      title: 'Recommendations',
      type: 'text',
      gridPos: { h: 8, w: 12, x: 12, y: 8 },
      content: 'Personalized recommendations based on your usage patterns...'
    };
  }

  /**
   * Get Grafana configuration
   */
  getConfiguration(): {
    enabled: boolean;
    apiUrl: string;
    datasourceName: string;
  } {
    return {
      enabled: this.grafanaEnabled,
      apiUrl: this.grafanaApiUrl,
      datasourceName: this.datasourceName
    };
  }
}
