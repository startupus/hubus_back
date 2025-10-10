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
exports.AnonymizedChatResponse = exports.AnonymizedChatRequest = exports.ChatCompletionResponse = exports.ChatCompletionUsage = exports.ChatCompletionChoice = exports.ChatCompletionRequest = exports.ChatMessage = exports.ChatRole = exports.ChatModel = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
var ChatModel;
(function (ChatModel) {
    ChatModel["GPT_3_5_TURBO"] = "gpt-3.5-turbo";
    ChatModel["GPT_4"] = "gpt-4";
    ChatModel["GPT_4_TURBO"] = "gpt-4-turbo-preview";
    ChatModel["CLAUDE_3_HAIKU"] = "claude-3-haiku-20240307";
    ChatModel["CLAUDE_3_SONNET"] = "claude-3-sonnet-20240229";
    ChatModel["CLAUDE_3_OPUS"] = "claude-3-opus-20240307";
    ChatModel["YANDEX_GPT"] = "yandexgpt";
    ChatModel["YANDEX_GPT_LITE"] = "yandexgpt-lite";
})(ChatModel || (exports.ChatModel = ChatModel = {}));
var ChatRole;
(function (ChatRole) {
    ChatRole["SYSTEM"] = "system";
    ChatRole["USER"] = "user";
    ChatRole["ASSISTANT"] = "assistant";
})(ChatRole || (exports.ChatRole = ChatRole = {}));
class ChatMessage {
}
exports.ChatMessage = ChatMessage;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Роль отправителя сообщения' }),
    __metadata("design:type", String)
], ChatMessage.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Содержимое сообщения' }),
    __metadata("design:type", String)
], ChatMessage.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Имя отправителя (опционально)', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ChatMessage.prototype, "name", void 0);
class ChatCompletionRequest {
}
exports.ChatCompletionRequest = ChatCompletionRequest;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Модель для использования' }),
    __metadata("design:type", String)
], ChatCompletionRequest.prototype, "model", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Массив сообщений', type: [ChatMessage] }),
    __metadata("design:type", Array)
], ChatCompletionRequest.prototype, "messages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Максимальное количество токенов в ответе', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], ChatCompletionRequest.prototype, "max_tokens", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Температура генерации (0-2)', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], ChatCompletionRequest.prototype, "temperature", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Вероятность top_p (0-1)', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], ChatCompletionRequest.prototype, "top_p", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Частота штрафа (0-2)', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], ChatCompletionRequest.prototype, "frequency_penalty", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Штраф за присутствие (0-2)', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], ChatCompletionRequest.prototype, "presence_penalty", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Провайдер для использования', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ChatCompletionRequest.prototype, "provider", void 0);
class ChatCompletionChoice {
}
exports.ChatCompletionChoice = ChatCompletionChoice;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Индекс выбора' }),
    __metadata("design:type", Number)
], ChatCompletionChoice.prototype, "index", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Сообщение ответа', type: ChatMessage }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ChatMessage),
    __metadata("design:type", ChatMessage)
], ChatCompletionChoice.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Причина завершения' }),
    __metadata("design:type", String)
], ChatCompletionChoice.prototype, "finish_reason", void 0);
class ChatCompletionUsage {
}
exports.ChatCompletionUsage = ChatCompletionUsage;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Количество токенов в промпте' }),
    __metadata("design:type", Number)
], ChatCompletionUsage.prototype, "prompt_tokens", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Количество токенов в ответе' }),
    __metadata("design:type", Number)
], ChatCompletionUsage.prototype, "completion_tokens", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Общее количество токенов' }),
    __metadata("design:type", Number)
], ChatCompletionUsage.prototype, "total_tokens", void 0);
class ChatCompletionResponse {
}
exports.ChatCompletionResponse = ChatCompletionResponse;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID ответа' }),
    __metadata("design:type", String)
], ChatCompletionResponse.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Объект ответа' }),
    __metadata("design:type", String)
], ChatCompletionResponse.prototype, "object", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Время создания' }),
    __metadata("design:type", Number)
], ChatCompletionResponse.prototype, "created", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Модель' }),
    __metadata("design:type", String)
], ChatCompletionResponse.prototype, "model", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Массив выборов', type: [ChatCompletionChoice] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ChatCompletionChoice),
    __metadata("design:type", Array)
], ChatCompletionResponse.prototype, "choices", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Использование токенов', type: ChatCompletionUsage }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ChatCompletionUsage),
    __metadata("design:type", ChatCompletionUsage)
], ChatCompletionResponse.prototype, "usage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Провайдер, который обработал запрос' }),
    __metadata("design:type", String)
], ChatCompletionResponse.prototype, "provider", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Время обработки в миллисекундах' }),
    __metadata("design:type", Number)
], ChatCompletionResponse.prototype, "processing_time_ms", void 0);
class AnonymizedChatRequest {
}
exports.AnonymizedChatRequest = AnonymizedChatRequest;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Обезличенный запрос' }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ChatCompletionRequest),
    __metadata("design:type", ChatCompletionRequest)
], AnonymizedChatRequest.prototype, "request", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Маппинг обезличивания' }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], AnonymizedChatRequest.prototype, "anonymization_mapping", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Хеш данных для отслеживания' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AnonymizedChatRequest.prototype, "data_hash", void 0);
class AnonymizedChatResponse {
}
exports.AnonymizedChatResponse = AnonymizedChatResponse;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Обезличенный ответ' }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ChatCompletionResponse),
    __metadata("design:type", ChatCompletionResponse)
], AnonymizedChatResponse.prototype, "response", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Маппинг обезличивания' }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], AnonymizedChatResponse.prototype, "anonymization_mapping", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Хеш данных для отслеживания' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AnonymizedChatResponse.prototype, "data_hash", void 0);
//# sourceMappingURL=chat.dto.js.map