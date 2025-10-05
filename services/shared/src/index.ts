/**
 * AI Aggregator Shared Package
 * Exports all types, DTOs, utilities, and constants
 */

// Types
export * from './types/common';
export * from './types/auth';
export * from './types/billing';
export * from './types/providers';
export * from './types/events';
export * from './types/ai-certification';

// DTOs
export * from './dto/base.dto';
export * from './dto/auth.dto';
export * from './dto/billing.dto';
export * from './dto/providers.dto';
export * from './dto/chat.dto';
export * from './dto/ai-certification.dto';

// Utilities
export * from './utils/crypto.util';
export * from './utils/validation.util';
export * from './utils/response.util';
export * from './utils/logger.util';
export * from './utils/concurrency.util';

// Services
export * from './services/anonymization.service';
export * from './services/ai-classification.service';
export * from './services/ai-safety.service';
export * from './services/redis.service';
export * from './services/rabbitmq.service';
export * from './services/thread-pool.service';

// Constants
export * from './constants';

// Interfaces
export * from './interfaces/config.interface';

// Re-export commonly used types for convenience
export type {
  User,
  ApiKey,
  JwtPayload,
  UserRole,
  Permission,
  AuthContext,
  AuthResult,
} from './types/auth';

export type {
  BillingRecord,
  UserBalance,
  BillingTransaction,
  CostCalculation,
  UsageStats,
} from './types/billing';

export type {
  ProviderRequest,
  ProviderResponse,
  ChatMessage,
  TokenUsage,
  ProviderConfig,
  ProviderModel,
} from './types/providers';

export type {
  BaseEntity,
  PaginationParams,
  PaginatedResponse,
  ServiceResponse,
  ErrorResponse,
  RequestContext,
  HealthCheck,
  Metrics,
} from './types/common';

export type {
  BaseEvent,
  Event,
  EventHandler,
  EventPublisher,
  EventSubscriber,
} from './types/events';

export type {
  MicroserviceConfig,
  DatabaseConfig,
  RedisConfig,
  RabbitMQConfig,
  JwtConfig,
  ProvidersConfig,
  BillingConfig,
  RateLimitConfig,
  MonitoringConfig,
  SecurityConfig,
  ServiceConfig,
} from './interfaces/config.interface';

export {
  AICategory,
  AICertificationLevel,
  AICertificationStatus,
  AISafetyLevel,
  AICapability,
  TestResult,
  AICertification,
  ComplianceInfo,
  AIClassification,
  AIClassificationRequest,
  AIClassificationResponse,
  CertificationAudit,
  AuditFinding,
  AIPerformanceMetrics,
  AISafetyAssessment,
  RiskFactor,
  SafetyIncident,
} from './types/ai-certification';
