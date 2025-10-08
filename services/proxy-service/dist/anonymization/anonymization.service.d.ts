export declare class AnonymizationService {
    anonymizeChatMessages(messages: any[]): {
        data: any[];
        mapping: Record<string, string>;
    };
    anonymizeText(text: string, mapping?: Record<string, string>, counter?: number): string;
    deanonymizeText(text: string, mapping: Record<string, string>): string;
    private generateAnonymizedValue;
}
