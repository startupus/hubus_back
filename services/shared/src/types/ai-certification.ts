/**
 * Типы для системы категоризации и сертификации ИИ
 */

export enum AICategory {
  TEXT_GENERATION = 'text_generation',
  CODE_GENERATION = 'code_generation',
  IMAGE_GENERATION = 'image_generation',
  AUDIO_GENERATION = 'audio_generation',
  VIDEO_GENERATION = 'video_generation',
  CONVERSATION = 'conversation',
  TRANSLATION = 'translation',
  SUMMARIZATION = 'summarization',
  QUESTION_ANSWERING = 'question_answering',
  SENTIMENT_ANALYSIS = 'sentiment_analysis',
  CLASSIFICATION = 'classification',
  EMBEDDING = 'embedding',
  REASONING = 'reasoning',
  CREATIVE_WRITING = 'creative_writing',
  TECHNICAL_WRITING = 'technical_writing',
  EDUCATION = 'education',
  RESEARCH = 'research',
  BUSINESS = 'business',
  MEDICAL = 'medical',
  LEGAL = 'legal',
  FINANCIAL = 'financial',
  OTHER = 'other'
}

export enum AICertificationLevel {
  UNVERIFIED = 'unverified',
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
  GOVERNMENT = 'government'
}

export enum AICertificationStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended'
}

export enum AISafetyLevel {
  SAFE = 'safe',
  CAUTION = 'caution',
  WARNING = 'warning',
  DANGEROUS = 'dangerous',
  RESTRICTED = 'restricted'
}

export enum RiskFactorCategory {
  BIAS = 'bias',
  MISINFORMATION = 'misinformation',
  PRIVACY = 'privacy',
  SECURITY = 'security',
  HARMFUL_CONTENT = 'harmful_content',
  MANIPULATION = 'manipulation'
}

export interface AICapability {
  id: string;
  name: string;
  description: string;
  category: AICategory;
  isSupported: boolean;
  confidence: number; // 0-1
  testResults?: TestResult[];
}

export interface TestResult {
  id: string;
  testName: string;
  testType: 'automated' | 'manual' | 'user_feedback';
  score: number; // 0-100
  passed: boolean;
  details: string;
  testedAt: Date;
  testedBy: string;
}

export interface AICertification {
  id: string;
  modelId: string;
  provider: string;
  certificationLevel: AICertificationLevel;
  status: AICertificationStatus;
  issuedAt: Date;
  expiresAt: Date;
  issuedBy: string;
  certificateUrl?: string;
  capabilities: AICapability[];
  safetyLevel: AISafetyLevel;
  compliance: ComplianceInfo;
  testResults: TestResult[];
  metadata: Record<string, any>;
}

export interface ComplianceInfo {
  gdpr: boolean;
  ccpa: boolean;
  hipaa: boolean;
  sox: boolean;
  iso27001: boolean;
  soc2: boolean;
  custom: Record<string, boolean>;
}

export interface AIClassification {
  id: string;
  modelId: string;
  categories: AICategory[];
  primaryCategory: AICategory;
  confidence: number;
  tags: string[];
  capabilities: AICapability[];
  limitations: string[];
  useCases: string[];
  risks: string[];
  recommendations: string[];
  classifiedAt: Date;
  classifiedBy: string;
  version: string;
}

export interface AIClassificationRequest {
  modelId: string;
  provider: string;
  modelName: string;
  description?: string;
  capabilities?: string[];
  testData?: any;
  metadata?: Record<string, any>;
}

export interface AIClassificationResponse {
  success: boolean;
  classification?: AIClassification;
  errors?: string[];
  warnings?: string[];
  recommendations?: string[];
}

export interface CertificationAudit {
  id: string;
  certificationId: string;
  auditType: 'initial' | 'renewal' | 'compliance' | 'incident';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  auditor: string;
  startedAt: Date;
  completedAt?: Date;
  findings: AuditFinding[];
  recommendations: string[];
  score: number;
}

export interface AuditFinding {
  id: string;
  category: 'security' | 'performance' | 'compliance' | 'safety' | 'quality';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string[];
  recommendation: string;
  status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk';
}

export interface AIPerformanceMetrics {
  modelId: string;
  category: AICategory;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  latency: number; // ms
  throughput: number; // requests per second
  reliability: number; // uptime percentage
  costPerToken: number;
  energyEfficiency: number;
  biasScore: number;
  fairnessScore: number;
  measuredAt: Date;
  testDataset: string;
  sampleSize: number;
}

export interface AISafetyAssessment {
  id: string;
  modelId: string;
  safetyLevel: AISafetyLevel;
  riskFactors: RiskFactor[];
  mitigationStrategies: string[];
  monitoringRequirements: string[];
  incidentHistory: SafetyIncident[];
  lastAssessment: Date;
  nextAssessment: Date;
  assessor: string;
}

export interface RiskFactor {
  id: string;
  category: RiskFactorCategory;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  probability: number; // 0-1
  impact: number; // 0-1
  mitigation: string;
  monitoring: string;
}

export interface SafetyIncident {
  id: string;
  incidentType: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  occurredAt: Date;
  resolvedAt?: Date;
  resolution: string;
  reportedBy: string;
  affectedUsers: number;
}