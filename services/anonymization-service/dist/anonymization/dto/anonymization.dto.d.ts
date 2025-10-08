export declare class ChatMessageDto {
    role: string;
    content: string;
}
export declare class AnonymizeRequestDto {
    text?: string;
    messages?: ChatMessageDto[];
    userId?: string;
}
export declare class AnonymizeResponseDto {
    anonymizedText?: string;
    anonymizedMessages?: ChatMessageDto[];
    mapping: Record<string, string>;
}
export declare class DeanonymizeRequestDto {
    text?: string;
    messages?: ChatMessageDto[];
    mapping: Record<string, string>;
}
export declare class DeanonymizeResponseDto {
    deanonymizedText?: string;
    deanonymizedMessages?: ChatMessageDto[];
}
export declare class AnonymizationSettingsDto {
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
export declare class AnonymizationSettingsResponseDto extends AnonymizationSettingsDto {
    userId: string;
    createdAt: string;
    updatedAt: string;
}
