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
var SubscriptionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
const library_1 = require("@prisma/client/runtime/library");
const billing_service_1 = require("./billing.service");
let SubscriptionService = SubscriptionService_1 = class SubscriptionService {
    constructor(prisma, billingService) {
        this.prisma = prisma;
        this.billingService = billingService;
        this.logger = new common_1.Logger(SubscriptionService_1.name);
    }
    async getSubscriptionPlans() {
        this.logger.log('Getting subscription plans');
        try {
            const plans = await this.prisma.pricingPlan.findMany({
                where: {
                    isActive: true,
                    type: 'SUBSCRIPTION'
                },
                orderBy: {
                    price: 'asc'
                }
            });
            return {
                success: true,
                data: plans.map(plan => ({
                    id: plan.id,
                    name: plan.name,
                    description: plan.description,
                    price: plan.price.toString(),
                    currency: plan.currency,
                    billingCycle: plan.billingCycle.toLowerCase(),
                    features: plan.features ? Object.values(plan.features) : [],
                    limits: plan.limits || {},
                    inputTokens: plan.inputTokens,
                    outputTokens: plan.outputTokens,
                    inputTokenPrice: plan.inputTokenPrice?.toString(),
                    outputTokenPrice: plan.outputTokenPrice?.toString(),
                    discountPercent: plan.discountPercent?.toString()
                }))
            };
        }
        catch (error) {
            this.logger.error('Failed to get subscription plans', error);
            return {
                success: false,
                error: 'Failed to get subscription plans'
            };
        }
    }
    async getHardcodedPlans() {
        this.logger.log('Getting hardcoded subscription plans');
        const plans = [
            {
                id: 'basic',
                name: 'Basic',
                description: 'Базовый план для небольших команд',
                price: '29.99',
                currency: 'USD',
                billingCycle: 'monthly',
                features: [
                    'До 1000 запросов в месяц',
                    'Базовые ИИ модели',
                    'Email поддержка',
                    'API доступ'
                ],
                limits: {
                    monthlyRequests: 1000,
                    maxUsers: 5,
                    storage: '1GB'
                }
            },
            {
                id: 'professional',
                name: 'Professional',
                description: 'Профессиональный план для растущих команд',
                price: '99.99',
                currency: 'USD',
                billingCycle: 'monthly',
                features: [
                    'До 10000 запросов в месяц',
                    'Все ИИ модели',
                    'Приоритетная поддержка',
                    'Расширенный API',
                    'Аналитика и отчеты'
                ],
                limits: {
                    monthlyRequests: 10000,
                    maxUsers: 25,
                    storage: '10GB'
                }
            },
            {
                id: 'enterprise',
                name: 'Enterprise',
                description: 'Корпоративный план для больших организаций',
                price: '299.99',
                currency: 'USD',
                billingCycle: 'monthly',
                features: [
                    'Неограниченные запросы',
                    'Все ИИ модели',
                    '24/7 поддержка',
                    'Полный API доступ',
                    'Расширенная аналитика',
                    'Кастомные интеграции',
                    'SLA гарантии'
                ],
                limits: {
                    monthlyRequests: -1,
                    maxUsers: -1,
                    storage: '100GB'
                }
            }
        ];
        return {
            success: true,
            data: plans
        };
    }
    async getMySubscription(companyId) {
        this.logger.log(`Getting subscription for company ${companyId}`);
        const subscription = await this.prisma.subscription.findFirst({
            where: {
                companyId,
                status: 'ACTIVE'
            },
            orderBy: { createdAt: 'desc' }
        });
        if (!subscription) {
            return {
                success: true,
                data: {
                    hasSubscription: false,
                    subscription: null
                }
            };
        }
        return {
            success: true,
            data: {
                hasSubscription: true,
                subscription: {
                    id: subscription.id,
                    planId: subscription.planId,
                    status: subscription.status,
                    currentPeriodStart: subscription.currentPeriodStart,
                    currentPeriodEnd: subscription.currentPeriodEnd,
                    price: subscription.price.toString(),
                    currency: subscription.currency,
                    createdAt: subscription.createdAt
                }
            }
        };
    }
    async getSubscriptionUsage(companyId) {
        this.logger.log(`Getting subscription usage for company ${companyId}`);
        const subscription = await this.prisma.subscription.findFirst({
            where: {
                companyId,
                status: 'ACTIVE'
            },
            orderBy: { createdAt: 'desc' }
        });
        if (!subscription) {
            return {
                success: true,
                data: {
                    hasSubscription: false,
                    usage: null
                }
            };
        }
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = new Date();
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);
        endOfMonth.setHours(23, 59, 59, 999);
        const usageStats = await this.prisma.usageEvent.aggregate({
            where: {
                companyId,
                timestamp: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            },
            _sum: {
                quantity: true,
                cost: true
            },
            _count: {
                id: true
            }
        });
        return {
            success: true,
            data: {
                hasSubscription: true,
                usage: {
                    currentPeriod: {
                        start: startOfMonth,
                        end: endOfMonth
                    },
                    requests: usageStats._count.id || 0,
                    totalCost: usageStats._sum.cost?.toString() || '0',
                    quantity: usageStats._sum.quantity || 0
                },
                subscription: {
                    id: subscription.id,
                    planId: subscription.planId,
                    status: subscription.status
                }
            }
        };
    }
    async subscribeToPlan(companyId, planId) {
        this.logger.log(`Subscribing company ${companyId} to plan ${planId}`);
        const company = await this.prisma.company.findUnique({
            where: { id: companyId }
        });
        if (!company) {
            throw new common_1.NotFoundException('Company not found');
        }
        const plans = await this.getSubscriptionPlans();
        const plan = plans.data.find(p => p.id === planId);
        if (!plan) {
            throw new common_1.BadRequestException('Invalid plan ID');
        }
        await this.prisma.subscription.updateMany({
            where: {
                companyId,
                status: 'ACTIVE'
            },
            data: {
                status: 'CANCELLED',
                currentPeriodEnd: new Date()
            }
        });
        const planPrice = new library_1.Decimal(plan.price);
        await this.billingService.chargeForSubscription(companyId, planPrice, planId);
        const currentPeriodStart = new Date();
        const currentPeriodEnd = new Date();
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
        const subscription = await this.prisma.subscription.create({
            data: {
                companyId,
                planId,
                status: 'ACTIVE',
                currentPeriodStart,
                currentPeriodEnd,
                price: planPrice,
                currency: plan.currency
            }
        });
        return {
            success: true,
            data: {
                subscription: {
                    id: subscription.id,
                    planId: subscription.planId,
                    status: subscription.status,
                    currentPeriodStart: subscription.currentPeriodStart,
                    currentPeriodEnd: subscription.currentPeriodEnd,
                    price: subscription.price.toString(),
                    currency: subscription.currency
                }
            }
        };
    }
    async cancelSubscription(companyId) {
        this.logger.log(`Cancelling subscription for company ${companyId}`);
        const subscription = await this.prisma.subscription.findFirst({
            where: {
                companyId,
                status: 'ACTIVE'
            },
            orderBy: { createdAt: 'desc' }
        });
        if (!subscription) {
            throw new common_1.NotFoundException('No active subscription found');
        }
        await this.prisma.subscription.update({
            where: { id: subscription.id },
            data: {
                status: 'CANCELLED',
                currentPeriodEnd: new Date()
            }
        });
        return {
            success: true,
            message: 'Subscription cancelled successfully'
        };
    }
};
exports.SubscriptionService = SubscriptionService;
exports.SubscriptionService = SubscriptionService = SubscriptionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        billing_service_1.BillingService])
], SubscriptionService);
//# sourceMappingURL=subscription.service.js.map