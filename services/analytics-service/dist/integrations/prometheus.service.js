"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PrometheusService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrometheusService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let PrometheusService = PrometheusService_1 = class PrometheusService {
    configService;
    logger = new common_1.Logger(PrometheusService_1.name);
    prometheusEnabled;
    prometheusEndpoint;
    customMetrics = new Map();
    constructor(configService) {
        this.configService = configService;
        this.prometheusEnabled = this.configService.get('PROMETHEUS_ENABLED', false);
        this.prometheusEndpoint = this.configService.get('PROMETHEUS_ENDPOINT', 'http://localhost:9090');
    }
    async exportMetrics(metrics) {
        if (!this.prometheusEnabled) {
            this.logger.debug('Prometheus export disabled');
            return false;
        }
        try {
            this.logger.debug('Exporting metrics to Prometheus', {
                metricsCount: metrics.length,
                endpoint: this.prometheusEndpoint
            });
            const groupedMetrics = this.groupMetricsByType(metrics);
            for (const [metricType, metricGroup] of groupedMetrics) {
                await this.exportMetricGroup(metricType, metricGroup);
            }
            this.logger.log('Metrics exported to Prometheus successfully', {
                totalMetrics: metrics.length,
                metricTypes: Object.keys(groupedMetrics).length
            });
            return true;
        }
        catch (error) {
            this.logger.error('Failed to export metrics to Prometheus', error);
            return false;
        }
    }
    async exportMetric(metric) {
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
        }
        catch (error) {
            this.logger.error('Failed to export single metric to Prometheus', error);
            return false;
        }
    }
    createCustomMetric(name, type, help) {
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
        }
        catch (error) {
            this.logger.error('Failed to create custom metric', error);
            return null;
        }
    }
    updateCustomMetric(name, value, labels) {
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
        }
        catch (error) {
            this.logger.error('Failed to update custom metric', error);
        }
    }
    async getPrometheusMetrics() {
        try {
            const metrics = [];
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
        }
        catch (error) {
            this.logger.error('Failed to get Prometheus metrics', error);
            return '';
        }
    }
    async checkPrometheusHealth() {
        if (!this.prometheusEnabled) {
            return { status: 'healthy' };
        }
        const start = Date.now();
        try {
            const responseTime = Date.now() - start;
            return {
                status: 'healthy',
                responseTime
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                responseTime: Date.now() - start,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    groupMetricsByType(metrics) {
        const grouped = new Map();
        for (const metric of metrics) {
            const key = `${metric.service}_${metric.metricType}`;
            if (!grouped.has(key)) {
                grouped.set(key, []);
            }
            grouped.get(key).push(metric);
        }
        return grouped;
    }
    async exportMetricGroup(metricType, metrics) {
        try {
            const prometheusMetrics = metrics.map(metric => this.formatMetricForPrometheus(metric));
            await this.sendToPrometheus(prometheusMetrics.join('\n'));
            this.logger.debug('Metric group exported to Prometheus', {
                metricType,
                count: metrics.length
            });
        }
        catch (error) {
            this.logger.error('Failed to export metric group to Prometheus', error);
            throw error;
        }
    }
    formatMetricForPrometheus(metric) {
        const metricName = this.sanitizeMetricName(`${metric.service}_${metric.metricName}`);
        const labels = this.formatLabelsForPrometheus(metric.labels);
        const timestamp = Math.floor(metric.timestamp.getTime() / 1000);
        return `${metricName}${labels} ${metric.value} ${timestamp}`;
    }
    formatLabelsForPrometheus(labels) {
        if (Object.keys(labels).length === 0) {
            return '';
        }
        const labelPairs = Object.entries(labels)
            .map(([key, value]) => `${this.sanitizeLabelName(key)}="${this.sanitizeLabelValue(value)}"`)
            .join(',');
        return `{${labelPairs}}`;
    }
    sanitizeMetricName(name) {
        return name
            .replace(/[^a-zA-Z0-9_:]/g, '_')
            .replace(/^[0-9]/, '_$&');
    }
    sanitizeLabelName(name) {
        return name
            .replace(/[^a-zA-Z0-9_]/g, '_')
            .replace(/^[0-9]/, '_$&');
    }
    sanitizeLabelValue(value) {
        return value
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"');
    }
    async sendToPrometheus(metrics) {
        try {
            this.logger.debug('Sending metrics to Prometheus', {
                endpoint: this.prometheusEndpoint,
                metricsLength: metrics.length
            });
        }
        catch (error) {
            this.logger.error('Failed to send metrics to Prometheus', error);
            throw error;
        }
    }
    getConfiguration() {
        return {
            enabled: this.prometheusEnabled,
            endpoint: this.prometheusEndpoint,
            customMetricsCount: this.customMetrics.size
        };
    }
};
exports.PrometheusService = PrometheusService;
exports.PrometheusService = PrometheusService = PrometheusService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PrometheusService);
//# sourceMappingURL=prometheus.service.js.map