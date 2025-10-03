import { RegisterDto, LoginDto, AuthResponseDto } from '@ai-aggregator/shared';
export declare class AuthService {
    register(registerDto: RegisterDto): Promise<AuthResponseDto>;
    login(loginDto: LoginDto): Promise<AuthResponseDto>;
}
