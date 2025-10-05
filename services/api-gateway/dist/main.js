"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const app_module_1 = require("./app.module");
const shared_1 = require("@ai-aggregator/shared");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    app.use((0, helmet_1.default)());
    app.use((0, compression_1.default)());
    app.enableCors({
        origin: configService.get('CORS_ORIGIN', '*'),
        credentials: true,
    });
    if (configService.get('NODE_ENV') !== 'production') {
        const config = new swagger_1.DocumentBuilder()
            .setTitle('AI Aggregator API Gateway')
            .setDescription('API Gateway for AI Aggregator microservices')
            .setVersion('1.0')
            .addBearerAuth()
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup('api/docs', app, document);
    }
    const port = configService.get('PORT', 3000);
    const host = configService.get('HOST', '0.0.0.0');
    await app.listen(port, host);
    shared_1.LoggerUtil.info('api-gateway', `API Gateway is running on http://${host}:${port}`, { port, host, environment: configService.get('NODE_ENV') });
}
bootstrap().catch((error) => {
    shared_1.LoggerUtil.fatal('api-gateway', 'Failed to start API Gateway', error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map