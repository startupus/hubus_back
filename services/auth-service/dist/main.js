"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const microservices_1 = require("@nestjs/microservices");
const path_1 = require("path");
const app_module_1 = require("./app.module");
const shared_1 = require("@ai-aggregator/shared");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        disableErrorMessages: false,
    }));
    const grpcOptions = {
        transport: microservices_1.Transport.GRPC,
        options: {
            package: 'auth',
            protoPath: (0, path_1.join)(__dirname, '../proto/auth.proto'),
            url: `0.0.0.0:${configService.get('AUTH_GRPC_PORT', 50051)}`,
        },
    };
    app.connectMicroservice(grpcOptions);
    const port = configService.get('AUTH_SERVICE_PORT', 3001);
    const host = configService.get('HOST', '0.0.0.0');
    await app.startAllMicroservices();
    await app.listen(port, host);
    shared_1.LoggerUtil.info('auth-service', `Auth service is running on http://${host}:${port} and gRPC on port ${configService.get('AUTH_GRPC_PORT', 50051)}`, {
        port,
        host,
        grpcPort: configService.get('AUTH_GRPC_PORT', 50051),
        environment: configService.get('NODE_ENV')
    });
}
bootstrap().catch((error) => {
    shared_1.LoggerUtil.fatal('auth-service', 'Failed to start Auth service', error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map