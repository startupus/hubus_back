import { HistoryService } from './history.service';
import { RequestHistoryQueryDto, RequestHistoryResponse, SessionHistoryQueryDto, SessionHistoryResponse } from '@ai-aggregator/shared';
export declare class HistoryController {
    private readonly historyService;
    constructor(historyService: HistoryService);
    getRequestHistory(req: any, query: RequestHistoryQueryDto): Promise<RequestHistoryResponse>;
    getRequestHistoryById(req: any, id: string): Promise<RequestHistoryResponse>;
    deleteRequestHistory(req: any, id: string): Promise<RequestHistoryResponse>;
    getSessions(req: any, query: SessionHistoryQueryDto): Promise<SessionHistoryResponse>;
    getSessionById(req: any, id: string): Promise<SessionHistoryResponse>;
    deleteSession(req: any, id: string): Promise<SessionHistoryResponse>;
    getUserStats(req: any): Promise<any>;
    getRequestTypes(): any;
    getRequestStatuses(): any;
}
