"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingHttpModule = void 0;
const common_1 = require("@nestjs/common");
const http_controller_1 = require("./http.controller");
const billing_module_1 = require("../billing/billing.module");
let BillingHttpModule = class BillingHttpModule {
};
exports.BillingHttpModule = BillingHttpModule;
exports.BillingHttpModule = BillingHttpModule = __decorate([
    (0, common_1.Module)({
        imports: [billing_module_1.BillingModule],
        controllers: [http_controller_1.HttpController],
    })
], BillingHttpModule);
//# sourceMappingURL=http.module.js.map