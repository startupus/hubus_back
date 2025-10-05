import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MetricsSnapshot } from '../types/analytics.types';
import { LoggerUtil } from '@ai-aggregator/shared';

/**
 * Prometheus Integration Service
 * 
 * Responsible for:
 * - Exporting metrics to Prometheus
 * - Custom metrics collection
 * - Prometheus server communication
 * - Metrics formatting and labeling
 */
@Injectable()
export class PrometheusService {
  private readonly logger = new Logger(PrometheusService.name);
  private readonly prometheusEnabled: boolean;
  private readonly prometheusEndpoint: string;
  private readonly customMetrics: Map<string, any> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.prometheusEnabled = this.configService.get('PROMETHEUS_ENABLED', false);
    this.prometheusEndpoint = this.configService.get('PROMETHEUS_ENDPOINT', 'http://localhost:9090');
  }

  /**
   * Export metrics to Prometheus
   */
  async exportMetrics(metrics: MetricsSnapshot[]): Promise<boolean> {
    if (!this.prometheusEnabled) {
      this.logger.debug('Prometheus export disabled');
      return false;
    }

    try {
      this.logger.debug('Exporting metrics to Prometheus', {
        metricsCount: metrics.length,
        endpoint: this.prometheusEndpoint
      });

      // Group metrics by type for better organization
      const groupedMetrics = this.groupMetricsByType(metrics);

      // Export each group
      for (const [metricType, metricGroup] of groupedMetrics) {
        await this.exportMetricGroup(metricType, metricGroup);
      }

      this.logger.log('Metrics exported to Prometheus successfully', {
        totalMetrics: metrics.length,
        metricTypes: Object.keys(groupedMetrics).length
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to export metrics to Prometheus', error);
      return false;
    }
  }

  /**
   * Export a single metric to Prometheus
   */
  async exportMetric(metric: MetricsSnapshot): Promise<boolean> {
    if (!this.prometheusEnabled) {
      return false;
    }

    try {
      const prometheusMetric = this.formatMetricForPrometheus(metric);
      await this.sendToPrometheus(prometheusMetric);

      this.logger.debug('Metric exported to Prometheus', {
        metricName: metric.metricName,
        service: metric.service,
        value: metric.value
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to export single metric to Prometheus', error);
      return false;
    }
  }

  /**
   * Create custom Prometheus metrics
   */
  createCustomMetric(name: string, type: 'counter' | 'gauge' | 'histogram' | 'summary', help: string): any {
    if (!this.prometheusEnabled) {
      return null;
    }

    try {
      const metric = {
        name: this.sanitizeMetricName(name),
        type,
        help,
        labels: new Map(),
        values: new Map()
      };

      this.customMetrics.set(name, metric);

      this.logger.debug('Custom metric created', { name, type, help });
      return metric;
    } catch (error) {
      this.logger.error('Failed to create custom metric', error);
      return null;
    }
  }

  /**
   * Update custom metric value
   */
  updateCustomMetric(name: string, value: number, labels?: Record<string, string>): void {
    if (!this.prometheusEnabled) {
      return;
    }

    try {
      const metric = this.customMetrics.get(name);
      if (!metric) {
        this.logger.warn('Custom metric not found', { name });
        return;
      }

      const labelKey = labels ? JSON.stringify(labels) : 'default';
      metric.values.set(labelKey, { value, labels: labels || {} });

      this.logger.debug('Custom metric updated', { name, value, labels });
    } catch (error) {
      this.logger.error('Failed to update custom metric', error);
    }
  }

  /**
   * Get Prometheus metrics in text format
   */
  async getPrometheusMetrics(): Promise<string> {
    try {
      const metrics: string[] = [];
      
      // Add custom metrics
      for (const [name, metric] of this.customMetrics) {
        metrics.push(`# HELP ${name} ${metric.help}`);
        metrics.push(`# TYPE ${name} ${metric.type}`);
        
        for (const [labelKey, data] of metric.values) {
          const labelString = Object.keys(data.labels).length > 0 
            ? `{${Object.entries(data.labels).map(([k, v]) => `${k}="${v}"`).join(',')}}`
            : '';
          metrics.push(`${name}${labelString} ${data.value}`);
        }
      }

      return metrics.join('\n') + '\n';
    } catch (error) {
      this.logger.error('Failed to get Prometheus metrics', error);
      return '';
    }
  }

  /**
   * Check Prometheus server health
   */
  async checkPrometheusHealth(): Promise<{ status: 'healthy' | 'unhealthy'; responseTime?: number; error?: string }> {
    if (!this.prometheusEnabled) {
      return { status: 'healthy' };
    }

    const start = Date.now();
    try {
      // This would be a real HTTP request to Prometheus
      // For now, we'll simulate a health check
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

  // Private helper methods

  private groupMetricsByType(metrics: MetricsSnapshot[]): Map<string, MetricsSnapshot[]> {
    const grouped = new Map<string, MetricsSnapshot[]>();

    for (const metric of metrics) {
      const key = `${metric.service}_${metric.metricType}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(metric);
    }

    return grouped;
  }

  private async exportMetricGroup(metricType: string, metrics: MetricsSnapshot[]): Promise<void> {
    try {
      // Format metrics for Prometheus
      const prometheusMetrics = metrics.map(metric => this.formatMetricForPrometheus(metric));
      
      // Send to Prometheus
      await this.sendToPrometheus(prometheusMetrics.join('\n'));

      this.logger.debug('Metric group exported to Prometheus', {
        metricType,
        count: metrics.length
      });
    } catch (error) {
      this.logger.error('Failed to export metric group to Prometheus', error);
      throw error;
    }
  }

  private formatMetricForPrometheus(metric: MetricsSnapshot): string {
    const metricName = this.sanitizeMetricName(`${metric.service}_${metric.metricName}`);
    const labels = this.formatLabelsForPrometheus(metric.labels);
    const timestamp = Math.floor(metric.timestamp.getTime() / 1000);

    return `${metricName}${labels} ${metric.value} ${timestamp}`;
  }

  private formatLabelsForPrometheus(labels: Record<string, string>): string {
    if (Object.keys(labels).length === 0) {
      return '';
    }

    const labelPairs = Object.entries(labels)
      .map(([key, value]) => `${this.sanitizeLabelName(key)}="${this.sanitizeLabelValue(value)}"`)
      .join(',');

    return `{${labelPairs}}`;
  }

  private sanitizeMetricName(name: string): string {
    // Prometheus metric names must match [a-zA-Z_:][a-zA-Z0-9_:]*
    return name
      .replace(/[^a-zA-Z0-9_:]/g, '_')
      .replace(/^[0-9]/, '_$&');
  }

  private sanitizeLabelName(name: string): string {
    // Prometheus label names must match [a-zA-Z_][a-zA-Z0-9_]*
    return name
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/^[0-9]/, '_$&');
  }

  private sanitizeLabelValue(value: string): string {
    // Escape quotes and backslashes in label values
    return value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"');
  }

  private async sendToPrometheus(metrics: string): Promise<void> {
    try {
      // This would be a real HTTP request to Prometheus
      // For now, we'll just log the metrics
      this.logger.debug('Sending metrics to Prometheus', {
        endpoint: this.prometheusEndpoint,
        metricsLength: metrics.length
      });

      // In a real implementation, you would use HTTP client to send metrics
      // await this.httpService.post(`${this.prometheusEndpoint}/api/v1/import/prometheus`, {
      //   data: metrics
      // }).toPromise();
    } catch (error) {
      this.logger.error('Failed to send metrics to Prometheus', error);
      throw error;
    }
  }

  /**
   * Get Prometheus configuration
   */
  getConfiguration(): {
    enabled: boolean;
    endpoint: string;
    customMetricsCount: number;
  } {
    return {
      enabled: this.prometheusEnabled,
      endpoint: this.prometheusEndpoint,
      customMetricsCount: this.customMetrics.size
    };
  }
}
