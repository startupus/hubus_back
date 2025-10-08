/**
 * HTTP API Contracts for Billing Service
 * Определяет интерфейсы для HTTP взаимодействия с billing-service
 */
export interface GetBalanceRequest {
    userId: string;
}
export interface GetBalanceResponse {
    userId: string;
    balance: number;
    currency: string;
}
export interface CreateTransactionRequest {
    userId: string;
    amount: number;
    type: 'credit' | 'debit';
    description?: string;
}
export interface TransactionResponse {
    id: string;
    userId: string;
    amount: number;
    type: 'credit' | 'debit';
    timestamp: string;
    description?: string;
}
export interface GetTransactionHistoryRequest {
    userId: string;
    limit?: number;
    offset?: number;
}
export interface TransactionHistoryResponse {
    transactions: TransactionResponse[];
    total: number;
    limit: number;
    offset: number;
}
export interface CalculateCostRequest {
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
}
export interface CalculateCostResponse {
    cost: number;
    currency: string;
    breakdown: {
        inputCost: number;
        outputCost: number;
        totalCost: number;
    };
}
//# sourceMappingURL=billing.contract.d.ts.map