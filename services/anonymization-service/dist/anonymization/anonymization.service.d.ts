import { AnonymizeRequestDto, AnonymizeResponseDto, DeanonymizeRequestDto, DeanonymizeResponseDto, AnonymizationSettingsDto, AnonymizationSettingsResponseDto } from './dto/anonymization.dto';
export declare class AnonymizationService {
    private readonly logger;
    private readonly defaultSettings;
    private settingsStorage;
    anonymize(request: AnonymizeRequestDto): Promise<AnonymizeResponseDto>;
    deanonymize(request: DeanonymizeRequestDto): Promise<DeanonymizeResponseDto>;
    getSettings(userId: string): Promise<AnonymizationSettingsResponseDto>;
    updateSettings(userId: string, settings: AnonymizationSettingsDto): Promise<AnonymizationSettingsResponseDto>;
    deleteSettings(userId: string): Promise<void>;
    private anonymizeText;
    private deanonymizeText;
    private createReverseMapping;
}
