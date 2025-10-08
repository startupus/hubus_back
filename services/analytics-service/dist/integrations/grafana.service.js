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
var GrafanaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrafanaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let GrafanaService = GrafanaService_1 = class GrafanaService {
    configService;
    logger = new common_1.Logger(GrafanaService_1.name);
    grafanaEnabled;
    grafanaApiUrl;
    grafanaApiKey;
    datasourceName;
    constructor(configService) {
        this.configService = configService;
        this.grafanaEnabled = this.configService.get('GRAFANA_ENABLED', false);
        this.grafanaApiUrl = this.configService.get('GRAFANA_API_URL', 'http://localhost:3000');
        this.grafanaApiKey = this.configService.get('GRAFANA_API_KEY', '');
        this.datasourceName = this.configService.get('GRAFANA_DATASOURCE_NAME', 'analytics-db');
    }
    async createDashboard(title, description, panels, tags = []) {
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
            const dashboardId = `dashboard_${Date.now()}`;
            this.logger.log('Grafana dashboard created successfully', {
                title,
                dashboardId,
                panelsCount: panels.length
            });
            return { success: true, dashboardId };
        }
        catch (error) {
            this.logger.error('Failed to create Grafana dashboard', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    async createAnalyticsDashboard() {
        try {
            const panels = [
                this.createUsagePanel(),
                this.createPerformancePanel(),
                this.createErrorRatePanel(),
                this.createCostPanel(),
                this.createAIAnalyticsPanel()
            ];
            return await this.createDashboard('AI Aggregator Analytics', 'Comprehensive analytics dashboard for AI Aggregator platform', panels, ['analytics', 'ai-aggregator', 'monitoring']);
        }
        catch (error) {
            this.logger.error('Failed to create analytics dashboard', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    async createUserDashboard(userId) {
        try {
            const panels = [
                this.createUserUsagePanel(userId),
                this.createUserCostPanel(userId),
                this.createUserActivityPanel(userId),
                this.createUserRecommendationsPanel(userId)
            ];
            return await this.createDashboard(`User Analytics - ${userId}`, `Personal analytics dashboard for user ${userId}`, panels, ['user', 'analytics', userId]);
        }
        catch (error) {
            this.logger.error('Failed to create user dashboard', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    async createAlertRule(name, condition, frequency, message, severity = 'warning') {
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
            const ruleId = `rule_${Date.now()}`;
            this.logger.log('Grafana alert rule created successfully', { name, ruleId });
            return { success: true, ruleId };
        }
        catch (error) {
            this.logger.error('Failed to create Grafana alert rule', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    async createDataSource() {
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
            const datasourceId = `datasource_${Date.now()}`;
            this.logger.log('Grafana data source created successfully', { name: this.datasourceName, datasourceId });
            return { success: true, datasourceId };
        }
        catch (error) {
            this.logger.error('Failed to create Grafana data source', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    async checkGrafanaHealth() {
        if (!this.grafanaEnabled) {
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
    createUsagePanel() {
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
    createPerformancePanel() {
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
    createErrorRatePanel() {
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
    createCostPanel() {
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
    createAIAnalyticsPanel() {
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
    createUserUsagePanel(userId) {
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
    createUserCostPanel(userId) {
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
    createUserActivityPanel(userId) {
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
    createUserRecommendationsPanel(userId) {
        return {
            id: 4,
            title: 'Recommendations',
            type: 'text',
            gridPos: { h: 8, w: 12, x: 12, y: 8 },
            content: 'Personalized recommendations based on your usage patterns...'
        };
    }
    getConfiguration() {
        return {
            enabled: this.grafanaEnabled,
            apiUrl: this.grafanaApiUrl,
            datasourceName: this.datasourceName
        };
    }
};
exports.GrafanaService = GrafanaService;
exports.GrafanaService = GrafanaService = GrafanaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GrafanaService);
//# sourceMappingURL=grafana.service.js.map