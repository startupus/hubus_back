import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { ProviderPreferencesModule } from './modules/provider-preferences/provider-preferences.module';
import { SecurityModule } from './modules/security/security.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { AuthHttpModule } from './http/http.module';
import { HttpModule } from '@nestjs/axios';
import { HealthModule } from './health/health.module';
import { ReferralModule } from './modules/referral/referral.module';
import { configuration } from './config/configuration';
import { validationSchema } from './config/validation.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      envFilePath: ['.env.local', '.env'],
      ignoreEnvFile: false,
      expandVariables: true,
    }),
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 3,
    }),
        PrismaModule,
        AuthModule,
        ReferralModule,
        EmployeeModule,
        ApiKeysModule,
        ProviderPreferencesModule,
        SecurityModule,
        AuthHttpModule,
        HealthModule,
  ],
})
export class AppModule {}
