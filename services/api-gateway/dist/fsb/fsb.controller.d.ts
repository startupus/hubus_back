import { HistoryService } from '../history/history.service';
import { AnonymizationService } from '../anonymization/anonymization.service';
export declare class FsbController {
    private readonly historyService;
    private readonly anonymizationService;
    constructor(historyService: HistoryService, anonymizationService: AnonymizationService);
    private checkFsbAccess;
    searchRequests(req: any, query?: string, userId?: string, provider?: string, model?: string, fromDate?: string, toDate?: string, limit?: string, offset?: string): Promise<{
        success: boolean;
        data: import("@ai-aggregator/shared").RequestHistory | import("@ai-aggregator/shared").RequestHistory[];
        pagination: {
            total: number;
            limit: number;
            offset: number;
            hasMore: boolean;
        };
        searchParams: {
            query: string;
            userId: string;
            provider: string;
            model: string;
            fromDate: string;
            toDate: string;
        };
    }>;
    getRequestDetails(req: any, id: string): Promise<{
        success: boolean;
        data: import("@ai-aggregator/shared").RequestHistory | import("@ai-aggregator/shared").RequestHistory[];
    }>;
    searchUsers(req: any, query?: string, fromDate?: string, toDate?: string): Promise<{
        success: boolean;
        data: import("@ai-aggregator/shared").RequestHistory | import("@ai-aggregator/shared").RequestHistory[];
        searchParams: {
            query: string;
            fromDate: string;
            toDate: string;
        };
    }>;
    getUserStats(req: any, userId: string): Promise<{
        success: boolean;
        data: any;
    }>;
    getAnonymizationSettings(req: any, provider?: string, model?: string, enabled?: string, limit?: string, offset?: string): Promise<{
        success: boolean;
        data: import("../anonymization/anonymization.service").AnonymizationSettings[];
        pagination: {
            total: number;
            limit: number;
            offset: number;
            hasMore: boolean;
        };
    }>;
    upsertAnonymizationSettings(req: any, settings: {
        provider: string;
        model: string;
        enabled: boolean;
        preserveMetadata?: boolean;
    }): Promise<{
        success: boolean;
        message: string;
        data: import("../anonymization/anonymization.service").AnonymizationSettings;
    }>;
    updateAnonymizationSettingsById(req: any, id: string, settings: {
        enabled?: boolean;
        preserveMetadata?: boolean;
    }): Promise<{
        success: boolean;
        message: string;
        data: import("../anonymization/anonymization.service").AnonymizationSettings;
    }>;
    deleteAnonymizationSettings(req: any, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getSystemStatistics(req: any): Promise<{
        success: boolean;
        data: any;
    }>;
    deanonymizeData(req: any, data: {
        anonymizedData: any;
        mapping: Record<string, string>;
    }): Promise<{
        success: boolean;
        data: any[];
    }>;
}
