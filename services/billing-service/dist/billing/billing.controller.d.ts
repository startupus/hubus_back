export declare class BillingController {
    constructor();
    getBalance(userId: string): Promise<{
        success: boolean;
        message: string;
        balance: {
            user_id: string;
            balance: number;
            currency: string;
            updated_at: string;
        };
    }>;
    updateBalance(userId: string, body: {
        amount: number;
        operation: string;
        description?: string;
    }): Promise<{
        success: boolean;
        message: string;
        balance: {
            user_id: string;
            balance: number;
            currency: string;
            updated_at: string;
        };
    }>;
    createTransaction(body: {
        user_id: string;
        type: string;
        amount: number;
        description?: string;
        provider?: string;
    }): Promise<{
        success: boolean;
        message: string;
        transaction: {
            id: string;
            user_id: string;
            type: string;
            amount: number;
            description: string;
            provider: string;
            status: string;
            created_at: string;
            metadata: {};
        };
    }>;
    getTransactionHistory(userId: string, page?: number, limit?: number): Promise<{
        success: boolean;
        message: string;
        transactions: any[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            total_pages: number;
        };
    }>;
    calculateCost(body: {
        user_id: string;
        provider: string;
        input_tokens: number;
        output_tokens: number;
        model: string;
    }): Promise<{
        success: boolean;
        message: string;
        cost: {
            provider: string;
            model: string;
            input_tokens: number;
            output_tokens: number;
            input_cost: number;
            output_cost: number;
            total_cost: number;
            currency: string;
        };
    }>;
    processPayment(body: {
        user_id: string;
        amount: number;
        payment_method: string;
        description?: string;
    }): Promise<{
        success: boolean;
        message: string;
        transaction: {
            id: string;
            user_id: string;
            type: string;
            amount: number;
            description: string;
            provider: string;
            status: string;
            created_at: string;
            metadata: {
                payment_method: string;
            };
        };
    }>;
}
