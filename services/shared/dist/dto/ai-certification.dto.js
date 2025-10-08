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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafetyStatisticsDto = exports.SafetyLevelInfoDto = exports.CertificationLevelInfoDto = exports.CategoryInfoDto = exports.RevokeCertificationDto = exports.SafetyIncidentDto = exports.SafetyTestResponseDto = exports.SafetyTestRequestDto = exports.CertificationResponseDto = exports.CertificationRequestDto = exports.AIClassificationResponseDto = exports.AIClassificationRequestDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const ai_certification_1 = require("../types/ai-certification");
class AIClassificationRequestDto {
    modelId;
    provider;
    modelName;
    description;
    capabilities;
    testData;
    metadata;
}
exports.AIClassificationRequestDto = AIClassificationRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Model ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AIClassificationRequestDto.prototype, "modelId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Provider name' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AIClassificationRequestDto.prototype, "provider", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Model name' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AIClassificationRequestDto.prototype, "modelName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Model description', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AIClassificationRequestDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Model capabilities', required: false, type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], AIClassificationRequestDto.prototype, "capabilities", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Test data', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], AIClassificationRequestDto.prototype, "testData", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Additional metadata', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], AIClassificationRequestDto.prototype, "metadata", void 0);
class AIClassificationResponseDto {
    success;
    classification;
    errors;
    warnings;
    recommendations;
}
exports.AIClassificationResponseDto = AIClassificationResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Success status' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AIClassificationResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Classification result', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], AIClassificationResponseDto.prototype, "classification", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Error messages', required: false, type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], AIClassificationResponseDto.prototype, "errors", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Warning messages', required: false, type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], AIClassificationResponseDto.prototype, "warnings", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Recommendations', required: false, type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], AIClassificationResponseDto.prototype, "recommendations", void 0);
class CertificationRequestDto {
    modelId;
    provider;
    modelName;
    requestedLevel;
    testData;
    metadata;
}
exports.CertificationRequestDto = CertificationRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Model ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CertificationRequestDto.prototype, "modelId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Provider name' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CertificationRequestDto.prototype, "provider", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Model name' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CertificationRequestDto.prototype, "modelName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Requested certification level', enum: ai_certification_1.AICertificationLevel }),
    (0, class_validator_1.IsEnum)(ai_certification_1.AICertificationLevel),
    __metadata("design:type", String)
], CertificationRequestDto.prototype, "requestedLevel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Test data', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CertificationRequestDto.prototype, "testData", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Additional metadata', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CertificationRequestDto.prototype, "metadata", void 0);
class CertificationResponseDto {
    success;
    certification;
    errors;
    warnings;
    recommendations;
}
exports.CertificationResponseDto = CertificationResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Success status' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CertificationResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Certification result', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CertificationResponseDto.prototype, "certification", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Error messages', required: false, type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CertificationResponseDto.prototype, "errors", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Warning messages', required: false, type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CertificationResponseDto.prototype, "warnings", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Recommendations', required: false, type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CertificationResponseDto.prototype, "recommendations", void 0);
class SafetyTestRequestDto {
    modelId;
    testType;
    testData;
    focusAreas;
}
exports.SafetyTestRequestDto = SafetyTestRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Model ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SafetyTestRequestDto.prototype, "modelId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Test type', enum: ['comprehensive', 'quick', 'targeted'] }),
    (0, class_validator_1.IsEnum)(['comprehensive', 'quick', 'targeted']),
    __metadata("design:type", String)
], SafetyTestRequestDto.prototype, "testType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Test data', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SafetyTestRequestDto.prototype, "testData", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Focus areas', required: false, type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(ai_certification_1.RiskFactorCategory, { each: true }),
    __metadata("design:type", Array)
], SafetyTestRequestDto.prototype, "focusAreas", void 0);
class SafetyTestResponseDto {
    success;
    assessment;
    errors;
    warnings;
    recommendations;
}
exports.SafetyTestResponseDto = SafetyTestResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Success status' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SafetyTestResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Safety assessment', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SafetyTestResponseDto.prototype, "assessment", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Error messages', required: false, type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], SafetyTestResponseDto.prototype, "errors", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Warning messages', required: false, type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], SafetyTestResponseDto.prototype, "warnings", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Recommendations', required: false, type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], SafetyTestResponseDto.prototype, "recommendations", void 0);
class SafetyIncidentDto {
    modelId;
    incidentType;
    description;
    severity;
    occurredAt;
    resolution;
    reportedBy;
    affectedUsers;
}
exports.SafetyIncidentDto = SafetyIncidentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Model ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SafetyIncidentDto.prototype, "modelId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Incident type' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SafetyIncidentDto.prototype, "incidentType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Incident description' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SafetyIncidentDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Severity level', enum: ['low', 'medium', 'high', 'critical'] }),
    (0, class_validator_1.IsEnum)(['low', 'medium', 'high', 'critical']),
    __metadata("design:type", String)
], SafetyIncidentDto.prototype, "severity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Occurred at' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SafetyIncidentDto.prototype, "occurredAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Resolution description', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SafetyIncidentDto.prototype, "resolution", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Reported by' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SafetyIncidentDto.prototype, "reportedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of affected users' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SafetyIncidentDto.prototype, "affectedUsers", void 0);
class RevokeCertificationDto {
    reason;
}
exports.RevokeCertificationDto = RevokeCertificationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Revocation reason' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RevokeCertificationDto.prototype, "reason", void 0);
class CategoryInfoDto {
    category;
    description;
    useCases;
}
exports.CategoryInfoDto = CategoryInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Category name', enum: ai_certification_1.AICategory }),
    (0, class_validator_1.IsEnum)(ai_certification_1.AICategory),
    __metadata("design:type", String)
], CategoryInfoDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Category description' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CategoryInfoDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Use cases', type: [String] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CategoryInfoDto.prototype, "useCases", void 0);
class CertificationLevelInfoDto {
    level;
    minScore;
    minPassRate;
    requiredTests;
    complianceStandards;
}
exports.CertificationLevelInfoDto = CertificationLevelInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Certification level', enum: ai_certification_1.AICertificationLevel }),
    (0, class_validator_1.IsEnum)(ai_certification_1.AICertificationLevel),
    __metadata("design:type", String)
], CertificationLevelInfoDto.prototype, "level", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Minimum score required' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CertificationLevelInfoDto.prototype, "minScore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Minimum pass rate required' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CertificationLevelInfoDto.prototype, "minPassRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Required tests', type: [String] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CertificationLevelInfoDto.prototype, "requiredTests", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Compliance standards', type: [String] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CertificationLevelInfoDto.prototype, "complianceStandards", void 0);
class SafetyLevelInfoDto {
    level;
    description;
    requirements;
    restrictions;
}
exports.SafetyLevelInfoDto = SafetyLevelInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Safety level', enum: ai_certification_1.AISafetyLevel }),
    (0, class_validator_1.IsEnum)(ai_certification_1.AISafetyLevel),
    __metadata("design:type", String)
], SafetyLevelInfoDto.prototype, "level", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Level description' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SafetyLevelInfoDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Requirements', type: [String] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], SafetyLevelInfoDto.prototype, "requirements", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Restrictions', type: [String] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], SafetyLevelInfoDto.prototype, "restrictions", void 0);
class SafetyStatisticsDto {
    totalIncidents;
    criticalIncidents;
    resolvedIncidents;
    averageResolutionTime;
}
exports.SafetyStatisticsDto = SafetyStatisticsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total incidents' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SafetyStatisticsDto.prototype, "totalIncidents", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Critical incidents' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SafetyStatisticsDto.prototype, "criticalIncidents", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Resolved incidents' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SafetyStatisticsDto.prototype, "resolvedIncidents", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Average resolution time in milliseconds' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SafetyStatisticsDto.prototype, "averageResolutionTime", void 0);
//# sourceMappingURL=ai-certification.dto.js.map