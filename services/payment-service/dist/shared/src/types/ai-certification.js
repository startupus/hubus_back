"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskFactorCategory = exports.AISafetyLevel = exports.AICertificationStatus = exports.AICertificationLevel = exports.AICategory = void 0;
var AICategory;
(function (AICategory) {
    AICategory["TEXT_GENERATION"] = "text_generation";
    AICategory["CODE_GENERATION"] = "code_generation";
    AICategory["IMAGE_GENERATION"] = "image_generation";
    AICategory["AUDIO_GENERATION"] = "audio_generation";
    AICategory["VIDEO_GENERATION"] = "video_generation";
    AICategory["CONVERSATION"] = "conversation";
    AICategory["TRANSLATION"] = "translation";
    AICategory["SUMMARIZATION"] = "summarization";
    AICategory["QUESTION_ANSWERING"] = "question_answering";
    AICategory["SENTIMENT_ANALYSIS"] = "sentiment_analysis";
    AICategory["CLASSIFICATION"] = "classification";
    AICategory["EMBEDDING"] = "embedding";
    AICategory["REASONING"] = "reasoning";
    AICategory["CREATIVE_WRITING"] = "creative_writing";
    AICategory["TECHNICAL_WRITING"] = "technical_writing";
    AICategory["EDUCATION"] = "education";
    AICategory["RESEARCH"] = "research";
    AICategory["BUSINESS"] = "business";
    AICategory["MEDICAL"] = "medical";
    AICategory["LEGAL"] = "legal";
    AICategory["FINANCIAL"] = "financial";
    AICategory["OTHER"] = "other";
})(AICategory || (exports.AICategory = AICategory = {}));
var AICertificationLevel;
(function (AICertificationLevel) {
    AICertificationLevel["BASIC"] = "BASIC";
    AICertificationLevel["INTERMEDIATE"] = "INTERMEDIATE";
    AICertificationLevel["ADVANCED"] = "ADVANCED";
    AICertificationLevel["EXPERT"] = "EXPERT";
    AICertificationLevel["ENTERPRISE"] = "ENTERPRISE";
})(AICertificationLevel || (exports.AICertificationLevel = AICertificationLevel = {}));
var AICertificationStatus;
(function (AICertificationStatus) {
    AICertificationStatus["PENDING"] = "PENDING";
    AICertificationStatus["IN_PROGRESS"] = "IN_PROGRESS";
    AICertificationStatus["APPROVED"] = "APPROVED";
    AICertificationStatus["REJECTED"] = "REJECTED";
    AICertificationStatus["EXPIRED"] = "EXPIRED";
    AICertificationStatus["REVOKED"] = "REVOKED";
})(AICertificationStatus || (exports.AICertificationStatus = AICertificationStatus = {}));
var AISafetyLevel;
(function (AISafetyLevel) {
    AISafetyLevel["SAFE"] = "SAFE";
    AISafetyLevel["MODERATE"] = "MODERATE";
    AISafetyLevel["CAUTION"] = "CAUTION";
    AISafetyLevel["HIGH_RISK"] = "HIGH_RISK";
})(AISafetyLevel || (exports.AISafetyLevel = AISafetyLevel = {}));
var RiskFactorCategory;
(function (RiskFactorCategory) {
    RiskFactorCategory["BIAS"] = "bias";
    RiskFactorCategory["MISINFORMATION"] = "misinformation";
    RiskFactorCategory["PRIVACY"] = "privacy";
    RiskFactorCategory["SECURITY"] = "security";
    RiskFactorCategory["HARMFUL_CONTENT"] = "harmful_content";
    RiskFactorCategory["MANIPULATION"] = "manipulation";
})(RiskFactorCategory || (exports.RiskFactorCategory = RiskFactorCategory = {}));
//# sourceMappingURL=ai-certification.js.map