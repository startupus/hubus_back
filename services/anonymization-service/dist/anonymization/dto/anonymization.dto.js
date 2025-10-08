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
exports.AnonymizationSettingsResponseDto = exports.AnonymizationSettingsDto = exports.DeanonymizeResponseDto = exports.DeanonymizeRequestDto = exports.AnonymizeResponseDto = exports.AnonymizeRequestDto = exports.ChatMessageDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class ChatMessageDto {
}
exports.ChatMessageDto = ChatMessageDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Message role (user, assistant, system)' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChatMessageDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Message content' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChatMessageDto.prototype, "content", void 0);
class AnonymizeRequestDto {
}
exports.AnonymizeRequestDto = AnonymizeRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Text to anonymize (if not using messages)',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AnonymizeRequestDto.prototype, "text", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Chat messages to anonymize (if not using text)',
        type: [ChatMessageDto],
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ChatMessageDto),
    __metadata("design:type", Array)
], AnonymizeRequestDto.prototype, "messages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User ID for settings lookup',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AnonymizeRequestDto.prototype, "userId", void 0);
class AnonymizeResponseDto {
}
exports.AnonymizeResponseDto = AnonymizeResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Anonymized text (if text was provided)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AnonymizeResponseDto.prototype, "anonymizedText", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Anonymized messages (if messages were provided)',
        type: [ChatMessageDto]
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ChatMessageDto),
    __metadata("design:type", Array)
], AnonymizeResponseDto.prototype, "anonymizedMessages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Mapping of original values to anonymized values',
        example: { 'john@example.com': 'user1@example.com', 'John Doe': '[ОБЕЗЛИЧЕНО_1]' }
    }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], AnonymizeResponseDto.prototype, "mapping", void 0);
class DeanonymizeRequestDto {
}
exports.DeanonymizeRequestDto = DeanonymizeRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Text to deanonymize (if not using messages)',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DeanonymizeRequestDto.prototype, "text", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Chat messages to deanonymize (if not using text)',
        type: [ChatMessageDto],
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ChatMessageDto),
    __metadata("design:type", Array)
], DeanonymizeRequestDto.prototype, "messages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Mapping of anonymized values to original values',
        example: { 'user1@example.com': 'john@example.com', '[ОБЕЗЛИЧЕНО_1]': 'John Doe' }
    }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], DeanonymizeRequestDto.prototype, "mapping", void 0);
class DeanonymizeResponseDto {
}
exports.DeanonymizeResponseDto = DeanonymizeResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Deanonymized text (if text was provided)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DeanonymizeResponseDto.prototype, "deanonymizedText", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Deanonymized messages (if messages were provided)',
        type: [ChatMessageDto]
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ChatMessageDto),
    __metadata("design:type", Array)
], DeanonymizeResponseDto.prototype, "deanonymizedMessages", void 0);
class AnonymizationSettingsDto {
}
exports.AnonymizationSettingsDto = AnonymizationSettingsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Enable anonymization' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AnonymizationSettingsDto.prototype, "enabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Anonymize email addresses' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AnonymizationSettingsDto.prototype, "anonymizeEmails", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Anonymize phone numbers' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AnonymizationSettingsDto.prototype, "anonymizePhones", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Anonymize names' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AnonymizationSettingsDto.prototype, "anonymizeNames", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Anonymize addresses' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AnonymizationSettingsDto.prototype, "anonymizeAddresses", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Anonymize personal numbers (INN, SNILS)' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AnonymizationSettingsDto.prototype, "anonymizePersonalNumbers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Anonymize IP addresses' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AnonymizationSettingsDto.prototype, "anonymizeIPs", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Anonymize URLs' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AnonymizationSettingsDto.prototype, "anonymizeURLs", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Custom patterns for anonymization' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], AnonymizationSettingsDto.prototype, "customPatterns", void 0);
class AnonymizationSettingsResponseDto extends AnonymizationSettingsDto {
}
exports.AnonymizationSettingsResponseDto = AnonymizationSettingsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AnonymizationSettingsResponseDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Settings creation timestamp' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AnonymizationSettingsResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Settings last update timestamp' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AnonymizationSettingsResponseDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=anonymization.dto.js.map