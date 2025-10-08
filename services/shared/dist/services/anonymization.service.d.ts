export interface AnonymizationMap {
    [key: string]: string;
}
export interface AnonymizedData {
    data: any;
    mapping: AnonymizationMap;
}
export declare class AnonymizationService {
    private readonly algorithm;
    private readonly keyLength;
    private readonly ivLength;
    private readonly tagLength;
    private encryptionKey;
    constructor();
    private generateKey;
    private generateIV;
    /**
     * Обезличивает конфиденциальные данные в тексте
     */
    anonymizeText(text: string): AnonymizedData;
    /**
     * Восстанавливает обезличенные данные
     */
    deanonymizeText(anonymizedText: string, mapping: AnonymizationMap): string;
    /**
     * Обезличивает объект с сообщениями чата
     */
    anonymizeChatMessages(messages: any[]): AnonymizedData;
    /**
     * Восстанавливает обезличенные сообщения чата
     */
    deanonymizeChatMessages(anonymizedMessages: any[], mapping: AnonymizationMap): any[];
    /**
     * Шифрует маппинг для безопасного хранения
     */
    encryptMapping(mapping: AnonymizationMap): string;
    /**
     * Расшифровывает маппинг
     */
    decryptMapping(encryptedMapping: string): AnonymizationMap;
    /**
     * Создает хеш для отслеживания обезличенных данных
     */
    createDataHash(data: any): string;
}
//# sourceMappingURL=anonymization.service.d.ts.map