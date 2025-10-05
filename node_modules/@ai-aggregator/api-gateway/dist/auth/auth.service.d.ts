import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { RegisterDto, LoginDto, AuthResponseDto } from '@ai-aggregator/shared';
export declare class AuthService {
    private readonly httpService;
    private readonly configService;
    private readonly authServiceUrl;
    constructor(httpService: HttpService, configService: ConfigService);
    register(registerDto: RegisterDto): Promise<AuthResponseDto>;
    login(loginDto: LoginDto): Promise<AuthResponseDto>;
}
