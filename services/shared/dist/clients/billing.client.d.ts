/**
 * HTTP Client for Billing Service
 * Клиент для взаимодействия с billing-service через HTTP API
 */
import { GetBalanceRequest, GetBalanceResponse, CreateTransactionRequest, TransactionResponse, GetTransactionHistoryRequest, TransactionHistoryResponse, CalculateCostRequest, CalculateCostResponse } from '../contracts/billing.contract';
export declare class BillingClient {
    private readonly BILLING_SERVICE_URL;
    private readonly axiosInstance;
    constructor();
    /**
     * Получение баланса пользователя
     */
    getBalance(data: GetBalanceRequest, accessToken: string): Promise<GetBalanceResponse>;
    /**
     * Создание транзакции
     */
    createTransaction(data: CreateTransactionRequest, accessToken: string): Promise<TransactionResponse>;
    /**
     * Получение истории транзакций
     */
    getTransactionHistory(data: GetTransactionHistoryRequest, accessToken: string): Promise<TransactionHistoryResponse>;
    /**
     * Расчет стоимости запроса
     */
    calculateCost(data: CalculateCostRequest, accessToken: string): Promise<CalculateCostResponse>;
}
//# sourceMappingURL=billing.client.d.ts.map