"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AICertificationModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const ai_classification_controller_1 = require("./ai-classification.controller");
const ai_certification_controller_1 = require("./ai-certification.controller");
const ai_safety_controller_1 = require("./ai-safety.controller");
const ai_classification_service_1 = require("./ai-classification.service");
const ai_certification_service_1 = require("./ai-certification.service");
const ai_safety_service_1 = require("./ai-safety.service");
let AICertificationModule = class AICertificationModule {
};
exports.AICertificationModule = AICertificationModule;
exports.AICertificationModule = AICertificationModule = __decorate([
    (0, common_1.Module)({
        imports: [axios_1.HttpModule],
        controllers: [
            ai_classification_controller_1.AIClassificationController,
            ai_certification_controller_1.AICertificationController,
            ai_safety_controller_1.AISafetyController,
        ],
        providers: [
            ai_classification_service_1.AIClassificationService,
            ai_certification_service_1.AICertificationService,
            ai_safety_service_1.AISafetyService,
        ],
        exports: [
            ai_classification_service_1.AIClassificationService,
            ai_certification_service_1.AICertificationService,
            ai_safety_service_1.AISafetyService,
        ],
    })
], AICertificationModule);
//# sourceMappingURL=ai-certification.module.js.map