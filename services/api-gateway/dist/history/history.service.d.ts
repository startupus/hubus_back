import { PrismaService } from '../prisma/prisma.service';
import { RequestHistory, CreateRequestHistoryDto, UpdateRequestHistoryDto, RequestHistoryQueryDto, RequestHistoryResponse, SessionHistory, CreateSessionHistoryDto, UpdateSessionHistoryDto, SessionHistoryQueryDto, SessionHistoryResponse } from '@ai-aggregator/shared';
export declare class HistoryService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private transformRequestHistory;
    private transformSessionHistory;
    createRequestHistory(dto: CreateRequestHistoryDto): Promise<RequestHistory>;
    updateRequestHistory(id: string, dto: UpdateRequestHistoryDto): Promise<RequestHistory>;
    getRequestHistory(query: RequestHistoryQueryDto): Promise<RequestHistoryResponse>;
    getRequestHistoryById(id: string, userId: string): Promise<RequestHistoryResponse>;
    deleteRequestHistory(id: string, userId: string): Promise<RequestHistoryResponse>;
    createSession(dto: CreateSessionHistoryDto): Promise<SessionHistory>;
    updateSession(id: string, dto: UpdateSessionHistoryDto): Promise<SessionHistory>;
    getSessions(query: SessionHistoryQueryDto): Promise<SessionHistoryResponse>;
    getSessionById(id: string, userId: string): Promise<SessionHistoryResponse>;
    deleteSession(id: string, userId: string): Promise<SessionHistoryResponse>;
    private updateSessionStats;
    searchRequests(params: {
        query?: string;
        userId?: string;
        provider?: string;
        model?: string;
        fromDate?: Date;
        toDate?: Date;
        limit?: number;
        offset?: number;
    }): Promise<RequestHistoryResponse>;
    searchUsers(params: {
        query?: string;
        fromDate?: Date;
        toDate?: Date;
    }): Promise<RequestHistoryResponse>;
    getSystemStatistics(): Promise<any>;
    getUserStats(userId: string): Promise<any>;
}
