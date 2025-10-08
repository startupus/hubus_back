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
var WebhookService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let WebhookService = WebhookService_1 = class WebhookService {
    configService;
    httpService;
    logger = new common_1.Logger(WebhookService_1.name);
    webhooks = new Map();
    retryAttempts = 3;
    retryDelay = 1000;
    constructor(configService, httpService) {
        this.configService = configService;
        this.httpService = httpService;
        this.initializeWebhooks();
    }
    async sendEvent(event) {
        const results = [];
        for (const [webhookId, config] of this.webhooks) {
            if (config.events.includes(event.eventType)) {
                try {
                    const result = await this.sendToWebhook(webhookId, config, {
                        type: 'event',
                        data: event,
                        timestamp: new Date().toISOString()
                    });
                    results.push(result);
                }
                catch (error) {
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
    async sendMetrics(metrics) {
        const results = [];
        for (const [webhookId, config] of this.webhooks) {
            if (config.events.includes('metrics')) {
                try {
                    const result = await this.sendToWebhook(webhookId, config, {
                        type: 'metrics',
                        data: metrics,
                        timestamp: new Date().toISOString()
                    });
                    results.push(result);
                }
                catch (error) {
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
    async sendBatch(events, metrics) {
        const results = [];
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
            }
            catch (error) {
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
    async sendAlert(alert) {
        const results = [];
        for (const [webhookId, config] of this.webhooks) {
            if (config.events.includes('alert')) {
                try {
                    const result = await this.sendToWebhook(webhookId, config, {
                        type: 'alert',
                        data: alert,
                        timestamp: new Date().toISOString()
                    });
                    results.push(result);
                }
                catch (error) {
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
    addWebhook(webhookId, config) {
        this.webhooks.set(webhookId, config);
        this.logger.log('Webhook added', { webhookId, url: config.url });
    }
    removeWebhook(webhookId) {
        const removed = this.webhooks.delete(webhookId);
        if (removed) {
            this.logger.log('Webhook removed', { webhookId });
        }
        return removed;
    }
    async testWebhook(webhookId) {
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
        }
        catch (error) {
            return {
                success: false,
                responseTime: Date.now() - start,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    getWebhookStatus() {
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
    async sendToWebhook(webhookId, config, payload, isTest = false) {
        if (!config.enabled && !isTest) {
            return {
                webhookId,
                success: false,
                error: 'Webhook disabled'
            };
        }
        let lastError = null;
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                this.logger.debug('Sending to webhook', {
                    webhookId,
                    attempt,
                    url: config.url,
                    isTest
                });
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(config.url, payload, {
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'AI-Aggregator-Analytics/1.0',
                        ...config.headers
                    },
                    timeout: config.timeout || 5000
                }));
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
            }
            catch (error) {
                lastError = error;
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
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    initializeWebhooks() {
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
};
exports.WebhookService = WebhookService;
exports.WebhookService = WebhookService = WebhookService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        axios_1.HttpService])
], WebhookService);
//# sourceMappingURL=webhook.service.js.map