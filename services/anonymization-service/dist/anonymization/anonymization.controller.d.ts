import { AnonymizationService } from './anonymization.service';
import { AnonymizeRequestDto, AnonymizeResponseDto, DeanonymizeRequestDto, DeanonymizeResponseDto, AnonymizationSettingsDto, AnonymizationSettingsResponseDto } from './dto/anonymization.dto';
export declare class AnonymizationController {
    private readonly anonymizationService;
    constructor(anonymizationService: AnonymizationService);
    anonymize(request: AnonymizeRequestDto): Promise<AnonymizeResponseDto>;
    deanonymize(request: DeanonymizeRequestDto): Promise<DeanonymizeResponseDto>;
    getSettings(userId: string): Promise<AnonymizationSettingsResponseDto>;
    updateSettings(userId: string, settings: AnonymizationSettingsDto): Promise<AnonymizationSettingsResponseDto>;
    deleteSettings(userId: string): Promise<{
        message: string;
    }>;
}
