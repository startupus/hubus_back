export interface AnonymizeRequest {
    text?: string;
    messages?: Array<{
        role: string;
        content: string;
    }>;
    userId?: string;
}
export interface AnonymizeResponse {
    anonymizedText?: string;
    anonymizedMessages?: Array<{
        role: string;
        content: string;
    }>;
    mapping: Record<string, string>;
}
export interface DeanonymizeRequest {
    text?: string;
    messages?: Array<{
        role: string;
        content: string;
    }>;
    mapping: Record<string, string>;
}
export interface DeanonymizeResponse {
    deanonymizedText?: string;
    deanonymizedMessages?: Array<{
        role: string;
        content: string;
    }>;
}
export interface AnonymizationSettings {
    enabled: boolean;
    anonymizeEmails: boolean;
    anonymizePhones: boolean;
    anonymizeNames: boolean;
    anonymizeAddresses: boolean;
    anonymizePersonalNumbers: boolean;
    anonymizeIPs: boolean;
    anonymizeURLs: boolean;
    customPatterns?: string[];
}
export interface AnonymizationSettingsResponse extends AnonymizationSettings {
    userId: string;
    createdAt: string;
    updatedAt: string;
}
