/**
 * HTTP Client for Billing Service
 * Клиент для взаимодействия с billing-service через HTTP API
 */

import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { 
  GetBalanceRequest, 
  GetBalanceResponse, 
  CreateTransactionRequest, 
  TransactionResponse,
  GetTransactionHistoryRequest,
  TransactionHistoryResponse,
  CalculateCostRequest,
  CalculateCostResponse
} from '../contracts/billing.contract';

@Injectable()
export class BillingClient {
  private readonly BILLING_SERVICE_URL = process.env.BILLING_SERVICE_URL || 'http://billing-service:3004';
  private readonly axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 10000,
      maxRedirects: 3,
    });
  }

  /**
   * Получение баланса пользователя
   */
  async getBalance(data: GetBalanceRequest, accessToken: string): Promise<GetBalanceResponse> {
    const response = await this.axiosInstance.get<GetBalanceResponse>(`${this.BILLING_SERVICE_URL}/billing/balance/${data.userId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data;
  }

  /**
   * Создание транзакции
   */
  async createTransaction(data: CreateTransactionRequest, accessToken: string): Promise<TransactionResponse> {
    const response = await this.axiosInstance.post<TransactionResponse>(`${this.BILLING_SERVICE_URL}/billing/transaction`, data, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data;
  }

  /**
   * Получение истории транзакций
   */
  async getTransactionHistory(data: GetTransactionHistoryRequest, accessToken: string): Promise<TransactionHistoryResponse> {
    const response = await this.axiosInstance.get<TransactionHistoryResponse>(`${this.BILLING_SERVICE_URL}/billing/transactions/${data.userId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { limit: data.limit, offset: data.offset }
    });
    return response.data;
  }

  /**
   * Расчет стоимости запроса
   */
  async calculateCost(data: CalculateCostRequest, accessToken: string): Promise<CalculateCostResponse> {
    const response = await this.axiosInstance.post<CalculateCostResponse>(`${this.BILLING_SERVICE_URL}/billing/calculate-cost`, data, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data;
  }
}
