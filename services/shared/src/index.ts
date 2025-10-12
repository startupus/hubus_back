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
export * from './types/request-history';

// DTOs
export * from './dto/base.dto';
export * from './dto/auth.dto';
export * from './dto/billing.dto';
export * from './dto/providers.dto';
export * from './dto/chat.dto';
export * from './dto/ai-certification.dto';

// Utilities (без нативных зависимостей)
export * from './utils/crypto.util';
export * from './utils/validation.util';
export * from './utils/response.util';
export * from './utils/logger.util';
export * from './utils/concurrency.util';

// HTTP API Contracts
export * from './contracts';

// HTTP Clients
export * from './clients';

// Services
export * from './services/thread-pool.service';

// Performance monitoring
export * from './monitoring/performance-monitor.service';
export * from './decorators/performance.decorator';

// Clients
export * from './clients/redis.client';

// Constants
export * from './constants';

// Interfaces
export * from './interfaces/config.interface';

// Re-export commonly used types for convenience
export type {
  Company,
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

export type {
  RequestHistory,
  CreateRequestHistoryDto,
  UpdateRequestHistoryDto,
  RequestHistoryQueryDto,
  RequestHistoryResponse,
  SessionHistory,
  CreateSessionHistoryDto,
  UpdateSessionHistoryDto,
  SessionHistoryQueryDto,
  SessionHistoryResponse,
} from './types/request-history';

export {
  RequestType,
  RequestStatus,
} from './types/request-history';
