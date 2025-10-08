import { AnonymizeRequest, AnonymizeResponse, DeanonymizeRequest, DeanonymizeResponse, AnonymizationSettings, AnonymizationSettingsResponse } from '../contracts/anonymization.contract';
export declare class AnonymizationClient {
    private readonly ANONYMIZATION_SERVICE_URL;
    private readonly axiosInstance;
    constructor();
    anonymize(request: AnonymizeRequest): Promise<AnonymizeResponse>;
    deanonymize(request: DeanonymizeRequest): Promise<DeanonymizeResponse>;
    getSettings(userId: string): Promise<AnonymizationSettingsResponse>;
    updateSettings(userId: string, settings: AnonymizationSettings): Promise<AnonymizationSettingsResponse>;
    deleteSettings(userId: string): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=anonymization.client.d.ts.map