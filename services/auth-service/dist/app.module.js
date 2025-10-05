"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("./common/prisma/prisma.module");
const auth_module_1 = require("./modules/auth/auth.module");
const api_key_module_1 = require("./modules/api-key/api-key.module");
const user_module_1 = require("./modules/user/user.module");
const security_module_1 = require("./modules/security/security.module");
const http_module_1 = require("./http/http.module");
const health_module_1 = require("./health/health.module");
const configuration_1 = require("./config/configuration");
const validation_schema_1 = require("./config/validation.schema");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [configuration_1.configuration],
                validationSchema: validation_schema_1.validationSchema,
                envFilePath: ['.env.local', '.env'],
                ignoreEnvFile: false,
                expandVariables: true,
            }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            api_key_module_1.ApiKeyModule,
            user_module_1.UserModule,
            security_module_1.SecurityModule,
            http_module_1.HttpModule,
            health_module_1.HealthModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map