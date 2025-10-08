export interface AnalyticsEvent {
    id?: string;
    userId?: string;
    sessionId?: string;
    eventType: EventType;
    eventName: string;
    service: string;
    properties: Record<string, any>;
    metadata?: Record<string, any>;
    timestamp?: Date;
    ipAddress?: string;
    userAgent?: string;
}
export declare enum EventType {
    USER_ACTION = "user_action",
    SYSTEM_EVENT = "system_event",
    AI_INTERACTION = "ai_interaction",
    SECURITY_EVENT = "security_event",
    BILLING_EVENT = "billing_event",
    PERFORMANCE_EVENT = "performance_event",
    ERROR_EVENT = "error_event"
}
export interface MetricsSnapshot {
    id?: string;
    service: string;
    metricType: MetricType;
    metricName: string;
    value: number;
    unit: string;
    labels: Record<string, string>;
    timestamp?: Date;
    metadata?: Record<string, any>;
}
export declare enum MetricType {
    PERFORMANCE = "performance",
    USAGE = "usage",
    ERROR = "error",
    RESOURCE = "resource",
    BUSINESS = "business",
    SECURITY = "security"
}
export interface UserAnalytics {
    id?: string;
    userId: string;
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    averageResponseTime: number;
    successRate: number;
    lastActivity: Date;
    preferences?: UserPreferences;
    timezone?: string;
    language?: string;
}
export interface UserPreferences {
    dashboardLayout?: string;
    defaultTimeRange?: string;
    favoriteMetrics?: string[];
    alertSettings?: AlertSettings;
    exportSettings?: ExportSettings;
    [key: string]: any;
}
export interface AlertSettings {
    emailNotifications: boolean;
    pushNotifications: boolean;
    criticalAlerts: boolean;
    warningAlerts: boolean;
    infoAlerts: boolean;
}
export interface ExportSettings {
    defaultFormat: 'csv' | 'json' | 'excel';
    includeMetadata: boolean;
    dateRange: string;
}
export interface UserUsageHistory {
    id?: string;
    userId: string;
    date: Date;
    requests: number;
    tokens: number;
    cost: number;
    models: Record<string, number>;
    providers: Record<string, number>;
}
export interface UserCostHistory {
    id?: string;
    userId: string;
    date: Date;
    totalCost: number;
    modelCosts: Record<string, number>;
    providerCosts: Record<string, number>;
    currency: string;
}
export interface AIAnalytics {
    id?: string;
    modelId: string;
    provider: string;
    totalRequests: number;
    totalTokens: number;
    averageLatency: number;
    successRate: number;
    averageCost: number;
    qualityScore?: number;
    lastUpdated: Date;
    metadata?: Record<string, any>;
}
export interface AIClassificationAnalytics {
    id?: string;
    modelId: string;
    category: string;
    totalClassified: number;
    accuracyRate: number;
    averageConfidence: number;
    processingTime: number;
    lastUpdated: Date;
}
export interface AICertificationAnalytics {
    id?: string;
    modelId: string;
    certificationLevel: string;
    totalCertified: number;
    complianceRate: number;
    auditFindings: number;
    renewalRate: number;
    lastUpdated: Date;
}
export interface AISafetyAnalytics {
    id?: string;
    modelId: string;
    safetyLevel: string;
    totalAssessed: number;
    riskScore: number;
    biasScore: number;
    incidentCount: number;
    lastUpdated: Date;
}
export interface SystemHealth {
    id?: string;
    service: string;
    status: HealthStatus;
    responseTime?: number;
    errorRate?: number;
    cpuUsage?: number;
    memoryUsage?: number;
    diskUsage?: number;
    networkLatency?: number;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';
export interface ErrorAnalytics {
    id?: string;
    service: string;
    errorType: string;
    errorCode?: string;
    errorMessage?: string;
    stackTrace?: string;
    userId?: string;
    requestId?: string;
    timestamp: Date;
    resolved: boolean;
    resolvedAt?: Date;
    metadata?: Record<string, any>;
}
export interface Alert {
    id?: string;
    alertType: AlertType;
    alertName: string;
    description: string;
    service?: string;
    userId?: string;
    isActive: boolean;
    triggeredAt: Date;
    resolvedAt?: Date;
    metadata?: Record<string, any>;
}
export declare enum AlertType {
    CRITICAL = "critical",
    WARNING = "warning",
    INFO = "info"
}
export interface AlertRule {
    id?: string;
    name: string;
    description: string;
    alertType: AlertType;
    condition: AlertCondition;
    threshold?: number;
    service?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface AlertCondition {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    value: number;
    timeWindow: number;
    consecutiveViolations?: number;
}
export interface DashboardData {
    summary: DashboardSummary;
    charts: ChartData[];
    recentActivity: ActivityItem[];
    alerts: Alert[];
    recommendations: Recommendation[];
}
export interface DashboardSummary {
    totalRequests: number;
    totalUsers: number;
    totalCost: number;
    averageResponseTime: number;
    successRate: number;
    uptime: number;
}
export interface ChartData {
    id: string;
    type: ChartType;
    title: string;
    data: any[];
    xAxis: string;
    yAxis: string;
    timeRange: TimeRange;
}
export type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'scatter';
export interface TimeRange {
    start: Date;
    end: Date;
    granularity: 'minute' | 'hour' | 'day' | 'week' | 'month';
}
export interface ActivityItem {
    id: string;
    timestamp: Date;
    type: string;
    description: string;
    userId?: string;
    metadata?: Record<string, any>;
}
export interface Recommendation {
    id: string;
    type: RecommendationType;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    actionRequired: boolean;
    estimatedImpact?: string;
}
export type RecommendationType = 'cost_optimization' | 'performance_improvement' | 'security_enhancement' | 'usage_optimization' | 'model_recommendation';
export interface ExternalIntegration {
    id?: string;
    integrationType: IntegrationType;
    name: string;
    config: IntegrationConfig;
    isActive: boolean;
    lastSync?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export type IntegrationType = 'prometheus' | 'grafana' | 'slack' | 'discord' | 'webhook' | 'email' | 'elasticsearch';
export interface IntegrationConfig {
    endpoint?: string;
    apiKey?: string;
    webhookUrl?: string;
    channel?: string;
    username?: string;
    icon?: string;
    [key: string]: any;
}
export interface DataExport {
    id?: string;
    exportType: ExportType;
    filters: ExportFilters;
    status: ExportStatus;
    filePath?: string;
    userId?: string;
    createdAt: Date;
    completedAt?: Date;
    expiresAt?: Date;
}
export declare enum ExportType {
    CSV = "csv",
    JSON = "json",
    EXCEL = "excel",
    PDF = "pdf"
}
export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed';
export interface ExportFilters {
    dateRange: {
        start: Date;
        end: Date;
    };
    eventTypes?: EventType[];
    services?: string[];
    userIds?: string[];
    metrics?: string[];
}
export interface AnalyticsRequest {
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    eventTypes?: EventType[];
    services?: string[];
    metrics?: string[];
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface AnalyticsResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    pagination?: PaginationInfo;
    metadata?: Record<string, any>;
}
export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export interface MetricsResponse {
    metrics: MetricsSnapshot[];
    summary: MetricsSummary;
    trends: TrendData[];
}
export interface MetricsSummary {
    totalMetrics: number;
    averageValue: number;
    minValue: number;
    maxValue: number;
    lastUpdated: Date;
}
export interface TrendData {
    metric: string;
    trend: 'up' | 'down' | 'stable';
    changePercent: number;
    period: string;
}
export interface BatchEvent {
    events: AnalyticsEvent[];
    batchId: string;
    timestamp: Date;
    source: string;
}
export interface BatchMetrics {
    metrics: MetricsSnapshot[];
    batchId: string;
    timestamp: Date;
    source: string;
}
export interface ProcessingResult {
    success: boolean;
    processed: number;
    failed: number;
    errors: ProcessingError[];
    batchId: string;
}
export interface ProcessingError {
    index: number;
    error: string;
    data: any;
}
export interface AnalyticsConfig {
    dataRetention: {
        events: number;
        metrics: number;
        exports: number;
    };
    batchProcessing: {
        enabled: boolean;
        batchSize: number;
        flushInterval: number;
    };
    realTimeProcessing: {
        enabled: boolean;
        maxConcurrency: number;
    };
    alerting: {
        enabled: boolean;
        checkInterval: number;
        maxAlertsPerMinute: number;
    };
    integrations: {
        prometheus: PrometheusConfig;
        grafana: GrafanaConfig;
        webhooks: WebhookConfig[];
    };
}
export interface PrometheusConfig {
    enabled: boolean;
    endpoint: string;
    port: number;
    path: string;
    customMetrics: string[];
}
export interface GrafanaConfig {
    enabled: boolean;
    apiUrl: string;
    apiKey: string;
    dashboardPath: string;
    datasourceName: string;
}
export interface WebhookConfig {
    name: string;
    url: string;
    events: EventType[];
    headers: Record<string, string>;
    retryAttempts: number;
    timeout: number;
}
