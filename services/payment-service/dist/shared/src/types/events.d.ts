export interface BaseEvent {
    id: string;
    type: string;
    version: string;
    timestamp: Date;
    source: string;
    correlationId?: string;
    metadata?: Record<string, unknown>;
}
export interface UserCreatedEvent extends BaseEvent {
    type: 'user.created';
    data: {
        userId: string;
        email: string;
        role: string;
    };
}
export interface UserUpdatedEvent extends BaseEvent {
    type: 'user.updated';
    data: {
        userId: string;
        changes: Record<string, unknown>;
    };
}
export interface UserDeletedEvent extends BaseEvent {
    type: 'user.deleted';
    data: {
        userId: string;
    };
}
export interface ApiKeyCreatedEvent extends BaseEvent {
    type: 'api_key.created';
    data: {
        apiKeyId: string;
        userId: string;
        name: string;
    };
}
export interface ApiKeyRevokedEvent extends BaseEvent {
    type: 'api_key.revoked';
    data: {
        apiKeyId: string;
        userId: string;
    };
}
export interface BillingChargeEvent extends BaseEvent {
    type: 'billing.charge';
    data: {
        userId: string;
        amount: number;
        currency: string;
        description: string;
        requestId: string;
    };
}
export interface BillingRefundEvent extends BaseEvent {
    type: 'billing.refund';
    data: {
        userId: string;
        amount: number;
        currency: string;
        reason: string;
        requestId: string;
    };
}
export interface BillingLimitExceededEvent extends BaseEvent {
    type: 'billing.limit_exceeded';
    data: {
        userId: string;
        limitType: 'daily' | 'monthly' | 'per_request';
        currentUsage: number;
        limit: number;
    };
}
export interface ProviderRequestEvent extends BaseEvent {
    type: 'provider.request';
    data: {
        requestId: string;
        userId: string;
        provider: string;
        model: string;
        tokens: number;
        cost: number;
    };
}
export interface ProviderResponseEvent extends BaseEvent {
    type: 'provider.response';
    data: {
        requestId: string;
        userId: string;
        provider: string;
        model: string;
        success: boolean;
        tokens: number;
        cost: number;
        responseTime: number;
        error?: string;
    };
}
export interface UsageAnalyticsEvent extends BaseEvent {
    type: 'analytics.usage';
    data: {
        userId: string;
        provider: string;
        model: string;
        tokens: number;
        cost: number;
        responseTime: number;
        timestamp: Date;
    };
}
export interface ErrorAnalyticsEvent extends BaseEvent {
    type: 'analytics.error';
    data: {
        userId?: string;
        service: string;
        error: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        metadata?: Record<string, unknown>;
    };
}
export interface ServiceHealthEvent extends BaseEvent {
    type: 'system.health';
    data: {
        service: string;
        status: 'healthy' | 'unhealthy' | 'degraded';
        metrics: Record<string, unknown>;
    };
}
export interface ServiceShutdownEvent extends BaseEvent {
    type: 'system.shutdown';
    data: {
        service: string;
        reason: string;
    };
}
export type Event = UserCreatedEvent | UserUpdatedEvent | UserDeletedEvent | ApiKeyCreatedEvent | ApiKeyRevokedEvent | BillingChargeEvent | BillingRefundEvent | BillingLimitExceededEvent | ProviderRequestEvent | ProviderResponseEvent | UsageAnalyticsEvent | ErrorAnalyticsEvent | ServiceHealthEvent | ServiceShutdownEvent;
export interface EventHandler<T extends Event = Event> {
    handle(event: T): Promise<void>;
}
export interface EventPublisher {
    publish<T extends Event>(event: T): Promise<void>;
}
export interface EventSubscriber {
    subscribe<T extends Event>(eventType: T['type'], handler: EventHandler<T>): Promise<void>;
}
