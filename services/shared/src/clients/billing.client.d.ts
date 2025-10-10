import { GetBalanceRequest, GetBalanceResponse, CreateTransactionRequest, TransactionResponse, GetTransactionHistoryRequest, TransactionHistoryResponse, CalculateCostRequest, CalculateCostResponse } from '../contracts/billing.contract';
export declare class BillingClient {
    private readonly BILLING_SERVICE_URL;
    private readonly axiosInstance;
    constructor();
    getBalance(data: GetBalanceRequest, accessToken: string): Promise<GetBalanceResponse>;
    createTransaction(data: CreateTransactionRequest, accessToken: string): Promise<TransactionResponse>;
    getTransactionHistory(data: GetTransactionHistoryRequest, accessToken: string): Promise<TransactionHistoryResponse>;
    calculateCost(data: CalculateCostRequest, accessToken: string): Promise<CalculateCostResponse>;
}
