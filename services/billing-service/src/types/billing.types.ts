import { Decimal } from '@prisma/client/runtime/library';

// ===========================================
// CORE BILLING TYPES
// ===========================================

export interface UserBalance {
  id: string;
  userId: string;
  companyId: string;
  balance: Decimal;
  currency: string;
  creditLimit?: Decimal;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  companyId: string;
  type: TransactionType;
  amount: Decimal;
  currency: string;
  description?: string;
  status: TransactionStatus;
  reference?: string;
  metadata?: Record<string, any>;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageEvent {
  id: string;
  userId: string;
  companyId: string;
  initiatorCompanyId?: string;
  service: string;
  resource: string;
  quantity: number;
  unit: string;
  cost: Decimal;
  currency: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface Invoice {
  id: string;
  userId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  subtotal: Decimal;
  tax: Decimal;
  total: Decimal;
  currency: string;
  dueDate: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: Decimal;
  total: Decimal;
  metadata?: Record<string, any>;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  price: Decimal;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentMethod {
  id: string;
  userId: string;
  type: PaymentMethodType;
  provider: string;
  externalId: string;
  isDefault: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PricingPlan {
  id: string;
  name: string;
  description?: string;
  type: PricingType;
  price: Decimal;
  currency: string;
  billingCycle: BillingCycle;
  isActive: boolean;
  limits?: Record<string, any>;
  features?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// ===========================================
// ENUMS
// ===========================================

export enum TransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
  REFUND = 'REFUND',
  CHARGEBACK = 'CHARGEBACK'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED'
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  CANCELLED = 'CANCELLED',
  PAST_DUE = 'PAST_DUE'
}

export enum PaymentMethodType {
  CARD = 'CARD',
  BANK_ACCOUNT = 'BANK_ACCOUNT',
  WALLET = 'WALLET',
  CRYPTOCURRENCY = 'CRYPTOCURRENCY'
}

export enum PricingType {
  SUBSCRIPTION = 'SUBSCRIPTION',
  USAGE_BASED = 'USAGE_BASED',
  ONE_TIME = 'ONE_TIME',
  FREEMIUM = 'FREEMIUM'
}

export enum BillingCycle {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY'
}

// ===========================================
// REQUEST/RESPONSE TYPES
// ===========================================

export interface CreateTransactionRequest {
  userId: string;
  companyId?: string;
  type: TransactionType;
  amount: number;
  currency?: string;
  description?: string;
  reference?: string;
  metadata?: Record<string, any>;
  paymentMethodId?: string;
}

export interface CreateTransactionResponse {
  success: boolean;
  transaction?: Transaction;
  error?: string;
}

export interface TrackUsageRequest {
  userId: string;
  companyId?: string;
  service: string;
  resource: string;
  quantity?: number;
  unit?: string;
  metadata?: Record<string, any>;
}

export interface TrackUsageResponse {
  success: boolean;
  usageEvent?: UsageEvent;
  cost?: number;
  error?: string;
}

export interface GetBalanceRequest {
  userId: string;
}

export interface GetBalanceResponse {
  success: boolean;
  balance?: UserBalance;
  error?: string;
}

export interface UpdateBalanceRequest {
  userId: string;
  amount: number;
  operation: 'add' | 'subtract';
  description?: string;
  reference?: string;
  metadata?: Record<string, any>;
}

export interface UpdateBalanceResponse {
  success: boolean;
  balance?: UserBalance;
  transaction?: Transaction;
  error?: string;
}

export interface CalculateCostRequest {
  userId: string;
  service: string;
  resource: string;
  quantity: number;
  metadata?: Record<string, any>;
}

export interface CalculateCostResponse {
  success: boolean;
  cost?: number;
  currency?: string;
  breakdown?: CostBreakdown;
  error?: string;
}

export interface CostBreakdown {
  baseCost: number;
  usageCost: number;
  tax: number;
  discounts: number;
  total: number;
  currency: string;
}

export interface ProcessPaymentRequest {
  userId: string;
  amount: number;
  currency?: string;
  paymentMethodId?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface ProcessPaymentResponse {
  success: boolean;
  transaction?: Transaction;
  paymentUrl?: string;
  error?: string;
}

// ===========================================
// PRICING AND USAGE TYPES
// ===========================================

export interface PricingRule {
  id: string;
  name: string;
  service: string;
  resource: string;
  provider?: string;
  model?: string;
  providerType: 'DOMESTIC' | 'FOREIGN';
  type: 'fixed' | 'per_unit' | 'per_token' | 'tiered';
  price: number;
  currency: string;
  limits?: {
    min?: number;
    max?: number;
  };
  discounts?: DiscountRule[];
}

export interface DiscountRule {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  conditions?: {
    minAmount?: number;
    minQuantity?: number;
    validFrom?: Date;
    validTo?: Date;
  };
}

export interface UsageMetrics {
  userId: string;
  service: string;
  resource: string;
  quantity: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface BillingReport {
  userId: string;
  period: {
    start: Date;
    end: Date;
  };
  totalUsage: number;
  totalCost: number;
  currency: string;
  breakdown: {
    byService: Record<string, number>;
    byResource: Record<string, number>;
    byDay: Record<string, number>;
  };
  transactions: Transaction[];
}
