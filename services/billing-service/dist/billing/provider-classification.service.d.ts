export type ProviderType = 'DOMESTIC' | 'FOREIGN';
export interface ProviderInfo {
    name: string;
    type: ProviderType;
    country: string;
    description?: string;
}
export declare class ProviderClassificationService {
    private readonly logger;
    private readonly domesticProviders;
    private readonly foreignProviders;
    private readonly providerInfo;
    classifyProvider(provider: string): ProviderType;
    getProviderInfo(provider: string): ProviderInfo | null;
    getAllProviders(): ProviderInfo[];
    getProvidersByType(type: ProviderType): ProviderInfo[];
    addProvider(provider: string, info: ProviderInfo): void;
    updateProvider(provider: string, info: Partial<ProviderInfo>): void;
    removeProvider(provider: string): void;
    private normalizeProviderName;
    isDomestic(provider: string): boolean;
    isForeign(provider: string): boolean;
    getProviderStats(): {
        total: number;
        domestic: number;
        foreign: number;
        unknown: number;
    };
}
