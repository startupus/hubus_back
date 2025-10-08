"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const shared_1 = require("@ai-aggregator/shared");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
    }));
    app.enableCors({
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('AI Certification Service')
        .setDescription('AI Certification Service API for AI Aggregator Platform')
        .setVersion('1.0')
        .addTag('certification')
        .addTag('health')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api', app, document);
    const port = process.env.PORT || 3007;
    await app.listen(port);
    shared_1.LoggerUtil.info('ai-certification-service', 'AI Certification Service started', {
        port,
        environment: process.env.NODE_ENV || 'development',
    });
}
bootstrap();
//# sourceMappingURL=main.js.map