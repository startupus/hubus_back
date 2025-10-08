import { PrismaService } from '../prisma/prisma.service';
export interface AnonymizationSettings {
    id: string;
    provider: string;
    model: string;
    enabled: boolean;
    preserveMetadata: boolean;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateAnonymizationSettingsDto {
    provider: string;
    model: string;
    enabled: boolean;
    preserveMetadata?: boolean;
    createdBy: string;
}
export interface UpdateAnonymizationSettingsDto {
    enabled?: boolean;
    preserveMetadata?: boolean;
    updatedBy: string;
}
export declare class AnonymizationService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getSettings(provider: string, model: string): Promise<AnonymizationSettings | null>;
    getAllSettings(): Promise<AnonymizationSettings[]>;
    upsertSettings(dto: CreateAnonymizationSettingsDto): Promise<AnonymizationSettings>;
    updateSettings(id: string, dto: UpdateAnonymizationSettingsDto): Promise<AnonymizationSettings | null>;
    deleteSettings(id: string, deletedBy: string): Promise<boolean>;
    shouldAnonymize(provider: string, model: string): Promise<boolean>;
    searchSettings(params: {
        provider?: string;
        model?: string;
        enabled?: boolean;
        limit?: number;
        offset?: number;
    }): Promise<{
        data: AnonymizationSettings[];
        total: number;
    }>;
    private transformSettings;
    anonymizeChatMessages(messages: any[]): {
        data: any[];
        mapping: Record<string, string>;
    };
    deanonymizeChatMessages(messages: any[], mapping: Record<string, string>): any[];
    anonymizeText(text: string, mapping?: Record<string, string>, counter?: number): string;
    deanonymizeText(text: string, reverseMapping: Record<string, string>): string;
    private createReverseMapping;
    private generateAnonymizedValue;
}
